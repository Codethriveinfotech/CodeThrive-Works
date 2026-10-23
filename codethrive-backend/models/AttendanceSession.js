const { BaseModel } = require('./BaseModel');

class AttendanceSessionModel extends BaseModel {
  constructor() {
    super('attendance_sessions', {
      attendanceId: { table: 'attendances', foreignKey: 'attendance_id' },
      employee: { table: 'employees', foreignKey: 'employee_id' }
    });
  }
}

module.exports = new AttendanceSessionModel();
