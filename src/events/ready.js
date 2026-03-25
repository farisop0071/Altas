const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute: async function(client) {
        console.log('');
        console.log('===========================================');
        console.log('  Atlas is online!');
        console.log('  Servers: ' + client.guilds.cache.size);
        console.log('  Tag: ' + client.user.tag);
        console.log('  Made by Faris (erenyeager.exp)');
        console.log('===========================================');
        console.log('');

        var statuses = [
            { name: '/setup - Atlas Bot', type: ActivityType.Playing },
            { name: client.guilds.cache.size + ' servers', type: ActivityType.Watching },
            { name: 'Server Security', type: ActivityType.Watching },
        ];

        var i = 0;
        //                    ↓↓↓↓↓ Added 'async' here
        setInterval(async function() {
            // Cache invites for all guilds
            var { getDb } = require('../utils/database');
            try {
                var db2 = getDb();
                var insInv = db2.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
                for (var [gid, guild] of client.guilds.cache) {
                    try {
                        var invs = await guild.invites.fetch();
                        invs.forEach(function(inv) {
                            insInv.run(gid, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null);
                        });
                    } catch(e) {}
                }
                console.log('  Cached invites for ' + client.guilds.cache.size + ' guilds');
            } catch(e) {}

            // Cache invites for all guilds
        var { getDb } = require('../utils/database');
        try {
            var db2 = getDb();
            var insInv = db2.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            for (var [gid, guild] of client.guilds.cache) {
                try {
                    var invs = await guild.invites.fetch();
                    invs.forEach(function(inv) { insInv.run(gid, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null); });
                } catch(e) {}
            }
            console.log('  Cached invites for ' + client.guilds.cache.size + ' guilds');
        } catch(e) {}

        // Cache invites for all guilds
        var { getDb } = require('../utils/database');
        try {
            var db2 = getDb();
            var insInv = db2.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            for (var [gid, guild] of client.guilds.cache) {
                try {
                    var invs = await guild.invites.fetch();
                    invs.forEach(function(inv) { insInv.run(gid, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null); });
                } catch(e) {}
            }
            console.log('  Cached invites for ' + client.guilds.cache.size + ' guilds');
        } catch(e) {}

        // Cache invites for all guilds
        var { getDb } = require('../utils/database');
        try {
            var db2 = getDb();
            var insInv = db2.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            for (var [gid, guild] of client.guilds.cache) {
                try {
                    var invs = await guild.invites.fetch();
                    invs.forEach(function(inv) { insInv.run(gid, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null); });
                } catch(e) {}
            }
            console.log('  Cached invites for ' + client.guilds.cache.size + ' guilds');
        } catch(e) {}

        // Cache invites for all guilds
        var { getDb } = require('../utils/database');
        try {
            var db2 = getDb();
            var insInv = db2.prepare('INSERT OR REPLACE INTO invite_cache (guild_id, code, uses, inviter_id) VALUES (?, ?, ?, ?)');
            for (var [gid, guild] of client.guilds.cache) {
                try {
                    var invs = await guild.invites.fetch();
                    invs.forEach(function(inv) { insInv.run(gid, inv.code, inv.uses, inv.inviter ? inv.inviter.id : null); });
                } catch(e) {}
            }
            console.log('  Cached invites for ' + client.guilds.cache.size + ' guilds');
        } catch(e) {}

        client.user.setPresence({
                activities: [statuses[i % statuses.length]],
                status: 'online',
            });
            i++;
        }, 15000);

        client.user.setPresence({
            activities: [statuses[0]],
            status: 'online',
        });
    }
};