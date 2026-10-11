// Copies the web app (repo root) into www/ for the store builds. The service worker is left out:
// inside the store app everything is already on the device.
import fs from 'fs';
import path from 'path';
const root = path.resolve(import.meta.dirname, '..', '..'), www = path.resolve(import.meta.dirname, '..', 'www');
fs.rmSync(www, { recursive: true, force: true }); fs.mkdirSync(www, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest']) fs.copyFileSync(path.join(root, f), path.join(www, f));
for (const d of ['audio', 'icons']) fs.cpSync(path.join(root, d), path.join(www, d), { recursive: true });
console.log('web app copied to', www, fs.readdirSync(path.join(www, 'audio')).length, 'audio files');
