import { getSecondaryCommand, removeAtSymbol, isModOrBroadcaster } from "../utils.js"

function SayHi({ user, words, msg }) {
   const secondaryCommand = getSecondaryCommand(words);
   let userToGreet = user;
   // Only mods or the broadcaster should be able to tell the bot who to greet
   if (secondaryCommand === "to" && isModOrBroadcaster(msg)) { 
      if (!words[2]) return `@${user}, Who should I say hi to?`
      userToGreet = removeAtSymbol(words[2]);
   }
   return `Hi @${userToGreet}, I am ManaBot :) I do things`
}

export default [
   // [CommandName in lowerCase, command function]
   ["sayhi", SayHi]
]