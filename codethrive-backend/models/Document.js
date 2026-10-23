const { BaseModel } = require('./BaseModel');

class DocumentModel extends BaseModel {
  constructor() {
    super('documents', {
      owner: { table: 'employees', foreignKey: 'owner_id' },
      uploadedBy: { table: 'users', foreignKey: 'uploaded_by_id' }
    });
  }
}

module.exports = new DocumentModel();
