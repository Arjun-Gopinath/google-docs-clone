require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

const db = getDb();

const users = [
  { email: 'alice@example.com', name: 'Alice Chen' },
  { email: 'bob@example.com', name: 'Bob Smith' },
  { email: 'charlie@example.com', name: 'Charlie Davis' },
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO users (email, name, password_hash) VALUES (?, ?, ?)'
);

const hash = bcrypt.hashSync('password123', 10);
const seedMany = db.transaction(() => {
  for (const u of users) {
    insert.run(u.email, u.name, hash);
  }
});

seedMany();
console.log('Seeded users: alice@example.com, bob@example.com, charlie@example.com (password: password123)');
