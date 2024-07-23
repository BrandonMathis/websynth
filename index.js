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

        // No need to keep record of peaks once waveform scrolls out of view
        if (peaks.length >= peaksCount) {
          peaks.splice(WIDTH);
        }
      });
    }
  }

  draw();
}

function drawOscilloscope(analyser, canvas) {
  const waveform = new Float32Array(analyser.frequencyBinCount);
  const ctx = canvas.getContext('2d');
  ctx.width = waveform.length;
  ctx.height = 100;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength)

  function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, ctx.width, ctx.height);

    // Draw Frequency in Hz upper left corner
    analyser.getByteFrequencyData(dataArray);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Courier';
    // Find the peak frequency bin
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }

    // Convert index to frequency
    const frequency = maxIndex * window.audioContext.sampleRate / analyser.fftSize;
    ctx.fillText(
      `Frequency: ${frequency} Hz`,
      10,
      20
    );

    // Draw Wave
    analyser.getFloatTimeDomainData(waveform);
    ctx.beginPath();
    for(let i = 0; i < waveform.length; i++) {
      const x = i;
      const y = ( 0.5 + (waveform[i] / 2) ) * ctx.height;

      if(i == 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  draw();
}

document.addEventListener('DOMContentLoaded', () => {
  const controls = document.querySelectorAll('.toggle-oscillator');
  const powerButton = document.querySelector('.power-button');
  let oscillator =  null;
  let oscillatorType = null;
  let analyser = null;

  powerButton.addEventListener('click', (e) => {
    initializeSynth();
    setKeyboardControls();
  });

  controls.forEach((item) => {
    item.addEventListener('click', (e) => {
      markActiveButton(e.currentTarget);

      switch(e.target.dataset.input) {
        case 'mic':
          analyseMicrophone();
          break;
        case 'sine':
          e.currentTarget.classList.add('active');
          setOscType('sine');
          break;
        case 'square':
          setOscType('square');
          break;
        case 'saw':
          setOscType('sawtooth');
          break;
        case 'tri':
          setOscType('triangle');
          break;
        default:
          throw 'Invalid input source';
      }
    });
  });

  function startVisualizer() {
    const gainCanvas = document.getElementById('gain-visualizer');
    const freqCanvas = document.getElementById('frequency-visualizer');

    drawGainPeaks(analyser, gainCanvas);
    drawOscilloscope(analyser, freqCanvas);
  }

  function analyseMicrophone() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaStream = window.audioContext.createMediaStreamSource(stream);
        mediaStream.connect(analyser);
      });
  }

  function initializeSynth() {
    window.audioContext = new AudioContext();
    analyser = window.audioContext.createAnalyser();

    startVisualizer();

    const oscillatorButtons = document.querySelectorAll('.toggle-oscillator');
    oscillatorButtons.forEach((item) => item.removeAttribute('disabled'));
    document.querySelector('.power-button').classList.add('power-on');
  }

  function setOscType(type = 'sine') {
    if (oscillator) {
      oscillator.stop();
      oscillator.disconnect(analyser);
      oscillator.disconnect(window.audioContext.destination);
    }

    oscillator = new OscillatorNode(
      window.audioContext,
      {
        frequency: 380,
        type: type
      }
    );
    oscillator.connect(analyser);
    oscillator.connect(window.audioContext.destination);
    oscillator.start();
  }

  function setKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      const freq = oscillator.frequency.value;

      if (e.key === 'ArrowUp') {
        oscillator.frequency.setValueAtTime(freq + 10, window.audioContext.currentTime);
      }
      if (e.key === 'ArrowDown') {
        oscillator.frequency.setValueAtTime(freq - 10, window.audioContext.currentTime);
      }
    });
  }

  function markActiveButton(e) {
    const controls = document.querySelectorAll('.synth-controls button');
    controls.forEach((item) => item.classList.remove('active'));
    e.classList.add('active');
  }
});

