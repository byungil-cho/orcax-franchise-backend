const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 (업로드된 파일 서빙)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB 연결 성공"))
  .catch(err => console.error("❌ MongoDB 연결 실패:", err));

// 📌 라우터 연결
const applyRoute = require("./routes/apply");
const manageRoute = require("./routes/manage");

app.use("/", applyRoute);
app.use("/", manageRoute);

// 기본 응답
app.get("/", (req, res) => {
  res.send("OrcaX 가맹점 신청 서버 실행 중입니다.");
});

// 서버 시작
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 at http://localhost:${PORT}`);
});

