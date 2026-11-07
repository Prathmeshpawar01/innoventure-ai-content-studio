const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');
const scheduler = require('./services/scheduler');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, distributionMode: config.distributionMode }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/analytics', require('./routes/analytics'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
  scheduler.start();
  app.listen(config.port, () => console.log(`API listening on :${config.port} (distribution: ${config.distributionMode})`));
}

main().catch((e) => { console.error('Failed to start:', e.message); process.exit(1); });
