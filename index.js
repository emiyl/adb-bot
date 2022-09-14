const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, InteractionType } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);

		const focusedValue = interaction.options.getFocused();

        let getInteractionName = interaction.options.data.filter(x => x.focused)
        if (getInteractionName.length) getInteractionName = getInteractionName[0].name
        else return

        let choices = command.choices[getInteractionName];
        if (!choices) return

        const filtered = choices.filter(choice => {
            function test(str, val) {
                if (val) val = val.toLowerCase()
                if (str) str = str.toLowerCase()
                return str.includes(val)
            }
            return test(choice.name, focusedValue) || test(choice.value, focusedValue)
        }).slice(0,25);
		await interaction.respond(
			filtered.map(choice => ({ name: choice.name, value: choice.value })),
		);
    }

	if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(token);