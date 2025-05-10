const express = require('express');
const multer = require('multer');
const router = express.Router();
const Application = require('../models/Application'); // 너 이거 따로 있어야 함

// multer 설정 – 파일 메모리에 저장 (디스크 저장 안 함)
const upload = multer({ storage: multer.memoryStorage() });

// POST: 가맹점 신청 데이터 저장
router.post('/', upload.single('file'), async (req, res) => {
  try {
    console.log('📨 신청서 도착:', req.body);
    console.log('📎 첨부파일:', req.file?.originalname);

    const {
      name,
      phone,
      biznum,
      region,
      address,
      type,
      message
    } = req.body;

    const newApplication = new Application({
      name,
      phone,
      biznum,
      region,
      address,
      type,
      message,
      uploadedFileName: req.file?.originalname || null
    });

    await newApplication.save();
    res.status(201).json({ message: '신청 완료!' });
  } catch (err) {
    console.error('❌ 저장 실패:', err);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

// GET: 모든 신청서 조회
router.get('/', async (req, res) => {
  try {
    const list = await Application.find();
    res.json(list);
  } catch (err) {
    console.error('❌ 조회 실패:', err);
    res.status(500).json({ error: '조회 실패' });
  }
});

module.exports = router;
