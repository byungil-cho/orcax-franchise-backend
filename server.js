// server.js — OrcaX API (users 자산 조회/업서트 + 채팅 + 가맹신청 + 디버그)
// ENV: MONGODB_URL (or MONGODB_URI), DB_NAME=orcax, CLIENT_ORIGIN, PORT
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 3070;

/* ================= Mongo ================= */
const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGODB_URI;
const DB_NAME     = process.env.DB_NAME || 'orcax';
if (!MONGODB_URL) {
  console.error('❌ MONGODB_URL(MONGODB_URI) 환경변수가 필요합니다.');
  process.exit(1);
}
mongoose
  .connect(MONGODB_URL, { dbName: DB_NAME, useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected:', DB_NAME))
  .catch(err => { console.error('❌ Mongo connect error:', err.message); process.exit(1); });

/* ================= CORS ================= */
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(s=>s.trim())
  : ['https://byungil-cho.github.io'] // 필요시 , 로 추가
);
app.use(cors({
  origin: (origin, cb)=> cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  credentials: true
}));
app.use(express.json());

/* ================= Schemas ================= */
// 가맹 신청(신규: applies)
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

// 가맹 신청(레거시: applications) — 조회/삭제용
const LegacyApplicationSchema = new mongoose.Schema({
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
}, { collection: 'applications' });
const LegacyApplication = mongoose.models.LegacyApplication
  || mongoose.model('LegacyApplication', LegacyApplicationSchema);

// 채팅
const MessageSchema = new mongoose.Schema({
  kakaoId:  { type:String, index:true },
  nickname: { type:String, required:true },
  message:  { type:String, required:true },
  ts:       { type:Number, default:()=>Date.now(), index:true }
}, { collection:'messages' });
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

// 사용자(자산)
const UserSchema = new mongoose.Schema({
  kakaoId:    { type:String, unique:true, index:true },
  nickname:   { type:String, index:true },
  email:      { type:String },

  water:      { type:Number, default:0 },
  fertilizer: { type:Number, default:0 },
  token:      { type:Number, default:0 }, // 일부 DB는 orcx 사용 → 아래서 매핑
  potato:     { type:Number, default:0 },
  barley:     { type:Number, default:0 },

  seedPotato: { type:Number, default:0 },
  seedBarley: { type:Number, default:0 },

  storage:    { type:Object, default:{} }, // { gamja, bori, ... }
  growth:     { type:Object, default:{} },  // { potato, barley, ... }
  products:   { type:Object, default:{} },

  orcx:       { type:Number, default:0 },  // token 대체 필드 케이스
  updatedAt:  { type:Date, default:Date.now }
}, { collection:'users' });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

/* ================= Helpers ================= */
const n = v => Number.isFinite(+v) ? +v : 0;

function projectAssets(u, fallbackNickname) {
  if (!u) return {
    nickname: fallbackNickname || '손님',
    water: 0, fertilizer: 0, token: 0,
    potato: 0, barley: 0,
    seedPotato: 0, seedBarley: 0,
  };

  const token = ('token' in u) ? n(u.token) : n(u.orcx);

  const potato = ('storage' in u && u.storage && 'gamja' in u.storage)
    ? n(u.storage.gamja)
    : ('growth' in u && u.growth && 'potato' in u.growth)
      ? n(u.growth.potato)
      : n(u.potato);

  const barley = ('storage' in u && u.storage && 'bori' in u.storage)
    ? n(u.storage.bori)
    : ('growth' in u && u.growth && 'barley' in u.growth)
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

/* ================= Routes ================= */
// 가맹 신청 상태
app.get('/api/apply/status', (req,res)=> res.json({ status:'OK' }));

// 가맹 신청 등록(신규: applies 에만 저장)
app.post('/api/apply', async (req,res)=>{
  try{
    const { kakaoId, nickname, name, storeName, phone, corpnum, region, address, type, note } = req.body || {};
    if (!kakaoId || !nickname || !name || !storeName || !phone) {
      return res.status(400).json({ success:false, message:'필수값 누락' });
    }
    const doc = await Franchise.create({ kakaoId, nickname, name, storeName, phone, corpnum, region, address, type, note, status:'신청' });
    res.json({ success:true, id: String(doc._id) });
  } catch(e){
    console.error('[APPLY] save error:', e);
    res.status(500).json({ success:false, message:'DB 저장 오류', detail:String(e?.message||e) });
  }
});

// 가맹 신청 목록(신규 applies + 레거시 applications 합쳐서 반환)
app.get('/api/apply', async (req,res)=>{
  try{
    const a = await Franchise.find().lean();          // applies
    const b = await LegacyApplication.find().lean();  // applications (legacy)

    // 합치고 createdAt desc 정렬 + 중복 제거(같은 _id 있으면 1개만)
    const byId = new Map();
    [...a, ...b].forEach(doc=>{
      const key = String(doc._id || '') + (doc.createdAt ? '_' + new Date(doc.createdAt).getTime() : '');
      if (!byId.has(key)) byId.set(key, doc);
    });

    const merged = Array.from(byId.values()).sort((x,y)=>{
      return new Date(y.createdAt || 0) - new Date(x.createdAt || 0);
    });

    res.json(merged);
  } catch(e){
    console.error('[APPLY] list error:', e);
    res.status(500).json({ error:'DB 조회 실패', detail:String(e?.message||e) });
  }
});

// 단건 삭제: applies 에서 먼저, 없으면 applications 에서
app.delete('/api/apply/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const r1 = await Franchise.deleteOne({ _id: id });
    const r2 = r1.deletedCount ? { deletedCount: 0 } : await LegacyApplication.deleteOne({ _id: id });
    return res.json({ ok: true, deletedFrom: { applies: r1.deletedCount, applications: r2.deletedCount } });
  } catch (e) {
    console.error('[APPLY] delete error:', e);
    return res.status(500).json({ ok:false, error:String(e?.message||e) });
  }
});

