const { BaseModel } = require('./BaseModel');

class SupportTicketModel extends BaseModel {
  constructor() {
    super('support_tickets', {
      employee: { table: 'employees', foreignKey: 'employee_id' },
      assignedTo: { table: 'users', foreignKey: 'assigned_to_id' }
    });
  }
}

module.exports = new SupportTicketModel();
