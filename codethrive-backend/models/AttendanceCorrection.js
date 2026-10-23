const { BaseModel } = require('./BaseModel');

class AttendanceCorrectionModel extends BaseModel {
  constructor() {
    super('attendance_corrections', {
      employee: { table: 'employees', foreignKey: 'employee_id' },
      approvedBy: { table: 'users', foreignKey: 'approved_by' }
    });
  }
}

module.exports = new AttendanceCorrectionModel();
