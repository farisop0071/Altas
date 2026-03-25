require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, ActivityType } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { initDatabase } = require('./utils/database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildMember,
    ],
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.setupSessions = new Collection();

client.botInfo = {
    developer: 'Faris (erenyeager.exp)',
    botName: 'Atlas',
    version: '1.0.0',
    color: 0x2B2D31,
    accentColor: 0x5865F2,
    successColor: 0x57F287,
    errorColor: 0xED4245,
    warningColor: 0xFEE75C,
};

(async () => {
    try {
        console.log('Initializing database...');
        initDatabase();
        console.log('Loading commands...');
        await loadCommands(client);
        console.log('Loading events...');
        await loadEvents(client);
        console.log('Logging in...');
        await client.login(process.env.BOT_TOKEN);
    } catch (error) {
        console.error('Failed to start Atlas:', error);
        process.exit(1);
    }
})();

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});