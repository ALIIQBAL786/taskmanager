const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'on_hold', 'completed', 'archived'],
      default: 'active',
    },
    dueDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Non-admin users can only see projects they own or are members of
projectSchema.statics.visibleTo = function (userId, role) {
  if (role === 'admin') return this.find();
  return this.find({ $or: [{ owner: userId }, { members: userId }] });
};

module.exports = mongoose.model('Project', projectSchema);
