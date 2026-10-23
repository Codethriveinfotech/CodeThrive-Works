const { BaseModel } = require('./BaseModel');

class LeaveRequestModel extends BaseModel {
  constructor() {
    super('leave_requests', {
      employee: { table: 'employees', foreignKey: 'employee_id' },
      approvedBy: { table: 'users', foreignKey: 'approved_by' }
    });
  }
}

module.exports = new LeaveRequestModel();
