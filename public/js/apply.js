async function checkServerStatus() {
    try {
        const res = await fetch('/api/apply/status');
        const json = await res.json();
        if (json.status === 'OK') {
            document.getElementById('server-status').innerHTML = '<span style="color: #00c851;">● 서버 연결됨</span>';
        } else {
            throw new Error();
        }
    } catch {
        document.getElementById('server-status').innerHTML = '<span style="color: #d32f2f;">● 서버 접속 불가 / 점검 중</span>';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    checkServerStatus();

    document.getElementById('applyForm').addEventListener('submit', async function(e){
        e.preventDefault();
        // 데이터 수집
        const data = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            bizNo: document.getElementById('bizNo').value,
            region: document.getElementById('region').value,
            address: document.getElementById('address').value,
            category: document.getElementById('category').value
        };

        try {
            const res = await fetch('/api/apply', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if(json.success){
                alert('신청 완료!');
                location.reload();
            } else {
                alert('신청 실패: ' + json.message);
            }
        } catch(err) {
            alert('서버 오류!');
        }
    });
});
