var { createCanvas, loadImage } = require('@napi-rs/canvas');
var { AttachmentBuilder } = require('discord.js');

async function createBotInfoCard(client) {
    var canvas = createCanvas(800, 400);
    var ctx = canvas.getContext('2d');

    var gradient = ctx.createLinearGradient(0, 0, 800, 400);
    gradient.addColorStop(0, '#0d1117');
    gradient.addColorStop(0.5, '#161b22');
    gradient.addColorStop(1, '#0d1117');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);

    ctx.strokeStyle = 'rgba(88, 101, 242, 0.05)';
    ctx.lineWidth = 1;
    for (var x = 0; x < 800; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 400); ctx.stroke();
    }
    for (var y = 0; y < 400; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }

    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 3;
    roundRect(ctx, 5, 5, 790, 390, 15);
    ctx.stroke();

    ctx.shadowColor = '#5865F2';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(120, 120, 55, 0, Math.PI * 2);
    ctx.fillStyle = '#5865F2';
    ctx.fill();
    ctx.shadowBlur = 0;

    try {
        var avatarURL = client.user.displayAvatarURL({ extension: 'png', size: 256 });
        var avatar = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(120, 120, 50, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 70, 70, 100, 100);
        ctx.restore();
    } catch (e) {
        ctx.beginPath();
        ctx.arc(120, 120, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#2B2D31';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('A', 120, 135);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('Atlas', 195, 110);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '16px Arial';
    ctx.fillText('Advanced Server Management Bot', 195, 140);

    ctx.strokeStyle = 'rgba(88, 101, 242, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 190);
    ctx.lineTo(760, 190);
    ctx.stroke();

    var stats = [
        { label: 'Servers', value: client.guilds.cache.size.toString() },
        { label: 'Users', value: client.guilds.cache.reduce(function(a, g) { return a + g.memberCount; }, 0).toString() },
        { label: 'Ping', value: client.ws.ping + 'ms' },
        { label: 'Version', value: '1.0.0' },
    ];

    var boxWidth = 160;
    var startX = 50;
    var boxY = 210;

    stats.forEach(function(stat, i) {
        var bx = startX + i * (boxWidth + 20);
        ctx.fillStyle = 'rgba(88, 101, 242, 0.1)';
        roundRect(ctx, bx, boxY, boxWidth, 80, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(88, 101, 242, 0.3)';
        ctx.lineWidth = 1;
        roundRect(ctx, bx, boxY, boxWidth, 80, 10);
        ctx.stroke();
        ctx.fillStyle = '#5865F2';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(stat.value, bx + boxWidth / 2, boxY + 40);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '14px Arial';
        ctx.fillText(stat.label, bx + boxWidth / 2, boxY + 65);
    });

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '14px Arial';
    ctx.fillText('Developed by Faris (erenyeager.exp)', 40, 340);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(88, 101, 242, 0.6)';
    ctx.font = '12px Arial';
    ctx.fillText('Setup | AutoMod | AntiNuke | Tickets | Welcome | Counting', 760, 340);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.textAlign = 'center';
    ctx.font = '12px Arial';
    ctx.fillText('Node.js ' + process.version + ' | discord.js v14', 400, 375);

    var buffer = canvas.toBuffer('image/png');
    var attachment = new AttachmentBuilder(buffer, { name: 'atlas-info.png' });
    return attachment;
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

module.exports = { createBotInfoCard };