// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const applyRouter = require('./routes/apply');

const app = express();
const PORT = process.env.PORT || 3070;

// 미들웨어
app.use(cors());
app.use(express.json());

// 몽고DB 연결 (Atlas 환경변수: MONGODB_URL로 고정)
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/orcax-franchise';

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공!');
})
.catch((err) => {
  console.error('❌ MongoDB 연결 실패:', err.message);
  process.exit(1); // 연결 실패시 서버 즉시 종료(옵션)
});

// 가맹점 신청 라우터 연결
app.use('/api/apply', applyRouter);

// ====== 메시지 전송 라우터 (메모리 저장 예시) ======
const messages = [];

app.post('/api/messages', (req, res) => {
  const { sender, content } = req.body;
  if (!sender || !content) {
    return res.status(400).json({ success: false, message: "필수값 누락" });
  }
  const newMsg = { sender, content, createdAt: new Date() };
  messages.push(newMsg);
  res.json({ success: true, message: "전송 성공", data: newMsg });
});

app.get('/api/messages', (req, res) => {
  res.json({ success: true, messages });
});
// ==========================================

// 서버 상태 확인 API
app.get('/api/apply/status', (req, res) => {
  res.json({ status: 'OK', db: mongoose.connection.readyState === 1 });
});

// 루트 접속 시 안내 메시지
app.get('/', (req, res) => {
  res.send('Franchise API Server (가맹점 & 메시지전송)');
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
