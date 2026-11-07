const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const Admin = require('../models/Admin');
const requireAdmin = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

// Used so a missing account takes about as long as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = String((req.body && req.body.email) || '').toLowerCase().trim();
    const password = String((req.body && req.body.password) || '');
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const admin = await Admin.findOne({ email }).select('+passwordHash');
    const ok = await bcrypt.compare(password, admin ? admin.passwordHash : DUMMY_HASH);
    if (!admin || !ok) return res.status(401).json({ error: 'Incorrect email or password.' });

    const token = jwt.sign({ sub: String(admin._id) }, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: config.jwtExpiresIn
    });
    res.json({ token, admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (e) { next(e); }
});

router.get('/me', requireAdmin, async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(401).json({ error: 'Account no longer exists.' });
    res.json({ admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (e) { next(e); }
});

module.exports = router;
