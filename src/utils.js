import path from 'path';
import { fileURLToPath } from 'url';


export const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function isModOrBroadcaster(msg) {
	return msg.userInfo.isMod || msg.userInfo.isBroadcaster;
}

/**
 * gets a secondary command like the "add" in "!stschant add STS STS STS". 
 * Return undefined if there's no secondary command 
 * @param { String[] } words
 * */
export function getSecondaryCommand(words) {
	return words[1]?.toLowerCase();
}

export function removeAtSymbol(word) {
	return word?.replace(/^@/g, "");
}

/**
 * A higher order function that returns a debounced version of another function
 * @param {Number} cooldown The cooldown in milliseconds
 * @param {(any) => any} callback The function to be debounced
 * @param {*} failReturn The return value if the function is called while on cooldown
 * @returns The debounced version of *callback*
 */
export function debounce(callback, cooldown=1500, failReturn) {
	let lastcalled = NaN;
	return function (...args) {
	  const now = Date.now();
	  const onCooldown = (lastcalled + cooldown) > now;
	  // console.log(lastcalled + cooldown, now, onCooldown);
	  if (onCooldown) {
		 return failReturn;
	  } else {
		 lastcalled = now;
		 return callback(...args);
	  }
	};
 }
 