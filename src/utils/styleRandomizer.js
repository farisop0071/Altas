// Random style generator for channels and roles
// Makes every setup unique!

var categoryStyles = [
    function(n) { return '\u2506 ' + n + ' \u2506'; },
    function(n) { return '\u2500\u2500 ' + n + ' \u2500\u2500'; },
    function(n) { return '\u2550\u2550 ' + n; },
    function(n) { return '\u2726 ' + n; },
    function(n) { return '\u2500 ' + n + ' \u2500'; },
    function(n) { return '\u25C6 ' + n; },
    function(n) { return '\u2503 ' + n; },
    function(n) { return '\u25B8 ' + n; },
    function(n) { return '\u00BB ' + n; },
    function(n) { return '\u2022 ' + n + ' \u2022'; },
];

var channelSeparators = ['\u30FB', ' \u2502 ', '\uFF5C', ' \u2E31 ', ' \u2043 ', '\u30A0', ' \u00B7 '];

var channelEmojiSets = [
    {
        welcome: '\uD83C\uDF1F', rules: '\uD83D\uDCDC', invites: '\uD83D\uDD17',
        announcements: '\uD83D\uDCE2', updates: '\uD83D\uDD14', changelogs: '\uD83E\uDDFE',
        polls: '\uD83D\uDCCA', support: '\u2753', apply: '\uD83D\uDCDD',
        chat: '\uD83D\uDCAC', commands: '\uD83E\uDD16', media: '\uD83C\uDFA8',
        poetry: '\u270D\uFE0F', pfp: '\uD83D\uDDBC\uFE0F', memes: '\uD83D\uDE02',
        owo: '\uD83C\uDFB2', counting: '\uD83D\uDD22', music: '\uD83C\uDFB5',
        ticket: '\uD83C\uDFAB', staff: '\uD83D\uDDE3\uFE0F', logs: '\uD83D\uDCDA',
        giveaways: '\uD83C\uDF81', events: '\uD83C\uDF89', general: '\uD83D\uDCAC',
        voice: '\uD83C\uDF99', gaming: '\uD83C\uDFAE', clips: '\uD83C\uDFA5',
        off_topic: '\uD83D\uDCA9', suggestions: '\uD83D\uDCA1', bug: '\uD83D\uDC1B',
        report: '\uD83D\uDEA8', faq: '\u2753', reviews: '\u2B50',
        bump: '\uD83D\uDD3C', promo: '\uD83D\uDCE3', youtube: '\uD83D\uDCFA',
        twitch: '\uD83D\uDFE3', tiktok: '\uD83C\uDFB5', confessions: '\uD83D\uDE48',
        starboard: '\u2B50', afk: '\uD83D\uDCA4', truth: '\uD83C\uDFAD',
    },
    {
        welcome: '\u2740\uFE0F', rules: '\uD83D\uDCD6', invites: '\uD83D\uDCE9',
        announcements: '\uD83D\uDCE3', updates: '\uD83D\uDCCC', changelogs: '\uD83D\uDCC4',
        polls: '\uD83D\uDDF3\uFE0F', support: '\uD83D\uDEF3\uFE0F', apply: '\uD83D\uDCCB',
        chat: '\uD83D\uDDE8\uFE0F', commands: '\u2699\uFE0F', media: '\uD83D\uDDBC\uFE0F',
        poetry: '\uD83D\uDCD6', pfp: '\uD83D\uDCF7', memes: '\uD83E\uDD23',
        owo: '\uD83D\uDC31', counting: '\uD83D\uDD23', music: '\uD83C\uDFB6',
        ticket: '\uD83D\uDCE9', staff: '\uD83D\uDD12', logs: '\uD83D\uDCCB',
        giveaways: '\uD83C\uDF80', events: '\uD83C\uDF86', general: '\uD83D\uDDE8\uFE0F',
        voice: '\uD83D\uDD0A', gaming: '\uD83D\uDD79\uFE0F', clips: '\uD83C\uDFA5',
        off_topic: '\uD83C\uDF00', suggestions: '\uD83D\uDCA1', bug: '\uD83E\uDEB2',
        report: '\u26A0\uFE0F', faq: '\uD83D\uDCD8', reviews: '\uD83C\uDF1F',
        bump: '\uD83D\uDE80', promo: '\uD83D\uDCE3', youtube: '\u25B6\uFE0F',
        twitch: '\uD83D\uDDA5\uFE0F', tiktok: '\uD83D\uDCF1', confessions: '\uD83E\uDD2B',
        starboard: '\uD83C\uDF1F', afk: '\uD83D\uDECC', truth: '\uD83E\uDD14',
    },
    {
        welcome: '\uD83C\uDF38', rules: '\uD83D\uDCCE', invites: '\uD83C\uDF10',
        announcements: '\uD83D\uDD14', updates: '\uD83D\uDCE1', changelogs: '\uD83D\uDDD2\uFE0F',
        polls: '\uD83D\uDCDD', support: '\uD83D\uDEE0\uFE0F', apply: '\u2712\uFE0F',
        chat: '\uD83C\uDFE0', commands: '\uD83D\uDCBB', media: '\uD83C\uDF04',
        poetry: '\uD83C\uDF39', pfp: '\uD83E\uDDE1', memes: '\uD83C\uDF2E',
        owo: '\uD83E\uDD8A', counting: '\uD83C\uDFB0', music: '\uD83C\uDFB8',
        ticket: '\uD83D\uDD10', staff: '\uD83D\uDC6E', logs: '\uD83D\uDCC2',
        giveaways: '\uD83C\uDF89', events: '\uD83C\uDF1F', general: '\uD83C\uDFE0',
        voice: '\uD83C\uDFA7', gaming: '\uD83C\uDFB2', clips: '\uD83D\uDCF9',
        off_topic: '\uD83C\uDF0A', suggestions: '\uD83E\uDD1D', bug: '\uD83D\uDC1E',
        report: '\uD83D\uDEA9', faq: '\uD83D\uDCD5', reviews: '\uD83D\uDC96',
        bump: '\uD83D\uDCE4', promo: '\uD83D\uDCE2', youtube: '\uD83C\uDFAC',
        twitch: '\uD83C\uDFAE', tiktok: '\uD83C\uDFB6', confessions: '\uD83D\uDC7B',
        starboard: '\u2728', afk: '\uD83C\uDF19', truth: '\uD83C\uDFAF',
    },
];

