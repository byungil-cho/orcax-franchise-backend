const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('OrcaX Backend is alive!');
});

app.post('/apply', (req, res) => {
  console.log("📦 신청서 도착:", req.body);
  res.json({ message: "신청 완료! 고마워 범고래야!" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중`);
});

