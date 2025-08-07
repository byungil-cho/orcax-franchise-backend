const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 3070;

app.use(cors());
app.use(bodyParser.json());

// ✅ 몽고DB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true, useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', () => console.log("❌ MongoDB 연결 실패!"));
db.once('open', () => console.log("✅ MongoDB 연결 성공!"));

const messageSchema = new mongoose.Schema({
  nickname: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// 상태 확인용 (index-10.html의 checkServer용)
app.get('/api/messages/status', (req, res) => {
  res.json({ status: 'OK' });
});

// 메시지 전체 조회
app.get('/api/messages', async (req, res) => {
  const messages = await Message.find({}).sort({createdAt:1}).limit(100);
  res.json(messages);
});

// 메시지 추가
app.post('/api/messages', async (req, res) => {
  const { nickname, message } = req.body;
  if (!nickname || !message) return res.status(400).json({ error: "닉네임/메시지 없음" });
  await Message.create({ nickname, message });
  res.json({ ok: true });
});

// 전체 메시지 삭제
app.delete('/api/messages', async (req, res) => {
  await Message.deleteMany({});
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`OrcaX 채팅 서버 ON :: ${PORT}`);
});
