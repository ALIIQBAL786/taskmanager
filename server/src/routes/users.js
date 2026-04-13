const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', authorize('admin'), userCtrl.listUsers);
router.get('/:id', userCtrl.getUser);
router.patch('/:id', [body('name').optional().trim().notEmpty()], validate, userCtrl.updateUser);
router.delete('/:id', authorize('admin'), userCtrl.deleteUser);

module.exports = router;
