import { getSecondaryCommand, removeAtSymbol } from "../utils.js"

function SayHi({ user, words, msg }) {
   const secondaryCommand = getSecondaryCommand(words);
   let userToGreet = user;
   if (secondaryCommand === "to") { 
      if (!words[2]) return `@${user}, Who should I say hi to?`
      userToGreet = removeAtSymbol(words[2]);
   }
   return `Hi @${userToGreet}, I am ManaBot :) I do things smileW`
}

export default [
   // [CommandName in lowerCase, command function]
   ["sayhi", SayHi],
   ["opencockpit", ({user}) => `I'm sorry @${user}, I'm afraid I can't do that :)`]
]