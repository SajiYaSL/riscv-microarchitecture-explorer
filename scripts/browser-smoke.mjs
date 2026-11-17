// Compatibility entry point for the complete Playwright browser suite.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url)), 'test', ...process.argv.slice(2)], {stdio: 'inherit'});
child.on('error', error => {console.error(error.message); process.exitCode = 1;});
child.on('exit', code => {process.exitCode = code ?? 1;});
