const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  name: String,
  phone: String,
  biznum: String,
  region: String,
  address: String,
  type: String,
  message: String,
  uploadedFileName: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', applicationSchema);
