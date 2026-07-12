import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { ah, logActivity } from '../helpers.js';

const router = Router();

// Signup ALWAYS creates a plain employee — no role selection (per problem statement)
router.post('/signup', ah(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = await query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
  if (existing.rows.length) return res.status(409).json({ error: 'An account with this email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const { rows: [user] } = await query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, department_id`,
    [name, email.toLowerCase(), hash]
  );
  await logActivity(user.id, 'user.signup', 'user', user.id, `${name} signed up`);
  res.status(201).json({ token: signToken(user), user });
}));

router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body;
  const { rows: [user] } = await query(`SELECT * FROM users WHERE email = $1`, [(email || '').toLowerCase()]);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.status !== 'active') return res.status(403).json({ error: 'Account is deactivated' });
  const { password_hash, ...safe } = user;
  res.json({ token: signToken(user), user: safe });
}));

// Session validation — frontend calls this on load to restore the session
router.get('/me', requireAuth, ah(async (req, res) => {
  const { rows: [user] } = await query(
    `SELECT id, name, email, role, department_id, status FROM users WHERE id = $1`, [req.user.id]);
  if (!user || user.status !== 'active') return res.status(401).json({ error: 'Session invalid' });
  res.json({ user });
}));

// Forgot password — hackathon version: code shown on screen instead of emailed
const resetCodes = new Map(); // email → { code, expiresAt }

router.post('/forgot-password', ah(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const { rows: [user] } = await query(`SELECT id, name, email FROM users WHERE email = $1 AND status = 'active'`, [email.toLowerCase()]);
  if (!user) return res.status(404).json({ error: 'No active account found with this email' });

  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit code
  resetCodes.set(email.toLowerCase(), { code, expiresAt: Date.now() + 15 * 60 * 1000 }); // 15 min expiry

  // In production this would be emailed — for the hackathon we return it in the response
  res.json({
    message: 'Reset code generated',
    reset_code: code,
    hint: 'In production this would be emailed. Code expires in 15 minutes.',
    user_name: user.name,
  });
}));

router.post('/reset-password', ah(async (req, res) => {
  const { email, code, new_password } = req.body;
  if (!email || !code || !new_password) return res.status(400).json({ error: 'email, code, and new_password are required' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const entry = resetCodes.get(email.toLowerCase());
  if (!entry) return res.status(400).json({ error: 'No reset code found for this email. Request a new one.' });
  if (Date.now() > entry.expiresAt) {
    resetCodes.delete(email.toLowerCase());
    return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
  }
  if (entry.code !== code) return res.status(400).json({ error: 'Invalid reset code' });

  const hash = bcrypt.hashSync(new_password, 10);
  await query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hash, email.toLowerCase()]);
  resetCodes.delete(email.toLowerCase());

  await logActivity(null, 'user.password_reset', 'user', null, `Password reset for ${email}`);
  res.json({ message: 'Password has been reset successfully. You can now sign in.' });
}));

export default router;
