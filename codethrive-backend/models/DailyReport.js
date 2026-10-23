const { BaseModel } = require('./BaseModel');

class DailyReportModel extends BaseModel {
  constructor() {
    super('daily_reports', {
      employee: { table: 'employees', foreignKey: 'employee_id' }
    });
  }
}

module.exports = new DailyReportModel();
