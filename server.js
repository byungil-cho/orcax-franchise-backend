const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = 3070;

// ✅ 반드시 운영 DB 'orcax'로 연결!
// 몽고 Atlas일 경우 (주소/계정/비번 실서버용으로 교체)
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb+srv://[계정]:[비번]@[클러스터주소]/orcax?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('몽고DB 연결 성공 (orcax DB만 사용)!'))
  .catch(err => {
    console.error('몽고DB 연결 실패:', err);
    process.exit(1);
  });

// ⭐️ 깃허브 페이지만 CORS 허용
app.use(cors({
  origin: [
    'https://byungil-cho.github.io'
  ]
}));
app.use(express.json());

// -- 회원 (orcax.users) --
const UserSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String
});
const User = mongoose.model('User', UserSchema);

// -- 가맹점 (orcax.franchises) --
const FranchiseSchema = new mongoose.Schema({
  kakaoId: String,   // 신청자 카카오ID
  nickname: String,  // 신청자 닉네임
  name: String,      // 대표자명
  storeName: String, // 매장명
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

// -- 서버 상태 확인 --
app.get('/api/apply/status', (req, res) => {
  res.json({ status: "OK" });
});

// -- 가맹점 신청 (회원만 허용) --
app.post('/api/apply', async (req, res) => {
  try {
    const {
      kakaoId, nickname, name, storeName, phone, corpnum, region, address, type, note
    } = req.body;

    // 1. 카카오 회원 인증 필수
    if (!kakaoId || !nickname) {
      return res.status(401).json({ success: false, message: "로그인 후 이용해주세요" });
    }

    // 2. 실제 회원 여부 orcax.users에서 조회
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(401).json({ success: false, message: "회원 정보 없음(회원가입 필요)" });
    }

    // 3. 필수값 체크
    if (!name || !storeName || !phone) {
      return res.status(400).json({ success: false, message: "필수값 누락" });
    }

    // 4. 신청서 저장 (orcax.franchises만!)
    const appData = await Franchise.create({
      kakaoId, nickname, name, storeName, phone, corpnum, region, address, type, note, status: "신청"
    });

    res.json({ success: true, id: appData._id });
  } catch (e) {
    res.status(500).json({ success: false, message: "DB 저장 오류" });
  }
});

// -- 모든 가맹점 리스트 (관리자 용) --
app.get('/api/apply', async (req, res) => {
  const list = await Franchise.find().sort({ createdAt: -1 }); // orcax.franchises!
  res.json(list);
});

// -- 회원 등록 API (카카오 로그인 후 최초 1회) --
app.post('/api/me', async (req, res) => {
  const { kakaoId, nickname } = req.body;
  if (!kakaoId || !nickname) return res.status(400).json({ error: "필수값 누락" });

  let user = await User.findOne({ kakaoId });
  if (user) return res.json(user);

  user = await User.create({
    kakaoId,
    nickname
  });
  res.json(user);
});

app.listen(PORT, () => {
  console.log('OrcaX 운영DB(orcax) 서버 ON ::', PORT);
});
