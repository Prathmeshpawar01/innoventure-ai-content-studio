// Creates or updates the single admin account from ADMIN_EMAIL / ADMIN_PASSWORD in .env
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

(async () => {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || password.length < 12) {
    console.error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in .env first.');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is not set.'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);
  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.findOneAndUpdate({ email }, { email, passwordHash }, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log(`Admin ready: ${email}. Remove ADMIN_PASSWORD from .env now.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
