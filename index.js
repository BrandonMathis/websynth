function drawGainPeaks(
  analyser,
  canvas,
  opts = { fillStyle: 'rgb(255, 255, 255)' }
) {
  const barWidth = 1;

  let then = new Date().getTime();
  const fps = 25;
  const interval = 1000 / fps;

  let ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const peaksCount = WIDTH;
  let peaks = new Array(WIDTH);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength)

  function draw() {
    requestAnimationFrame(draw);

    // Timng vars for FPS
    var now = new Date().getTime();
    var delta = now - then;

    if (delta > interval) {
      then = now - (delta % interval);

      analyser.getByteFrequencyData(dataArray);
      let sum = 0
      for (const amplitude of dataArray) {
        sum += amplitude * amplitude
      }

      const currentLevel = Math.sqrt(sum / dataArray.length)

      if (currentLevel > -Infinity) {
        peaks.unshift(currentLevel);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      peaks.forEach((peak, index) => {
        ctx.fillStyle = opts.fillStyle;
        const barHeight = Math.max(1, peak);
        const x = barWidth * index;
        const y = HEIGHT / 2 - barHeight / 2;

        ctx.fillRect(x, y, barWidth, barHeight);

        // No need to keep record of peaks once waveform
        // scrolls out of view
        if (peaks.length >= peaksCount) {
          peaks.splice(WIDTH);
        }
      });
    }
  }

  draw();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startVisuals').addEventListener('click', (e) => {
    e.target.disabled = true;
    startVisualizer();
  });

  function startVisualizer() {
    const canvas = document.getElementById('audioVisualizer');

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        source.connect(analyser);
        drawGainPeaks(analyser, canvas);
      })
      .catch((err) => {
        console.error(err);
      });
  }
});