// 여러 개 삭제: body { ids: ["id1","id2", ...] }
app.delete('/api/apply', async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ ok:false, error:'ids required' });
    const r1 = await Franchise.deleteMany({ _id: { $in: ids } });
    const remain = ids; // 같은 id 스키마를 가정 (다르면 별도 매핑 필요)
    const r2 = await LegacyApplication.deleteMany({ _id: { $in: remain } });
    return res.json({ ok:true, deletedFrom: { applies:r1.deletedCount, applications:r2.deletedCount } });
  } catch (e) {
    console.error('[APPLY] bulk delete error:', e);
    return res.status(500).json({ ok:false, error:String(e?.message||e) });
  }
});

/* ------- Presence(메모리) ------- */
const online = new Set();

/* ------- 공통 라우트 묶음: /api/apply, /api, / ------- */
function registerRoutes(prefix){
  const p = (path)=> `${prefix}${path.startsWith('/') ? path : `/${path}`}`;

  app.get(p('/status'), (req,res)=> res.json({ status:'OK' }));

  // ---------- 자산 /me ----------
  const meHandler = async (req,res)=>{
    try{
      const { kakaoId, nickname } = req.body || {};
      if (!kakaoId || !nickname) return res.status(400).json({ error:'kakaoId, nickname required' });

      // 검색 조건에서는 kakaoId만, 변경값은 $set — 닉네임 충돌 해결
      const user = await User.findOneAndUpdate(
        { kakaoId },
        { $set: { nickname, updatedAt: new Date() }, $setOnInsert: { kakaoId } },
        { upsert: true, new: true }
      ).lean();

      const view = projectAssets(user, nickname);
      return res.json(view);
    } catch (e) {
      console.error('[ME] fatal error:', e);
      return res.status(500).json({ error:'server error', detail: String(e?.message || e) });
    }
  };

  // POST
  app.post(p('/me'),      meHandler);
  app.post(p('/user/me'), meHandler);
  app.post(p('/profile'), meHandler);

  // GET 폴백(테스트/프록시 이슈 대비)
  app.get(p('/me'),      (req,res)=>{ req.body={ kakaoId:req.query.kakaoId, nickname:req.query.nickname }; return meHandler(req,res); });
  app.get(p('/user/me'), (req,res)=>{ req.body={ kakaoId:req.query.kakaoId, nickname:req.query.nickname }; return meHandler(req,res); });
  app.get(p('/profile'), (req,res)=>{ req.body={ kakaoId:req.query.kakaoId, nickname:req.query.nickname }; return meHandler(req,res); });

  // ---------- 채팅 ----------
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

  // ---------- Presence ----------
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

  // ---------- 디버그 ----------
  app.get(p('/debug/diag'), async (req, res) => {
    try {
      const db = mongoose.connection.db;
      const collections = (await db.listCollections().toArray()).map(c => c.name);
      const usersCount  = await db.collection('users').countDocuments().catch(()=>'no-collection');
      const sampleUser  = await db.collection('users').findOne({}, { projection: { _id:0 }, sort:{ _id:-1 } }).catch(()=>null);

      res.json({
        ok: true,
        dbName: db.databaseName,
        hasUsersCollection: collections.includes('users'),
        usersCount,
        sampleUserKeys: sampleUser ? Object.keys(sampleUser) : null,
        collections
      });
    } catch (e) {
      res.status(500).json({ ok:false, error:String(e?.message || e) });
    }
  });
}

// 프리픽스 3종 등록 (프론트가 어디로 치든 다 받기)
registerRoutes('/api/apply');
registerRoutes('/api');
registerRoutes('');

/* ================= Boot ================= */
app.listen(PORT, ()=>{
  console.log('🚀 OrcaX API on :', PORT);
  console.log('CORS allowed origins:', ALLOWED_ORIGINS);
});



