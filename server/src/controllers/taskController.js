const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper — verify user can access the project
const assertProjectAccess = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  const isMember =
    user.role === 'admin' ||
    project.owner.toString() === user._id.toString() ||
    project.members.some((m) => m.toString() === user._id.toString());
  if (!isMember) return { error: 'Forbidden', status: 403 };
  return { project };
};

// GET /api/projects/:projectId/tasks
exports.listTasks = async (req, res, next) => {
  try {
    const { error, status } = await assertProjectAccess(req.params.projectId, req.user);
    if (error) return res.status(status).json({ message: error });

    const filter = { project: req.params.projectId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignee) filter.assignee = req.query.assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { error, status } = await assertProjectAccess(req.params.projectId, req.user);
    if (error) return res.status(status).json({ message: error });

    const { title, description, assignee, priority, dueDate, tags } = req.body;
    const task = await Task.create({
      title,
      description,
      assignee,
      priority,
      dueDate,
      tags,
      project: req.params.projectId,
      createdBy: req.user._id,
    });
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/tasks/:taskId
exports.getTask = async (req, res, next) => {
  try {
    const { error, status } = await assertProjectAccess(req.params.projectId, req.user);
    if (error) return res.status(status).json({ message: error });

    const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:projectId/tasks/:taskId
exports.updateTask = async (req, res, next) => {
  try {
    const { error, status } = await assertProjectAccess(req.params.projectId, req.user);
    if (error) return res.status(status).json({ message: error });

    const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const allowed = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'tags'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) task[f] = req.body[f]; });

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/tasks/:taskId
exports.deleteTask = async (req, res, next) => {
  try {
    const { error, status } = await assertProjectAccess(req.params.projectId, req.user);
    if (error) return res.status(status).json({ message: error });

    const task = await Task.findOneAndDelete({ _id: req.params.taskId, project: req.params.projectId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/my  — tasks assigned to the current user across all projects
exports.myTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'title status')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};
