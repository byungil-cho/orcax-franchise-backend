const express = require('express');
const router = express.Router();
const Application = require('../models/Application'); // 모델 경로 확인

// GET /api/applications - 모든 신청서 데이터 조회
router.get('/', async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ message: '서버 오류로 데이터를 불러올 수 없습니다.' });
  }
});

module.exports = router;
