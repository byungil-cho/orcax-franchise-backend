const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = 3070;

// 1. 환경변수에서만 MongoDB URI 사용 (하드코딩 완전 제거)
const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
  console.error('❌ [오류] MONGODB_URL 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

// 2. Atlas 연결 (실패시 에러 메시지 명확 출력)
mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('몽고DB 연결 성공! (orcax DB 사용)'))
  .catch(err => {
    console.error('몽고DB 연결 실패:', err.message);
    process.exit(1);
  });

// 3. CORS는 오직 깃허브에서만 허용
app.use(cors({
  origin: ['https://byungil-cho.github.io'],
  credentials: true
}));
app.use(express.json());

// 4. 스키마(orcax DB 내에서만)
const UserSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String,
  email: String,
  orcx: Number,
  seedPotato: Number,
  seedBarley: Number,
  water: Number,
  fertilizer: Number,
  growth: Object,
  storage: Object,
  products: Object
});
const User = mongoose.model('User', UserSchema);

const FranchiseSchema = new mongoose.Schema({
  kakaoId: String,
  nickname: String,
  name: String,
  storeName: String,
  phone: String,
  corpnum: String,
  region: String,
  address: String,
  type: String,
  note: String,
  status: { type: String, default: "신청" },
  createdAt: { type: Date, default: Date.now }
});
const Franchise = mongoose.model('Franchise', FranchiseSchema);

// 5. 상태확인
app.get('/api/apply/status', (req, res) => {
  res.json({ status: "OK" });
});

// 6. 가맹점 신청 API
app.post('/api/apply', async (req, res) => {
  try {
    const {
      kakaoId, nickname, name, storeName, phone, corpnum, region, address, type, note
    } = req.body;
    if (!kakaoId || !nickname) {
      return res.status(401).json({ success: false, message: "로그인 후 이용" });
    }
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(401).json({ success: false, message: "회원 정보 없음" });
    }
    if (!name || !storeName || !phone) {
      return res.status(400).json({ success: false, message: "필수값 누락" });
    }
    const appData = await Franchise.create({
      kakaoId, nickname, name, storeName, phone, corpnum, region, address, type, note, status: "신청"
    });
    res.json({ success: true, id: appData._id });
  } catch (e) {
    res.status(500).json({ success: false, message: "DB 저장 오류" });
  }
});

// 7. 가맹점 목록 API
app.get('/api/apply', async (req, res) => {
  const list = await Franchise.find().sort({ createdAt: -1 });
  res.json(list);
});

// 8. 회원 등록(로그인)
app.post('/api/me', async (req, res) => {
  const { kakaoId, nickname, email } = req.body;
  if (!kakaoId || !nickname) return res.status(400).json({ error: "필수값 누락" });
  let user = await User.findOne({ kakaoId });
  if (user) return res.json(user);
  user = await User.create({
    kakaoId,
    nickname,
    email
  });
  res.json(user);
});

app.listen(PORT, () => {
  console.log('OrcaX 운영DB(orcax) 서버 ON ::', PORT);
});
