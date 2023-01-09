import { getSecondaryCommand } from "../utils.js";
import storage from 'node-persist'

export const getStreaks = async () => (await storage.get('streaks')) || [];
export const getCurrentStreak = async () => {
   const streaks = await getStreaks();
   return streaks[streaks.length - 1];
};
export const getLongestStreak = async () => {
   const streaks = await getStreaks();
   const longestStreak = streaks.sort((a, b) => b.count - a.count)[0];
   return longestStreak;
}
export const getLongestUserStreak = async (user) => {
   const streaks = await getStreaks();
   const userStreaks = streaks.filter(streak => streak.holder === user);
   const longestStreak = userStreaks.sort((a, b) => b.count - a.count)[0];
   return longestStreak;
};

async function handleLongestStreakCommand({ user, words }) {
   const secondaryUsername = getSecondaryCommand(words);
   let streak;
   if (secondaryUsername) {
      streak = await getLongestUserStreak(secondaryUsername);
      if (streak) return `@${user}, The longest streak held by ${secondaryUsername} was ${streak.count} firsts in a row`
      else return `@${user}, No streak held by ${secondaryUsername} was found`;
   }
   else {
      streak = await getLongestStreak();
      return `@${user}, The longest FIRST streak was held by ${streak.holder} for ${streak.count} times in a row`
   }
}

async function handleCurrentStreakCommand({ user }) {
   const streak = await getCurrentStreak();
   return `@${user}, The current FIRST streak is held by ${streak.holder} for ${streak.count} times in a row`
}

export default [
   // [CommandName in lowerCase, command function]
   ["longeststreak", handleLongestStreakCommand],
   ["firststreak", handleCurrentStreakCommand]
]