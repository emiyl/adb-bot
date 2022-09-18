const { botManagerUsername } = require('../config.json')

module.exports = function(interaction, client) {
    const command = client.commands.get(interaction.commandName)
    
    if (!command) return

    try {
        command.execute(interaction)
    } catch (error) {
        console.error(error)
        interaction.reply({ content: `There was an error while executing this command! Please contact ${botManagerUsername}`, ephemeral: true })
    }
}