// server.js (최신 통합본)
// 환경변수: MONGODB_URL, (optional) DB_NAME, CLIENT_ORIGIN, PORT
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 3070;

// ===== Mongo 연결 =====
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

// ===== CORS =====
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(s=>s.trim())
  : ['https://byungil-cho.github.io']
);
app.use(cors({ origin: (origin, cb)=>cb(null, !origin || ALLOWED_ORIGINS.includes(origin)), credentials:true }));
app.use(express.json());

// -----------------------------------------------------
// (기존) 가맹 신청 API
// -----------------------------------------------------
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
    console.error(e);
    res.status(500).json({ success:false, message:'DB 저장 오류' });
  }
});

app.get('/api/apply', async (req,res)=>{
  try{
    const list = await Franchise.find().sort({ createdAt:-1 });
    res.json(list);
  } catch(e){
    console.error(e);
    res.status(500).json({ error:'DB 조회 실패' });
  }
});

// -----------------------------------------------------
// (추가) 공용 스키마들: 채팅 / 유저 / 농장 관련
// -----------------------------------------------------
// 채팅
const MessageSchema = new mongoose.Schema({
  kakaoId:  { type:String, index:true },
  nickname: { type:String, required:true },
  message:  { type:String, required:true },
  ts:       { type:Number, default:()=>Date.now(), index:true }
}, { collection:'messages' });
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

// 사용자(보유 기본값/최근 닉네임)
const UserSchema = new mongoose.Schema({
  kakaoId:    { type:String, unique:true, index:true },
  nickname:   { type:String, index:true },
  water:      { type:Number, default:0 },
  fertilizer: { type:Number, default:0 },
  token:      { type:Number, default:0 },
  potato:     { type:Number, default:0 },
  barley:     { type:Number, default:0 },
  seedPotato: { type:Number, default:0 },
  seedBarley: { type:Number, default:0 },
  updatedAt:  { type:Date, default:Date.now }
}, { collection:'users' });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// 농장 관련(필드명/컬렉션명은 실제에 맞게 수정 필요)
const Farm = mongoose.models.Farm || mongoose.model('Farm', new mongoose.Schema({
  kakaoId: String,
  waterUsed: Number,
  fertilizerUsed: Number
}, { collection:'farms' }));

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', new mongoose.Schema({
  kakaoId: String,
  seedPotato: Number,
  seedBarley: Number
}, { collection:'seedinventories' }));

const Harvest = mongoose.models.Harvest || mongoose.model('Harvest', new mongoose.Schema({
  kakaoId: String,
  potato: Number,
  barley: Number,
  token: Number
}, { collection:'harvests' }));

// Presence(간단, 메모리)
const online = new Set();

// -----------------------------------------------------
// (추가) 실시간 계산 함수: /me 응답 생성
// -----------------------------------------------------
async function computeMe(kakaoId, nickname){
  const base = await User.findOneAndUpdate(
    { kakaoId },
    { $setOnInsert: { kakaoId, nickname }, $set: { nickname, updatedAt: new Date() } },
    { upsert: true, new: true }
  ).lean();

  const [farmAgg, invDoc, harvestAgg] = await Promise.all([
    Farm.aggregate([
      { $match: { kakaoId } },
      { $group: { _id:null, waterUsed:{ $sum:'$waterUsed' }, fertilizerUsed:{ $sum:'$fertilizerUsed' } } }
    ]),
    Inventory.findOne({ kakaoId }).lean(),
    Harvest.aggregate([
      { $match: { kakaoId } },
      { $group: { _id:null, token:{ $sum:'$token' }, potato:{ $sum:'$potato' }, barley:{ $sum:'$barley' } } }
    ])
  ]);

  const farm = farmAgg?.[0] || { waterUsed:0, fertilizerUsed:0 };
  const inv  = invDoc || { seedPotato:0, seedBarley:0 };
  const hv   = harvestAgg?.[0] || { token:0, potato:0, barley:0 };

  return {
    nickname:   base.nickname || nickname || '손님',
    water:      Math.max((base.water ?? 0)      - (farm.waterUsed ?? 0), 0),
    fertilizer: Math.max((base.fertilizer ?? 0) - (farm.fertilizerUsed ?? 0), 0),
    token:      (base.token ?? 0) + (hv.token ?? 0),
    potato:     (base.potato ?? 0) + (hv.potato ?? 0),
    barley:     (base.barley ?? 0) + (hv.barley ?? 0),
    seedPotato: inv.seedPotato ?? 0,
    seedBarley: inv.seedBarley ?? 0
  };
}

// -----------------------------------------------------
// (추가) 공통 라우트 등록: /api/apply, /api, /
// -----------------------------------------------------
function registerRoutes(prefix){
  const p = (path)=> `${prefix}${path.startsWith('/') ? path : `/${path}`}`;

  // 헬스
  app.get(p('/status'), (req,res)=> res.json({ status:'OK' }));

  // 자산: /me, /user/me, /profile 모두 지원
  const meHandler = async (req,res)=>{
    try{
      const { kakaoId, nickname } = req.body || {};
      if (!kakaoId || !nickname) return res.status(400).json({ error:'kakaoId, nickname required' });
      const me = await computeMe(kakaoId, nickname);
      res.json(me);
    } catch(e){
      console.error('ME error:', e);
      res.status(500).json({ error:'server error' });
    }
  };
  app.post(p('/me'), meHandler);
  app.post(p('/user/me'), meHandler);
  app.post(p('/profile'), meHandler);

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

// 세 프리픽스 모두 등록
registerRoutes('/api/apply');
registerRoutes('/api');
registerRoutes('');

// ===== 서버 기동 =====
app.listen(PORT, ()=>{
  console.log('🚀 OrcaX API on :', PORT);
  console.log('CORS allowed origins:', ALLOWED_ORIGINS);
});
