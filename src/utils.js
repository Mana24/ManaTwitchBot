export function isModOrBroadcaster(msg) {
	return msg.userInfo.isMod || msg.userInfo.isBroadcaster;
}