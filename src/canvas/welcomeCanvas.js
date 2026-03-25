var { createCanvas, loadImage } = require('@napi-rs/canvas');
var { AttachmentBuilder } = require('discord.js');

async function createWelcomeCard(member, welcomeMessage) {
    var canvas = createCanvas(1024, 450);
    var ctx = canvas.getContext('2d');

    var gradient = ctx.createLinearGradient(0, 0, 1024, 450);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 450);

    ctx.strokeStyle = 'rgba(88, 101, 242, 0.3)';
    ctx.lineWidth = 2;
    for (var i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(512, 225, 180 + i * 20, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (var x = 0; x < 1024; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 450); ctx.stroke();
    }
    for (var y = 0; y < 450; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
    }

    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 4;
    roundRect(ctx, 10, 10, 1004, 430, 20);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(88, 101, 242, 0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, 20, 20, 984, 410, 15);
    ctx.stroke();

    ctx.shadowColor = '#5865F2';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(512, 150, 80, 0, Math.PI * 2);
    ctx.fillStyle = '#5865F2';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(512, 150, 75, 0, Math.PI * 2);
    ctx.fillStyle = '#2B2D31';
    ctx.fill();

    try {
        var avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        var avatar = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(512, 150, 70, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 442, 80, 140, 140);
        ctx.restore();
    } catch (err) {
        ctx.beginPath();
        ctx.arc(512, 150, 70, 0, Math.PI * 2);
        ctx.fillStyle = '#5865F2';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(member.user.username[0].toUpperCase(), 512, 168);
    }

    ctx.beginPath();
    ctx.arc(560, 200, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#2B2D31';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(560, 200, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#57F287';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#5865F2';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('W E L C O M E', 512, 260);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    var username = member.user.username.length > 20
        ? member.user.username.substring(0, 17) + '...'
        : member.user.username;
    ctx.fillText(username, 512, 305);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '20px Arial';
    ctx.fillText('to ' + member.guild.name, 512, 340);

    ctx.fillStyle = 'rgba(88, 101, 242, 0.8)';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Member #' + member.guild.memberCount, 512, 380);

    if (welcomeMessage) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '14px Arial';
        var msg = welcomeMessage.length > 60 ? welcomeMessage.substring(0, 57) + '...' : welcomeMessage;
        ctx.fillText(msg, 512, 410);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('Atlas Bot', 990, 430);

    var buffer = canvas.toBuffer('image/png');
    var attachment = new AttachmentBuilder(buffer, { name: 'welcome-card.png' });
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

module.exports = { createWelcomeCard };