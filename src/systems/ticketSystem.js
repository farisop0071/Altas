var { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
var { getDb } = require('../utils/database');
var { AtlasEmbed } = require('../utils/embedBuilder');

async function handleTicketCreate(interaction, client) {
    var db = getDb();
    var tc = db.prepare('SELECT * FROM ticket_config WHERE guild_id = ? AND enabled = 1').get(interaction.guild.id);
    if (!tc) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Tickets not configured.')], ephemeral: true });
    var idx = parseInt(interaction.customId.replace('ticket_create_', ''));
    var cats = db.prepare('SELECT * FROM ticket_categories WHERE guild_id = ?').all(interaction.guild.id);
    var cat = cats[idx];
    if (!cat) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Invalid category.')], ephemeral: true });
    await makeTicket(interaction, client, tc, cat, db);
}

async function handleTicketSelectCreate(interaction, client) {
    var db = getDb();
    var tc = db.prepare('SELECT * FROM ticket_config WHERE guild_id = ? AND enabled = 1').get(interaction.guild.id);
    if (!tc) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Tickets not configured.')], ephemeral: true });
    var idx = parseInt(interaction.values[0].replace('ticket_cat_', ''));
    var cats = db.prepare('SELECT * FROM ticket_categories WHERE guild_id = ?').all(interaction.guild.id);
    var cat = cats[idx];
    if (!cat) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Invalid category.')], ephemeral: true });
    await makeTicket(interaction, client, tc, cat, db);
}

async function makeTicket(interaction, client, tc, cat, db) {
    var guild = interaction.guild;
    var user = interaction.user;
    var existing = db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'").get(guild.id, user.id);
    if (existing) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'You already have a ticket: <#' + existing.channel_id + '>')], ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    try {
        var num = (db.prepare('SELECT COUNT(*) as c FROM tickets WHERE guild_id = ?').get(guild.id).c || 0) + 1;
        var chName = 'ticket-' + num + '-' + user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        var perms = [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] },
        ];
        var staffRoles = db.prepare("SELECT role_id FROM setup_roles WHERE guild_id = ? AND (role_type = 'admin' OR role_type = 'mod' OR role_type = 'staff' OR role_type = 'owner')").all(guild.id);
        for (var sr of staffRoles) { perms.push({ id: sr.role_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }); }
        var ch = await guild.channels.create({ name: chName, type: ChannelType.GuildText, parent: tc.category_id || undefined, permissionOverwrites: perms, reason: 'Atlas Ticket #' + num });
        db.prepare('INSERT INTO tickets (guild_id, channel_id, user_id, category, status) VALUES (?, ?, ?, ?, ?)').run(guild.id, ch.id, user.id, cat.name, 'open');

        var embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ name: 'Ticket #' + num, iconURL: guild.iconURL({ dynamic: true }) })
            .setTitle((cat.emoji || '📋') + ' ' + cat.name)
            .setDescription(
                'Hey <@' + user.id + '>! A staff member will assist you shortly.\n\n' +
                '**Category:** ' + cat.name + '\n' +
                '**Priority:** 🟢 Normal\n' +
                '**Status:** 🟢 Open\n' +
                '**Created:** <t:' + Math.floor(Date.now()/1000) + ':F>\n' +
                '**Claimed by:** Not claimed yet\n\n' +
                'Please describe your issue below.'
            )
            .setFooter({ text: 'Atlas Tickets | Made by Faris (erenyeager.exp)' })
            .setTimestamp();

        var row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setEmoji('📌').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket_adduser').setLabel('Add User').setEmoji('➕').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_removeuser').setLabel('Remove User').setEmoji('➖').setStyle(ButtonStyle.Primary),
        );
        var row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_priority_low').setLabel('Low').setEmoji('🟢').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_priority_medium').setLabel('Medium').setEmoji('🟡').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_priority_high').setLabel('High').setEmoji('🔴').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setEmoji('📝').setStyle(ButtonStyle.Secondary),
        );

        var pingContent = '<@' + user.id + '>';
        try {
            var tcfg = db.prepare('SELECT support_role_id FROM ticket_config WHERE guild_id = ?').get(guild.id);
            if (tcfg && tcfg.support_role_id) pingContent += ' <@&' + tcfg.support_role_id + '>';
        } catch(e) {}
        await ch.send({ content: pingContent, embeds: [embed], components: [row1, row2] });
        await interaction.editReply({ embeds: [AtlasEmbed.success('Ticket Created', 'Your ticket: <#' + ch.id + '>')] });
    } catch(e) {
        console.error('Ticket error:', e);
        await interaction.editReply({ embeds: [AtlasEmbed.error('Error', e.message)] });
    }
}

