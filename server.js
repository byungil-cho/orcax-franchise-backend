const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3070;

app.use(cors());
app.use(express.json());

// ────────────── 샘플 자산/회원/가맹점 데이터 ──────────────
// [실전은 DB에서 관리, 여기선 샘플로 메모리]
let userAssets = {
  "kakao_1234": {
    nickname: "고래잡이선장",
    water: 10, fertilizer: 10, token: 100,
    potato: 5, barley: 3, seedPotato: 2, seedBarley: 1
  },
  "kakao_test": {
    nickname: "테스트회원",
    water: 15, fertilizer: 7, token: 22,
    potato: 2, barley: 0, seedPotato: 0, seedBarley: 0
  }
};

// [프랜차이즈] 신청 데이터
let franchiseApps = [
  // 예시 데이터
  // { id: 1, name: "가맹점1", owner: "홍길동", phone: "010-1234-5678", status: "신청" }
];

// [채팅] 메시지 (최신 100개만 유지)
let messages = [];

// ────────────── 자산 API ──────────────
app.get('/api/me', (req, res) => {
  const kakaoId = req.headers['x-kakao-id'];
  const user = userAssets[kakaoId];
  if (!user) return res.status(401).json({ error: "로그인 필요" });
  res.json(user);
});

// ────────────── 프랜차이즈 API ──────────────
// 전체 가맹점 신청 리스트 (관리자/조회)
app.get('/api/franchise', (req, res) => {
  res.json(franchiseApps);
});
// 가맹점 신규 신청 (프론트에서 POST)
app.post('/api/franchise', (req, res) => {
  const { name, owner, phone } = req.body;
  if (!name || !owner || !phone)
    return res.status(400).json({ error: "필수값 누락" });
  const appData = {
    id: franchiseApps.length + 1,
    name, owner, phone,
    status: "신청",
    createdAt: new Date()
  };
  franchiseApps.push(appData);
  res.json({ ok: true, id: appData.id });
});
// (선택) 상태 변경/승인 등 확장 가능

// ────────────── 채팅 메시지 API ──────────────
// 메시지 전체 조회
app.get('/api/messages', (req, res) => {
  res.json(messages.slice(-100));
});
// 메시지 등록
app.post('/api/messages', (req, res) => {
  const { nickname, message } = req.body;
  if (!nickname || !message) return res.status(400).json({ error: "닉네임/메시지 없음" });
  const msg = { nickname, message, ts: Date.now() };
  messages.push(msg);
  if (messages.length > 100) messages = messages.slice(-100);
  res.json({ ok: true });
});
// 전체 메시지 삭제 (관리자용)
app.delete('/api/messages', (req, res) => {
  messages = [];
  res.json({ ok: true });
});

// ────────────── 상태 체크(서버 alive) ──────────────
app.get('/api/ping', (req, res) => res.json({ status: "OK" }));

app.listen(PORT, () => {
  console.log('OrcaX 프랜차이즈/채팅/자산 서버 ON ::', PORT);
});
