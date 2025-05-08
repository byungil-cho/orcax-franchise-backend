const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 👉 /apply 라우트 연결
const applyRoute = require("./경로/apply"); // 실제 경로 맞춰주세요
app.use(applyRoute);

// 몽고 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB 연결 성공"))
  .catch(err => console.error("❌ MongoDB 연결 실패:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 at 포트 ${PORT}`);
});
