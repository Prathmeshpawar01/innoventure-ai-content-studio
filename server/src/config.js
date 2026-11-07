require('dotenv').config();

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name}. See .env.example`);
  return v;
}

const jwtSecret = must('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters.');

module.exports = {
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: must('MONGODB_URI'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  geminiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || '',
  distributionMode: process.env.DISTRIBUTION_MODE === 'live' ? 'live' : 'manual'
};
