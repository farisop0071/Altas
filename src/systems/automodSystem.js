var { getDb } = require('../utils/database');
var { AtlasEmbed } = require('../utils/embedBuilder');

class AutoModSystem {
    constructor() {
        this.spamMap = new Map();
        this.raidMap = new Map();
    }

    isExempt(message) {
        if (!message.member) return true;
        if (message.author.id === message.guild.ownerId) return true;
        if (message.member.permissions.has('Administrator')) return true;
        var db = getDb();
        var wl = db.prepare('SELECT * FROM automod_whitelisted_users WHERE guild_id = ? AND user_id = ?').get(message.guild.id, message.author.id);
        if (wl) return true;
        try {
            var an = db.prepare('SELECT bypass_role_id FROM antinuke_config WHERE guild_id = ?').get(message.guild.id);
            if (an && an.bypass_role_id && message.member.roles.cache.has(an.bypass_role_id)) return true;
        } catch(e) {}
        return false;
    }

    async checkMessage(message) {
        if (!message.guild) return false;
        if (!message.member) return false;
        var db = getDb();
        var config;
        try {
            config = db.prepare('SELECT * FROM automod_config WHERE guild_id = ? AND enabled = 1').get(message.guild.id);
        } catch(e) { return false; }
        if (!config) return false;
        if (this.isExempt(message)) return false;

        // Anti-Bad Words (check first - most important)
        if (config.antibadwords) {
            try {
                var badWords = db.prepare('SELECT word FROM automod_badwords WHERE guild_id = ?').all(message.guild.id);
                if (badWords && badWords.length > 0) {
                    var content = message.content.toLowerCase();
                    for (var i = 0; i < badWords.length; i++) {
                        if (content.includes(badWords[i].word)) {
                            await this.deleteAndWarn(message, 'Bad Word Filter', 'Your message contained a prohibited word.');
                            return true;
                        }
                    }
                }
            } catch(e) { console.error('Badword check error:', e); }
        }

        // Anti-Link
        if (config.antilink) {
            var hasLink = false;
            var txt = message.content;
            if (txt.includes('http://') || txt.includes('https://') || txt.includes('discord.gg/') || txt.includes('www.') || txt.includes('.com') || txt.includes('.gg') || txt.includes('.io') || txt.includes('.org') || txt.includes('.net')) {
                hasLink = true;
            }
            if (hasLink) {
                await this.deleteAndWarn(message, 'Anti-Link', 'Links are not allowed in this server!');
                return true;
            }
        }

        // Anti-Spam
        if (config.antispam) {
            var key = message.guild.id + ':' + message.author.id;
            var now = Date.now();
            var data = this.spamMap.get(key);
            if (!data) data = { count: 0, start: now };
            if (now - data.start > config.antispam_interval * 1000) {
                data = { count: 1, start: now };
            } else {
                data.count++;
            }
            this.spamMap.set(key, data);
            if (data.count >= config.antispam_max) {
                this.spamMap.set(key, { count: 0, start: now });
                await this.deleteAndWarn(message, 'Anti-Spam', 'You are sending messages too fast!');
                try { await message.member.timeout(30000, 'Atlas: Spam'); } catch(e) {}
                return true;
            }
        }

        // Anti-Caps
        if (config.anticaps && message.content.length > 8) {
            var letters = message.content.replace(/[^a-zA-Z]/g, '');
            if (letters.length > 5) {
                var upper = message.content.replace(/[^A-Z]/g, '').length;
                var pct = (upper / letters.length) * 100;
                if (pct >= (config.anticaps_percent || 70)) {
                    await this.deleteAndWarn(message, 'Anti-Caps', 'Too many capital letters!');
                    return true;
                }
            }
        }

        // Anti-Mass Mention
        if (config.antimention) {
            var totalMentions = message.mentions.users.size + message.mentions.roles.size;
            if (totalMentions >= (config.antimention_max || 5)) {
                await this.deleteAndWarn(message, 'Anti-Mention', 'Too many mentions!');
                try { await message.member.timeout(60000, 'Atlas: Mass mention'); } catch(e) {}
                return true;
            }
        }

        // Anti-Emoji Spam
        if (config.antiemoji) {
            try {
                var customEmojis = message.content.match(/<a?:\w+:\d+>/g) || [];
                var unicodeEmojis = message.content.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || [];
                var totalEmojis = customEmojis.length + unicodeEmojis.length;
                if (totalEmojis >= (config.antiemoji_max || 10)) {
                    await this.deleteAndWarn(message, 'Anti-Emoji', 'Too many emojis!');
                    return true;
                }
            } catch(e) {}
        }

        return false;
    }

    async deleteAndWarn(message, system, reason) {
        try { await message.delete(); } catch(e) {}
        try {
            var warn = await message.channel.send({
                embeds: [AtlasEmbed.warning(system, '<@' + message.author.id + '> ' + reason)]
            });
            setTimeout(function() { try { warn.delete(); } catch(e) {} }, 5000);
        } catch(e) {}
        // Log to mod-logs
        try {
            var logCh = message.guild.channels.cache.find(function(c) {
                return c.name.includes('mod-log');
            });
            if (logCh) {
                var logEmbed = AtlasEmbed.warning(system + ' Log',
                    '**User:** <@' + message.author.id + '>\n' +
                    '**Channel:** <#' + message.channel.id + '>\n' +
                    '**Reason:** ' + reason + '\n' +
                    '**Content:** ' + (message.content.substring(0, 200) || 'N/A') + '\n' +
                    '**Time:** <t:' + Math.floor(Date.now() / 1000) + ':R>');
                logCh.send({ embeds: [logEmbed] }).catch(function(){});
            }
        } catch(e) {}
    }

    async checkRaid(member) {
        var db = getDb();
        var config;
        try {
            config = db.prepare('SELECT * FROM automod_config WHERE guild_id = ? AND enabled = 1').get(member.guild.id);
        } catch(e) { return false; }
        if (!config || !config.antiraid) return false;
        var key = member.guild.id;
        var now = Date.now();
        var data = this.raidMap.get(key) || { joins: [], active: false };
        data.joins = data.joins.filter(function(t) { return now - t < (config.antiraid_seconds || 10) * 1000; });
        data.joins.push(now);
        this.raidMap.set(key, data);
        if (data.joins.length >= (config.antiraid_joins || 5)) {
            if (!data.active) {
                data.active = true;
                this.raidMap.set(key, data);
                var logCh = member.guild.channels.cache.find(function(c) { return c.name.includes('mod-log'); });
                if (logCh) {
                    logCh.send({ embeds: [AtlasEmbed.error('RAID DETECTED', data.joins.length + ' joins in ' + config.antiraid_seconds + 's! Auto-kicking new joins for 60s.')] }).catch(function(){});
                }
                var self = this;
                setTimeout(function() { var d = self.raidMap.get(key); if(d) { d.active = false; d.joins = []; self.raidMap.set(key, d); } }, 60000);
            }
            try {
                var action = config.antiraid_action || 'kick';
                if (action === 'ban') { await member.ban({ reason: 'Atlas Anti-Raid' }); }
                else { await member.kick('Atlas Anti-Raid'); }
            } catch(e) {}
            return true;
        }
        if (data.active) {
            try { await member.kick('Atlas Anti-Raid: Active'); } catch(e) {}
            return true;
        }
        return false;
    }
}

module.exports = { AutoModSystem };