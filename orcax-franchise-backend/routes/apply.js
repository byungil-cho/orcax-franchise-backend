const express = require("express");
const router = express.Router();
const multer = require("multer");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// 📁 업로드 폴더 자동 생성
const uploadFolder = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// 📸 multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// 🧾 Mongo 스키마
const ApplicationSchema = new mongoose.Schema({
  name: String,
  phone: String,
  biznum: String,
  region: String,
  address: String,
  type: String,
  message: String,
  file: String,
  submittedAt: { type: Date, default: Date.now },
});
const Application = mongoose.model("Application", ApplicationSchema);

// 📧 이메일 설정
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📨 신청서 처리
router.post("/apply", upload.single("file"), async (req, res) => {
  const data = req.body;
  const file = req.file;

  console.log("📥 신청 데이터:", data);
  console.log("📎 업로드 파일:", file);

  // 🔍 파일 누락 시 처리
  if (!file) {
    console.error("❌ 파일이 업로드되지 않았습니다.");
    return res.status(400).json({
      success: false,
      message: "파일이 업로드되지 않았습니다.",
    });
  }

  try {
    // 1. DB 저장
    const newApp = new Application({ ...data, file: file.filename });
    await newApp.save();

    // 2. 이메일 전송
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [process.env.EMAIL_USER, process.env.EMAIL_RECEIVER],
      subject: "📬 신규 가맹점 신청서 도착",
      text: `
        상호: ${data.name}
        연락처: ${data.phone}
        사업자등록번호: ${data.biznum}
        지역: ${data.region}
        주소: ${data.address}
        업종: ${data.type}
        비고: ${data.message}
      `,
      attachments: [
        {
          filename: file.originalname,
          path: path.join(uploadFolder, file.filename),
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "신청 완료! 범고래 감사 접수함!",
    });
  } catch (err) {
    console.error("❌ 서버 오류:", err.message);
    res.status(500).json({
      success: false,
      message: "서버 오류: " + err.message,
    });
  }
});

module.exports = router;


