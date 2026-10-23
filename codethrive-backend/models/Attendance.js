const { BaseModel } = require('./BaseModel');

class AttendanceModel extends BaseModel {
  constructor() {
    super('attendances', {
      employee: { table: 'employees', foreignKey: 'employee_id' }
    });
  }
}

module.exports = new AttendanceModel();
