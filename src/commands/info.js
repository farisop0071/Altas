var { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
var { AtlasEmbed } = require('../utils/embedBuilder');
var { createBotInfoCard } = require('../canvas/botInfoCanvas');

module.exports = {
    data: new SlashCommandBuilder().setName('info').setDescription('View bot information'),

    execute: async function(interaction) {
        await interaction.deferReply();
        var client = interaction.client;
        var ms = client.uptime;
        var days = Math.floor(ms / 86400000);
        var hours = Math.floor((ms % 86400000) / 3600000);
        var minutes = Math.floor((ms % 3600000) / 60000);
        var uptime = days + 'd ' + hours + 'h ' + minutes + 'm';
        var totalUsers = client.guilds.cache.reduce(function(a, g) { return a + g.memberCount; }, 0);

        try {
            var infoCard = await createBotInfoCard(client);
            var embed = AtlasEmbed.default('Atlas Bot', null)
                .setDescription(
                    '**Advanced Server Management Bot**\n\n' +
                    '> Setup: /setup\n> AutoMod System\n> AntiNuke Protection\n> Welcome System with Canvas\n> Ticket System\n> Counting System\n\n' +
                    '**Stats:**\n' +
                    '> Servers: **' + client.guilds.cache.size + '**\n' +
                    '> Users: **' + totalUsers + '**\n' +
                    '> Ping: **' + client.ws.ping + 'ms**\n' +
                    '> Uptime: **' + uptime + '**\n' +
                    '> Node.js: **' + process.version + '**\n\n' +
                    '**Developer:** Faris (erenyeager.exp)')
                .setImage('attachment://atlas-info.png');

            var inviteURL = 'https://discord.com/api/oauth2/authorize?client_id=' + client.user.id + '&permissions=8&scope=bot%20applications.commands';
            var row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Invite Atlas').setURL(inviteURL).setStyle(ButtonStyle.Link));
            await interaction.editReply({ embeds: [embed], files: [infoCard], components: [row] });
        } catch (error) {
            console.error('Info command error:', error);
            var embed2 = AtlasEmbed.info('Atlas Bot', 'Developer: Faris (erenyeager.exp)\nServers: ' + client.guilds.cache.size + '\nPing: ' + client.ws.ping + 'ms\nUptime: ' + uptime);
            await interaction.editReply({ embeds: [embed2] });
        }
    }
};