const { BaseModel, Document } = require('./BaseModel');
const bcrypt = require('bcryptjs');

class UserDocument extends Document {
  async matchPassword(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
  }
}

class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  createDocument(data) {
    return new UserDocument(data, this);
  }

  async create(data) {
    const dataCopy = { ...data };
    if (dataCopy.password && !dataCopy.password.startsWith('$2a$') && !dataCopy.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      dataCopy.password = await bcrypt.hash(dataCopy.password, salt);
    }
    return await super.create(dataCopy);
  }

  async saveDocument(doc) {
    if (doc.password && !doc.password.startsWith('$2a$') && !doc.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      doc.password = await bcrypt.hash(doc.password, salt);
    }
    return await super.saveDocument(doc);
  }
}

module.exports = new UserModel();
