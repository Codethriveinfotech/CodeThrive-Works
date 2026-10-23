const { BaseModel } = require('./BaseModel');

class TaskActivityModel extends BaseModel {
  constructor() {
    super('task_activities', {
      task: { table: 'tasks', foreignKey: 'task_id' },
      user: { table: 'users', foreignKey: 'user_id' }
    });
  }
}

module.exports = new TaskActivityModel();
