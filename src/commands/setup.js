var {
    SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder,
    ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, EmbedBuilder
} = require('discord.js');
var { AtlasEmbed } = require('../utils/embedBuilder');
var { getDb } = require('../utils/database');
var { serverTemplates, bigServerExtras, welcomeMessages } = require('../templates/serverTemplates');
var { getRandomStyle, getChannelEmoji } = require('../utils/styleRandomizer');
var { botRecommendations } = require('../templates/botRecommendations');
var { botRecommendations } = require('../templates/botRecommendations');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup your entire server with Atlas wizard')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    execute: async function(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ embeds: [AtlasEmbed.error('Permission Denied', 'Only admins can run setup.')], ephemeral: true });
        }

        var session = {
            userId: interaction.user.id, guildId: interaction.guild.id, step: 1,
            config: {
                serverType: null, serverSize: null, setupRoles: false,
                setupWelcome: false, welcomeMessage: null,
                setupAutoMod: false, automodBadWords: [],
                setupAntiNuke: false, setupTickets: false, showBots: false, showBots: false,
                ticketConfig: { title: 'Support Tickets', description: 'Click below to create a ticket', categories: [], useButtons: true },
            },
            createdRoles: {}, createdChannels: {}, createdCategories: {},
            style: getRandomStyle(),
        };

        interaction.client.setupSessions.set(interaction.user.id, session);

        var step1Embed = AtlasEmbed.setup(1, 8, 'Server Type',
            'Hey **' + interaction.user.username + '**! Welcome to Atlas Setup!\n\nWhat type of server is this?');

        var menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('setup_server_type').setPlaceholder('Select server type...').addOptions([
                { label: 'Community / Chill', value: 'community', description: 'Hangout & chill community' },
                { label: 'Gaming Server', value: 'gaming', description: 'Gaming community' },
                { label: 'Minecraft Server', value: 'minecraft', description: 'MC game server' },
                { label: 'Hosting Server', value: 'hosting', description: 'Hosting services' },
                { label: 'Selling / Services', value: 'selling', description: 'Digital services' },
                { label: 'Content Creator', value: 'creator', description: 'YouTube/Twitch creator' },
                { label: 'Anime Server', value: 'anime', description: 'Anime community' },
                { label: 'General Server', value: 'general', description: 'General purpose' },
            ])
        );

        await interaction.reply({ embeds: [step1Embed], components: [menu], ephemeral: true });

        var waitingForInput = null;
        var collector = interaction.channel.createMessageComponentCollector({ filter: function(i) { return i.user.id === interaction.user.id; }, time: 600000 });
        var msgCollector = interaction.channel.createMessageCollector({ filter: function(m) { return m.author.id === interaction.user.id; }, time: 600000 });

        msgCollector.on('collect', async function(message) {
            var s = interaction.client.setupSessions.get(interaction.user.id);
            if (!s) return;
            if (waitingForInput === 'badwords') {
                var words = message.content.split(',').map(function(w) { return w.trim().toLowerCase(); }).filter(function(w) { return w.length > 0; });
                s.config.automodBadWords = words;
                interaction.client.setupSessions.set(interaction.user.id, s);
                try { await message.delete(); } catch(e) {}
                await interaction.editReply({ embeds: [AtlasEmbed.success('Bad Words Added', 'Added **' + words.length + '** words. Proceeding...')], components: [] });
                waitingForInput = null;
                setTimeout(function() { showStep6(interaction, s); }, 1500);
            } else if (waitingForInput === 'custom_welcome') {
                s.config.welcomeMessage = message.content;
                interaction.client.setupSessions.set(interaction.user.id, s);
                try { await message.delete(); } catch(e) {}
                await interaction.editReply({ embeds: [AtlasEmbed.success('Welcome Set', '> ' + message.content)], components: [] });
                waitingForInput = null;
                setTimeout(function() { showStep5(interaction, s); }, 1500);
            } else if (waitingForInput === 'ticket_title') {
                s.config.ticketConfig.title = message.content;
                try { await message.delete(); } catch(e) {}
                waitingForInput = 'ticket_desc';
                await interaction.editReply({ embeds: [AtlasEmbed.setup(7, 8, 'Ticket Description', 'Type the description:')], components: [] });
            } else if (waitingForInput === 'ticket_desc') {
                s.config.ticketConfig.description = message.content;
                try { await message.delete(); } catch(e) {}
                waitingForInput = 'ticket_cats';
                await interaction.editReply({ embeds: [AtlasEmbed.setup(7, 8, 'Ticket Categories', 'Type categories separated by commas:\nExample: General Support, Billing, Bug Report')], components: [] });
            } else if (waitingForInput === 'ticket_cats') {
                var cats = message.content.split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
                s.config.ticketConfig.categories = cats;
                interaction.client.setupSessions.set(interaction.user.id, s);
                try { await message.delete(); } catch(e) {}
                waitingForInput = null;
                var catList = cats.map(function(c) { return '**' + c + '**'; }).join(', ');
                var styleRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_style_buttons').setLabel('Buttons').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('ticket_style_dropdown').setLabel('Dropdown').setStyle(ButtonStyle.Secondary)
                );
                await interaction.editReply({ embeds: [AtlasEmbed.setup(7, 8, 'Ticket Style', 'Categories: ' + catList + '\n\nButtons or Dropdown?')], components: [styleRow] });
            }
        });

        collector.on('collect', async function(i) {
            var s = interaction.client.setupSessions.get(interaction.user.id);
            if (!s) return;
            try {
                if (i.customId === 'setup_server_type') { s.config.serverType = i.values[0]; await i.deferUpdate(); await showStep2(interaction, s); }
                else if (i.customId === 'setup_size_static' || i.customId === 'setup_size_big') { s.config.serverSize = i.customId.includes('static') ? 'static' : 'big'; await i.deferUpdate(); await showStep3(interaction, s); }
                else if (i.customId === 'setup_roles_yes' || i.customId === 'setup_roles_no') { s.config.setupRoles = i.customId.includes('yes'); await i.deferUpdate(); await showStep4(interaction, s); }
                else if (i.customId === 'setup_welcome_no') { s.config.setupWelcome = false; await i.deferUpdate(); await showStep5(interaction, s); }
                else if (i.customId === 'setup_welcome_yes') { s.config.setupWelcome = true; await i.deferUpdate(); await showWelcomeMsgs(interaction, s); }
                else if (i.customId === 'setup_welcome_select') {
                    if (i.values[0] === 'custom') { await i.deferUpdate(); waitingForInput = 'custom_welcome'; await interaction.editReply({ embeds: [AtlasEmbed.setup(4, 8, 'Custom Welcome', 'Type your message. Use {user} {server} {count}')], components: [] }); }
                    else { var wm = welcomeMessages.find(function(m) { return m.id === i.values[0]; }); s.config.welcomeMessage = wm.message; await i.deferUpdate(); await showStep5(interaction, s); }
                }
                else if (i.customId === 'setup_automod_no') { s.config.setupAutoMod = false; await i.deferUpdate(); await showStep6(interaction, s); }
                else if (i.customId === 'setup_automod_yes') { s.config.setupAutoMod = true; await i.deferUpdate(); waitingForInput = 'badwords'; await interaction.editReply({ embeds: [AtlasEmbed.setup(5, 8, 'Bad Words', 'Type bad words separated by commas:')], components: [] }); }
                else if (i.customId === 'setup_antinuke_yes' || i.customId === 'setup_antinuke_no') { s.config.setupAntiNuke = i.customId.includes('yes'); await i.deferUpdate(); await showStep7(interaction, s); }
                else if (i.customId === 'setup_tickets_no') { s.config.setupTickets = false; await i.deferUpdate(); await showStep8(interaction, s); }
                else if (i.customId === 'setup_tickets_yes') { s.config.setupTickets = true; await i.deferUpdate(); waitingForInput = 'ticket_title'; await interaction.editReply({ embeds: [AtlasEmbed.setup(7, 8, 'Ticket Title', 'Type the title for your ticket panel:')], components: [] }); }
                else if (i.customId === 'ticket_style_buttons' || i.customId === 'ticket_style_dropdown') { s.config.ticketConfig.useButtons = i.customId.includes('buttons'); await i.deferUpdate(); await showStep8(interaction, s); }
                else if (i.customId === 'setup_bots_yes') { s.config.showBots = true; await i.deferUpdate(); await showBotList(interaction, s); }
                else if (i.customId === 'setup_bots_no' || i.customId === 'setup_bots_done') { await i.deferUpdate(); await executeSetup(interaction, s); }
                else if (i.customId === 'setup_bot_select') {
                    await i.deferUpdate();
                    var { botList: bl, getBotInvite: gi } = require('../templates/botRecommendations');
                    var selected = i.values;
                    var links = selected.map(function(botId) {
                        var bot = bl.find(function(b) { return b.id === botId; });
                        return bot ? '> [**' + bot.name + '**](' + gi(botId) + ') - ' + bot.desc : '';
                    }).filter(function(l) { return l.length > 0; }).join('\n');
                    var doneRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_bots_done').setLabel('Continue Setup').setStyle(ButtonStyle.Success));
                    await interaction.editReply({ embeds: [AtlasEmbed.info('Invite These Bots', links + '\n\n*Click each link to add the bot!*')], components: [doneRow] });
                }
                else if (i.customId === 'setup_bot_select') {
                    await i.deferUpdate();
                    var { botList: bl, getBotInvite: gi } = require('../templates/botRecommendations');
                    var selected = i.values;
                    var links = selected.map(function(botId) {
                        var bot = bl.find(function(b) { return b.id === botId; });
                        return bot ? '> [**' + bot.name + '**](' + gi(botId) + ') - ' + bot.desc : '';
                    }).filter(function(l) { return l.length > 0; }).join('\n');
                    var doneRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_bots_done').setLabel('Continue Setup').setStyle(ButtonStyle.Success));
                    await interaction.editReply({ embeds: [AtlasEmbed.info('Invite These Bots', links + '\n\n*Click each link to add the bot!*')], components: [doneRow] });
                }
                else if (i.customId === 'setup_bot_select') {
                    await i.deferUpdate();
                    var { botList: bl, getBotInvite: gi } = require('../templates/botRecommendations');
                    var selected = i.values;
                    var links = selected.map(function(botId) {
                        var bot = bl.find(function(b) { return b.id === botId; });
                        return bot ? '> [**' + bot.name + '**](' + gi(botId) + ') - ' + bot.desc : '';
                    }).filter(function(l) { return l.length > 0; }).join('\n');
                    var doneRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_bots_done').setLabel('Continue Setup').setStyle(ButtonStyle.Success));
                    await interaction.editReply({ embeds: [AtlasEmbed.info('Invite These Bots', links + '\n\n*Click each link to add the bot!*')], components: [doneRow] });
                }
                else if (i.customId === 'setup_bot_select') {
                    await i.deferUpdate();
                    var { botList: bl, getBotInvite: gi } = require('../templates/botRecommendations');
                    var selected = i.values;
                    var links = selected.map(function(botId) {
                        var bot = bl.find(function(b) { return b.id === botId; });
                        return bot ? '> [**' + bot.name + '**](' + gi(botId) + ') - ' + bot.desc : '';
                    }).filter(function(l) { return l.length > 0; }).join('\n');
                    var doneRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_bots_done').setLabel('Continue Setup').setStyle(ButtonStyle.Success));
                    await interaction.editReply({ embeds: [AtlasEmbed.info('Invite These Bots', links + '\n\n*Click each link to add the bot!*')], components: [doneRow] });
                }
                else if (i.customId === 'setup_bot_select') {
                    await i.deferUpdate();
                    var { botList: bl, getBotInvite: gi } = require('../templates/botRecommendations');
                    var selected = i.values;
                    var links = selected.map(function(botId) {
                        var bot = bl.find(function(b) { return b.id === botId; });
                        return bot ? '> [**' + bot.name + '**](' + gi(botId) + ') - ' + bot.desc : '';
                    }).filter(function(l) { return l.length > 0; }).join('\n');
                    var doneRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_bots_done').setLabel('Continue Setup').setStyle(ButtonStyle.Success));
                    await interaction.editReply({ embeds: [AtlasEmbed.info('Invite These Bots', links + '\n\n*Click each link to add the bot!*')], components: [doneRow] });
                }
                else if (i.customId === 'setup_bot_select') {
                    await i.deferUpdate();
                    var { botList: bl, getBotInvite: gi } = require('../templates/botRecommendations');
                    var selected = i.values;
                    var links = selected.map(function(botId) {
                        var bot = bl.find(function(b) { return b.id === botId; });
                        return bot ? '> [**' + bot.name + '**](' + gi(botId) + ') - ' + bot.desc : '';
                    }).filter(function(l) { return l.length > 0; }).join('\n');
                    var doneRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_bots_done').setLabel('Continue Setup').setStyle(ButtonStyle.Success));
                    await interaction.editReply({ embeds: [AtlasEmbed.info('Invite These Bots', links + '\n\n*Click each link to add the bot!*')], components: [doneRow] });
                }
            } catch(e) { console.error('Setup error:', e); }
        });
        collector.on('end', function() { interaction.client.setupSessions.delete(interaction.user.id); msgCollector.stop(); });
    }
};

