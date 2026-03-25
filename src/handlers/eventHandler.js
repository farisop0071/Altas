const fs = require('fs');
const path = require('path');

async function loadEvents(client) {
    const eventsPath = path.join(__dirname, '..', 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(function(f) { return f.endsWith('.js'); });

    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
            client.once(event.name, function() {
                var args = Array.from(arguments);
                args.push(client);
                event.execute.apply(null, args);
            });
        } else {
            client.on(event.name, function() {
                var args = Array.from(arguments);
                args.push(client);
                event.execute.apply(null, args);
            });
        }
        console.log('  Loaded event: ' + event.name);
    }
}

module.exports = { loadEvents };