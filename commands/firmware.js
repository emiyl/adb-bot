const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

const appleDb = require('../appledb/main.json')
const groupList = appleDb.group
const deviceList = appleDb.device
const firmwareList = appleDb.ios.sort((a,b) => {
	if (!a.released || !b.released) return -1
	const date = [a,b].map(x => new Date(x.released))
	if (date[0] < date[1]) return 1
	if (date[0] > date[1]) return -1
	return 0
})

const firmwareNameList = appleDb.ios.map(x => [x.osStr,x.version].filter(x => x).join(' '))
let duplicateFirmwareNameList = []
for (const name of firmwareNameList) if (firmwareNameList.filter(x => x === name).length > 1) duplicateFirmwareNameList.push(name)

module.exports = {
	data: new SlashCommandBuilder()
		.setName('firmware')
		.setDescription('Get info about a software version')
		.addStringOption((option) =>
			option
				.setName('version')
				.setDescription('Version to get info about')
				.setRequired(true)
				.setAutocomplete(true)
		),
	async execute(interaction) {
		const key = interaction.options.getString('version')
		const firmware = firmwareList.find(x => x.key == key)

		if (!firmware) {
			let embed = new EmbedBuilder()
				.setColor(0xdf3c4c)
				.setTitle('Error')
				.setDescription(`Firmware \`${key}\` not found`)
			interaction.reply({ embeds: [embed] })
			return
		}

		let embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle([firmware.osStr, firmware.version].filter(y => y).join(' '))
			.setURL(firmware.appledburl)

		if (firmware.build) embed.addFields({
			name: 'Build number',
			value: firmware.build,
			inline: true
		})

		const deviceMap = firmware.deviceMap
		let groupArr = []
		let omitArr = []
		for (const device of deviceMap) {
			const group = groupList.find(x => x.devices.includes(device))
			if (!group) continue
			if (group.devices.every(v => deviceMap.includes(v))) {
				groupArr.push(group.key)
				omitArr.push(device)
			}
		}
		groupArr = Array.from(new Set(groupArr))
		.map(x => groupList.find(y => y.key === x).name)

		let nameArr = groupArr
		.concat(
			deviceMap
			.filter(x => !omitArr.includes(x))
			.map(x => deviceList.find(y => y.key === x).name)
		).sort()

		if (nameArr.length <= 5) embed.addFields({
			name: `Supported device${nameArr.length > 1 ? 's' : ''}`,
			value: nameArr.join('\n'),
			inline: true
		})
		else embed.addFields({
			name: `Supported device${deviceMap.length > 1 ? 's' : ''}`,
			value: `${deviceMap.length} device${deviceMap.length > 1 ? 's' : ''}`,
			inline: true
		})

		function adjustDate(date) {
			const dateOffset = new Date().getTimezoneOffset() * 60 * 1000
			const currentDate = new Date(date).valueOf()
			return new Date(currentDate + dateOffset)
		}

		function formatDate(date) {
			const releasedArr = date.split('-')
			const dateStyleArr = [{ year: 'numeric'}, { dateStyle: 'medium'}, { dateStyle: 'medium'}]
			return new Intl.DateTimeFormat('en-US', dateStyleArr[releasedArr.length-1]).format(adjustDate(date))
		}

		if (firmware.released) embed.setFooter({
			text: `Releas${(new Date(firmware.released) < new Date()) ? 'ed' : 'ing'} on ${formatDate(firmware.released)}`
		});

		await interaction.reply({embeds: [embed]})
	},
	choices: {
		version: firmwareList.map(x => {
			let name = [x.osStr, x.version].filter(y => y).join(' ')
			if (duplicateFirmwareNameList.includes(name) && x.build) name += ` (${x.build})`
			return {
				name: name,
				value: x.key
			}
		})
	}
}