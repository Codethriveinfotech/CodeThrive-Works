const { BaseModel } = require('./BaseModel');

class MeetingModel extends BaseModel {
  constructor() {
    super('meetings', {
      organizer: { table: 'users', foreignKey: 'organizer_id' }
    });
  }
}

module.exports = new MeetingModel();
