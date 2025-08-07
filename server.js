// OrcaX 채팅 서버 (3070번 포트 예시)
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3070;

// 메모리 저장 (실운영은 DB 교체 권장)
let messages = [];
let userSet = new Set();
let lastActive = {}; // {nick: timestamp}

app.use(cors());
app.use(express.json());

// 서버 상태 체크 (index-10.html에서 /api/ping 으로 사용)
app.get('/api/ping', (req, res) => res.json({status:"OK"}));

// 유저 리스트 (최근 90초 내 활동)
app.get('/api/users', (req, res) => {
  const now = Date.now();
  // 90초 이내 활동한 닉만 표시 (퇴장 자동제거)
  const users = Array.from(userSet).filter(nick => now - (lastActive[nick]||0) < 90000);
  res.json(users.map(nick => ({nick})));
});

// 메시지 전체 조회
app.get('/api/messages', (req, res) => {
  res.json(messages.slice(-50)); // 최근 50개만
});

// 메시지 등록
app.post('/api/messages', (req, res) => {
  const {nick, text} = req.body;
  if (!nick || !text) return res.status(400).json({ok:false, error:"닉네임/내용 누락"});
  const now = Date.now();
  userSet.add(nick);
  lastActive[nick] = now;
  messages.push({nick, text, ts: now});
  if (messages.length > 200) messages = messages.slice(-100); // 오래된 메시지 삭제
  res.json({ok:true});
});

// 전체 메시지 삭제
app.delete('/api/messages', (req, res) => {
  messages = [];
  res.json({ok:true});
});

// 유저가 퇴장할 때(추가 구현)
// app.post('/api/leave', (req, res) => { ... });

app.listen(PORT, () => {
  console.log('OrcaX 채팅 서버 ON ::', PORT);
});
