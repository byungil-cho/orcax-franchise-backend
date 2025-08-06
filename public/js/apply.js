// public/js/apply.js

document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("applyForm");
  const resultDiv = document.getElementById("result");

  if (!form) return;

  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    resultDiv.innerHTML = "<span style='color:#ffd700;'>🚀 신청 정보를 전송 중입니다...</span>";

    const formData = new FormData(form);

    try {
      // ★ 여기만 onrender 주소로 교체!
      const res = await fetch("https://orcax-franchise-backend.onrender.com/api/apply", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("서버 응답 오류 (" + res.status + ")");
      }

      const data = await res.json();

      if (data.success) {
        resultDiv.innerHTML = "✅ <b>신청이 접수되었습니다!</b><br><span style='font-size:0.95em;color:#ffe164'>" + (data.message || "곧 확인 후 연락드리겠습니다.") + "</span>";
        form.reset();
      } else {
        resultDiv.innerHTML = "❌ <b>전송 실패!</b><br><span style='color:#ffb999;'>" + (data.message || "서버에서 오류가 발생했습니다.") + "</span>";
      }
    } catch (err) {
      resultDiv.innerHTML = "❌ <b>전송 실패!</b><br><span style='color:#ffb999;'>" + err.message + "</span>";
    }
  });
});
