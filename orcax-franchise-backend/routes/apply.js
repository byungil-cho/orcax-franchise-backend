const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// 스키마 정의
const ApplySchema = new mongoose.Schema({
  name: String,
  phone: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

// 모델 생성
const Apply = mongoose.model("Apply", ApplySchema);

// POST /apply
router.post("/apply", async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    const newApply = new Apply({ name, phone, message });
    await newApply.save();

    res.json({ message: "✅ 신청이 성공적으로 저장되었습니다." });
  } catch (err) {
    console.error("❌ 저장 실패:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;
