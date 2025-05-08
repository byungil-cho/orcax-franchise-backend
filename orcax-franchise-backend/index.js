const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3030;

// Middleware
app.use(cors());
app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
  res.send('🚀 OrcaX 백엔드 살아있음');
});

// 신청서 제출 라우트
app.post('/apply', (req, res) => {
  console.log("📦 신청서 도착:", req.body);
  res.json({ message: "신청 완료! 범고래 감자 접수함!" });
});

// Mongo 연결 후 서버 리슨
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('🟢 Mongo 연결 성공');
    app.listen(port, () => {
      console.log(`🛰️ 서버 대기 중 → 포트 ${port}`);
    });
  })
  .catch((err) => {
    console.error('🔴 Mongo 연결 실패:', err);
  });
