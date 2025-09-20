const video = document.getElementById('cam');
const frameEl = document.getElementById('frame');
const startBtn = document.getElementById('startBtn');
const shootBtn = document.getElementById('shootBtn');
let stream;

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    shootBtn.disabled = false;
  } catch (e) {
    alert('无法访问摄像头：' + e.message + '\n请确认已在 HTTPS 环境、并授予摄像头权限。');
  }
}

function captureSquare() {
  if (!video.videoWidth) { alert('视频尚未准备好'); return; }
  const vr = video.getBoundingClientRect();
  const fr = frameEl.getBoundingClientRect();
  // 将 DOM 像素映射到视频像素（object-fit: cover 时可用）
  const scaleX = video.videoWidth / vr.width;
  const scaleY = video.videoHeight / vr.height;
  const sx = (fr.left - vr.left) * scaleX;
  const sy = (fr.top  - vr.top)  * scaleY;
  const sw = fr.width  * scaleX;
  const sh = fr.height * scaleY;

  const size = Math.round(Math.min(sw, sh));
  // 以扫描框为基准导出正方形
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

  canvas.toBlob(async (blob) => {
    const file = new File([blob], 'scan-1x1.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Scan 1:1' }); return; } catch (err) { /* 用户取消 */ }
    }
    // 回退：下载
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'scan-1x1.png'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png', 0.95);
}

startBtn.addEventListener('click', startCamera);
shootBtn.addEventListener('click', captureSquare);

// 返回前台或旋转后尝试恢复
window.addEventListener('visibilitychange', () => {
  if (!document.hidden && stream && video.paused) {
    video.play().catch(() => {});
  }
});
window.addEventListener('resize', () => {
  // 如果需要，旋转时可以提示用户重新构图
});
