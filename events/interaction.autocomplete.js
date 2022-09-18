module.exports = function(interaction, client) {
    const command = client.commands.get(interaction.commandName)
    
    const focusedValue = interaction.options.getFocused()

    let getInteractionName = interaction.options.data.filter(x => x.focused)
    if (getInteractionName.length) getInteractionName = getInteractionName[0].name
    else return

    let choices = command.choices[getInteractionName]
    let choiceArray = []
    let filterBy
    
    if (!choices) return
    
    if (choices.hasOwnProperty('choiceArray')) choiceArray = choices.choiceArray
    else choiceArray = choices

    if (choices.hasOwnProperty('filterBy')) filterBy = choices.filterBy

    const filtered = choiceArray.filter(choice => {
        if (filterBy) {
            let getValue = interaction.options.data.filter(x => x.name == filterBy.option)
            if (!getValue.length) return true
            else getValue = getValue[0].value

            let getChoice = getValue
            if (filterBy.optionProperty) {
                getChoice = command.choices[filterBy.option].filter(x => x.value == getValue)
                if (!getChoice.length) return true
                else getChoice = getChoice[0][filterBy.optionProperty]
            }

            if (!Array.isArray(getChoice)) getChoice = [getChoice]
            if (!choice[filterBy.property].some(r => getChoice.includes(r))) return false
        }

        function test(str, val) {
            if (val) val = val.toLowerCase()
            if (str) str = str.toLowerCase()
            return str.includes(val)
        }

        if (choice.hasOwnProperty('value')) return test(choice.name, focusedValue) || test(choice.value, focusedValue)
        
        return test(choice, focusedValue)
    }).slice(0,25)
    
    interaction.respond(
        filtered.map(choice => ({ name: choice.name || choice, value: choice.value || choice })),
    )
}