const express = require('express');
const router = express.Router();
const taskCtrl = require('../controllers/taskController');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// Cross-project: tasks assigned to me
router.get('/my', taskCtrl.myTasks);

module.exports = router;
