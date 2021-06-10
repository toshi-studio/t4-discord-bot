const { MessageEmbed } = require("discord.js")

module.exports = {
	firebaseApp: null,
	name: 't4',
	guild: null,
	description: '`add nickame[:class] [slot1,slot2,slot3...]`\n'
				+ 'The class **MUST** be provided the first time.\n'
				+ '**Available classes**: druid, hunter, mage, paladin, priest, rogue, shaman, warlock, warrior\n'
				+ '**Available slots**: head, shoulders, chest, hands, legs\n'
				+ 'Prefix a slot with the minus sign (`-`) to remove the piece\n'
				+ 'Examples:\n`!gm t4 add lanwu:shaman head legs` will create a player named Lanwu who plays as a shaman and add the head and legs T4 items to his T4 set\n'
				+ '`!gm t4 add lanwu hands` will update a already registered player named Lanwu with the T4 gloves item\n'
				+ '`!gm t4 add lanwu -hands` will remove the T4 gloves item from Lanwu T4 set\n'
				+ '\n'
				+ '`delete [player name]`\n'
				+ 'Remove a player from the census\n'
				+ 'Example:\n`!gm t4 delete lanwu`\n'
				+ '\n'
				+ '`list [class]`\n'
				+ 'Show the current census of the T4 for your roster. A class can be specified.\n'
				+ 'Example:\n`!gm t4 list`\n`!gm t4 list shaman`\n'
				+ '\n*The parameters between brackets (`[` and `]`) are optional*\n',
	classColors: {
		'druid': '#E67E22',
		'hunter': '#32cd32',
		'mage': '#8acaff',
		'paladin': '#fbaab8',
		'priest': '#eeeeee',
		'rogue': '#ffff62',
		'shaman': '#2c98e0',
		'warlock': '#de0aa4',
		'warrior': '#d68d69'
	},

	async execute(message, args) {
		const guildId = message.guild ? message.guild.id : null
		const subCommand = args[0]

		if(!guildId) {
			return await message.author.send(this.description)
		}

		switch (subCommand) {
			case 'add':
				return await this.add(message, args.slice(1))
			case 'list':
				return await this.list(message, args.slice(1))
			case 'delete':
				return await this.delete(message, args.slice(1))
			default:
				return await message.author.send(this.description)
		}
	},

	/**
	 * Add or update a user
	 * @param {Message} message
	 * @param {array[string]} args
	 * @returns
	 */
	async add(message, args) {
		const database = this.firebaseApp.database();
		const guildId = message.guild.id
		const userArgs = args[0].split(':')
		const userName = userArgs[0]
		const userNormalizedName = userName.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
		const userClass = userArgs.length > 1 ? userArgs[1] : ''

		// Load user data
		const snapshot = await database.ref(`Guilds/${guildId}/Roster/${userNormalizedName}`).once('value')
		let userData = snapshot ? snapshot.val() : null

		// Check if it's a new player and the class is not provided
		if(userClass.length === 0 && !userData) {
			return await message.author.send('Please provide the player\'s class. Type `!gm t4` for the help.')
		}

		// Check if the class provided is recognized
		if(userClass.length > 0 && ['druid', 'hunter', 'mage', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'].indexOf(userClass) === -1) {
			return await message.author.send('Please provide a class among these : druid, hunter, mage, paladin, priest, rogue, shaman, warlock, warrior')
		}

		// Default user data
		if(!userData) {
			userData = {
				name: userName,
				class: userClass,
				t4: '00000',
				t5: '00000',
			}
			await database.ref(`Guilds/${guildId}/name`).set(message.guild.name)
		}

		// Update the slots
		for(let i = 1; i < args.length; i++) {
			let slot = args[i].toLowerCase().trim()
			switch(slot) {
				case 'head':
					userData.t4 = this.setCharAt(userData.t4, 0, '1')
					break
				case '-head':
					userData.t4 = this.setCharAt(userData.t4, 0, '0')
					break

				case 'shoulders':
					userData.t4 = this.setCharAt(userData.t4, 1, '1')
					break
				case 'shoulders':
					userData.t4 = this.setCharAt(userData.t4, 1, '0')
					break

				case 'chest':
					userData.t4 = this.setCharAt(userData.t4, 2, '1')
					break
				case '-chest':
					userData.t4 = this.setCharAt(userData.t4, 2, '0')
					break

				case 'hands':
					userData.t4 = this.setCharAt(userData.t4, 3, '1')
					break
				case '-hands':
					userData.t4 = this.setCharAt(userData.t4, 3, '0')
					break

				case 'legs':
					userData.t4 = this.setCharAt(userData.t4, 4, '1')
					break
				case '-legs':
					userData.t4 = this.setCharAt(userData.t4, 4, '0')
					break

				default:
					return await message.author.send('Please provide a slot among these : head, shoulders, chest, hands, legs.\nPrefix the slot with the minus (`-`) sign to remove a slot from a player.')
			}
		}

		// Save the data
		await database.ref(`Guilds/${guildId}/Roster/${userNormalizedName}`).set(userData)

		// Tells everything is ok
		return await message.reply('OK! Use the `!gm t4 list` command to see your update.')
	},

	/**
	 * List the t4 census
	 * @param {Message} message
	 * @param {array} args
	 * @returns
	 */
	async list(message, args) {
		const database = this.firebaseApp.database();
		const guildId = message.guild.id
		const snapshot = await database.ref(`Guilds/${guildId}/Roster`).once('value')
		const roster = snapshot ? snapshot.val() : null
		const specificClass = args.length > 0 ? args[0] : ''

		if(!roster) {
			return await message.author.send('The roster is empty.')
		}
		let rosterByClass = {
			druid: [],
			hunter: [],
			mage: [],
			paladin: [],
			priest: [],
			rogue: [],
			shaman: [],
			warlock: [],
			warrior: []
		}


		Object.keys(roster).forEach(function(key) {
			const data = roster[key]
			rosterByClass[data.class].push(data)
		})

		const self = this
		Object.keys(rosterByClass).forEach(async function(key) {
			if(specificClass.length ==0 || specificClass == key) {
				let _embed = new MessageEmbed()
				const _emoji = self.guild.emojis.cache.find(emoji => emoji.name == key)

				_embed.setTitle(`${_emoji}\` \`${key.toUpperCase()}`)
				_embed.setColor(self.classColors[key])
				_embed.setFooter('Guild Manager')

				for(let i = 0; i < rosterByClass[key].length; i++) {
					const _t4 = self.getValuesAsEmoji(rosterByClass[key][i].t4)
					_embed.addField(rosterByClass[key][i].name, _t4)
				}

				await message.channel.send(_embed)
			}
		})
		// console.log(rosterByClass)
	},

	/**
	 * Delete a player
	 * @param {Message} message
	 * @param {array} args
	 */
	async delete(message, args) {
		if(!args || args.length == 0) {
			return message.author.send('`!gm t4 delete playername` Use this command to delete a player. The player\'s name MUST be specified.')
		}
		const database = this.firebaseApp.database();
		const guildId = message.guild.id
		const userName = args[0]
		const userNormalizedName = userName.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
		// Load user data to check if he exists
		const snapshot = await database.ref(`Guilds/${guildId}/Roster/${userNormalizedName}`).once('value')
		let userData = snapshot ? snapshot.val() : null
		if(userData) {
			await database.ref(`Guilds/${guildId}/Roster/${userNormalizedName}`).remove()
			// Tells everything is ok
			return await message.reply('OK! Use the `!gm t4 list` command to see your update.')
		} else {
			return message.author.send(`The player ${userName} has not been found.`)
		}
	},

	/**
	 * Replace a specific char at specific index
	 * @param {string} str
	 * @param {int} index
	 * @param {char} chr
	 * @returns
	 */
	setCharAt(str, index, chr) {
		if(index > str.length - 1)  {
			return str;
		}
    	return str.substring(0, index) + chr + str.substring(index + 1);
	},

	getValuesAsEmoji(setItems) {
		let retValue = ''
		if(setItems.charAt(0) == '1') {
			retValue += 'Head'
		}

		if(setItems.charAt(1) == '1') {
			if(retValue.length > 0) retValue += ' | '
			retValue += 'Shoulders'
		}

		if(setItems.charAt(2) == '1') {
			if(retValue.length > 0) retValue += ' | '
			retValue += 'Chest'
		}

		if(setItems.charAt(3) == '1') {
			if(retValue.length > 0) retValue += ' | '
			retValue += 'Hands'
		}

		if(setItems.charAt(4) == '1') {
			if(retValue.length > 0) retValue += ' | '
			retValue += 'Legs'
		}
		return (retValue.length >  0) ?  `\`${retValue}\`` : '\u200B'
	}

}