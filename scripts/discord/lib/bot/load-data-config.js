/** Résout config/data.js en dev (CJS) et dans le bundle Vite (default export). */
function loadDataConfig() {
    const mod = require('../../config/data');

    if (mod?.categories) {
        return mod;
    }

    if (mod?.default?.categories) {
        return mod.default;
    }

    throw new Error('config/data.js : propriété categories introuvable.');
}

module.exports = {
    loadDataConfig,
};
