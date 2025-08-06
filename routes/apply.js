const express = require('express');
const router = express.Router();
const Apply = require('../models/Apply');

// 가맹점 신청
router.post('/', async (req, res) => {
    try {
        const apply = new Apply(req.body);
        await apply.save();
        res.json({ success: true, message: '신청 완료' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 신청 리스트 (관리자용)
router.get('/list', async (req, res) => {
    try {
        const data = await Apply.find().sort({ createdAt: -1 });
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
