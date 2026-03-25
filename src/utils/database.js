var Database = require('better-sqlite3');
var path = require('path');
var db;
function initDatabase() {
    db = new Database(path.join(__dirname, '..', 'data', 'atlas.db'));
    db.pragma('journal_mode = WAL');
    var t = [
        'CREATE TABLE IF NOT EXISTS guild_config (guild_id TEXT PRIMARY KEY, server_type TEXT, server_size TEXT, setup_complete INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)',
        'CREATE TABLE IF NOT EXISTS welcome_config (guild_id TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0, channel_id TEXT, message TEXT, use_embed INTEGER DEFAULT 1, use_canvas INTEGER DEFAULT 1, dm_welcome INTEGER DEFAULT 0, dm_message TEXT)',
        'CREATE TABLE IF NOT EXISTS automod_config (guild_id TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0, antispam INTEGER DEFAULT 1, antispam_max INTEGER DEFAULT 10, antispam_interval INTEGER DEFAULT 30, antilink INTEGER DEFAULT 1, antibadwords INTEGER DEFAULT 1, anticaps INTEGER DEFAULT 1, anticaps_percent INTEGER DEFAULT 70, antiemoji INTEGER DEFAULT 1, antiemoji_max INTEGER DEFAULT 10, antimention INTEGER DEFAULT 1, antimention_max INTEGER DEFAULT 5, antiraid INTEGER DEFAULT 1, antiraid_joins INTEGER DEFAULT 5, antiraid_seconds INTEGER DEFAULT 10, antiraid_action TEXT DEFAULT \'kick\')',
        'CREATE TABLE IF NOT EXISTS automod_whitelisted_users (guild_id TEXT, user_id TEXT, PRIMARY KEY (guild_id, user_id))',
        'CREATE TABLE IF NOT EXISTS automod_badwords (guild_id TEXT, word TEXT, PRIMARY KEY (guild_id, word))',
        'CREATE TABLE IF NOT EXISTS automod_whitelisted_links (guild_id TEXT, domain TEXT, PRIMARY KEY (guild_id, domain))',
        'CREATE TABLE IF NOT EXISTS antinuke_config (guild_id TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0, anti_bot_add INTEGER DEFAULT 1, anti_role_give INTEGER DEFAULT 1, anti_perm_change INTEGER DEFAULT 1, anti_role_delete INTEGER DEFAULT 1, anti_channel_delete INTEGER DEFAULT 1, anti_channel_create INTEGER DEFAULT 1, anti_guild_edit INTEGER DEFAULT 1, anti_mass_ban INTEGER DEFAULT 1, anti_mass_kick INTEGER DEFAULT 1, anti_webhook INTEGER DEFAULT 1, anti_everyone INTEGER DEFAULT 1, quarantine_enabled INTEGER DEFAULT 1, quarantine_role_id TEXT, bypass_role_id TEXT, log_channel_id TEXT, punishment TEXT DEFAULT \'ban\')',
        'CREATE TABLE IF NOT EXISTS antinuke_whitelisted (guild_id TEXT, user_id TEXT, level TEXT DEFAULT \'trusted\', PRIMARY KEY (guild_id, user_id))',
        'CREATE TABLE IF NOT EXISTS antinuke_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, user_id TEXT, action TEXT, details TEXT, timestamp INTEGER)',
        'CREATE TABLE IF NOT EXISTS ticket_config (guild_id TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0, title TEXT, description TEXT, category_id TEXT, log_channel_id TEXT, panel_channel_id TEXT, panel_message_id TEXT, use_buttons INTEGER DEFAULT 1, support_role_id TEXT)',
        'CREATE TABLE IF NOT EXISTS ticket_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, name TEXT, description TEXT, emoji TEXT)',
        'CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, channel_id TEXT, user_id TEXT, category TEXT, status TEXT DEFAULT \'open\', claimed_by TEXT, priority TEXT DEFAULT \'normal\', created_at TEXT DEFAULT CURRENT_TIMESTAMP, closed_at TEXT, close_reason TEXT)',
        'CREATE TABLE IF NOT EXISTS counting_config (guild_id TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0, channel_id TEXT, current_count INTEGER DEFAULT 0, last_user_id TEXT, high_score INTEGER DEFAULT 0)',
        'CREATE TABLE IF NOT EXISTS spam_tracking (guild_id TEXT, user_id TEXT, message_count INTEGER DEFAULT 0, first_message_time INTEGER, PRIMARY KEY (guild_id, user_id))',
        'CREATE TABLE IF NOT EXISTS setup_roles (guild_id TEXT, role_id TEXT, role_name TEXT, role_type TEXT, PRIMARY KEY (guild_id, role_id))',
        'CREATE TABLE IF NOT EXISTS raid_tracking (guild_id TEXT PRIMARY KEY, join_timestamps TEXT, raid_mode INTEGER DEFAULT 0, raid_mode_until INTEGER DEFAULT 0)',
        'CREATE TABLE IF NOT EXISTS invite_tracking (guild_id TEXT, user_id TEXT, inviter_id TEXT, invite_code TEXT, joined_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (guild_id, user_id))',
        'CREATE TABLE IF NOT EXISTS invite_cache (guild_id TEXT, code TEXT, uses INTEGER DEFAULT 0, inviter_id TEXT, PRIMARY KEY (guild_id, code))',
        'CREATE TABLE IF NOT EXISTS message_tracking (guild_id TEXT, user_id TEXT, message_count INTEGER DEFAULT 0, last_message TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (guild_id, user_id))',
    ];
    for (var i = 0; i < t.length; i++) { db.exec(t[i]); }
    console.log('Database initialized');
    return db;
}
function getDb() { if (!db) initDatabase(); return db; }
module.exports = { initDatabase, getDb };