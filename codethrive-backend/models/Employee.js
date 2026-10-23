const { BaseModel } = require('./BaseModel');

class EmployeeModel extends BaseModel {
  constructor() {
    super('employees', {
      user: { table: 'users', foreignKey: 'user_id' },
      reportingManager: { table: 'employees', foreignKey: 'reporting_manager_id' }
    });
  }

  async create(data) {
    const dataCopy = { ...data };
    const year = new Date().getFullYear();

    if (!dataCopy.employeeId && !dataCopy.employee_id) {
      const count = await this.countDocuments();
      dataCopy.employeeId = `CTI-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    const checkId = dataCopy.employeeId || dataCopy.employee_id;
    if (checkId) {
      const exists = await this.findOne({ employeeId: checkId });
      if (exists) {
        dataCopy.employeeId = `${checkId}-${Math.floor(100 + Math.random() * 900)}`;
      }
    }

    return await super.create(dataCopy);
  }
}

module.exports = new EmployeeModel();