var roleDividerStyles = [
    function(n) { return '\u2501\u2501 ' + n + ' \u2501\u2501'; },
    function(n) { return '\u2500 \u2726 ' + n + ' \u2726 \u2500'; },
    function(n) { return '\u2500 \u2662 ' + n + ' \u2662 \u2500'; },
    function(n) { return '\u2500 \u2605 ' + n + ' \u2605 \u2500'; },
    function(n) { return '\u2500 \u2740 ' + n + ' \u2740 \u2500'; },
    function(n) { return '\u25C6 ' + n + ' \u25C6'; },
    function(n) { return '\u2500\u2500 ' + n + ' \u2500\u2500'; },
    function(n) { return '\u00AB ' + n + ' \u00BB'; },
];

var roleEmojiSets = [
    { owner: '\uD83D\uDC51', coowner: '\uD83D\uDC51', admin: '\u2694\uFE0F', mod: '\uD83D\uDEE1\uFE0F', staff: '\uD83D\uDD31', dev: '\u2728', vip: '\u2B50', mvp: '\uD83C\uDFC6', member: '\uD83C\uDF1F', bots: '\uD83E\uDD16' },
    { owner: '\u26A1', coowner: '\u26A1', admin: '\u2728', mod: '\uD83D\uDCA0', staff: '\u2764\uFE0F', dev: '\uD83D\uDC8E', vip: '\uD83C\uDF1F', mvp: '\uD83C\uDFC5', member: '\u2606', bots: '\u2699\uFE0F' },
    { owner: '\uD83C\uDF38', coowner: '\uD83C\uDF38', admin: '\uD83D\uDD25', mod: '\u2744\uFE0F', staff: '\uD83C\uDF3F', dev: '\uD83D\uDDA5\uFE0F', vip: '\uD83D\uDC96', mvp: '\uD83C\uDFAF', member: '\uD83C\uDF3C', bots: '\uD83E\uDD16' },
    { owner: '\uD83D\uDC8E', coowner: '\uD83D\uDC8E', admin: '\uD83D\uDD2E', mod: '\uD83C\uDF0A', staff: '\uD83C\uDF3F', dev: '\u26A1', vip: '\u2728', mvp: '\uD83C\uDFC6', member: '\u2606', bots: '\u2699\uFE0F' },
];

