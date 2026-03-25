const { EmbedBuilder } = require('discord.js');

class AtlasEmbed {
    static default(title, description) {
        return new EmbedBuilder()
            .setTitle(title || null)
            .setDescription(description || null)
            .setColor(0x2B2D31)
            .setTimestamp()
            .setFooter({ text: 'Atlas | Made by Faris (erenyeager.exp)' });
    }
    static success(title, description) {
        return new EmbedBuilder()
            .setTitle('✅ ' + (title || 'Success'))
            .setDescription(description || null)
            .setColor(0x57F287)
            .setTimestamp()
            .setFooter({ text: 'Atlas | Made by Faris (erenyeager.exp)' });
    }
    static error(title, description) {
        return new EmbedBuilder()
            .setTitle('❌ ' + (title || 'Error'))
            .setDescription(description || null)
            .setColor(0xED4245)
            .setTimestamp()
            .setFooter({ text: 'Atlas | Made by Faris (erenyeager.exp)' });
    }
    static warning(title, description) {
        return new EmbedBuilder()
            .setTitle('⚠️ ' + (title || 'Warning'))
            .setDescription(description || null)
            .setColor(0xFEE75C)
            .setTimestamp()
            .setFooter({ text: 'Atlas | Made by Faris (erenyeager.exp)' });
    }
    static info(title, description) {
        return new EmbedBuilder()
            .setTitle('ℹ️ ' + (title || 'Info'))
            .setDescription(description || null)
            .setColor(0x5865F2)
            .setTimestamp()
            .setFooter({ text: 'Atlas | Made by Faris (erenyeager.exp)' });
    }
    static setup(step, totalSteps, title, description) {
        return new EmbedBuilder()
            .setAuthor({ name: 'Atlas Setup - Step ' + step + '/' + totalSteps })
            .setTitle(title || null)
            .setDescription(description || null)
            .setColor(0x2B2D31)
            .setTimestamp()
            .setFooter({ text: 'Atlas Setup Wizard | Made by Faris (erenyeager.exp)' });
    }
    static panel(title, description) {
        return new EmbedBuilder()
            .setTitle(title || null)
            .setDescription(description || null)
            .setColor(0x2B2D31)
            .setTimestamp()
            .setFooter({ text: 'Atlas System | Made by Faris (erenyeager.exp)' });
    }
}

module.exports = { AtlasEmbed };