const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  content: { type: String, required: true },
  color: { type: String, default: '#333' },
  type: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
