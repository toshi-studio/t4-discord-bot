'use strict';
const admin = require ('firebase-admin');
const fs = require('fs');
const Discord = require('discord.js');
const firebaseApp = admin.initializeApp({
	credential: admin.credential.applicationDefault(),
	databaseURL: 'https://discord-t4-census-default-rtdb.europe-west1.firebasedatabase.app/'
});
const client = new Discord.Client();
const prefix = '!gm';
let isReady = false;
let guildmanagerGuild = null;

// Bot connected
client.once('ready', () => {
	console.log('connected');

	// Initialize the bot
	client.guilds.fetch(process.env.BOT_SERVER_ID)
	.then( guild => {
		guildmanagerGuild = guild

		// Load the commands
		client.commands = new Discord.Collection();
		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
		for(const file of commandFiles) {
			const command = require(`./commands/${file}`);
			client.commands.set(command.name, command);
		}
		console.log('T4 Bot is ready and initialized');
		isReady = true;
	})
});

client.on('message', message => {
	if(!isReady) return;

	try {
		// bypass unconcerned message
		if(!message.content.startsWith(prefix) || message.author.bot) return;

		// Parse the message
		const args = message.content.slice(prefix.length).match(/(?:[^\s"']+|['"][^'"]*["'])+/g)

		// No args => show the help
		if(args.length == 0) {
			client.commands.get('help').execute(message, [])
			return;
		}

		// Distribute the command
		else {
			const command = args[0].toLowerCase();
			// Unknown command
			if(!client.commands.has(command))
			{
				console.log('command unknown')
				return;
			}
			// Execute the command
			else
			{
				const cmd = client.commands.get(command);
				// Pass the firebaseApp to the command
				cmd.firebaseApp = firebaseApp

				// Pass the original guild
				cmd.guild = guildmanagerGuild

				// Pass the args if there's any
				if(args.length > 1) {
					cmd.execute(message, args.slice(1))
				} else {
					cmd.execute(message, [])
				}
			}
		}
	}
	catch(error) {
		console.log('error', error)
		console.error(error);
	}
	return;
})

// Connect the client
client.login(process.env.BOT_TOKEN);

