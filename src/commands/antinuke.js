var { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
var { AtlasEmbed } = require('../utils/embedBuilder');
var { getDb } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Manage AntiNuke settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(function(sub) { return sub.setName('whitelist').setDescription('Add a user to the AntiNuke whitelist').addUserOption(function(opt) { return opt.setName('user').setDescription('User to whitelist').setRequired(true); }); })
        .addSubcommand(function(sub) { return sub.setName('unwhitelist').setDescription('Remove a user from the AntiNuke whitelist').addUserOption(function(opt) { return opt.setName('user').setDescription('User to unwhitelist').setRequired(true); }); })
        .addSubcommand(function(sub) { return sub.setName('status').setDescription('View AntiNuke status and whitelisted users'); }),

    execute: async function(interaction) {
        var db = getDb();
        var sub = interaction.options.getSubcommand();

        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ embeds: [AtlasEmbed.error('Permission Denied', 'Only the server owner can manage AntiNuke settings.')], ephemeral: true });
        }

        if (sub === 'whitelist') {
            var user = interaction.options.getUser('user');
            db.prepare('INSERT OR REPLACE INTO antinuke_whitelisted (guild_id, user_id) VALUES (?, ?)').run(interaction.guild.id, user.id);
            await interaction.reply({ embeds: [AtlasEmbed.success('AntiNuke Whitelist', '<@' + user.id + '> has been added to the AntiNuke whitelist.')], ephemeral: true });
        }
        else if (sub === 'unwhitelist') {
            var user2 = interaction.options.getUser('user');
            db.prepare('DELETE FROM antinuke_whitelisted WHERE guild_id = ? AND user_id = ?').run(interaction.guild.id, user2.id);
            await interaction.reply({ embeds: [AtlasEmbed.success('AntiNuke Whitelist', '<@' + user2.id + '> has been removed from the AntiNuke whitelist.')], ephemeral: true });
        }
        else if (sub === 'status') {
            var config = db.prepare('SELECT * FROM antinuke_config WHERE guild_id = ?').get(interaction.guild.id);
            var whitelisted = db.prepare('SELECT user_id FROM antinuke_whitelisted WHERE guild_id = ?').all(interaction.guild.id);
            var wlList = whitelisted.length > 0 ? whitelisted.map(function(w) { return '> <@' + w.user_id + '>'; }).join('\n') : '> None';

            var embed = AtlasEmbed.info('AntiNuke Status',
                '**Status:** ' + (config && config.enabled ? 'Enabled' : 'Disabled') + '\n\n' +
                '**Protection:**\n' +
                '> Anti Bot Add: ' + (config && config.anti_bot_add ? 'Yes' : 'No') + '\n' +
                '> Anti Role Give: ' + (config && config.anti_role_give ? 'Yes' : 'No') + '\n' +
                '> Anti Perm Change: ' + (config && config.anti_perm_change ? 'Yes' : 'No') + '\n' +
                '> Anti Role Delete: ' + (config && config.anti_role_delete ? 'Yes' : 'No') + '\n' +
                '> Anti Channel Delete: ' + (config && config.anti_channel_delete ? 'Yes' : 'No') + '\n' +
                '> Anti Mass Ban: ' + (config && config.anti_mass_ban ? 'Yes' : 'No') + '\n' +
                '> Anti Mass Kick: ' + (config && config.anti_mass_kick ? 'Yes' : 'No') + '\n\n' +
                '**Bypass Role:** ' + (config && config.bypass_role_id ? '<@&' + config.bypass_role_id + '>' : 'None') + '\n\n' +
                '**Whitelisted Users:**\n' + wlList);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};