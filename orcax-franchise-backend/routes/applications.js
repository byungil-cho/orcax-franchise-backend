const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// 파일 업로드 저장 경로 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post("/", upload.single("file"), (req, res) => {
  const { name, phone, corpnum, region, address, type, note } = req.body;
  const file = req.file;

  console.log("📩 가맹점 신청 도착:", {
    name, phone, corpnum, region, address, type, note,
    file: file?.filename
  });

  // 여기에서 DB 저장도 가능
  res.status(200).json({ message: "가맹점 신청 접수 완료" });
});

module.exports = router;

