var { getDb } = require('../utils/database');
var { AtlasEmbed } = require('../utils/embedBuilder');
var { AutoModSystem } = require('../systems/automodSystem');
var { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

var autoMod = new AutoModSystem();

module.exports = {
    name: 'messageCreate',
    once: false,
    execute: async function(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;
        var db = getDb();

        // BOT PING
        if (message.mentions.has(client.user) && !message.mentions.everyone) {
            try {
                var users = client.guilds.cache.reduce(function(a, g) { return a + g.memberCount; }, 0);
                var embed = new EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setAuthor({ name: 'Atlas Bot', iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                    .setDescription('Hey **' + message.author.username + '**!\n\nI am **Atlas** - advanced server management!\n\n**Features:** /setup, AutoMod, AntiNuke, Welcome, Tickets, Counting\n\n**Dev:** Faris (erenyeager.exp)\n**Ping:** ' + client.ws.ping + 'ms | **Servers:** ' + client.guilds.cache.size + ' | **Users:** ' + users)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setFooter({ text: 'Atlas | Made by Faris (erenyeager.exp)' })
                    .setTimestamp();
                var url = 'https://discord.com/api/oauth2/authorize?client_id=' + client.user.id + '&permissions=8&scope=bot%20applications.commands';
                var row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Invite').setURL(url).setStyle(ButtonStyle.Link));
                await message.reply({ embeds: [embed], components: [row], allowedMentions: { repliedUser: false } });
            } catch(e) { console.error('Ping error:', e); }
            return;
        }

        // AUTOMOD
        try {
            var blocked = await autoMod.checkMessage(message);
            if (blocked) return;
        } catch(e) { console.error('AutoMod error:', e); }

        // MESSAGE TRACKING
        try {
            db.prepare('INSERT INTO message_tracking (guild_id, user_id, message_count, last_message) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(guild_id, user_id) DO UPDATE SET message_count = message_count + 1, last_message = CURRENT_TIMESTAMP').run(message.guild.id, message.author.id);
        } catch(e) {}

        // MESSAGE TRACKING
        try {
            db.prepare('INSERT INTO message_tracking (guild_id, user_id, message_count, last_message) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(guild_id, user_id) DO UPDATE SET message_count = message_count + 1, last_message = CURRENT_TIMESTAMP').run(message.guild.id, message.author.id);
        } catch(e) {}

        // MESSAGE TRACKING
        try {
            db.prepare('INSERT INTO message_tracking (guild_id, user_id, message_count, last_message) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(guild_id, user_id) DO UPDATE SET message_count = message_count + 1, last_message = CURRENT_TIMESTAMP').run(message.guild.id, message.author.id);
        } catch(e) {}

        // MESSAGE TRACKING
        try {
            db.prepare('INSERT INTO message_tracking (guild_id, user_id, message_count, last_message) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(guild_id, user_id) DO UPDATE SET message_count = message_count + 1, last_message = CURRENT_TIMESTAMP').run(message.guild.id, message.author.id);
        } catch(e) {}

        // MESSAGE TRACKING
        try {
            db.prepare('INSERT INTO message_tracking (guild_id, user_id, message_count, last_message) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(guild_id, user_id) DO UPDATE SET message_count = message_count + 1, last_message = CURRENT_TIMESTAMP').run(message.guild.id, message.author.id);
        } catch(e) {}

        // MESSAGE TRACKING
        try {
            db.prepare('INSERT INTO message_tracking (guild_id, user_id, message_count, last_message) VALUES (?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(guild_id, user_id) DO UPDATE SET message_count = message_count + 1, last_message = CURRENT_TIMESTAMP').run(message.guild.id, message.author.id);
        } catch(e) {}

        // COUNTING
        try {
            var cc = db.prepare('SELECT * FROM counting_config WHERE guild_id = ? AND enabled = 1').get(message.guild.id);
            if (cc && message.channel.id === cc.channel_id) {
                var num = parseInt(message.content);
                if (isNaN(num)) { try { await message.delete(); } catch(e) {} return; }
                var exp = cc.current_count + 1;
                if (message.author.id === cc.last_user_id) {
                    await message.react('\u274C');
                    var m1 = await message.channel.send({ embeds: [AtlasEmbed.error('Counting', '<@' + message.author.id + '> cant count twice! Reset to 0.')] });
                    db.prepare('UPDATE counting_config SET current_count = 0, last_user_id = NULL WHERE guild_id = ?').run(message.guild.id);
                    setTimeout(function() { try{m1.delete();}catch(e){} }, 5000);
                } else if (num === exp) {
                    await message.react('\u2705');
                    var hs = Math.max(cc.high_score, num);
                    db.prepare('UPDATE counting_config SET current_count = ?, last_user_id = ?, high_score = ? WHERE guild_id = ?').run(num, message.author.id, hs, message.guild.id);
                    if (num % 100 === 0) await message.channel.send({ embeds: [AtlasEmbed.success('Milestone!', 'Reached **' + num + '**!')] });
                } else {
                    await message.react('\u274C');
                    var m2 = await message.channel.send({ embeds: [AtlasEmbed.error('Counting', 'Expected **' + exp + '**! Reset to 0.')] });
                    db.prepare('UPDATE counting_config SET current_count = 0, last_user_id = NULL WHERE guild_id = ?').run(message.guild.id);
                    setTimeout(function() { try{m2.delete();}catch(e){} }, 5000);
                }
            }
        } catch(e) {}
    }
};