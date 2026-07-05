const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function registerModules(commands, payloads, modules) {
    const list = Array.isArray(modules) ? modules : [modules];

    for (const command of list) {
        if (command && 'data' in command && 'execute' in command) {
            commands.set(command.data.name, command);
            payloads.push(command.data.toJSON());
        }
    }
}

function loadFromDirectory(commandsDir) {
    const registryPath = path.join(commandsDir, 'index.js');

    if (fs.existsSync(registryPath)) {
        return require(registryPath);
    }

    return fs.readdirSync(commandsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => require(path.join(commandsDir, file)));
}

/**
 * @param {string | unknown[]} source — dossier `commands/` ou liste de modules (bundle)
 */
function loadCommands(source) {
    const commands = new Collection();
    const payloads = [];

    if (Array.isArray(source)) {
        registerModules(commands, payloads, source);
        return { commands, payloads };
    }

    if (typeof source !== 'string' || !fs.existsSync(source)) {
        return { commands, payloads };
    }

    registerModules(commands, payloads, loadFromDirectory(source));
    return { commands, payloads };
}

module.exports = {
    loadCommands,
};
