const express = require('express');
const router = express.Router();
const Message = require('../모델/Message');

router.get('/', async (req, res) => {
  const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
  res.json(messages.reverse()); // 최신이 아래로
});

router.post('/', async (req, res) => {
  const { sender, message, color } = req.body;
  try {
    const newMsg = new Message({ sender, message, color });
    await newMsg.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

