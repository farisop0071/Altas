var { AntiNukeSystem } = require('../systems/antinukeSystem');

module.exports = {
    name: 'ready',
    once: true,
    execute: function(client) {
        var antiNuke = new AntiNukeSystem(client);

        client.on('guildMemberAdd', async function(member) {
            if (member.user.bot) await antiNuke.onGuildBotAdd(member);
        });
        client.on('channelDelete', async function(channel) {
            if (channel.guild) await antiNuke.onChannelDelete(channel);
        });
        client.on('channelCreate', async function(channel) {
            if (channel.guild) await antiNuke.onChannelCreate(channel);
        });
        client.on('roleDelete', async function(role) {
            await antiNuke.onRoleDelete(role);
        });
        client.on('guildBanAdd', async function(ban) {
            await antiNuke.onBanAdd(ban);
        });
        client.on('guildMemberRemove', async function(member) {
            if (!member.user.bot) await antiNuke.onMemberRemove(member);
        });
        client.on('roleUpdate', async function(oldRole, newRole) {
            await antiNuke.onRoleUpdate(oldRole, newRole);
        });
        client.on('webhooksUpdate', async function(channel) {
            await antiNuke.onWebhookUpdate(channel);
        });

        console.log('  AntiNuke listeners registered (v2.0)');
    }
};