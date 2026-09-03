import fs from 'fs';

const code = fs.readFileSync('worker.js', 'utf8');

// We will do some Regex extraction or just keep worker.js but create new modules for it.
