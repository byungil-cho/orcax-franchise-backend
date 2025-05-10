const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  name: String,
  phone: String,
  biznum: String,
  region: String,
  address: String,
  type: String,
  message: String,
  file: {
    originalname: String,
    mimetype: String,
    buffer: Buffer,
    size: Number
  }
}, {
  timestamps: true // createdAt, updatedAt 자동 생성
});

module.exports = mongoose.model('Application', applicationSchema);
