const express = require('express');
const router = express.Router();
const Apply = require('../models/Apply');

router.post('/', async (req, res) => {
  try {
    const { name, phone, storeName, corpnum, region, address, type, note } = req.body;
    if (!name || !phone || !storeName) {
      return res.status(400).json({ success: false, message: '필수 항목 누락' });
    }
    const newApply = new Apply({ name, phone, storeName, corpnum, region, address, type, note });
    await newApply.save();
    res.json({ success: true, message: '신청 완료!' });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 에러', error: err.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const all = await Apply.find().sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    res.status(500).json({ success: false, message: '조회 실패', error: err.message });
  }
});

module.exports = router;
