const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = 3070;

// ✅ Atlas에서 제공한 표준 URI(연결문) 반드시 사용!
// 예시: (아래 3줄 중 하나만 사용, 실제 값으로 교체)
const MONGODB_URL = process.env.MONGODB_URL
  || 'mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/orcax?retryWrites=true&w=majority';
// .env 쓸 때도 반드시 공백·쌍따옴표·줄바꿈 없는 정확한 한 줄!

mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('몽고DB 연결 성공! (orcax DB 사용)'))
  .catch(err => {
    console.error('몽고DB 연결 실패:', err.message);
    process.exit(1);
  });

// 운영 깃허브 페이지만 허용
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

app.get('/api/apply/status', (req, res) => {
  res.json({ status: "OK" });
});

app.post('/api/apply', async (req, res) => {
  try {
    const {
      kakaoId, nickname, name, storeName, phone, corpnum, region, address, type, note
    } = req.body;

    if (!kakaoId || !nickname) {
      return res.status(401).json({ success: false, message: "로그인 후 이용해주세요" });
    }
    const user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(401).json({ success: false, message: "회원 정보 없음(회원가입 필요)" });
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

app.get('/api/apply', async (req, res) => {
  const list = await Franchise.find().sort({ createdAt: -1 });
  res.json(list);
});

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