async function showStep2(inter, s) { var t = serverTemplates[s.config.serverType]; await inter.editReply({ embeds: [AtlasEmbed.setup(2, 8, 'Server Size', 'Selected: **' + t.name + '**\n\n**Static** = compact\n**Big** = extra categories & roles')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_size_static').setLabel('Static').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('setup_size_big').setLabel('Big').setStyle(ButtonStyle.Success))] }); }
async function showStep3(inter, s) { var t = serverTemplates[s.config.serverType]; var rl = t.roles.map(function(r) { return '> ' + r.name; }).join('\n'); await inter.editReply({ embeds: [AtlasEmbed.setup(3, 8, 'Roles', 'Create roles?\n\n' + rl)], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_roles_yes').setLabel('Yes').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('setup_roles_no').setLabel('Skip').setStyle(ButtonStyle.Danger))] }); }
async function showStep4(inter, s) { await inter.editReply({ embeds: [AtlasEmbed.setup(4, 8, 'Welcome System', 'Setup welcome with canvas cards?')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_welcome_yes').setLabel('Yes').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('setup_welcome_no').setLabel('Skip').setStyle(ButtonStyle.Danger))] }); }
async function showWelcomeMsgs(inter, s) { var opts = welcomeMessages.map(function(m) { return { label: m.label, value: m.id, description: m.message.substring(0, 90) }; }); opts.push({ label: 'Custom', value: 'custom', description: 'Write your own' }); await inter.editReply({ embeds: [AtlasEmbed.setup(4, 8, 'Welcome Message', welcomeMessages.map(function(m, i) { return '**' + (i+1) + '.** ' + m.label + '\n> ' + m.message; }).join('\n'))], components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('setup_welcome_select').setPlaceholder('Pick one...').addOptions(opts))] }); }
async function showStep5(inter, s) { await inter.editReply({ embeds: [AtlasEmbed.setup(5, 8, 'AutoMod', 'Enable AutoMod?\n\n> Anti-Spam (10msg/30s)\n> Anti-Link\n> Anti-Bad Words\n> Anti-Caps\n> Anti-Emoji Spam\n> Anti-Mass Mention\n> Anti-Raid')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_automod_yes').setLabel('Yes').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('setup_automod_no').setLabel('Skip').setStyle(ButtonStyle.Danger))] }); }
async function showStep6(inter, s) { await inter.editReply({ embeds: [AtlasEmbed.setup(6, 8, 'AntiNuke', 'Enable AntiNuke?\n\n> Anti Bot Add\n> Anti Mass Ban/Kick\n> Anti Channel/Role Delete\n> Anti Perm Change\n> Anti Webhook\n> Quarantine Mode')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_antinuke_yes').setLabel('Yes').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('setup_antinuke_no').setLabel('Skip').setStyle(ButtonStyle.Danger))] }); }
async function showStep7(inter, s) { await inter.editReply({ embeds: [AtlasEmbed.setup(7, 8, 'Tickets', 'Setup ticket system?')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('setup_tickets_yes').setLabel('Yes').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('setup_tickets_no').setLabel('Skip').setStyle(ButtonStyle.Danger))] }); }

async function showStep8(inter, s) {
    await inter.editReply({
        embeds: [AtlasEmbed.setup(8, 8, 'Add Bots?',
            'Do you want to see recommended bots for your server?\n\n' +
            'We will show you the best bots for:\n' +
            '> 🛡️ Moderation\n' +
            '> 🎮 Fun & Games\n' +
            '> 🎵 Music\n' +
            '> 🔧 Utility\n' +
            '> 💰 Economy\n\n' +
            'You can invite them with one click!')],
        components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('setup_bots_yes').setLabel('Show Bots').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('setup_bots_no').setLabel('Skip').setStyle(ButtonStyle.Danger)
        )]
    });
}

async function showBotList(inter, s) {
    var { botList, getBotInvite } = require('../templates/botRecommendations');
    var { StringSelectMenuBuilder } = require('discord.js');
    var desc = '**Select bots you want to add!**\n\nAfter selecting, invite links will be shown.\n\n';
    desc += botList.slice(0, 10).map(function(b) { return '> **' + b.name + '** - ' + b.desc; }).join('\n');

    var opts = botList.slice(0, 25).map(function(b) {
        return { label: b.name, value: b.id, description: b.desc.substring(0, 50) };
    });

    var menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('setup_bot_select').setPlaceholder('Select bots...').setMinValues(1).setMaxValues(Math.min(opts.length, 10)).addOptions(opts)
    );
    var skipRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('setup_bots_done').setLabel('Skip / Continue').setStyle(ButtonStyle.Danger)
    );

    await inter.editReply({ embeds: [AtlasEmbed.info('Select Bots', desc)], components: [menu, skipRow] });
}

async function showStep8(inter, s) {
    await inter.editReply({
        embeds: [AtlasEmbed.setup(8, 8, 'Add Bots?',
            'Do you want to see recommended bots for your server?\n\n' +
            'We will show you the best bots for:\n' +
            '> 🛡️ Moderation\n' +
            '> 🎮 Fun & Games\n' +
            '> 🎵 Music\n' +
            '> 🔧 Utility\n' +
            '> 💰 Economy\n\n' +
            'You can invite them with one click!')],
        components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('setup_bots_yes').setLabel('Show Bots').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('setup_bots_no').setLabel('Skip').setStyle(ButtonStyle.Danger)
        )]
    });
}

async function showBotList(inter, s) {
    var desc = '';
    var cats = Object.keys(botRecommendations);
    for (var ci = 0; ci < cats.length; ci++) {
        var cat = botRecommendations[cats[ci]];
        desc += '\n' + cat.emoji + ' **' + cat.label + '**\n';
        for (var bi = 0; bi < cat.bots.length; bi++) {
            var b = cat.bots[bi];
            desc += '> [' + b.name + '](' + b.invite + ') - ' + b.desc + '\n';
        }
    }
    desc += '\n*Click the links above to invite bots!*';

    await inter.editReply({
        embeds: [AtlasEmbed.info('Recommended Bots', desc)],
        components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('setup_bots_done').setLabel('Continue Setup').setStyle(ButtonStyle.Success)
        )]
    });
}

async function executeSetup(interaction, session) {
    var guild = interaction.guild;
    var config = session.config;
    var template = serverTemplates[config.serverType];
    if (!template) template = serverTemplates.general;
    var db = getDb();
    var style = session.style;
    var logs = [];
    function log(m) { logs.push(m); }

    await interaction.editReply({ embeds: [AtlasEmbed.default('Setting Up...', 'Please wait...')], components: [] });

    try {
        db.prepare('INSERT OR REPLACE INTO guild_config (guild_id, server_type, server_size, setup_complete) VALUES (?, ?, ?, 0)').run(guild.id, config.serverType, config.serverSize);
        log('Saved config');

        var createdRoles = {};
        if (config.setupRoles) {
            log('--- Creating Roles ---');
            var allRoles = template.roles.slice();
            if (config.serverSize === 'big') {
                var base = allRoles.filter(function(r) { return r.type !== 'member' && r.type !== 'bots'; });
                var end = allRoles.filter(function(r) { return r.type === 'member' || r.type === 'bots'; });
                allRoles = base.concat(bigServerExtras.extraRoles).concat(end);
            }
            // Apply random emoji style to roles
            for (var ri = 0; ri < allRoles.length; ri++) {
                var rd = allRoles[ri];
                try {
                    var roleName = rd.name;
                    // For divider roles, apply random divider style
                    if (rd.type === 'divider') { roleName = style.divStyle('Staff'); }
                    else if (rd.type === 'divider2') { roleName = style.divStyle('Members'); }
                    else {
                        // Apply random emoji from set
                        var emoji = style.roleEmojis[rd.type] || style.roleEmojis.member || '';
                        var baseName = rd.name.replace(/^[^a-zA-Z]*/, '').trim();
                        roleName = emoji + ' ' + baseName;
                    }
                    var existing = guild.roles.cache.find(function(r) { return r.name === roleName; });
                    if (existing) { createdRoles[rd.type] = existing; log('  Exists: ' + roleName); continue; }
                    var colorNum = parseInt(rd.color.replace('#', ''), 16);
                    var role = await guild.roles.create({ name: roleName, color: colorNum, hoist: rd.hoist || false, reason: 'Atlas Setup' });
                    createdRoles[rd.type] = role;
                    db.prepare('INSERT OR REPLACE INTO setup_roles (guild_id, role_id, role_name, role_type) VALUES (?, ?, ?, ?)').run(guild.id, role.id, roleName, rd.type);
                    log('  Created: ' + roleName);
                } catch(e) { log('  Failed: ' + rd.name + ' - ' + e.message); }
            }
            // Assign owner role
            try {
                var ownerMember = await guild.members.fetch(guild.ownerId);
                if (createdRoles.owner) { await ownerMember.roles.add(createdRoles.owner); log('  Assigned owner role'); }
            } catch(e) {}
        }
        session.createdRoles = createdRoles;

        log('--- Creating Channels ---');
        var allCats = template.categories.slice();
        if (config.serverSize === 'big') allCats = allCats.concat(bigServerExtras.categories);
        var staffRole = createdRoles.mod || createdRoles.admin || null;
        var bypassRole = createdRoles.bots || null;
        var welcomeCh = null, countingCh = null, ticketCh = null, modLogCh = null, ticketLogCh = null;

        for (var ci = 0; ci < allCats.length; ci++) {
            var catData = allCats[ci];
            try {
                // Apply random category style
                var rawCatName = catData.name.replace(/[^a-zA-Z0-9 &]/g, '').trim();
                var styledCatName = style.catStyle(rawCatName);
                var category = guild.channels.cache.find(function(c) { return c.name === styledCatName && c.type === ChannelType.GuildCategory; });
                if (!category) {
                    category = await guild.channels.create({ name: styledCatName, type: ChannelType.GuildCategory, reason: 'Atlas Setup' });
                    log('  Category: ' + styledCatName);
                }
                for (var chi = 0; chi < catData.channels.length; chi++) {
                    var chData = catData.channels[chi];
                    try {
                        // Get raw name for matching
                        var rawName = chData.name.replace(/[^a-zA-Z0-9 -]/g, '').trim().toLowerCase();
                        // Apply random style for text channels
                        var chType = chData.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
                        var displayName;
                        if (chData.type === 'voice') {
                            var voiceEmoji = getChannelEmoji(chData.name, style.emojiSet);
                            displayName = voiceEmoji + ' ' + chData.name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
                        } else {
                            var chEmoji = getChannelEmoji(chData.name, style.emojiSet);
                            displayName = chEmoji + style.sep + rawName.replace(/ /g, '-');
                        }

                        var perms = [];
                        if (chData.readOnly) perms.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel] });
                        if (chData.staffOnly && staffRole) {
                            perms.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
                            perms.push({ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                            if (createdRoles.admin) perms.push({ id: createdRoles.admin.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                            if (createdRoles.owner) perms.push({ id: createdRoles.owner.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
                        }

                        var channel = await guild.channels.create({ name: displayName, type: chType, parent: category.id, permissionOverwrites: perms.length > 0 ? perms : undefined, reason: 'Atlas Setup' });

                        // Match channels by raw name for later use
                        if (rawName.includes('welcome') && !rawName.includes('staff')) welcomeCh = channel;
                        if (rawName.includes('counting')) countingCh = channel;
                        if (rawName.includes('create-ticket') || rawName.includes('ticket') && !rawName.includes('log')) ticketCh = channel;
                        if (rawName.includes('mod-log') || rawName.includes('modlog')) modLogCh = channel;
                        if (rawName.includes('ticket-log')) ticketLogCh = channel;

                        log('    #' + displayName);
                    } catch(e) { log('    Failed: ' + chData.name + ' - ' + e.message); }
                }
            } catch(e) { log('  Cat failed: ' + catData.name + ' - ' + e.message); }
        }

        if (config.setupWelcome) {
            log('--- Welcome System ---');
            if (!welcomeCh) {
                try {
                    var chEmoji2 = getChannelEmoji('welcome', style.emojiSet);
                    welcomeCh = await guild.channels.create({ name: chEmoji2 + style.sep + 'welcome', type: ChannelType.GuildText, permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel] }], reason: 'Atlas Welcome' });
                } catch(e) {}
            }
            if (welcomeCh) {
                db.prepare('INSERT OR REPLACE INTO welcome_config (guild_id, enabled, channel_id, message, use_embed, use_canvas, dm_welcome) VALUES (?, 1, ?, ?, 1, 1, 0)').run(guild.id, welcomeCh.id, config.welcomeMessage || 'Welcome {user} to {server}!');
                log('  Welcome channel: #' + welcomeCh.name);
            }
        }

        if (config.setupAutoMod) {
            log('--- AutoMod ---');
            db.prepare('INSERT OR REPLACE INTO automod_config (guild_id, enabled, antispam, antispam_max, antispam_interval, antilink, antibadwords, anticaps, anticaps_percent, antiemoji, antiemoji_max, antimention, antimention_max, antiraid, antiraid_joins, antiraid_seconds, antiraid_action) VALUES (?, 1, 1, 10, 30, 1, 1, 1, 70, 1, 10, 1, 5, 1, 5, 10, ?)').run(guild.id, 'kick');
            var insertW = db.prepare('INSERT OR REPLACE INTO automod_badwords (guild_id, word) VALUES (?, ?)');
            for (var wi = 0; wi < config.automodBadWords.length; wi++) { insertW.run(guild.id, config.automodBadWords[wi]); }
            db.prepare('INSERT OR REPLACE INTO automod_whitelisted_users (guild_id, user_id) VALUES (?, ?)').run(guild.id, guild.ownerId);
            log('  All protections enabled');
            log('  ' + config.automodBadWords.length + ' bad words added');
        }

        if (config.setupAntiNuke) {
            log('--- AntiNuke ---');
            db.prepare('INSERT OR REPLACE INTO antinuke_config (guild_id, enabled, anti_bot_add, anti_role_give, anti_perm_change, anti_role_delete, anti_channel_delete, anti_channel_create, anti_guild_edit, anti_mass_ban, anti_mass_kick, anti_webhook, anti_everyone, quarantine_enabled, bypass_role_id, punishment) VALUES (?, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ?, ?)').run(guild.id, bypassRole ? bypassRole.id : null, 'ban');
            db.prepare('INSERT OR REPLACE INTO antinuke_whitelisted (guild_id, user_id) VALUES (?, ?)').run(guild.id, guild.ownerId);
            log('  All protections enabled');
        }

        if (config.setupTickets) {
            log('--- Tickets ---');
            var ticketCat = null;
            try {
                var tcName = style.catStyle('tickets');
                ticketCat = await guild.channels.create({ name: tcName, type: ChannelType.GuildCategory, permissionOverwrites: [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }], reason: 'Atlas Tickets' });
            } catch(e) {}

            db.prepare('INSERT OR REPLACE INTO ticket_config (guild_id, enabled, title, description, category_id, log_channel_id, panel_channel_id, use_buttons) VALUES (?, 1, ?, ?, ?, ?, ?, ?)').run(guild.id, config.ticketConfig.title, config.ticketConfig.description, ticketCat ? ticketCat.id : null, ticketLogCh ? ticketLogCh.id : null, ticketCh ? ticketCh.id : null, config.ticketConfig.useButtons ? 1 : 0);

            var insertCat = db.prepare('INSERT INTO ticket_categories (guild_id, name, description, emoji) VALUES (?, ?, ?, ?)');
            var emojis = ['\uD83D\uDCE9', '\uD83D\uDCB0', '\uD83D\uDC1B', '\uD83E\uDD1D', '\u2753', '\uD83D\uDCCB', '\uD83D\uDD27', '\uD83D\uDCAC'];
            for (var ti = 0; ti < config.ticketConfig.categories.length; ti++) {
                insertCat.run(guild.id, config.ticketConfig.categories[ti], config.ticketConfig.categories[ti] + ' support', emojis[ti] || '\uD83D\uDCCB');
            }

            // SEND TICKET PANEL
            if (ticketCh) {
                try {
                    var panelEmbed = new EmbedBuilder()
                        .setTitle(config.ticketConfig.title)
                        .setDescription(config.ticketConfig.description + '\n\n' + config.ticketConfig.categories.map(function(c, idx) { return (emojis[idx] || '\uD83D\uDCCB') + ' **' + c + '**'; }).join('\n'))
                        .setColor(0x2B2D31)
                        .setFooter({ text: 'Atlas Tickets | Made by Faris (erenyeager.exp)' })
                        .setTimestamp();

                    var comp;
                    if (config.ticketConfig.useButtons) {
                        var rows = []; var curRow = new ActionRowBuilder(); var bc = 0;
                        for (var bi = 0; bi < config.ticketConfig.categories.length; bi++) {
                            if (bc >= 5) { rows.push(curRow); curRow = new ActionRowBuilder(); bc = 0; }
                            curRow.addComponents(new ButtonBuilder().setCustomId('ticket_create_' + bi).setLabel(config.ticketConfig.categories[bi]).setEmoji(emojis[bi] || '\uD83D\uDCCB').setStyle(ButtonStyle.Secondary));
                            bc++;
                        }
                        if (bc > 0) rows.push(curRow);
                        comp = rows;
                    } else {
                        var selOpts = config.ticketConfig.categories.map(function(cn, idx) { return { label: cn, value: 'ticket_cat_' + idx, emoji: emojis[idx] || '\uD83D\uDCCB' }; });
                        comp = [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('ticket_create_select').setPlaceholder('Select category...').addOptions(selOpts))];
                    }
                    var panelMsg = await ticketCh.send({ embeds: [panelEmbed], components: comp });
                    db.prepare('UPDATE ticket_config SET panel_message_id = ? WHERE guild_id = ?').run(panelMsg.id, guild.id);
                    log('  Ticket panel sent to #' + ticketCh.name);
                } catch(e) { log('  Panel error: ' + e.message); }
            } else { log('  WARNING: No ticket channel found to send panel!'); }
            log('  ' + config.ticketConfig.categories.length + ' categories');
        }

        if (countingCh) {
            db.prepare('INSERT OR REPLACE INTO counting_config (guild_id, enabled, channel_id, current_count, last_user_id, high_score) VALUES (?, 1, ?, 0, NULL, 0)').run(guild.id, countingCh.id);
            log('  Counting: #' + countingCh.name);
        }

        db.prepare('UPDATE guild_config SET setup_complete = 1 WHERE guild_id = ?').run(guild.id);

        // Cache invites for tracking
        try {
            var invites = await guild.invites.fetch();
            var insInv = db.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            invites.forEach(function(inv) { insInv.run(guild.id, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null); });
            log('  Cached ' + invites.size + ' invites');
        } catch(e) {}

        // Cache invites for tracking
        try {
            var invites = await guild.invites.fetch();
            var insInv = db.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            invites.forEach(function(inv) { insInv.run(guild.id, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null); });
            log('  Cached ' + invites.size + ' invites');
        } catch(e) {}

        // Cache invites for tracking
        try {
            var invites = await guild.invites.fetch();
            var insInv = db.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            invites.forEach(function(inv) { insInv.run(guild.id, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null); });
            log('  Cached ' + invites.size + ' invites');
        } catch(e) {}

        // Cache invites for tracking
        try {
            var invites = await guild.invites.fetch();
            var insInv = db.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            invites.forEach(function(inv) { insInv.run(guild.id, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null); });
            log('  Cached ' + invites.size + ' invites');
        } catch(e) {}

        // Cache invites for tracking
        try {
            var invites = await guild.invites.fetch();
            var insInv = db.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            invites.forEach(function(inv) { insInv.run(guild.id, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null); });
            log('  Cached ' + invites.size + ' invites');
        } catch(e) {}

        // Cache invites for tracking
        try {
            var invites = await guild.invites.fetch();
            var insInv = db.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            invites.forEach(function(inv) { insInv.run(guild.id, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null); });
            log('  Cached ' + invites.size + ' invites');
        } catch(e) {}

        var summary = AtlasEmbed.success('Setup Complete!',
            'Your **' + template.name + '** is ready!\n\n' +
            '> Type: **' + template.name + '**\n' +
            '> Size: **' + (config.serverSize === 'big' ? 'Big' : 'Static') + '**\n' +
            '> Roles: **' + (config.setupRoles ? 'Yes' : 'No') + '**\n' +
            '> Welcome: **' + (config.setupWelcome ? 'Yes' : 'No') + '**\n' +
            '> AutoMod: **' + (config.setupAutoMod ? 'Yes' : 'No') + '**\n' +
            '> AntiNuke: **' + (config.setupAntiNuke ? 'Yes' : 'No') + '**\n' +
            '> Tickets: **' + (config.setupTickets ? 'Yes' : 'No') + '**\n' +
            '> Counting: **' + (countingCh ? 'Yes' : 'No') + '**\n\n' +
            '*Style is randomly generated - every setup is unique!*');

        var logEmbed = AtlasEmbed.default('Setup Log', logs.join('\n'));
        await interaction.editReply({ embeds: [summary, logEmbed], components: [] });

    } catch(error) {
        console.error('Setup error:', error);
        log('FATAL: ' + error.message);
        await interaction.editReply({ embeds: [AtlasEmbed.error('Setup Failed', error.message + '\n\n' + logs.join('\n'))], components: [] });
    }
    interaction.client.setupSessions.delete(interaction.user.id);
}