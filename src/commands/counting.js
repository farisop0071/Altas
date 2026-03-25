var { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
var { AtlasEmbed } = require('../utils/embedBuilder');
var { getDb } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('counting')
        .setDescription('Manage counting system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(function(sub) { return sub.setName('setup').setDescription('Set counting channel').addChannelOption(function(opt) { return opt.setName('channel').setDescription('Counting channel').setRequired(true); }); })
        .addSubcommand(function(sub) { return sub.setName('reset').setDescription('Reset the count'); })
        .addSubcommand(function(sub) { return sub.setName('stats').setDescription('View counting stats'); }),

    execute: async function(interaction) {
        var db = getDb();
        var sub = interaction.options.getSubcommand();

        if (sub === 'setup') {
            var channel = interaction.options.getChannel('channel');
            db.prepare('INSERT OR REPLACE INTO counting_config (guild_id, enabled, channel_id, current_count, last_user_id, high_score) VALUES (?, 1, ?, 0, NULL, 0)').run(interaction.guild.id, channel.id);
            await interaction.reply({ embeds: [AtlasEmbed.success('Counting Setup', 'Counting has been set up in <#' + channel.id + '>! Start counting from 1!')], ephemeral: true });
        }
        else if (sub === 'reset') {
            db.prepare('UPDATE counting_config SET current_count = 0, last_user_id = NULL WHERE guild_id = ?').run(interaction.guild.id);
            await interaction.reply({ embeds: [AtlasEmbed.success('Count Reset', 'The count has been reset to 0.')], ephemeral: true });
        }
        else if (sub === 'stats') {
            var config = db.prepare('SELECT * FROM counting_config WHERE guild_id = ?').get(interaction.guild.id);
            if (!config) return interaction.reply({ embeds: [AtlasEmbed.error('Not Setup', 'Counting is not set up. Use /counting setup.')], ephemeral: true });
            var embed = AtlasEmbed.info('Counting Stats',
                '**Status:** ' + (config.enabled ? 'Active' : 'Inactive') + '\n' +
                '**Channel:** <#' + config.channel_id + '>\n' +
                '**Current Count:** ' + config.current_count + '\n' +
                '**High Score:** ' + config.high_score + '\n' +
                '**Last Counter:** ' + (config.last_user_id ? '<@' + config.last_user_id + '>' : 'None'));
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};