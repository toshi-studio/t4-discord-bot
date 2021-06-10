module.exports = {
	firebaseApp: null,
	guild: null,
	name: 'help',
	description: '**Guild Manager commands**\n`help`\tShow this message',
	async execute(message, args) {
		console.log('reply help')
		await message.author.send(this.description)
		message.delete();
		return
	}
}