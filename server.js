// server.js (통합 완성본)
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 3070;

// ===== Mongo 연결 =====
const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGODB_URI;
if (!MONGODB_URL) {
  console.error('❌ [오류] MONGODB_URL 환경변수 없음!');
  process.exit(1);
}
mongoose
  .connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('몽고DB 연결 성공!'))
  .catch(err => { console.error('몽고DB 연결 실패:', err.message); process.exit(1); });

// ===== CORS =====
const envOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(origin => origin.trim())
  : ['https://byungil-cho.github.io'];
app.use(cors({ origin: envOrigins, credentials: true }));

app.use(express.json());

// ===== (기존) 가맹 신청 스키마/라우트 =====
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

// 상태 체크 (기존)
app.get('/api/apply/status', (req, res) => {
  res.json({ status: "OK" });
});

// 신청 등록 (기존)
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

// 신청 목록 (기존)
app.get('/api/apply', async (req, res) => {
  try {
    const list = await Franchise.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "DB 조회 실패" });
  }
});

// ===== (추가) 공용 스키마: messages(채팅) + Presence =====
const MessageSchema = new mongoose.Schema({
  kakaoId:   { type: String, index: true },
  nickname:  { type: String, required: true },
  message:   { type: String, required: true },
  ts:        { type: Number, default: () => Date.now(), index: true }
}, { collection: 'messages' });

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

// 메모리 기반 접속자 목록(간단 구현)
const online = new Set();

// ===== (추가) 동일 라우트를 여러 prefix에 등록하는 헬퍼 =====
function registerRoutes(prefix) {
  const p = (path) => `${prefix}${path.startsWith('/') ? path : `/${path}`}`;

  // 상태
  app.get(p('/status'), (req,res)=> res.json({ status:'OK' }));

  // 자산(임시 응답) — 실제 스키마로 교체 가능
  app.post(p('/me'), (req,res)=>{
    const { nickname } = req.body || {};
    res.json({
      nickname: nickname || '손님',
      water: 10, fertilizer: 3, token: 0,
      potato: 0, barley: 0, seedPotato: 0, seedBarley: 0
    });
  });

  // 채팅 목록
  app.get(p('/chat'), async (req,res)=>{
    const docs = await Message.find({}, { _id:0, __v:0 })
      .sort({ ts: 1 })
      .limit(200)
      .lean();
    res.json(docs);
  });
  // 별칭
  app.get(p('/chat/list'), async (req,res)=>{
    const docs = await Message.find({}, { _id:0, __v:0 })
      .sort({ ts: 1 })
      .limit(200)
      .lean();
    res.json(docs);
  });

  // 채팅 전송
  app.post(p('/chat'), async (req,res)=>{
    const { kakaoId, nickname, message } = req.body || {};
    if (!nickname || !message) return res.status(400).json({ error:'nickname, message required' });
    await Message.create({ kakaoId, nickname, message });
    res.json({ ok:true });
  });
  // 별칭
  app.post(p('/chat/send'), async (req,res)=>{
    const { kakaoId, nickname, message } = req.body || {};
    if (!nickname || !message) return res.status(400).json({ error:'nickname, message required' });
    await Message.create({ kakaoId, nickname, message });
    res.json({ ok:true });
  });

  // 전체 삭제(관리용)
  app.delete(p('/chat/clear'), async (req,res)=>{
    await Message.deleteMany({});
    res.json({ ok:true });
  });
  app.post(p('/chat/clear'), async (req,res)=>{
    await Message.deleteMany({});
    res.json({ ok:true });
  });

  // Presence
  app.post(p('/presence/join'), (req,res)=>{
    const { nickname } = req.body || {};
    if (nickname) online.add(nickname);
    res.json({ ok:true, joiners:[...online] });
  });
  app.delete(p('/presence/leave'), (req,res)=>{
    const { nickname } = req.body || {};
    if (nickname) online.delete(nickname);
    res.json({ ok:true, joiners:[...online] });
  });

  // 별칭
  app.post(p('/chat/join'), (req,res)=>{
    const { nickname } = req.body || {};
    if (nickname) online.add(nickname);
    res.json({ ok:true, joiners:[...online] });
  });
  app.post(p('/chat/leave'), (req,res)=>{
    const { nickname } = req.body || {};
    if (nickname) online.delete(nickname);
    res.json({ ok:true, joiners:[...online] });
  });

  // 목록
  app.get(p('/presence/list'), (req,res)=> res.json({ joiners:[...online] }));
  app.get(p('/chat/joiners'), (req,res)=> res.json({ joiners:[...online] }));
}

// 프론트 자동탐색에 맞춰 3개 prefix 모두 지원
registerRoutes('/api/apply');
registerRoutes('/api');
registerRoutes('');

// ===== 서버 기동 =====
app.listen(PORT, () => {
  console.log('OrcaX 가맹DB 서버 ON ::', PORT);
  console.log('CORS 허용 도메인:', envOrigins);
});
