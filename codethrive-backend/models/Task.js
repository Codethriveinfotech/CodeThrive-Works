const { BaseModel } = require('./BaseModel');

class TaskModel extends BaseModel {
  constructor() {
    super('tasks', {
      assignedTo: { table: 'employees', foreignKey: 'assigned_to_id' },
      assignedBy: { table: 'users', foreignKey: 'assigned_by_id' }
    });
  }
}

module.exports = new TaskModel();
