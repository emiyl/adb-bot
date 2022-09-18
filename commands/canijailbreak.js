const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js')

const appleDb = require('../appledb/main.json')

function checkJailbreakableDevices(arr) {
    return [
        'iPhone',
        'iPad Air',
        'iPad Pro',
        'iPad mini',
        'iPad',
        'HomePod',
        'Apple Watch',
        'Apple TV',
        'iBridge'
    ].includes(arr)
}

const groupList = appleDb.group.filter(x => checkJailbreakableDevices(x.type))
const deviceList = appleDb.device.filter(x => checkJailbreakableDevices(x.type))
const jailbreakList = appleDb.jailbreak.map(x => {
    x.priority = x.priority || 99999
    return x
})
.sort((a,b) => {
    if (a.priority < b.priority) return -1
    if (a.priority > b.priority) return 1
    return 0
})

const firmwareList = appleDb.ios
.filter(x => x.build && [
    'iOS',
    'iPadOS',
    'iPhoneOS',
    'tvOS',
    'Apple TV Software',
    'watchOS',
    'audioOS',
    'bridgeOS'
].includes(x.osStr))
.sort((a,b) => {
	if (!a.released || !b.released) return -1
	const date = [a,b].map(x => new Date(x.released))
	if (date[0] < date[1]) return 1
	if (date[0] > date[1]) return -1
	return 0
})

const firmwareNameList = firmwareList.map(x => [x.osStr,x.version].filter(x => x).join(' '))
let duplicateFirmwareNameList = []
for (const name of firmwareNameList) if (firmwareNameList.filter(x => x === name).length > 1) duplicateFirmwareNameList.push(name)

module.exports = {
	data: new SlashCommandBuilder()
		.setName('canijailbreak')
		.setDescription('Find out if you can jailbreak your device')
		.addStringOption((option) =>
			option
				.setName('device')
				.setDescription('Name or identifier of the device')
				.setRequired(true)
				.setAutocomplete(true)
		)
		.addStringOption((option) =>
			option
				.setName('version')
				.setDescription('Firmware version you want to jailbreak')
				.setRequired(true)
				.setAutocomplete(true)
		),
	async execute(interaction) {
        const groupKey = interaction.options.getString('device')
        const firmwareKey = interaction.options.getString('version')

		if (groupKey.length > 100 || firmwareKey.length > 100) {
            let errArr = []
            if (groupKey.length > 100) errArr.push('device')
            if (firmwareKey.length > 100) errArr.push('version')
            return require('../views/respondErrorEmbed')(interaction, errArr.map(x => {
                return {
                    type: 'tooLong',
                    string: x
                }
            }))
        }

		const group = groupList.find(x => x.key == groupKey)
		const firmware = firmwareList.find(x => x.key == firmwareKey)

		if (!group || !firmware) {
            let errorMessage = []
            if (!group) errorMessage.push({
                type: 'notFound',
                string: 'Device',
                key: groupKey
            })
            if (!firmware) errorMessage.push({
                type: 'notFound',
                string: 'Firmware',
                key: firmwareKey
            })
            require('../views/respondErrorEmbed')(interaction, errorMessage)
			return
		}

        const identifierList = group.devices.map(x => deviceList.find(y => y.key == x)).map(x => x.identifier).flat()
        const build = firmware.build
        
        const compatibleJailbreaks = jailbreakList
        .filter(jb => jb.compatibility && jb.compatibility
            .filter(c =>
                c.firmwares.includes(build) &&
                c.devices.some(r => identifierList.includes(r))
        ).length)

        let footerOsString = [firmware.osStr, firmware.version].join(' ')

        if (footerOsString && firmware.build) footerOsString += ' (' + firmware.build + ')'
        else if (!footerOsString && firmware.build) footerOsString = firmware.build
        else footerOsString = firmware.key

        const footer = `${group.name} on ${footerOsString}`

        let embed, buttonRow

        if (compatibleJailbreaks.length) {
            const jailbreakResponse = require('../views/getJailbreakEmbed')(compatibleJailbreaks[0], {
                identifierList: identifierList,
                build: build
            })
            embed = jailbreakResponse.embed
            buttonRow = jailbreakResponse.buttonRow
        } else {
            embed = new EmbedBuilder()
                .setTitle('No jailbreaks')
                .setDescription('There are no jailbreaks available for this device and firmware version.')
                .setColor(0xdf3c4c)
        }

        embed.setFooter({ text: footer })

        let replyObject = {embeds: [embed]}
        if (buttonRow) replyObject.components = [buttonRow]

		await interaction.reply(replyObject)
	},
	choices: {
        device: groupList.map(x => {
			return {
				name: x.name,
				value: x.key,
                devices: x.devices
			}
		}),
		version: {
            choiceArray: firmwareList
            .map(x => {
                let name = [x.osStr, x.version].filter(y => y).join(' ')
                if (duplicateFirmwareNameList.includes(name) && x.build) name += ` (${x.build})`
                return {
                    name: name,
                    value: x.key,
                    deviceMap: x.deviceMap
                }
            }),
            filterBy: {
                option: 'device',
                optionProperty: 'devices',
                property: 'deviceMap'
            }
        }
	}
}