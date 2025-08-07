const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = 3070;

// 몽고DB 주소 (환경변수 또는 기본)
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/orcax';

mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('몽고DB 연결 성공!'))
  .catch(err => {
    console.error('몽고DB 연결 실패:', err);
    process.exit(1);
  });

// [유저 자산 모델]
const UserSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String,
  water: Number,
  fertilizer: Number,
  token: Number,
  potato: Number,
  barley: Number,
  seedPotato: Number,
  seedBarley: Number,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

app.use(cors());
app.use(express.json());

// 1. 최초 로그인/회원 등록 (카카오 로그인 후)
app.post('/api/me', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId || !nickname) return res.status(400).json({ error: "필수값 누락" });

  let user = await User.findOne({ kakaoId });
  if (user) return res.json(user);

  user = await User.create({
    kakaoId,
    nickname,
    water: 10, fertilizer: 10, token: 100,
    potato: 5, barley: 3, seedPotato: 2, seedBarley: 1
  });
  res.json(user);
});

// 2. 내 정보/자산 조회
app.get('/api/me', async (req, res) => {
  const kakaoId = req.headers['x-kakao-id'];
  if (!kakaoId) return res.status(400).json({ error: "kakaoId 필요" });
  let user = await User.findOne({ kakaoId });
  if (!user) return res.status(401).json({ error: "로그인 필요" });
  res.json(user);
});

// 3. 상태 체크
app.get('/api/ping', (req, res) => res.json({ status: "OK" }));

app.listen(PORT, () => {
  console.log(`몽고DB 연동 OrcaX 서버 ON :: ${PORT}`);
});
