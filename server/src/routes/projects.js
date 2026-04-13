const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const projectCtrl = require('../controllers/projectController');
const taskCtrl = require('../controllers/taskController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

router.use(authenticate);

const projectRules = [
  body('title').trim().notEmpty().isLength({ max: 120 }),
  body('description').optional().trim().isLength({ max: 1000 }),
];

router.get('/', projectCtrl.listProjects);
router.post('/', projectRules, validate, projectCtrl.createProject);
router.get('/:id', projectCtrl.getProject);
router.patch('/:id', projectCtrl.updateProject);
router.delete('/:id', projectCtrl.deleteProject);

// Nested task routes under /projects/:projectId/tasks
const taskRules = [
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'done']),
];

router.get('/:projectId/tasks', taskCtrl.listTasks);
router.post('/:projectId/tasks', taskRules, validate, taskCtrl.createTask);
router.get('/:projectId/tasks/:taskId', taskCtrl.getTask);
router.patch('/:projectId/tasks/:taskId', taskCtrl.updateTask);
router.delete('/:projectId/tasks/:taskId', taskCtrl.deleteTask);

module.exports = router;
