// routes/apply.js

const express = require('express');
const router = express.Router();

// POST /api/apply (지원서 제출)
router.post('/', async (req, res) => {
  try {
    // 클라이언트에서 받은 데이터
    const { nickname, email, phone, message } = req.body;

    // (DB 저장/검증 로직은 추후 추가)
    // 콘솔에 출력만 우선
    console.log('Apply Request:', { nickname, email, phone, message });

    // 응답
    res.json({
      success: true,
      message: '지원서가 정상적으로 접수되었습니다.',
    });
  } catch (error) {
    console.error('apply.js error:', error);
    res.status(500).json({ success: false, message: '서버 오류!' });
  }
});

module.exports = router;
