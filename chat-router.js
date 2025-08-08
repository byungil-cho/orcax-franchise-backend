// chat-router.js
import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// === Mongo 연결 (앱 레벨에서 한 번만) ===
// app.js에서 이미 연결한다면 이 블록은 제거하세요.
const MONGODB_URI = process.env.MONGODB_URL;      // 예: mongodb+srv://...
const DB_NAME     = process.env.DB_NAME || "orcax";
if (!mongoose.connection.readyState) {
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
}

// === 스키마 ===
const MessageSchema = new mongoose.Schema({
  kakaoId:   { type: String, index: true },
  nickname:  { type: String, required: true },
  message:   { type: String, required: true },
  ts:        { type: Number, default: () => Date.now(), index: true }
}, { collection: "messages" });

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);

// 메모리 presence (간단 버전)
const online = new Set();

// === 헬스 ===
router.get("/status", (req,res)=> res.json({ status:"OK"}));

// === 자산 (임시/예시) ===
router.post("/me", (req,res)=>{
  const { nickname } = req.body || {};
  // 실제 DB 자산 조회 로직으로 교체하세요
  return res.json({
    nickname: nickname || "손님",
    water: 10, fertilizer: 3, token: 0,
    potato: 0, barley: 0, seedPotato: 0, seedBarley: 0
  });
});

// === 채팅 목록 ===
router.get("/chat", async (req,res)=>{
  const docs = await Message.find({}, { _id:0, __v:0 })
    .sort({ ts: 1 })
    .limit(200)
    .lean();
  res.json(docs);
});
// 별칭
router.get("/chat/list", (req,res)=> router.handle(req,res));

// === 채팅 전송 ===
router.post("/chat", async (req,res)=>{
  const { kakaoId, nickname, message } = req.body || {};
  if (!nickname || !message) return res.status(400).json({ error:"nickname, message required" });
  await Message.create({ kakaoId, nickname, message });
  res.json({ ok:true });
});
// 별칭
router.post("/chat/send", (req,res)=> router.handle(req,res));

// === 전체 삭제(관리용) ===
router.delete("/chat/clear", async (req,res)=>{
  await Message.deleteMany({});
  res.json({ ok:true });
});
router.post("/chat/clear", (req,res)=> router.handle(req,res));

// === Presence ===
router.post("/presence/join", (req,res)=>{
  const { nickname } = req.body || {};
  if (nickname) online.add(nickname);
  res.json({ ok:true, joiners:[...online] });
});
router.delete("/presence/leave", (req,res)=>{
  const { nickname } = req.body || {};
  if (nickname) online.delete(nickname);
  res.json({ ok:true, joiners:[...online] });
});
router.post("/chat/join",  (req,res)=> router.handle(req,res));
router.post("/chat/leave", (req,res)=> router.handle(req,res));
router.get("/presence/list", (req,res)=> res.json({ joiners:[...online] }));
router.get("/chat/joiners", (req,res)=> res.json({ joiners:[...online] }));

export default router;