async function handleTicketClose(interaction, client) {
    var db = getDb();
    var ticket = db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND channel_id = ? AND status = 'open'").get(interaction.guild.id, interaction.channel.id);
    if (!ticket) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Not a ticket.')], ephemeral: true });
    var modal = new ModalBuilder().setCustomId('ticket_close_modal').setTitle('Close Ticket');
    var input = new TextInputBuilder().setCustomId('close_reason').setLabel('Reason for closing').setStyle(TextInputStyle.Paragraph).setPlaceholder('Enter reason...').setRequired(false).setMaxLength(500);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function handleTicketCloseModal(interaction, client) {
    var db = getDb();
    var reason = interaction.fields.getTextInputValue('close_reason') || 'No reason';
    db.prepare("UPDATE tickets SET status = 'closed', closed_at = CURRENT_TIMESTAMP, close_reason = ? WHERE guild_id = ? AND channel_id = ?").run(reason, interaction.guild.id, interaction.channel.id);
    var ticket = db.prepare('SELECT * FROM tickets WHERE guild_id = ? AND channel_id = ?').get(interaction.guild.id, interaction.channel.id);
    var embed = AtlasEmbed.warning('Ticket Closed',
        '**Closed by:** <@' + interaction.user.id + '>\n' +
        '**Reason:** ' + reason + '\n\n' +
        'Channel will be deleted in 10 seconds.');
    var row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_delete').setLabel('Delete Now').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Reopen').setEmoji('🔓').setStyle(ButtonStyle.Success),
    );
    await interaction.reply({ embeds: [embed], components: [row] });
    try { await interaction.channel.permissionOverwrites.edit(ticket.user_id, { SendMessages: false }); } catch(e) {}
    setTimeout(async function() { try { await interaction.channel.delete('Ticket closed'); } catch(e) {} }, 10000);
}

async function handleTicketClaim(interaction, client) {
    var db = getDb();
    var ticket = db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND channel_id = ? AND status = 'open'").get(interaction.guild.id, interaction.channel.id);
    if (!ticket) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Not a ticket.')], ephemeral: true });
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Staff only.')], ephemeral: true });
    if (ticket.claimed_by) return interaction.reply({ embeds: [AtlasEmbed.error('Already Claimed', 'Claimed by <@' + ticket.claimed_by + '>')], ephemeral: true });
    db.prepare('UPDATE tickets SET claimed_by = ? WHERE guild_id = ? AND channel_id = ?').run(interaction.user.id, interaction.guild.id, interaction.channel.id);
    await interaction.reply({ embeds: [AtlasEmbed.success('Ticket Claimed', '<@' + interaction.user.id + '> has claimed this ticket.')] });
}

