const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder, ButtonStyle
} = require('discord.js')

module.exports = function(jailbreak, guideFilter) {
    let embed = new EmbedBuilder()
        .setTitle(jailbreak.name)
        .setURL(`https://appledb.dev/jailbreak/${jailbreak.name}`)
        .setColor(0x0099FF)

    let buttonRow

    if (jailbreak.info) {
        const info = jailbreak.info

        if (info.firmwares) {
            const supportedFirmwares = info.firmwares

            const firstTwo = supportedFirmwares.slice(0,2)
            const middle = supportedFirmwares.slice(2,-1)
            const last = supportedFirmwares.slice(-1)
            const length = supportedFirmwares.length

            let supportedFirmwaresString = firstTwo.join(' to ')
            if (length > 3) supportedFirmwaresString += ', ' + middle.join(', ')
            if (length > 2) supportedFirmwaresString += ' and ' + last
            
            embed.addFields({
                name: `Supported firmware${supportedFirmwares.length > 1 ? 's' : ''}`,
                value: supportedFirmwaresString,
                inline: false
            })
        }

        function addInfoField(property, title, inline) {
            if (info[property])embed.addFields({
                name: title,
                value: info[property],
                inline: inline
            })
        }

        addInfoField('type', 'Type', true)
        addInfoField('latestVer', 'Latest version', true)
        addInfoField('notes', 'Notes', false)

        if (info.color) embed.setColor(parseInt(info.color.replace('#',''),16))
        if (info.icon) embed.setThumbnail(encodeURI(`https://appledb.dev${info.icon}`))
        
        buttonRow = new ActionRowBuilder()

        if (info.website) buttonRow.addComponents(
            new ButtonBuilder()
                .setLabel('Website')
                .setStyle(ButtonStyle.Link)
                .setURL(info.website.url)
        )

        if (info.guide) {
            const validGuides = info.guide
            .filter(g => g.validGuide)

            let guideList = validGuides

            if (guideFilter) {
                const {identifierList, build} = guideFilter
                const defaultGuides = validGuides.filter(x => !x.firmwares && !x.devices)
                const filteredGuides = validGuides
                .filter(x => {
                    return (x.firmwares || x.devices) &&
                    (x.firmwares ? x.firmwares.includes(build) : true) &&
                    (x.devices ? x.devices.some(r => identifierList.includes(r)) : true)
                })
    
                guideList = filteredGuides
                if (!guideList.length) guideList = defaultGuides
            }
            
            guideList.forEach(guide => {
                buttonRow.addComponents(
                    new ButtonBuilder()
                        .setLabel(guide.name)
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://ios.cfw.guide${guide.url}`)
                )
            })
        }
    }
    
    return {
        embed: embed,
        buttonRow: buttonRow
    }
}