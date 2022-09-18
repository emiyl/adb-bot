const {
    EmbedBuilder
} = require('discord.js')

module.exports = function(interaction, description) {
    let errorMessage = description
    .map(x => {
        if (x.key) x.key = x.key.replace(/`/g, '')
        return x
    })
    .map(x => {
        let ret
        if (x.type == 'notFound') {
            ret = `${x.string} \`${x.key}\` not found`
        } else if (x.type == 'tooLong') {
            ret = `Input \`${x.string}\` exceeds character limit`
        }
        return ret
    })

    let embed = new EmbedBuilder()
        .setColor(0xdf3c4c)
        .setTitle('Error')
        .setDescription(errorMessage.join('\n'))
    interaction.reply({ embeds: [embed] })
}