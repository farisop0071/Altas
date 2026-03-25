var { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
var { AtlasEmbed } = require('../utils/embedBuilder');
var { getDb } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder().setName('reset').setDescription('Reset all Atlas settings for this server').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    execute: async function(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ embeds: [AtlasEmbed.error('Permission Denied', 'Only the server owner can reset Atlas settings.')], ephemeral: true });
        }

        var confirmEmbed = AtlasEmbed.warning('Reset Confirmation',
            'Are you sure you want to reset all Atlas settings?\n\n' +
            '**This will:**\n> Remove all database configurations\n> Disable AutoMod, AntiNuke, Welcome, Tickets, Counting\n> NOT delete created channels or roles\n\nThis action cannot be undone.');

        var row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('reset_confirm').setLabel('Yes, Reset Everything').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('reset_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        );

        var response = await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });

        var collector = response.createMessageComponentCollector({ filter: function(i2) { return i2.user.id === interaction.user.id; }, time: 30000, max: 1 });

        collector.on('collect', async function(i2) {
            if (i2.customId === 'reset_confirm') {
                var db = getDb();
                var guildId = interaction.guild.id;
                var tables = ['guild_config', 'welcome_config', 'automod_config', 'automod_whitelisted_users', 'automod_badwords', 'automod_whitelisted_links', 'antinuke_config', 'antinuke_whitelisted', 'ticket_config', 'ticket_categories', 'tickets', 'counting_config', 'spam_tracking', 'setup_roles'];
                for (var table of tables) { try { db.prepare('DELETE FROM ' + table + ' WHERE guild_id = ?').run(guildId); } catch(e) {} }
                await i2.update({ embeds: [AtlasEmbed.success('Reset Complete', 'All Atlas settings have been reset. Run /setup to set up again.')], components: [] });
            } else {
                await i2.update({ embeds: [AtlasEmbed.info('Cancelled', 'Reset has been cancelled.')], components: [] });
            }
        });
    }
};