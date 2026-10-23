const { BaseModel } = require('./BaseModel');

class TimesheetModel extends BaseModel {
  constructor() {
    super('timesheets', {
      employee: { table: 'employees', foreignKey: 'employee_id' }
    });
  }
}

module.exports = new TimesheetModel();
