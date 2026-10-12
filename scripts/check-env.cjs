const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split(/\r?\n/).filter(l => l.includes('ELEVENLABS'));
lines.forEach(l => {
  const parts = l.split('=');
  const val = parts.slice(1).join('=');
  console.log(parts[0], 'hasQuotes:', val.startsWith('"') || val.startsWith("'"), 'length:', val.length, 'firstChar:', val[0], 'lastChar:', val[val.length - 1]);
});
