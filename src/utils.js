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
	return word.replace(/^@/g, "");
}