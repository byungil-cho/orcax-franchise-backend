const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 라우터 연결
app.use("/api/apply", require("./routes/applications"));

// 기본 응답
app.get("/", (req, res) => {
  res.send("🚀 OrcaX 백엔드 살아있음");
});

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Mongo 연결 성공");
}).catch(err => {
  console.error("❌ Mongo 연결 실패:", err.message);
});

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌐 서버 실행 중: 포트 ${PORT}`);
});


