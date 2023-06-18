import { getSecondaryCommand, removeAtSymbol, __dirname, isModOrBroadcaster, debounce } from "../utils.js";
import { currentTrack } from '../spotify.js';
import { readFile } from "fs/promises"; 
import storage from 'node-persist'
import path from "path";

function SayHi({ user, words, msg }) {
   const secondaryCommand = getSecondaryCommand(words);
   let userToGreet = user;
   if (secondaryCommand === "to") { 
      if (!words[2]) return `@${user}, Who should I say hi to?`
      userToGreet = removeAtSymbol(words[2]);
   }
   return `Hi @${userToGreet}, I am ManaBot :) I do things smileW`
}

async function Song({user, isLive}) {
   if (!(await isLive())) return;
   const song = await currentTrack();
   if (!song) return `@${user}, No song is currently playing`;
   return `@${user}, The song currently playing is ${song.name} by ${song.artists[0].name}${song.artists.length > 1 ? ' and others' : ""}. You can find it here ${song.external_urls.spotify}`
}

let preceptIndex = 0;
async function Precept(index) {
   const precepts = JSON.parse(await readFile(path.join(__dirname, "../precepts.json")));
   return precepts[index];
}

export default [
   // [CommandName in lowerCase, command function]
   ["sayhi", SayHi],
   ["opencockpit", ({user}) => `I'm sorry @${user}, I'm afraid I can't do that :)`],
   // ["leaderboard", ({user}) => `@${user}, Check the lembit leaderboard at streamelements.com/serboggit/leaderboard`],
   ["song", debounce(Song)],
   ["icecream", debounce(() => "Ice cream and Hitless runs have a lot in common! Any% is like sweet cream, simple and quick. Vanilla represents the base game bosses, while chocolate adds DLC complexity. Strawberry is a unique challenge for SL1/BL4 runs, and Neopolitan combines it all. All Achievements is mint chocolate with chips, while Sorbet is for limited categories. Special categories are like frozen yogurt - a unique take on the classic. 🍦")],
   ["charms", async ({user}) => {
      const preceptIndex = await storage.get('preceptIndex') || 0;
      await storage.update('preceptIndex', (preceptIndex + 1) % 57);
      return `@${user}, ${await Precept(preceptIndex)}`
   }],
   ['resetprecepts', async ({msg}) => { 
      if(!isModOrBroadcaster(msg)) return null;
      await storage.update('preceptIndex', 0);
      return "Precepts reset"
   }]
]