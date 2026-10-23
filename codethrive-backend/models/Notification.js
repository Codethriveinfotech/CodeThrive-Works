const { BaseModel } = require('./BaseModel');

class NotificationModel extends BaseModel {
  constructor() {
    super('notifications', {
      recipient: { table: 'users', foreignKey: 'recipient_id' }
    });
  }
}

module.exports = new NotificationModel();
