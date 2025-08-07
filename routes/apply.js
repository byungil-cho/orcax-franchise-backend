// routes/apply.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 간단한 스키마
const ApplySchema = new mongoose.Schema({
  name: String,
  phone: String,
  storeName: String,
  createdAt: { type: Date, default: Date.now }
});

const Apply = mongoose.model('Apply', ApplySchema);

// 가맹점 신청 (POST)
router.post('/', async (req, res) => {
  try {
    const { name, phone, storeName } = req.body;
    if (!name || !phone || !storeName) {
      return res.status(400).json({ success: false, message: '필수 항목 누락' });
    }
    const newApply = new Apply({ name, phone, storeName });
    await newApply.save();
    res.json({ success: true, message: '신청 완료!' });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 에러', error: err.message });
  }
});

// 신청 내역 전체 조회 (관리자용, GET)
router.get('/all', async (req, res) => {
  try {
    const all = await Apply.find().sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    res.status(500).json({ success: false, message: '조회 실패', error: err.message });
  }
});

module.exports = router;
