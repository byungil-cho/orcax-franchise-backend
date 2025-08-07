const express = require('express');
const router = express.Router();

const messages = []; // 메모리 저장(테스트용, DB연동 가능)

router.post('/', (req, res) => {
  const { sender, content } = req.body;
  if (!sender || !content) return res.status(400).json({ success: false, message: "필수값 누락" });

  const newMsg = { sender, content, createdAt: new Date() };
  messages.push(newMsg);
  res.json({ success: true, message: "전송 성공", data: newMsg });
});

router.get('/', (req, res) => {
  res.json({ success: true, messages });
});

module.exports = router;
