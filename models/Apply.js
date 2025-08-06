const mongoose = require('mongoose');

const ApplySchema = new mongoose.Schema({
    name: String,
    phone: String,
    bizNo: String,
    region: String,
    address: String,
    category: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Apply', ApplySchema);
