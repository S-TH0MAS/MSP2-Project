import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const discordRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(discordRoot, '../..');
const optionalNativeStub = path.join(__dirname, 'stubs/optional-native.cjs');
const bufferutilStub = path.join(__dirname, 'stubs/bufferutil.cjs');
const envPath = path.join(projectRoot, '.env');

let bundledDotenv = process.env.MSP2_BUNDLED_DOTENV ?? '';

if (!bundledDotenv && fs.existsSync(envPath)) {
    bundledDotenv = fs.readFileSync(envPath, 'utf8');
}

export default defineConfig({
    root: discordRoot,
    define: {
        __BUNDLED_DOTENV__: JSON.stringify(bundledDotenv),
    },
    resolve: {
        alias: {
            'zlib-sync': optionalNativeStub,
            bufferutil: bufferutilStub,
            'utf-8-validate': optionalNativeStub,
        },
    },
    build: {
        ssr: true,
        outDir: path.join(discordRoot, 'dist'),
        emptyOutDir: true,
        target: 'node20',
        minify: 'esbuild',
        sourcemap: false,
        commonjsOptions: {
            transformMixedEsModules: true,
            requireReturnsDefault: 'preferred',
            defaultIsModuleExports: true,
            include: [/node_modules/, /\/lib\//, /\/commands\//, /\/config\//],
        },
        rollupOptions: {
            input: path.join(__dirname, 'standalone.mjs'),
            output: {
                format: 'cjs',
                entryFileNames: 'index.js',
                inlineDynamicImports: true,
            },
        },
    },
    ssr: {
        noExternal: true,
    },
});
