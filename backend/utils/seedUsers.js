// Seed the three demo accounts with real Argon2id-hashed passwords.
// Run once after the database is initialized: node utils/seedUsers.js

const { connect } = require('../db');
const { createUser, findByEmail, countUsers } = require('../db/users');
const { hashPassword } = require('./password');

const DEMO_USERS = [
  { name: 'Platform Administrator', email: 'admin@realestateai.com', password: 'AdminDemo2026!', role: 'Admin' },
  { name: 'Rahul Verma', email: 'buyer@realestateai.com', password: 'BuyerDemo2026!', role: 'Buyer' },
  { name: 'Rajesh Sharma', email: 'seller@realestateai.com', password: 'SellerDemo2026!', role: 'Seller' },
];

async function seedUsers() {
  try {
    connect();

    const existing = countUsers();
    if (existing > 0) {
      console.log(`[seed] Database already has ${existing} users. Skipping seed.`);
      return;
    }

    console.log('[seed] Hashing passwords and creating demo users...');
    for (const u of DEMO_USERS) {
      const passwordHash = await hashPassword(u.password);
      const user = createUser({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        phone: '+91 98765 00000',
      });
      console.log(`[seed] Created: ${user.email} (${user.role}) — password: ${u.password}`);
    }

    console.log('[seed] Done. Update the quick-fill buttons to use the new passwords.');
  } catch (err) {
    console.error('[seed] Failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedUsers().then(() => process.exit(0));
}

module.exports = { seedUsers, DEMO_USERS };
