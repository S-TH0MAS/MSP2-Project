/**
 * Stub pur-JS pour `bufferutil` (module natif optionnel).
 * Implémente les fonctions mask/unmask utilisées par ws/discord.js
 * sans dépendre du binding natif — compatible avec le bundle standalone.
 */

function mask(source, mask, output, offset, length) {
    for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
    }
}

function unmask(buffer, mask) {
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
    }
}

module.exports = { mask, unmask };
