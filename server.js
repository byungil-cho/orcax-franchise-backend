// server.js — OrcaX 통합본 (users 컬렉션 직조회 버전)
// ENV: MONGODB_URL, (optional) DB_NAME, CLIENT_ORIGIN, PORT
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 3070;

/* ============ Mongo 연결 ============ */
const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGODB_URI;
const DB_NAME     = process.env.DB_NAME || 'orcax';
if (!MONGODB_URL) {
  console.error('❌ MONGODB_URL 환경변수가 필요합니다.');
  process.exit(1);
}
mongoose
  .connect(MONGODB_URL, { dbName: DB_NAME, useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected:', DB_NAME))
  .catch(err => { console.error('❌ MongoDB connect error:', err.message); process.exit(1); });

/* ============ CORS ============ */
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(s=>s.trim())
  : ['https://byungil-cho.github.io']
);
app.use(cors({
  origin: (origin, cb)=> cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  credentials: true
}));
app.use(express.json());

/* ============ 스키마 ============ */
// 가맹 신청
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
  status: { type: String, default: '신청' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'applies' });
const Franchise = mongoose.models.Franchise || mongoose.model('Franchise', FranchiseSchema);

// 채팅
const MessageSchema = new mongoose.Schema({
  kakaoId:  { type:String, index:true },
  nickname: { type:String, required:true },
  message:  { type:String, required:true },
  ts:       { type:Number, default:()=>Date.now(), index:true }
}, { collection:'messages' });
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

// 사용자(자산 저장되는 컬렉션)
const UserSchema = new mongoose.Schema({
  kakaoId:    { type:String, unique:true, index:true },
  nickname:   { type:String, index:true },
  email:      { type:String },
  // 기본 자산
  water:      { type:Number, default:0 },
  fertilizer: { type:Number, default:0 },
  token:      { type:Number, default:0 }, // 일부 계정은 orcx 필드 사용 → 아래에서 매핑함
  potato:     { type:Number, default:0 },
  barley:     { type:Number, default:0 },
  // 씨앗/창고 등
  seedPotato: { type:Number, default:0 },
  seedBarley: { type:Number, default:0 },
  storage:    { type:Object, default:{} }, // { gamja, bori, ... }
  growth:     { type:Object, default:{} },  // { potato, barley, ... }
  products:   { type:Object, default:{} },
  orcx:       { type:Number, default:0 },  // 토큰 대용 필드로 쓰이는 케이스
  updatedAt:  { type:Date, default:Date.now }
}, { collection:'users' });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

/* ============ 헬퍼 ============ */
const n = v => Number.isFinite(+v) ? +v : 0;

// users 문서에서 화면 표시에 필요한 자산만 깔끔하게 뽑기
function projectAssets(u, fallbackNickname) {
  if (!u) return {
    nickname: fallbackNickname || '손님',
    water: 0, fertilizer: 0, token: 0,
    potato: 0, barley: 0,
    seedPotato: 0, seedBarley: 0,
  };

  // 토큰: token 또는 orcx 중 존재하는 값 사용
  const token = ('token' in u) ? n(u.token) : n(u.orcx);

  // 감자/보리: storage.gamja/bori → growth.potato/barley → 최상위 필드 순서로 폴백
  const potato = ('storage' in u && 'gamja' in (u.storage || {}))
                  ? n(u.storage.gamja)
                  : ('growth' in u && 'potato' in (u.growth || {}))
                    ? n(u.growth.potato)
                    : n(u.potato);

  const barley = ('storage' in u && 'bori' in (u.storage || {}))
                  ? n(u.storage.bori)
                  : ('growth' in u && 'barley' in (u.growth || {}))
                    ? n(u.growth.barley)
                    : n(u.barley);

  return {
    nickname:   u.nickname || fallbackNickname || '손님',
    water:      n(u.water),
    fertilizer: n(u.fertilizer),
    token,
    potato,
    barley,
    seedPotato: n(u.seedPotato),
    seedBarley: n(u.seedBarley),
  };
}

