const express = require('express');
const multer = require('multer');
const Application = require('../models/application');

const router = express.Router();
const upload = multer();

// ✅ 신청서 저장 API
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const newApp = new Application({
      ...req.body,
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            buffer: req.file.buffer,
            size: req.file.size
          }
        : null
    });

    await newApp.save();
    res.json({ message: "신청서 접수 완료!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류 발생!" });
  }
});

// ✅ 전체 신청서 불러오기 API
router.get('/', async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "신청서 조회 실패!" });
  }
});

module.exports = router;




