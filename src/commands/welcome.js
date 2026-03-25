var { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
var { AtlasEmbed } = require('../utils/embedBuilder');
var { getDb } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Manage welcome system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(function(sub) { return sub.setName('toggle').setDescription('Toggle welcome system on/off'); })
        .addSubcommand(function(sub) { return sub.setName('channel').setDescription('Set welcome channel').addChannelOption(function(opt) { return opt.setName('channel').setDescription('Welcome channel').setRequired(true); }); })
        .addSubcommand(function(sub) { return sub.setName('message').setDescription('Set welcome message').addStringOption(function(opt) { return opt.setName('message').setDescription('Welcome message ({user}, {server}, {count})').setRequired(true); }); })
        .addSubcommand(function(sub) { return sub.setName('test').setDescription('Test the welcome system'); })
        .addSubcommand(function(sub) { return sub.setName('status').setDescription('View welcome system status'); }),

    execute: async function(interaction) {
        var db = getDb();
        var sub = interaction.options.getSubcommand();

        if (sub === 'toggle') {
            var config = db.prepare('SELECT enabled FROM welcome_config WHERE guild_id = ?').get(interaction.guild.id);
            if (!config) return interaction.reply({ embeds: [AtlasEmbed.error('Not Setup', 'Welcome system is not set up. Use /setup first.')], ephemeral: true });
            var newState = config.enabled ? 0 : 1;
            db.prepare('UPDATE welcome_config SET enabled = ? WHERE guild_id = ?').run(newState, interaction.guild.id);
            await interaction.reply({ embeds: [AtlasEmbed.success(newState ? 'Welcome Enabled' : 'Welcome Disabled', 'Welcome system has been turned ' + (newState ? 'on' : 'off') + '.')], ephemeral: true });
        }
        else if (sub === 'channel') {
            var channel = interaction.options.getChannel('channel');
            db.prepare('UPDATE welcome_config SET channel_id = ? WHERE guild_id = ?').run(channel.id, interaction.guild.id);
            await interaction.reply({ embeds: [AtlasEmbed.success('Welcome Channel Set', 'Welcome messages will be sent to <#' + channel.id + '>')], ephemeral: true });
        }
        else if (sub === 'message') {
            var message = interaction.options.getString('message');
            db.prepare('UPDATE welcome_config SET message = ? WHERE guild_id = ?').run(message, interaction.guild.id);
            await interaction.reply({ embeds: [AtlasEmbed.success('Welcome Message Set', 'New message:\n> ' + message)], ephemeral: true });
        }
        else if (sub === 'test') {
            var createWelcomeCard = require('../canvas/welcomeCanvas').createWelcomeCard;
            var cfg = db.prepare('SELECT * FROM welcome_config WHERE guild_id = ?').get(interaction.guild.id);
            if (!cfg) return interaction.reply({ embeds: [AtlasEmbed.error('Not Setup', 'Welcome system is not configured.')], ephemeral: true });
            await interaction.deferReply({ ephemeral: true });
            var card = await createWelcomeCard(interaction.member, cfg.message);
            var msg = cfg.message || 'Welcome {user} to {server}!';
            msg = msg.replace(/{user}/g, '<@' + interaction.user.id + '>').replace(/{server}/g, interaction.guild.name).replace(/{count}/g, interaction.guild.memberCount.toString());
            var embed = AtlasEmbed.default(null, msg).setAuthor({ name: 'Welcome to ' + interaction.guild.name + '!', iconURL: interaction.guild.iconURL({ dynamic: true }) }).setImage('attachment://welcome-card.png').setColor(0x5865F2);
            await interaction.editReply({ embeds: [embed], files: [card] });
        }
        else if (sub === 'status') {
            var cfg2 = db.prepare('SELECT * FROM welcome_config WHERE guild_id = ?').get(interaction.guild.id);
            if (!cfg2) return interaction.reply({ embeds: [AtlasEmbed.error('Not Setup', 'Welcome system is not configured.')], ephemeral: true });
            var embed2 = AtlasEmbed.info('Welcome System Status',
                '**Status:** ' + (cfg2.enabled ? 'Enabled' : 'Disabled') + '\n' +
                '**Channel:** ' + (cfg2.channel_id ? '<#' + cfg2.channel_id + '>' : 'Not set') + '\n' +
                '**Canvas Cards:** ' + (cfg2.use_canvas ? 'Yes' : 'No') + '\n' +
                '**Message:** ' + (cfg2.message || 'Default'));
            await interaction.reply({ embeds: [embed2], ephemeral: true });
        }
    }
};