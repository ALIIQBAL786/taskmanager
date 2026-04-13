const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const registerRules = [
  body('name').trim().notEmpty().isLength({ max: 80 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
];

router.post('/register', registerRules, validate, auth.register);
router.post('/login', loginRules, validate, auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', authenticate, auth.me);

module.exports = router;
