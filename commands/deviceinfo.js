const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const hash = require('object-hash')

const appleDb = require('../appledb/main.json')
const groupList = appleDb.group
const deviceList = appleDb.device
const firmwareList = appleDb.ios

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deviceinfo')
		.setDescription('Get info about an Apple device')
		.addStringOption((option) =>
			option
				.setName('device')
				.setDescription('Device name or identifier')
				.setRequired(true)
				.setAutocomplete(true)
		),
	async execute(interaction) {
		const key = interaction.options.getString('device')

		if (key.length > 100) return require('../views/respondErrorEmbed')(interaction, [{
			type: 'tooLong',
			string: 'device'
		}])

		const group = groupList.find(x => x.key == key)
		if (!group) {
			return require('../views/respondErrorEmbed')(interaction, [{
				type: 'notFound',
				string: 'Device',
				key: key
			}])
		}

		let embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(group.name)
			.setURL(`https://appledb.dev/device/${group.key.replace(/ /g,'-')}`)
			.setThumbnail(encodeURI(`https://img.appledb.dev/device@128/${group.devices[0]}/0.webp`))

		const devicesInGroup = deviceList.filter(x => group.devices.includes(x.key))

		const productList = devicesInGroup.map(x => {
			return {
				name: x.name,
				identifier: x.identifier,
				identifierString: x.identifier.join(', ')
			}
		})

		function removeDuplicatesFromArray(input) { return [...new Set(input)] }

		function removeDuplicatesFromArrayOfObjects(input, key) {
			return input.filter((obj, index, arr) => {
				return arr.map(mapObj => mapObj[key]).indexOf(obj[key]) === index;
			});
		}

		let showIdentifiers = false
		let showProducts = true

		if (
			removeDuplicatesFromArray(productList.map(x => x.identifierString)).length &&
			removeDuplicatesFromArray(productList.map(x => x.name)).length == 1
		) {
			showIdentifiers = true
			showProducts = false
		}
		if (removeDuplicatesFromArray(productList.map(x => x.identifierString)).length == 1) showIdentifiers = true

		if (showIdentifiers && !showProducts && !removeDuplicatesFromArray(productList.map(x => x.identifierString)).filter(x => x.length).length) {
			showIdentifiers = false
			showProducts = true
		}

		if (showProducts) embed.addFields({
			name: `Product${productList.length > 1 ? 's' : ''}`,
			value: productList.map(x => x.name + ((x.identifier.length && !showIdentifiers) ? ` (\`${x.identifier.join('`, `')}\`)` : '')).join('\n'),
			inline: false
		})
		if (showIdentifiers) {
			const identList = removeDuplicatesFromArray(productList.map(x => x.identifierString.split(', ')).flat()).sort()
			embed.addFields({
				name: `Identifier${identList.length > 1 ? 's' : ''}`,
				value: '`' + identList.join('`\n`') + '`',
				inline: true
			})
		}

		function getProperty(property) { return removeDuplicatesFromArray(devicesInGroup.map(x => x[property]).flat()).sort() }

		const modelList = getProperty('model')
		if (modelList.length) embed.addFields({
			name: `Model${modelList.length > 1 ? 's' : ''}`,
			value: modelList.join(', '),
			inline: true
		})

		const boardList = getProperty('board')
		if (boardList.length) embed.addFields({
			name: `Board${boardList.length > 1 ? 's' : ''}`,
			value: boardList.join(', '),
			inline: true
		})

		let socList = removeDuplicatesFromArrayOfObjects(devicesInGroup.map(x => {
			return {
				soc: x.soc,
				arch: x.arch
			}
		}).map(x => {
			x.hash = hash(x)
			return x
		}), 'hash')

		if (socList.length && socList[0].soc) embed.addFields({
			name: 'SoC',
			value: socList.map(x => x.soc + (x.arch ? ` (${x.arch})` : '')).join(', '),
			inline: true
		})

		let firmware = firmwareList
		.filter(x => 
			x.deviceMap.some(r => group.devices.includes(r)) &&
			x.released &&
			!x.beta &&
			!x.hideFromLatestVersions
		)
		.sort((a,b) => {
			const date = [a,b].map(x => new Date(x.released))
			if (date[0] < date[1]) return 1
			if (date[0] > date[1]) return -1
			return 0
		})[0]

		if (firmware) embed.addFields({
			name: 'Latest firmware',
			value: firmware.osStr + ' ' + firmware.version + (firmware.build ? ` (${firmware.build})` : ''),
			inline: true
		})

		const released = devicesInGroup
		.filter(x => x.released)
		.map(x => x.released)
		.sort(x => new Date(x))

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

		if (released.length) embed.setFooter({
			text: `Releas${(new Date(released[0]) < new Date()) ? 'ed' : 'ing'} on ${formatDate(released[0])}`
		});

		await interaction.reply({embeds: [embed]})
	},
	choices: {
		device: groupList.map(x => {
			return {
				name: x.name,
				value: x.key
			}
		})
	}
}