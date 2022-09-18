module.exports = {
	name: 'interactionCreate',
	execute(interaction, client) {
        if (interaction.isAutocomplete()) require('./interaction.autocomplete')(interaction, client)
        if (interaction.isChatInputCommand()) require('./interaction.chatInputCommand')(interaction, client)
	}
}