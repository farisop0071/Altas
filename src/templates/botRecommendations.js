var botList = [
    { name: 'Carl-bot', id: '235148962103951360', desc: 'Reaction roles, automod, logging, embeds', category: 'mod' },
    { name: 'MEE6', id: '159985415099514880', desc: 'Leveling, moderation, welcome messages', category: 'mod' },
    { name: 'Dyno', id: '155149108183695360', desc: 'Moderation, automod, custom commands', category: 'mod' },
    { name: 'Wick', id: '536991182035746816', desc: 'Advanced anti-nuke and security', category: 'mod' },
    { name: 'OwO', id: '408785106942164992', desc: 'Animals, battling, gambling', category: 'fun' },
    { name: 'Dank Memer', id: '270904126974590976', desc: 'Memes, currency, games', category: 'fun' },
    { name: 'Mudae', id: '432610292342587392', desc: 'Waifu/husbando gacha', category: 'fun' },
    { name: 'Truth or Dare', id: '692045914436796436', desc: 'Truth or dare, never have I ever', category: 'fun' },
    { name: 'Would You Rather', id: '724657775652634795', desc: 'Would you rather questions', category: 'fun' },
    { name: 'Jockie Music', id: '411916947773587456', desc: 'Music from Spotify, YouTube', category: 'music' },
    { name: 'Lofi Radio', id: '830432948974936074', desc: '24/7 lofi hip hop radio', category: 'music' },
    { name: 'Hydra', id: '547905866255433758', desc: 'High quality music bot', category: 'music' },
    { name: 'YAGPDB', id: '204255221017214977', desc: 'Custom commands, automod, feeds', category: 'util' },
    { name: 'Arcane', id: '437808476106784770', desc: 'Leveling, role rewards, leaderboards', category: 'util' },
    { name: 'ServerStats', id: '458276816071950337', desc: 'Member count channels, server stats', category: 'util' },
    { name: 'Disboard', id: '302050872383242240', desc: 'Server bumping and discovery', category: 'util' },
    { name: 'Ticket Tool', id: '557628352828014614', desc: 'Advanced ticket management', category: 'util' },
    { name: 'UnbelievaBoat', id: '292953664492929025', desc: 'Economy, moderation, custom shop', category: 'econ' },
    { name: 'Tatsu', id: '172002275412279296', desc: 'Social, leveling, economy, profiles', category: 'econ' },
    { name: 'ProBot', id: '282859044593598464', desc: 'Welcome images, leveling, moderation', category: 'mod' },
    { name: 'Mimu', id: '749540505736069221', desc: 'Embeds, giveaways, reaction roles', category: 'util' },
    { name: 'Bump Reminder', id: '735147814878969968', desc: 'Reminds to bump on Disboard', category: 'util' },
];

function getBotInvite(botId) {
    return 'https://discord.com/oauth2/authorize?client_id=' + botId + '&scope=bot+applications.commands&permissions=8';
}

module.exports = { botList, getBotInvite };
