// server.js (몽고DB 완전 연동)
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = 3070;

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/orcax';

mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('몽고DB 연결 성공!'))
  .catch(err => {
    console.error('몽고DB 연결 실패:', err);
    process.exit(1);
  });

// ----- 스키마/모델 -----
const UserSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String,
  water: Number, fertilizer: Number, token: Number,
  potato: Number, barley: Number, seedPotato: Number, seedBarley: Number
});
const User = mongoose.model('User', UserSchema);

const FranchiseSchema = new mongoose.Schema({
  name: String, owner: String, phone: String,
  status: { type: String, default: "신청" },
  createdAt: { type: Date, default: Date.now }
});
const Franchise = mongoose.model('Franchise', FranchiseSchema);

const MessageSchema = new mongoose.Schema({
  nickname: String, message: String,
  ts: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

app.use(cors());
app.use(express.json());

// ---- [자산: 내 정보 불러오기 & 최초등록] ----
// POST /api/me : 최초등록 or 로그인
app.post('/api/me', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId || !nickname) return res.status(400).json({ error: "필수값 누락" });

  let user = await User.findOne({ kakaoId });
  if (user) return res.json(user); // 이미 있으면 그대로 반환

  user = await User.create({
    kakaoId, nickname,
    water: 10, fertilizer: 10, token: 100,
    potato: 5, barley: 3, seedPotato: 2, seedBarley: 1
  });
  res.json(user);
});

// GET /api/me : 내 정보 조회
app.get('/api/me', async (req, res) => {
  const kakaoId = req.headers['x-kakao-id'];
  if (!kakaoId) return res.status(400).json({ error: "kakaoId 필요" });
  let user = await User.findOne({ kakaoId });
  if (!user) return res.status(401).json({ error: "로그인 필요" });
  res.json(user);
});

// ---- [프랜차이즈] ----
app.get('/api/franchise', async (req, res) => {
  const list = await Franchise.find().sort({ createdAt: -1 });
  res.json(list);
});
app.post('/api/franchise', async (req, res) => {
  const { name, owner, phone } = req.body;
  if (!name || !owner || !phone)
    return res.status(400).json({ error: "필수값 누락" });
  const appData = await Franchise.create({ name, owner, phone });
  res.json({ ok: true, id: appData._id });
});

// ---- [채팅] ----
app.get('/api/messages', async (req, res) => {
  const msgs = await Message.find().sort({ ts: -1 }).limit(100);
  res.json(msgs.reverse());
});
app.post('/api/messages', async (req, res) => {
  const { nickname, message } = req.body;
  if (!nickname || !message) return res.status(400).json({ error: "닉네임/메시지 없음" });
  await Message.create({ nickname, message });
  res.json({ ok: true });
});
app.delete('/api/messages', async (req, res) => {
  await Message.deleteMany({});
  res.json({ ok: true });
});

// ---- [서버 상태] ----
app.get('/api/ping', (req, res) => res.json({ status: "OK" }));

app.listen(PORT, () => {
  console.log('OrcaX 프랜차이즈/채팅/자산 서버 ON ::', PORT);
});
