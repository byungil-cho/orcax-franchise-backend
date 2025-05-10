const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const Application = require("../models/Application"); // MongoDB 모델

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/**
 * 📩 POST /api/apply
 * 가맹점 신청 처리 및 저장
 */
router.post("/", upload.single("file"), async (req, res) => {
  const { name, phone, corpnum, region, address, type, note } = req.body;
  const file = req.file;

  try {
    const newApp = new Application({
      name,
      phone,
      corpnum,
      region,
      address,
      type,
      note,
      fileUrl: file ? `/uploads/${file.filename}` : ""
    });

    await newApp.save();

    console.log("📦 가맹점 신청 도착:", {
      name,
      phone,
      corpnum,
      region,
      address,
      type,
      note,
      file: file?.filename
    });

    res.status(200).json({ message: "신청 저장 성공" });
  } catch (err) {
    console.error("❌ 저장 중 오류:", err.message);
    res.status(500).json({ error: "DB 저장 실패" });
  }
});

/**
 * 📋 GET /api/apply
 * 관리자용 신청 목록 전체 조회
 */
router.get("/", async (req, res) => {
  try {
    const allApplications = await Application.find().sort({ createdAt: -1 });
    res.status(200).json(allApplications);
  } catch (err) {
    console.error("❌ 조회 중 오류:", err.message);
    res.status(500).json({ error: "데이터 조회 실패" });
  }
});

module.exports = router;



