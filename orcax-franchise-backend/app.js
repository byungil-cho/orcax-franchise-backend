const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB 연결 성공"))
  .catch(err => console.error("❌ MongoDB 연결 실패:", err));

// 라우터 연결
const applyRoutes = require('./routes/apply');
app.use('/api/applications', applyRoutes);

// 기본 루트
app.get('/', (req, res) => {
  res.send("OrcaX 백엔드 작동 중 🐳");
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