function getRandomStyle() {
    var catStyle = categoryStyles[Math.floor(Math.random() * categoryStyles.length)];
    var sep = channelSeparators[Math.floor(Math.random() * channelSeparators.length)];
    var emojiSet = channelEmojiSets[Math.floor(Math.random() * channelEmojiSets.length)];
    var divStyle = roleDividerStyles[Math.floor(Math.random() * roleDividerStyles.length)];
    var roleEmojis = roleEmojiSets[Math.floor(Math.random() * roleEmojiSets.length)];
    return { catStyle: catStyle, sep: sep, emojiSet: emojiSet, divStyle: divStyle, roleEmojis: roleEmojis };
}

function getChannelEmoji(channelName, emojiSet) {
    var name = channelName.toLowerCase();
    if (name.includes('welcome')) return emojiSet.welcome;
    if (name.includes('rule')) return emojiSet.rules;
    if (name.includes('invite')) return emojiSet.invites;
    if (name.includes('announce')) return emojiSet.announcements;
    if (name.includes('update')) return emojiSet.updates;
    if (name.includes('changelog')) return emojiSet.changelogs;
    if (name.includes('poll')) return emojiSet.polls;
    if (name.includes('support')) return emojiSet.support;
    if (name.includes('apply') || name.includes('staff-apply')) return emojiSet.apply;
    if (name.includes('ticket')) return emojiSet.ticket;
    if (name.includes('chat') || name.includes('general') || name.includes('chit')) return emojiSet.chat;
    if (name.includes('command') || name.includes('cmnd') || name.includes('bot')) return emojiSet.commands;
    if (name.includes('media') || name.includes('art')) return emojiSet.media;
    if (name.includes('poet') || name.includes('script')) return emojiSet.poetry;
    if (name.includes('pfp') || name.includes('thumbnail')) return emojiSet.pfp;
    if (name.includes('meme')) return emojiSet.memes;
    if (name.includes('owo')) return emojiSet.owo;
    if (name.includes('count')) return emojiSet.counting;
    if (name.includes('music')) return emojiSet.music;
    if (name.includes('staff') || name.includes('mod-log') || name.includes('log')) return emojiSet.staff;
    if (name.includes('giveaway')) return emojiSet.giveaways;
    if (name.includes('event')) return emojiSet.events;
    if (name.includes('clip') || name.includes('edit')) return emojiSet.clips;
    if (name.includes('off-topic')) return emojiSet.off_topic;
    if (name.includes('suggest')) return emojiSet.suggestions;
    if (name.includes('bug')) return emojiSet.bug;
    if (name.includes('report')) return emojiSet.report;
    if (name.includes('faq')) return emojiSet.faq;
    if (name.includes('review')) return emojiSet.reviews;
    if (name.includes('bump')) return emojiSet.bump;
    if (name.includes('promo') || name.includes('spons')) return emojiSet.promo;
    if (name.includes('youtube')) return emojiSet.youtube;
    if (name.includes('twitch')) return emojiSet.twitch;
    if (name.includes('tiktok')) return emojiSet.tiktok;
    if (name.includes('confess')) return emojiSet.confessions;
    if (name.includes('star')) return emojiSet.starboard;
    if (name.includes('afk')) return emojiSet.afk;
    if (name.includes('truth')) return emojiSet.truth;
    if (name.includes('game') || name.includes('valorant') || name.includes('fortnite') || name.includes('gta') || name.includes('minecraft')) return emojiSet.gaming;
    if (name.includes('voice') || name.includes('vc') || name.includes('duo') || name.includes('trio') || name.includes('squad') || name.includes('ranked')) return emojiSet.voice;
    return emojiSet.general;
}

module.exports = { getRandomStyle, getChannelEmoji };