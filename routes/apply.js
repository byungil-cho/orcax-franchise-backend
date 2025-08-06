// routes/apply.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 간단한 Apply 모델 (스키마/필드 원하는대로 추가 가능)
const ApplySchema = new mongoose.Schema({
  owner: String,
  phone: String,
  biznum: String,
  region: String,
  addr: String,
  biztype: String,
  kakaoId: String,
  nickname: String,
  createdAt: { type: Date, default: Date.now }
});
const Apply = mongoose.models.Apply || mongoose.model('Apply', ApplySchema);

// 헬스체크 (GET)
router.get('/status', (req, res) => {
  res.json({ status: 'OK' });
});

// 신청서 제출 (POST)
router.post('/', async (req, res) => {
  try {
    const { owner, phone, biznum, region, addr, biztype, kakaoId, nickname } = req.body;
    if (!kakaoId || !nickname) return res.status(401).json({ success: false, message: "로그인 필요" });

    const newApply = new Apply({ owner, phone, biznum, region, addr, biztype, kakaoId, nickname });
    await newApply.save();

    res.json({ success: true, message: "신청 완료!" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB 오류' });
  }
});

// 관리자: 신청내역 전체 리스트 (GET)
router.get('/list', async (req, res) => {
  try {
    const applies = await Apply.find().sort({ createdAt: -1 });
    res.json(applies);
  } catch (err) {
    res.status(500).json({ success: false, message: '신청내역 불러오기 실패' });
  }
});

module.exports = router;
