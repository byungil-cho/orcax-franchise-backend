const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// 메시지 저장 (POST)
router.post('/', async (req, res) => {
  try {
    const { nickname, content, color, type } = req.body;

    const newMessage = new Message({
      nickname: nickname || "익명",
      content,
      color: color || "#333",
      type: type || 'user',
      createdAt: new Date()
    });

    const saved = await newMessage.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('❌ 메시지 저장 오류:', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

// 메시지 불러오기 (GET)
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }); // 오래된 순
    res.json(messages);
  } catch (error) {
    console.error('❌ 메시지 불러오기 오류:', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

module.exports = router;
