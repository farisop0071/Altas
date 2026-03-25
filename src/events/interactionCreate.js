var { AtlasEmbed } = require('../utils/embedBuilder');
var ts = require('../systems/ticketSystem');

module.exports = {
    name: 'interactionCreate',
    once: false,
    execute: async function(interaction, client) {

        // Slash commands
        if (interaction.isChatInputCommand()) {
            var cmd = client.commands.get(interaction.commandName);
            if (!cmd) return;
            try { await cmd.execute(interaction); }
            catch(e) { console.error(e); var em = AtlasEmbed.error('Error','Command failed.'); if(interaction.replied||interaction.deferred) await interaction.followUp({embeds:[em],ephemeral:true}).catch(function(){}); else await interaction.reply({embeds:[em],ephemeral:true}).catch(function(){}); }
        }

        // Ticket buttons
        if (interaction.isButton()) {
            var id = interaction.customId;
            if (id.startsWith('ticket_create_')) return ts.handleTicketCreate(interaction, client);
            if (id === 'ticket_close') return ts.handleTicketClose(interaction, client);
            if (id === 'ticket_claim') return ts.handleTicketClaim(interaction, client);
            if (id === 'ticket_adduser') return ts.handleTicketAddUser(interaction, client);
            if (id === 'ticket_removeuser') return ts.handleTicketRemoveUser(interaction, client);
            if (id === 'ticket_transcript') return ts.handleTicketTranscript(interaction, client);
            if (id === 'ticket_delete') return ts.handleTicketDelete(interaction, client);
            if (id === 'ticket_reopen') return ts.handleTicketReopen(interaction, client);
            if (id.startsWith('ticket_priority_')) return ts.handleTicketPriority(interaction, client);
        }

        // Ticket select menu
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_create_select')
            return ts.handleTicketSelectCreate(interaction, client);

        // Modals
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'ticket_close_modal') return ts.handleTicketCloseModal(interaction, client);
            if (interaction.customId === 'ticket_adduser_modal') return ts.handleAddUserModal(interaction, client);
            if (interaction.customId === 'ticket_removeuser_modal') return ts.handleRemoveUserModal(interaction, client);
        }
    }
};