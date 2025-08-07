const mongoose = require('mongoose');

const ApplySchema = new mongoose.Schema({
    name: String,
    storeName: String,
    phone: String,
    corpnum: String,
    region: String,
    address: String,
    type: String,
    note: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Apply', ApplySchema);
