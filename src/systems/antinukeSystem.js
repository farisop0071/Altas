var { getDb } = require('../utils/database');
var { AtlasEmbed } = require('../utils/embedBuilder');
var { AuditLogEvent } = require('discord.js');

class AntiNukeSystem {
    constructor(client) {
        this.client = client;
        this.actionLimits = new Map();
        this.LIMIT = 3;
        this.WINDOW = 10000;
    }

    isWhitelisted(guildId, userId) {
        var db = getDb();
        return !!db.prepare('SELECT * FROM antinuke_whitelisted WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
    }

    hasBypass(member, guildId) {
        var db = getDb();
        var config = db.prepare('SELECT bypass_role_id FROM antinuke_config WHERE guild_id = ?').get(guildId);
        if (!config || !config.bypass_role_id) return false;
        return member.roles ? member.roles.cache.has(config.bypass_role_id) : false;
    }

    getConfig(guildId) {
        var db = getDb();
        return db.prepare('SELECT * FROM antinuke_config WHERE guild_id = ? AND enabled = 1').get(guildId);
    }

    canBypass(guild, userId) {
        if (userId === guild.ownerId) return true;
        if (userId === this.client.user.id) return true;
        if (this.isWhitelisted(guild.id, userId)) return true;
        return false;
    }

    trackAction(guildId, userId, action) {
        var key = guildId + '-' + userId + '-' + action;
        var now = Date.now();
        if (!this.actionLimits.has(key)) this.actionLimits.set(key, []);
        var actions = this.actionLimits.get(key).filter(function(t) { return now - t < 10000; });
        actions.push(now);
        this.actionLimits.set(key, actions);
        return actions.length >= this.LIMIT;
    }

    async punish(guild, userId, reason, punishment) {
        var db = getDb();
        var config = this.getConfig(guild.id);
        var action = punishment || (config ? config.punishment : 'ban');
        try {
            var member = await guild.members.fetch(userId).catch(function() { return null; });
            if (!member) return;

            if (action === 'quarantine' && config && config.quarantine_role_id) {
                // Strip all roles and add quarantine role
                var roles = member.roles.cache.filter(function(r) { return r.id !== guild.roles.everyone.id; });
                try { await member.roles.remove(roles, 'Atlas AntiNuke: Quarantined'); } catch(e) {}
                try { await member.roles.add(config.quarantine_role_id, 'Atlas AntiNuke: Quarantined'); } catch(e) {}
            } else if (action === 'ban') {
                try {
                    var roles2 = member.roles.cache.filter(function(r) { return r.id !== guild.roles.everyone.id; });
                    await member.roles.remove(roles2, 'Atlas AntiNuke: ' + reason);
                } catch(e) {}
                try { await guild.members.ban(userId, { reason: 'Atlas AntiNuke: ' + reason, deleteMessageSeconds: 0 }); } catch(e) {}
            } else if (action === 'kick') {
                try { await member.kick('Atlas AntiNuke: ' + reason); } catch(e) {}
            }

            // Log action
            db.prepare('INSERT INTO antinuke_actions (guild_id, user_id, action, details, timestamp) VALUES (?, ?, ?, ?, ?)').run(guild.id, userId, action, reason, Date.now());
        } catch (error) { console.error('AntiNuke punish error:', error); }

        // Log to channel
        this.logToChannel(guild, userId, reason, action);
    }

    logToChannel(guild, userId, reason, action) {
        var logChannel = guild.channels.cache.find(function(c) { return c.name === 'mod-logs'; });
        if (!logChannel) return;
        var embed = AtlasEmbed.error('AntiNuke Triggered',
            '**User:** <@' + userId + '> (' + userId + ')\n' +
            '**Action:** ' + reason + '\n' +
            '**Punishment:** ' + action + '\n' +
            '**Time:** <t:' + Math.floor(Date.now() / 1000) + ':F>');
        logChannel.send({ embeds: [embed] }).catch(function(){});
    }

    async getExecutor(guild, auditType) {
        try {
            var logs = await guild.fetchAuditLogs({ type: auditType, limit: 1 });
            var entry = logs.entries.first();
            if (!entry || Date.now() - entry.createdTimestamp > 5000) return null;
            return entry.executor;
        } catch(e) { return null; }
    }

    async onGuildBotAdd(member) {
        if (!member.user.bot) return;
        var config = this.getConfig(member.guild.id);
        if (!config || !config.anti_bot_add) return;
        var executor = await this.getExecutor(member.guild, AuditLogEvent.BotAdd);
        if (!executor || this.canBypass(member.guild, executor.id)) return;
        await member.kick('Atlas AntiNuke: Unauthorized bot');
        await this.punish(member.guild, executor.id, 'Unauthorized bot addition');
    }

    async onChannelDelete(channel) {
        var config = this.getConfig(channel.guild.id);
        if (!config || !config.anti_channel_delete) return;
        var executor = await this.getExecutor(channel.guild, AuditLogEvent.ChannelDelete);
        if (!executor || this.canBypass(channel.guild, executor.id)) return;
        if (this.trackAction(channel.guild.id, executor.id, 'ch_del')) {
            await this.punish(channel.guild, executor.id, 'Mass channel deletion');
        }
    }

    async onChannelCreate(channel) {
        var config = this.getConfig(channel.guild.id);
        if (!config || !config.anti_channel_create) return;
        var executor = await this.getExecutor(channel.guild, AuditLogEvent.ChannelCreate);
        if (!executor || this.canBypass(channel.guild, executor.id)) return;
        if (this.trackAction(channel.guild.id, executor.id, 'ch_create')) {
            await this.punish(channel.guild, executor.id, 'Mass channel creation');
            try { await channel.delete('Atlas AntiNuke: Reverting'); } catch(e) {}
        }
    }

    async onRoleDelete(role) {
        var config = this.getConfig(role.guild.id);
        if (!config || !config.anti_role_delete) return;
        var executor = await this.getExecutor(role.guild, AuditLogEvent.RoleDelete);
        if (!executor || this.canBypass(role.guild, executor.id)) return;
        if (this.trackAction(role.guild.id, executor.id, 'role_del')) {
            await this.punish(role.guild, executor.id, 'Mass role deletion');
        }
    }

    async onBanAdd(ban) {
        var config = this.getConfig(ban.guild.id);
        if (!config || !config.anti_mass_ban) return;
        var executor = await this.getExecutor(ban.guild, AuditLogEvent.MemberBanAdd);
        if (!executor || this.canBypass(ban.guild, executor.id)) return;
        if (this.trackAction(ban.guild.id, executor.id, 'ban')) {
            await this.punish(ban.guild, executor.id, 'Mass banning');
            try { await ban.guild.members.unban(ban.user.id, 'Atlas: Reversing mass ban'); } catch(e) {}
        }
    }

    async onMemberRemove(member) {
        var config = this.getConfig(member.guild.id);
        if (!config || !config.anti_mass_kick) return;
        var executor = await this.getExecutor(member.guild, AuditLogEvent.MemberKick);
        if (!executor || this.canBypass(member.guild, executor.id)) return;
        if (this.trackAction(member.guild.id, executor.id, 'kick')) {
            await this.punish(member.guild, executor.id, 'Mass kicking');
        }
    }

    async onRoleUpdate(oldRole, newRole) {
        var config = this.getConfig(newRole.guild.id);
        if (!config || !config.anti_perm_change) return;
        var dangerous = ['Administrator', 'BanMembers', 'KickMembers', 'ManageGuild', 'ManageRoles', 'ManageChannels', 'ManageWebhooks', 'MentionEveryone'];
        var oldP = oldRole.permissions.toArray();
        var newP = newRole.permissions.toArray();
        var added = newP.filter(function(p) { return !oldP.includes(p) && dangerous.includes(p); });
        if (added.length === 0) return;
        var executor = await this.getExecutor(newRole.guild, AuditLogEvent.RoleUpdate);
        if (!executor || this.canBypass(newRole.guild, executor.id)) return;
        try { await newRole.setPermissions(oldRole.permissions, 'Atlas AntiNuke: Reverting'); } catch(e) {}
        await this.punish(newRole.guild, executor.id, 'Unauthorized permission change on @' + newRole.name);
    }

    async onWebhookUpdate(channel) {
        var config = this.getConfig(channel.guild.id);
        if (!config || !config.anti_webhook) return;
        var executor = await this.getExecutor(channel.guild, AuditLogEvent.WebhookCreate);
        if (!executor || this.canBypass(channel.guild, executor.id)) return;
        // Delete all webhooks created by this user
        try {
            var webhooks = await channel.fetchWebhooks();
            var toDelete = webhooks.filter(function(wh) { return wh.owner && wh.owner.id === executor.id; });
            for (var wh of toDelete.values()) { await wh.delete('Atlas AntiNuke: Unauthorized webhook'); }
        } catch(e) {}
        await this.punish(channel.guild, executor.id, 'Unauthorized webhook creation');
    }
}

module.exports = { AntiNukeSystem };