const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// GET /api/users  [admin]
exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map((u) => u.toPublic()));
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id  [admin or self]
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Non-admin can only view their own profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(user.toPublic());
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id  [admin or self]
exports.updateUser = async (req, res, next) => {
  try {
    const isSelf = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    const allowedFields = ['name'];
    if (isAdmin) allowedFields.push('role', 'isActive');

    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toPublic());
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id  [admin]
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await RefreshToken.deleteMany({ user: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};
