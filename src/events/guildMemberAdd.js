var { getDb } = require('../utils/database');
var { AtlasEmbed } = require('../utils/embedBuilder');
var { AutoModSystem } = require('../systems/automodSystem');
var autoMod = new AutoModSystem();

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    execute: async function(member, client) {
        var db = getDb();

        // Anti-Raid
        try { var raided = await autoMod.checkRaid(member); if (raided) return; } catch(e) {}

        // Invite Tracking
        try {
            var newInvites = await member.guild.invites.fetch();
            var cached = db.prepare('SELECT * FROM invite_cache WHERE guild_id = ?').all(member.guild.id);
            var usedInvite = null;
            newInvites.forEach(function(inv) {
                var old = cached.find(function(c) { return c.code === inv.code; });
                if (old && inv.uses > old.uses) usedInvite = inv;
                if (!old && inv.uses > 0) usedInvite = inv;
            });
            // Update cache
            var del = db.prepare('DELETE FROM invite_cache WHERE guild_id = ?');
            del.run(member.guild.id);
            var ins = db.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            newInvites.forEach(function(inv) {
                ins.run(member.guild.id, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null);
            });
            if (usedInvite && usedInvite.inviter) {
                db.prepare('INSERT OR REPLACE INTO invite_tracking (guild_id, user_id, inviter_id, invite_code) VALUES (?, ?, ?, ?)').run(member.guild.id, member.user.id, usedInvite.inviter.id, usedInvite.code);
            }
        } catch(e) {}

        // Welcome Message
        try {
            var wc = db.prepare('SELECT * FROM welcome_config WHERE guild_id = ? AND enabled = 1').get(member.guild.id);
            if (!wc) return;
            var ch = member.guild.channels.cache.get(wc.channel_id);
            if (!ch) return;
            var msg = (wc.message || 'Welcome {user}!');
            msg = msg.replace(/{user}/g, '<@' + member.user.id + '>');
            msg = msg.replace(/{server}/g, member.guild.name);
            msg = msg.replace(/{count}/g, member.guild.memberCount.toString());

            var embed = AtlasEmbed.default(null, msg)
                .setAuthor({ name: 'Welcome to ' + member.guild.name + '!', iconURL: member.guild.iconURL({ dynamic: true }) })
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setColor(0x5865F2);

            // Ping user BEFORE embed
            await ch.send({ content: '<@' + member.user.id + '>' });
            await ch.send({ embeds: [embed] });

            // Assign member role
            var rd = db.prepare('SELECT role_id FROM setup_roles WHERE guild_id = ? AND role_type = ?').get(member.guild.id, 'member');
            if (rd) { var r = member.guild.roles.cache.get(rd.role_id); if (r) try { await member.roles.add(r); } catch(e) {} }
        } catch(e) { console.error('Welcome error:', e); }
    }
};