const { SlashCommandBuilder } = require('discord.js')

const appleDb = require('../appledb/main.json')
const jailbreakList = appleDb.jailbreak.sort((a,b) => {
	if (a.name < b.name) return -1
	if (a.name > b.name) return 1
	return 0
})

module.exports = {
	data: new SlashCommandBuilder()
		.setName('jailbreak')
		.setDescription('Get info about a jailbreak')
		.addStringOption((option) =>
			option
				.setName('jailbreak')
				.setDescription('Name of the jailbreak')
				.setRequired(true)
				.setAutocomplete(true)
		),
	async execute(interaction) {
		const name = interaction.options.getString('name')
		const jailbreak = jailbreakList.find(x => x.name == name)

		const jailbreakResponse = require('../views/getJailbreakEmbed')(jailbreak)

		embed = jailbreakResponse.embed
		buttonRow = jailbreakResponse.buttonRow

		await interaction.reply({embeds: [embed], components: [buttonRow]})
	},
	choices: {
		name: jailbreakList.map(jb => jb.name)
	}
}