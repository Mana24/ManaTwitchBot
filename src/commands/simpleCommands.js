import { getSecondaryCommand, removeAtSymbol } from "../utils.js";
import { currentTrack } from '../spotify.js';

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

export default [
   // [CommandName in lowerCase, command function]
   ["sayhi", SayHi],
   ["opencockpit", ({user}) => `I'm sorry @${user}, I'm afraid I can't do that :)`],
   ["leaderboard", ({user}) => `@${user}, Check the lembit leaderboard at streamelements.com/serboggit/leaderboard`],
   ["song", Song],
]