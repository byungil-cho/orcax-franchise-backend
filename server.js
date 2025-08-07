require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3070;

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
  console.error('❌ [오류] MONGODB_URL 환경변수 없음!');
  process.exit(1);
}

mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('몽고DB 연결 성공!'))
  .catch(err => { console.error('몽고DB 연결 실패:', err.message); process.exit(1); });

const envOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(origin => origin.trim())
  : ['https://byungil-cho.github.io'];

app.use(cors({ origin: envOrigins, credentials: true }));
app.use(express.json());

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
    const { kakaoId, nickname, name, storeName, phone, corpnum, region, address, type, note } = req.body;
    if (!kakaoId || !nickname || !name || !storeName || !phone) {
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

// **신청서 목록 불러오기 – 여기 반드시 정확히 라우트 만듦**
app.get('/api/apply', async (req, res) => {
  try {
    const list = await Franchise.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "DB 조회 실패" });
  }
});

app.listen(PORT, () => {
  console.log('OrcaX 가맹DB 서버 ON ::', PORT);
  console.log('CORS 허용 도메인:', envOrigins);
});
