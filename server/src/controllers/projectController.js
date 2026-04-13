const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/projects
exports.listProjects = async (req, res, next) => {
  try {
    const projects = await Project.visibleTo(req.user._id, req.user.role)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const { title, description, dueDate, members } = req.body;
    const project = await Project.create({
      title,
      description,
      dueDate,
      owner: req.user._id,
      members: members || [],
    });
    await project.populate('owner', 'name email');
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canAccess(req.user, project)) return res.status(403).json({ message: 'Forbidden' });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canModify(req.user, project)) return res.status(403).json({ message: 'Forbidden' });

    const allowed = ['title', 'description', 'status', 'dueDate', 'members'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) project[f] = req.body[f]; });

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    res.json(project);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canModify(req.user, project)) return res.status(403).json({ message: 'Forbidden' });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project and its tasks deleted' });
  } catch (err) {
    next(err);
  }
};

// Access helpers
const canAccess = (user, project) =>
  user.role === 'admin' ||
  project.owner._id.toString() === user._id.toString() ||
  project.members.some((m) => m._id?.toString() === user._id.toString());

const canModify = (user, project) =>
  user.role === 'admin' || project.owner.toString() === user._id.toString();