/* ============ 라우팅 ============ */
// 가맹 신청
app.get('/api/apply/status', (req,res)=> res.json({ status:'OK' }));
app.post('/api/apply', async (req,res)=>{
  try{
    const { kakaoId, nickname, name, storeName, phone, corpnum, region, address, type, note } = req.body || {};
    if (!kakaoId || !nickname || !name || !storeName || !phone) {
      return res.status(400).json({ success:false, message:'필수값 누락' });
    }
    const doc = await Franchise.create({ kakaoId, nickname, name, storeName, phone, corpnum, region, address, type, note, status:'신청' });
    res.json({ success:true, id: doc._id });
  } catch(e){
    console.error('[APPLY] save error:', e);
    res.status(500).json({ success:false, message:'DB 저장 오류' });
  }
});
app.get('/api/apply', async (req,res)=>{
  try{
    const list = await Franchise.find().sort({ createdAt:-1 });
    res.json(list);
  } catch(e){
    console.error('[APPLY] list error:', e);
    res.status(500).json({ error:'DB 조회 실패' });
  }
});

// Presence(메모리)
const online = new Set();

// 공통 라우트 묶음: /api/apply, /api, /
function registerRoutes(prefix){
  const p = (path)=> `${prefix}${path.startsWith('/') ? path : `/${path}`}`;

  app.get(p('/status'), (req,res)=> res.json({ status:'OK' }));

  // 자산: users 컬렉션에서 바로 조회
  const meHandler = async (req,res)=>{
    try{
      const { kakaoId, nickname } = req.body || {};
      if (!kakaoId || !nickname) return res.status(400).json({ error:'kakaoId, nickname required' });

      // 없으면 최소 정보로 생성(초기값 0)
      const user = await User.findOneAndUpdate(
        { kakaoId },
        { $setOnInsert: { kakaoId, nickname, updatedAt: new Date() }, $set: { nickname, updatedAt: new Date() } },
        { upsert: true, new: true }
      ).lean();

      const view = projectAssets(user, nickname);
      return res.json(view);
    } catch (e) {
      console.error('[ME] fatal error:', e);
      return res.status(500).json({ error:'server error' });
    }
  };
  app.post(p('/me'),        meHandler);
  app.post(p('/user/me'),   meHandler);
  app.post(p('/profile'),   meHandler);

  // 채팅
  app.get(p('/chat'), async (req,res)=>{
    const docs = await Message.find({}, { _id:0, __v:0 }).sort({ ts:1 }).limit(200).lean();
    res.json(docs);
  });
  app.get(p('/chat/list'), async (req,res)=>{
    const docs = await Message.find({}, { _id:0, __v:0 }).sort({ ts:1 }).limit(200).lean();
    res.json(docs);
  });
  app.post(p('/chat'), async (req,res)=>{
    const { kakaoId, nickname, message } = req.body || {};
    if (!nickname || !message) return res.status(400).json({ error:'nickname, message required' });
    await Message.create({ kakaoId, nickname, message });
    res.json({ ok:true });
  });
  app.post(p('/chat/send'), async (req,res)=>{
    const { kakaoId, nickname, message } = req.body || {};
    if (!nickname || !message) return res.status(400).json({ error:'nickname, message required' });
    await Message.create({ kakaoId, nickname, message });
    res.json({ ok:true });
  });
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
  app.get(p('/presence/list'), (req,res)=> res.json({ joiners:[...online] }));
  app.get(p('/chat/joiners'),  (req,res)=> res.json({ joiners:[...online] }));
}

// 프리픽스 3종 등록(프론트 폴백 경로 대응)
registerRoutes('/api/apply');
registerRoutes('/api');
registerRoutes('');

/* ============ 서버 기동 ============ */
app.listen(PORT, ()=>{
  console.log('🚀 OrcaX API on :', PORT);
  console.log('CORS allowed origins:', ALLOWED_ORIGINS);
});
