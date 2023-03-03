#!node
import * as dotenv from 'dotenv'
import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { promises as fs } from 'fs';
import QuoteRepo from './QuoteRepo.js';
import { RedeemWatcher } from './RedeemWatcher.js';
import path from 'path';
import storage from 'node-persist'
import { fileURLToPath } from 'url';
import { getSecondaryCommand, isModOrBroadcaster } from './utils.js';
import simpleCommands from './commands/simpleCommands.js';
import streakCommands, { getStreaks } from './commands/streakCommands.js';
import { ApiClient } from '@twurple/api';

// CURRENT SCOPES: channel:moderate chat:edit chat:read channel:read:redemptions
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const tokenPath = path.join(__dirname, "../tokens.json");

const quotePath = path.join(__dirname, '../quotes.json');
const quoteRepo = new QuoteRepo(quotePath, true);

const storagePath = path.join(__dirname, '../storage');

const commandSymbol = '!';
const commands = new Map(simpleCommands.concat(streakCommands)); // Initialize the commands map with simple commands

const channels = ['mana248', 'serboggit'];

async function handleCommand({ channel, user, text, msg, isLive }) {
	const words = text.trim().split(/\s+/);
	const command = words[0].substring(commandSymbol.length).toLowerCase();

	if (!commands.has(command)) return;

	const commandHandler = commands.get(command);
	const responseToUser = await commandHandler({ channel, user, text, msg, words, isLive });

	return responseToUser;
}

/**
 * @param {Object} options
 * @param {string} options.channel Channel name
 * @param {string} options.user User name that typed the command
 * @param {string} options.text The whole text of the user's message
 * @param {TwitchPrivateMessage} options.msg The message object
 * @param {string[]} options.words An array of the words in the user's message
 * @returns {string} What to say 
 */
async function handleQuoteCommand({ channel, user, text, msg, words }) {
	const requestedCategory = words[0].substring(commandSymbol.length).toLowerCase();
	const secondaryCommand = getSecondaryCommand(words);

	const noQuoteMessage = (index) => `@${user}, Quote #${index} not found`;
	const quoteMessage = (index, quote) => `@${user}, #${index}: ${quote}`;
	const incorrectUsage = (properUsage) => `@${user}, Incorrect usage. Proper usage: ${commandSymbol}${requestedCategory} ${properUsage}`

	switch (true) {
		case /^\d+$/.test(secondaryCommand): // GET QUOTE
			{
				// Making it seem like we have a 1 indexed array.
				const index = parseInt(secondaryCommand) - 1;

				const quote = await quoteRepo.getQuote(requestedCategory, index);
				if (quote === undefined) return noQuoteMessage(index + 1);

				return quoteMessage(index + 1, quote);
				break;
			}
		case secondaryCommand === undefined: // GET RANDOM QUOTE
			{
				const categoryArray = await quoteRepo.getCategory(requestedCategory);
				if (categoryArray.length === 0) return `@${user}, This quote category is empty`
				const randomIndex = Math.floor(Math.random() * categoryArray.length);
				return quoteMessage(randomIndex + 1, categoryArray[randomIndex]);
				break;
			}
		case secondaryCommand === "add" && isModOrBroadcaster(msg):
			{
				if (words.length < 3) // if there's only the command and "add" and no quote 
				{
					// Tell the user how to use this command
					return incorrectUsage('add YOUR QUOTE HERE');
				}
				// reconstitue the quote
				words.splice(0, 2);
				const quote = words.join(' ');

				const index = await quoteRepo.addQuote(requestedCategory, quote);
				return `@${user}, Added new quote #${index + 1}`;
				break;
			}
		case secondaryCommand === "edit" && isModOrBroadcaster(msg):
			{
				if (words.length < 4 || !/^\d+$/.test(words[2])) {
					// if there's only the command and "edit" and no quote or the user doesn't provide an index
					// Tell the user how to use this command
					return incorrectUsage('edit QUOTE_NUMBER NEW_QUOTE');
				}
				const index = parseInt(words[2]) - 1;
				// reconstitue the quote
				words.splice(0, 3);
				const newQuote = words.join(' ');

				const oldQuote = await quoteRepo.getQuote(requestedCategory, index);
				if (oldQuote === undefined) return noQuoteMessage(index + 1);

				await quoteRepo.updateQuote(requestedCategory, index, newQuote);
				return `@${user}, Updated quote #${index + 1} successfully: ${newQuote}`;

				break;
			}
		case secondaryCommand === "remove" && isModOrBroadcaster(msg):
			{
				if (words.length < 3 || !/^\d+$/.test(words[2])) {
					// if there's only the command and "remove" and no quote number
					// Tell the user how to use this command
					return incorrectUsage('remove QUOTE_NUMBER');
				}
				const index = parseInt(words[2]) - 1;

				const quote = await quoteRepo.getQuote(requestedCategory, index);
				if (quote === undefined) return noQuoteMessage(index + 1);

				await quoteRepo.deleteQuote(requestedCategory, index);
				return `@${user}, Removed quote #${index + 1}: ${quote}`

				break;
			}
		default: // UNRECOGNIZED ACTION
			break;
	}
}

async function handleFirst(user) {
	let streaks = await getStreaks();
	let streak = streaks[streaks.length - 1]
	if (streak?.holder !== user.toLowerCase()) {
		streak = { holder: user.toLowerCase(), count: 1 };
		streaks.push(streak);
	} else {
		streak.count = streak.count + 1;
	}
	await storage.set('streaks', streaks);

	// return `You're on a streak of ${streak.count}`;
	return `!addpoints ${user} 1000 You're on a streak of ${streak.count}`;
}

async function main() {
	const categories = Object.keys(await quoteRepo.getAll())
	categories.forEach(category => { commands.set(category, handleQuoteCommand) });

	await storage.init({ dir: storagePath });

	const clientId = process.env.CLIENT_ID;
	const clientSecret = process.env.CLIENT_SECRET;
	const tokenData = JSON.parse(await fs.readFile(tokenPath, 'UTF-8'));
	const authProvider = new RefreshingAuthProvider(
		{
			clientId,
			clientSecret,
			onRefresh: async newTokenData => await fs.writeFile(tokenPath, JSON.stringify(newTokenData, null, 4), 'UTF-8')
		},
		tokenData
	);

	const chatClient = new ChatClient({ authProvider, channels, webSocket: true });
	await chatClient.connect();
	console.log("Connected to chat successfully!");

	const apiClient = new ApiClient({authProvider});
	const hardCodedChannel = 'serboggit'
	
	
	new RedeemWatcher(hardCodedChannel).addRedeemListener(async (user, redeemInfo) => {
		if (redeemInfo.redeemTitle.toLowerCase() === "first") {
			// Determine streak info
			
			chatClient.say(hardCodedChannel, await handleFirst(user));
		}
	})
	
	chatClient.onMessage(async (channel, user, text, msg) => {
		// channel: #[channelname] notice the octothrope at the start
		const isLive = async () => await apiClient.streams.getStreamByUserId(msg.channelId) ? true : false; 
		//console.log(text)
		if (text.startsWith(commandSymbol)) {
			const response = await handleCommand({ channel, user, text, msg, isLive });
			if (response) {
				chatClient.say(channel, response);
			}
		}
	});
}

main();
