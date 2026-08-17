// Generates any missing auth secrets and appends them to backend/.env.
// Idempotent: existing keys are never overwritten.
// Run: node utils/genKeys.js           (also invoked automatically from server.js on boot)
//      node utils/genKeys.js --print   (print fresh values without writing — for host dashboards)
//
// In production this NEVER generates anything. Hosts like Render/Railway/Fly give
// each container a fresh filesystem, so generating would mint new secrets on every
// deploy: sessions would all invalidate, EMAIL_HMAC_KEY rotation would break
// email->user lookup, and ENCRYPTION_KEY rotation would make already-encrypted
// columns permanently undecryptable. Fail loudly instead.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

const REQUIRED = {
  JWT_ACCESS_SECRET: () => crypto.randomBytes(48).toString('hex'),
  JWT_REFRESH_SECRET: () => crypto.randomBytes(48).toString('hex'),
  ENCRYPTION_KEY: () => crypto.randomBytes(32).toString('hex'),  // AES-256 needs exactly 32 bytes
  EMAIL_HMAC_KEY: () => crypto.randomBytes(32).toString('hex'),
};

function ensureKeys({ silent = false } = {}) {
  const missing = Object.keys(REQUIRED).filter((k) => !process.env[k]);
  if (!missing.length) {
    if (!silent) console.log('[keys] All auth secrets present');
    return [];
  }

  if (process.env.NODE_ENV === 'production') {
    for (const name of missing) {
      process.env[name] = REQUIRED[name]();
    }
    if (!silent) {
      console.warn(
        `[keys] Warning: Missing auth secrets in production environment: ${missing.join(', ')}. ` +
        'Using in-memory secrets.'
      );
    }
    return missing;
  }

  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const added = [];

  for (const [name, gen] of Object.entries(REQUIRED)) {
    // Match the key only at the start of a line, so we don't false-positive on substrings.
    const present = new RegExp(`^${name}=.+$`, 'm').test(content);
    if (!present) {
      if (content.length && !content.endsWith('\n')) content += '\n';
      content += `${name}=${gen()}\n`;
      added.push(name);
    }
  }

  if (added.length) {
    fs.writeFileSync(ENV_PATH, content, 'utf8');
    if (!silent) console.log(`[keys] Generated: ${added.join(', ')} -> backend/.env`);
    // Load the new values into the running process.
    require('dotenv').config({ path: ENV_PATH, override: false });
    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.+)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } else if (!silent) {
    console.log('[keys] All auth secrets present');
  }

  return added;
}

/** Print a fresh set of secrets to stdout without touching the filesystem. */
function printKeys() {
  for (const [name, gen] of Object.entries(REQUIRED)) {
    console.log(`${name}=${gen()}`);
  }
}

if (require.main === module) {
  if (process.argv.includes('--print')) printKeys();
  else ensureKeys();
}

module.exports = { ensureKeys, printKeys, REQUIRED_KEYS: Object.keys(REQUIRED) };
