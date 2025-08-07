const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const applyRouter = require('./routes/apply');

const app = express();
const PORT = process.env.PORT || 3070;

app.use(cors());
app.use(express.json());

// 몽고DB 연결 (환경변수)
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
  process.exit(1);
});

// 프랜차이즈 라우터
app.use('/api/apply', applyRouter);

// ====== 실시간 입장자 관리(메모리) ======
const onlineUsers = new Set();

app.post('/api/online-users', (req, res) => {
  const { nickname } = req.body;
  if (nickname) onlineUsers.add(nickname);
  res.json({ success: true, users: Array.from(onlineUsers) });
});

app.get('/api/online-users', (req, res) => {
  res.json({ users: Array.from(onlineUsers) });
});

app.post('/api/online-users/exit', (req, res) => {
  const { nickname } = req.body;
  onlineUsers.delete(nickname);
  res.json({ success: true });
});

// ====== 메시지 전송(메모리) ======
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

// ====== 전체 메시지 삭제 ======
app.delete('/api/messages', (req, res) => {
  messages.length = 0;
  res.json({ success: true, message: "모든 메시지 삭제됨" });
});

// ====== 서버 상태 ======
app.get('/api/apply/status', (req, res) => {
  res.json({ status: 'OK', db: mongoose.connection.readyState === 1 });
});

// 루트 안내
app.get('/', (req, res) => {
  res.send('Franchise API Server (가맹점 + 메시지 + 접속자 관리 + 전체삭제)');
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
