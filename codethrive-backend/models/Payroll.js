const { BaseModel } = require('./BaseModel');

class PayrollModel extends BaseModel {
  constructor() {
    super('payrolls', {
      employee: { table: 'employees', foreignKey: 'employee_id' }
    });
  }
}

module.exports = new PayrollModel();
