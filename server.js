const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3070;

// [1] MongoDB 연결
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/orcax';
mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('몽고DB 연결 성공!'))
  .catch(err => {
    console.error('몽고DB 연결 실패:', err);
    process.exit(1);
  });

// [2] 몽고DB 스키마 및 모델 정의
const UserSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potato: Number,
  barley: Number,
  seedPotato: Number,
  seedBarley: Number
});
const User = mongoose.model('User', UserSchema);

const FranchiseSchema = new mongoose.Schema({
  name: String,
  owner: String,
  phone: String,
  status: { type: String, default: "신청" },
  createdAt: { type: Date, default: Date.now }
});
const Franchise = mongoose.model('Franchise', FranchiseSchema);

const MessageSchema = new mongoose.Schema({
  nickname: String,
  message: String,
  ts: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

app.use(cors());
app.use(express.json());

// ────────────── 1. 자산 API ──────────────
// 회원 자산 불러오기
app.get('/api/me', async (req, res) => {
  const kakaoId = req.headers['x-kakao-id'];
  if (!kakaoId) return res.status(400).json({ error: "kakaoId 필요" });

  let user = await User.findOne({ kakaoId });
  if (!user) return res.status(401).json({ error: "로그인 필요" });

  res.json(user);
});

// 회원 신규 생성 (최초 로그인 시 자산 지급)
app.post('/api/me', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId || !nickname) return res.status(400).json({ error: "필수값 누락" });

  let user = await User.findOne({ kakaoId });
  if (user) return res.json(user);

  user = await User.create({
    kakaoId,
    nickname,
    water: 10,
    fertilizer: 10,
    token: 100,
    potato: 5,
    barley: 3,
    seedPotato: 2,
    seedBarley: 1
  });
  res.json(user);
});

// ────────────── 2. 프랜차이즈(가맹점) API ──────────────
// 전체 신청 리스트 조회
app.get('/api/franchise', async (req, res) => {
  const list = await Franchise.find().sort({ createdAt: -1 });
  res.json(list);
});

// 신규 신청
app.post('/api/franchise', async (req, res) => {
  const { name, owner, phone } = req.body;
  if (!name || !owner || !phone)
    return res.status(400).json({ error: "필수값 누락" });
  const appData = await Franchise.create({ name, owner, phone });
  res.json({ ok: true, id: appData._id });
});

// ────────────── 3. 채팅 메시지 API ──────────────
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

// ────────────── 4. 상태 체크(서버 alive) ──────────────
app.get('/api/ping', (req, res) => res.json({ status: "OK" }));

app.listen(PORT, () => {
  console.log('OrcaX 프랜차이즈/채팅/자산 서버 ON ::', PORT);
});
