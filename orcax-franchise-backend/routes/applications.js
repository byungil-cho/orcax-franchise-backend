// routes/applications.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// POST /api/apply
router.post("/", upload.single("file"), (req, res) => {
  const { name, phone, corpnum, region, address, type, note } = req.body;
  const file = req.file;

  console.log("📦 신청 접수됨:", { name, phone, corpnum, region, address, type, note, file });

  // 여기서 DB 저장 로직이 가능
  res.status(200).json({ message: "신청 성공" });
});

module.exports = router;
