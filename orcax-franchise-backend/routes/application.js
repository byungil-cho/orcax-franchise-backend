const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  biznum: { type: String }, // 사업자등록번호
  region: { type: String },
  address: { type: String },
  type: { type: String },
  message: { type: String },
  file: {
    originalname: String,
    mimetype: String,
    buffer: Buffer,
    size: Number
  }
}, {
  timestamps: true // createdAt, updatedAt 자동 추가됨
});

module.exports = mongoose.model('Application', applicationSchema);
