const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// Helper — hash a token string before persisting
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Helper — parse JWT expiry string to a Date
const parseDuration = (str) => {
  const map = { s: 1, m: 60, h: 3600, d: 86400 };
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error('Invalid duration format');
  return new Date(Date.now() + parseInt(match[1], 10) * map[match[2]] * 1000);
};

const issueTokens = async (user) => {
  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await RefreshToken.create({
    token: hashToken(refreshToken),
    user: user._id,
    expiresAt: parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
  });

  return { accessToken, refreshToken };
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    // Only allow setting admin role if there are no users yet (first-run bootstrap)
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : 'user';

    const user = await User.create({ name, email, password, role: assignedRole });
    const tokens = await issueTokens(user);

    res.status(201).json({ user: user.toPublic(), ...tokens });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const tokens = await issueTokens(user);
    res.json({ user: user.toPublic(), ...tokens });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
// Implements token rotation: old refresh token is revoked, a new pair is issued.
// If a revoked token is presented (theft detection), ALL tokens for that user are revoked.
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const hashed = hashToken(refreshToken);
    const stored = await RefreshToken.findOne({ token: hashed });

    if (!stored) {
      return res.status(401).json({ message: 'Refresh token not recognised' });
    }

    // Theft detection — token already revoked means the family has been compromised
    if (stored.isRevoked) {
      await RefreshToken.updateMany({ user: stored.user }, { isRevoked: true });
      return res.status(401).json({ message: 'Token reuse detected — all sessions revoked' });
    }

    // Revoke the current token and issue a new pair
    const newRefreshToken = signRefreshToken({ sub: decoded.sub, role: decoded.role });
    stored.isRevoked = true;
    stored.replacedByToken = hashToken(newRefreshToken);
    await stored.save();

    const user = await require('../models/User').findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const expiresAt = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    await RefreshToken.create({ token: hashToken(newRefreshToken), user: user._id, expiresAt });

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: hashToken(refreshToken) },
        { isRevoked: true }
      );
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  res.json({ user: req.user.toPublic() });
};
