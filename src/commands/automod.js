var { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
var { AtlasEmbed } = require('../utils/embedBuilder');
var { getDb } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Manage AutoMod settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(function(sub) { return sub.setName('status').setDescription('View AutoMod status'); })
        .addSubcommand(function(sub) { return sub.setName('addword').setDescription('Add a bad word').addStringOption(function(opt) { return opt.setName('word').setDescription('Word').setRequired(true); }); })
        .addSubcommand(function(sub) { return sub.setName('removeword').setDescription('Remove a bad word').addStringOption(function(opt) { return opt.setName('word').setDescription('Word').setRequired(true); }); })
        .addSubcommand(function(sub) { return sub.setName('whitelist').setDescription('Whitelist a user').addUserOption(function(opt) { return opt.setName('user').setDescription('User').setRequired(true); }); })
        .addSubcommand(function(sub) { return sub.setName('toggle').setDescription('Toggle AutoMod on/off'); }),

    execute: async function(interaction) {
        var db = getDb();
        var sub = interaction.options.getSubcommand();

        if (sub === 'status') {
            var config = db.prepare('SELECT * FROM automod_config WHERE guild_id = ?').get(interaction.guild.id);
            var badWords = db.prepare('SELECT word FROM automod_badwords WHERE guild_id = ?').all(interaction.guild.id);
            var whitelisted = db.prepare('SELECT user_id FROM automod_whitelisted_users WHERE guild_id = ?').all(interaction.guild.id);
            var c = config || {};
            var embed = AtlasEmbed.info('AutoMod Status',
                '**Status:** ' + (c.enabled ? 'Enabled' : 'Disabled') + '\n\n' +
                '**Protections:**\n' +
                '> Anti-Spam: ' + (c.antispam ? c.antispam_max + ' msgs / ' + c.antispam_interval + 's' : 'Off') + '\n' +
                '> Anti-Link: ' + (c.antilink ? 'On' : 'Off') + '\n' +
                '> Anti-Bad Words: ' + (c.antibadwords ? badWords.length + ' words' : 'Off') + '\n' +
                '> Anti-Caps: ' + (c.anticaps ? c.anticaps_percent + '% threshold' : 'Off') + '\n' +
                '> Anti-Emoji: ' + (c.antiemoji ? 'Max ' + c.antiemoji_max : 'Off') + '\n' +
                '> Anti-Mention: ' + (c.antimention ? 'Max ' + c.antimention_max : 'Off') + '\n' +
                '> Anti-Raid: ' + (c.antiraid ? c.antiraid_joins + ' joins / ' + c.antiraid_seconds + 's -> ' + c.antiraid_action : 'Off') + '\n\n' +
                '**Whitelisted:** ' + (whitelisted.map(function(w) { return '<@' + w.user_id + '>'; }).join(', ') || 'None'));
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else if (sub === 'addword') {
            var word = interaction.options.getString('word').toLowerCase();
            db.prepare('INSERT OR REPLACE INTO automod_badwords (guild_id, word) VALUES (?, ?)').run(interaction.guild.id, word);
            await interaction.reply({ embeds: [AtlasEmbed.success('Word Added', 'Added word to filter.')], ephemeral: true });
        }
        else if (sub === 'removeword') {
            var word2 = interaction.options.getString('word').toLowerCase();
            db.prepare('DELETE FROM automod_badwords WHERE guild_id = ? AND word = ?').run(interaction.guild.id, word2);
            await interaction.reply({ embeds: [AtlasEmbed.success('Word Removed', 'Removed word from filter.')], ephemeral: true });
        }
        else if (sub === 'whitelist') {
            var user = interaction.options.getUser('user');
            db.prepare('INSERT OR REPLACE INTO automod_whitelisted_users (guild_id, user_id) VALUES (?, ?)').run(interaction.guild.id, user.id);
            await interaction.reply({ embeds: [AtlasEmbed.success('Whitelisted', '<@' + user.id + '> is now exempt from AutoMod.')], ephemeral: true });
        }
        else if (sub === 'toggle') {
            var cfg = db.prepare('SELECT enabled FROM automod_config WHERE guild_id = ?').get(interaction.guild.id);
            if (!cfg) {
                db.prepare('INSERT INTO automod_config (guild_id, enabled) VALUES (?, 1)').run(interaction.guild.id);
                await interaction.reply({ embeds: [AtlasEmbed.success('AutoMod Enabled', 'AutoMod turned on.')], ephemeral: true });
            } else {
                var ns = cfg.enabled ? 0 : 1;
                db.prepare('UPDATE automod_config SET enabled = ? WHERE guild_id = ?').run(ns, interaction.guild.id);
                await interaction.reply({ embeds: [AtlasEmbed.success(ns ? 'Enabled' : 'Disabled', 'AutoMod turned ' + (ns ? 'on' : 'off') + '.')], ephemeral: true });
            }
        }
    }
};