async function handleTicketAddUser(interaction, client) {
    var modal = new ModalBuilder().setCustomId('ticket_adduser_modal').setTitle('Add User to Ticket');
    var input = new TextInputBuilder().setCustomId('user_id').setLabel('User ID').setStyle(TextInputStyle.Short).setPlaceholder('Enter user ID...').setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function handleAddUserModal(interaction, client) {
    var userId = interaction.fields.getTextInputValue('user_id').trim();
    try {
        await interaction.channel.permissionOverwrites.edit(userId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
        await interaction.reply({ embeds: [AtlasEmbed.success('User Added', '<@' + userId + '> can now view this ticket.')] });
    } catch(e) { await interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Invalid user ID.')], ephemeral: true }); }
}

async function handleTicketRemoveUser(interaction, client) {
    var modal = new ModalBuilder().setCustomId('ticket_removeuser_modal').setTitle('Remove User from Ticket');
    var input = new TextInputBuilder().setCustomId('user_id').setLabel('User ID').setStyle(TextInputStyle.Short).setPlaceholder('Enter user ID...').setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

async function handleRemoveUserModal(interaction, client) {
    var userId = interaction.fields.getTextInputValue('user_id').trim();
    try {
        await interaction.channel.permissionOverwrites.edit(userId, { ViewChannel: false });
        await interaction.reply({ embeds: [AtlasEmbed.success('User Removed', '<@' + userId + '> removed from ticket.')] });
    } catch(e) { await interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Invalid user ID.')], ephemeral: true }); }
}

async function handleTicketPriority(interaction, client) {
    var db = getDb();
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Staff only.')], ephemeral: true });
    var level = interaction.customId.replace('ticket_priority_', '');
    var colors = { low: '🟢', medium: '🟡', high: '🔴' };
    db.prepare('UPDATE tickets SET priority = ? WHERE guild_id = ? AND channel_id = ?').run(level, interaction.guild.id, interaction.channel.id);
    await interaction.reply({ embeds: [AtlasEmbed.success('Priority Updated', 'Set to ' + colors[level] + ' **' + level.toUpperCase() + '**')] });
}

async function handleTicketTranscript(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Staff only.')], ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    try {
        var messages = await interaction.channel.messages.fetch({ limit: 100 });
        var sorted = Array.from(messages.values()).reverse();
        var lines = sorted.map(function(m) { return '[' + m.createdAt.toISOString() + '] ' + m.author.tag + ': ' + (m.content || '[embed/attachment]'); });
        var text = 'TICKET TRANSCRIPT - ' + interaction.channel.name + '\n';
        text += 'Generated: ' + new Date().toISOString() + '\n';
        text += '='.repeat(50) + '\n\n';
        text += lines.join('\n');
        var buffer = Buffer.from(text, 'utf8');
        var { AttachmentBuilder } = require('discord.js');
        var file = new AttachmentBuilder(buffer, { name: 'transcript-' + interaction.channel.name + '.txt' });
        await interaction.editReply({ content: 'Transcript generated!', files: [file] });
    } catch(e) { await interaction.editReply({ embeds: [AtlasEmbed.error('Error', e.message)] }); }
}

async function handleTicketReopen(interaction, client) {
    var db = getDb();
    var ticket = db.prepare('SELECT * FROM tickets WHERE guild_id = ? AND channel_id = ?').get(interaction.guild.id, interaction.channel.id);
    if (!ticket) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Not a ticket.')], ephemeral: true });
    db.prepare("UPDATE tickets SET status = 'open', closed_at = NULL, close_reason = NULL WHERE guild_id = ? AND channel_id = ?").run(interaction.guild.id, interaction.channel.id);
    try { await interaction.channel.permissionOverwrites.edit(ticket.user_id, { SendMessages: true }); } catch(e) {}
    await interaction.reply({ embeds: [AtlasEmbed.success('Ticket Reopened', '<@' + interaction.user.id + '> reopened this ticket.')] });
}

async function handleTicketDelete(interaction, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ embeds: [AtlasEmbed.error('Error', 'Staff only.')], ephemeral: true });
    await interaction.reply({ embeds: [AtlasEmbed.warning('Deleting', 'Deleting...')] });
    setTimeout(async function() { try { await interaction.channel.delete('Ticket deleted'); } catch(e) {} }, 2000);
}

module.exports = { handleTicketCreate, handleTicketSelectCreate, handleTicketClose, handleTicketCloseModal, handleTicketClaim, handleTicketAddUser, handleAddUserModal, handleTicketRemoveUser, handleRemoveUserModal, handleTicketPriority, handleTicketTranscript, handleTicketReopen, handleTicketDelete };