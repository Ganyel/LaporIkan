const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const ROOT_URL = process.env.ROOT_URL || `http://localhost:${process.env.PORT || 3000}`;
const ALLOWED_ADMIN_EMAILS = (process.env.ALLOWED_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function ensureConfig(req, res, next) {
  // Treat placeholder or empty secret as missing
  const missingSecret = !CLIENT_SECRET || CLIENT_SECRET.trim() === '' || CLIENT_SECRET === 'REPLACE_WITH_YOUR_CLIENT_SECRET';
  if (!CLIENT_ID || missingSecret) {
    return res.status(500).send('Google OAuth belum dikonfigurasi pada server. Setel GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di .env');
  }
  next();
}

router.get('/auth/google', ensureConfig, (req, res) => {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, `${ROOT_URL}/auth/google/callback`);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile']
  });
  res.redirect(authUrl);
});

router.get('/auth/google/callback', ensureConfig, async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Code tidak ditemukan');

  try {
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, `${ROOT_URL}/auth/google/callback`);
    const { tokens } = await oauth2Client.getToken(code);

    // tokens.id_token berisi JWT dengan profile
    const ticket = await oauth2Client.verifyIdToken({ idToken: tokens.id_token, audience: CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || payload.given_name || '';
    const picture = payload.picture || '';

    const allowAll = ALLOWED_ADMIN_EMAILS.includes('*') || ALLOWED_ADMIN_EMAILS.includes('all') || ALLOWED_ADMIN_EMAILS.length === 0;
    if (!allowAll && !ALLOWED_ADMIN_EMAILS.includes(String(email).toLowerCase())) {
      return res.status(403).send('Akun Google Anda tidak diizinkan untuk admin');
    }

    // Buat simple token aplikasi (ganti dengan JWT pada production)
    const appToken = Buffer.from(`google:${email}:${Date.now()}`).toString('base64');

    // Redirect kembali ke halaman login dengan token di query param
    const redirectUrl = `/login?adminToken=${encodeURIComponent(appToken)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&picture=${encodeURIComponent(picture)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    // Improve logging for common googleapis errors
    console.error('Google OAuth callback error:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    if (err && err.response && err.response.data) console.error('Google API response:', err.response.data);

    // Return a more descriptive message in development to help debugging (avoid leaking secrets)
    const devMsg = err && err.message ? `Gagal memproses callback Google OAuth: ${err.message}` : 'Gagal memproses callback Google OAuth';
    res.status(500).send(devMsg);
  }
});

module.exports = router;
