let oscGainNode = null;
let oscillator =  null;
let oscillatorType = null;
let analyser = null;
let audioContext = new AudioContext();
let synthInitialized = false;
let keyboardEnabled = false;

document.addEventListener('DOMContentLoaded', () => {
  const controls = document.querySelectorAll('.toggle-oscillator');
  const powerButton = document.querySelector('.power-button');
  const keysButton = document.querySelector('.enable-keyboard');
  let activeOscType = null;


  powerButton.addEventListener('click', (e) => {
    initializeSynth();
  });

  keysButton.addEventListener('click', (e) => {
    enableKeyboard(e);
  });

  controls.forEach((item) => {
    item.addEventListener('click', (e) => {
      markActiveButton(e.currentTarget);

      switch(e.target.dataset.input) {
        case 'mic':
          analyseMicrophone();
          break;
        case 'sine':
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
        const mediaStream = audioContext.createMediaStreamSource(stream);
        mediaStream.connect(analyser);
      });
  }

  function initializeSynth() {
    if (synthInitialized) {
      return;
    }
    analyser = new AnalyserNode(audioContext, { fftSize: 2048 });
    oscGainNode = new GainNode(audioContext, { gain: 0 });
    oscillator = new OscillatorNode(
      audioContext,
      { frequency: 380 }
    );
    oscillator.connect(oscGainNode);
    oscGainNode.connect(audioContext.destination);
    oscGainNode.connect(analyser);
    oscillator.start();
    startVisualizer();

    const oscillatorButtons = document.querySelectorAll('.synth-controls button');
    oscillatorButtons.forEach((item) => item.removeAttribute('disabled'));
    document.querySelector('.power-button').classList.add('power-on');
    document.querySelector('.power-button').disabled = true;
    synthInitialized = true;

    setupKeyboardControls();
  }

  function setOscType(type = 'sine') {
    if (activeOscType === type)  {
      oscGainNode.gain.setValueAtTime(0, audioContext.currentTime);
      activeOscType = null;
    } else {
      if (!keyboardEnabled) {
        oscGainNode.gain.setValueAtTime(1, audioContext.currentTime);
      }
      oscillator.type = type;
      activeOscType = type;
    }
  }

  function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      const freq = oscillator.frequency.value;

      if (e.key === 'ArrowUp') {
        oscillator.frequency.setValueAtTime(freq + 10, audioContext.currentTime);
      }
      if (e.key === 'ArrowDown') {
        oscillator.frequency.setValueAtTime(freq - 10, audioContext.currentTime);
      }
    });
  }

  function markActiveButton(e) {
    const controls = document.querySelectorAll('.toggle-oscillator');
    e.classList.toggle('active');
    Array.from(controls)
      .filter((control) => control !== e)
      .forEach((item) => item.classList.remove('active'));
  }

  function fireKeySound(e) {
    const freq = oscillator.frequency.value;
    // Frequency map for keys z - , all in the chord of C
    const keyMap = {
      'z': 261.63, // Pure Keys
      'x': 293.66,
      'c': 329.63,
      'v': 349.23,
      'b': 392.00,
      'n': 440.00,
      'm': 493.88,
      ',': 523.25,
      's': 277.18, // Flats and sharps
      'd': 311.13,
      'g': 369.99,
      'h': 415.30,
      'j': 466.16,
    };
    if (keyMap[e.key]) {
      oscGainNode.gain.setValueAtTime(1, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(keyMap[e.key], audioContext.currentTime);
    }
  }

  function stopKeySound(e) {
    oscGainNode.gain.setValueAtTime(0, audioContext.currentTime);
  }

  function enableKeyboard(e) {
    if (keyboardEnabled) {
      window.removeEventListener('keydown', fireKeySound);
      window.removeEventListener('keyup', stopKeySound);
      e.currentTarget.classList.remove('active');
      oscGainNode.gain.setValueAtTime(0, audioContext.currentTime);
      keyboardEnabled = false;
      return;
    } else {
      keyboardEnabled = !keyboardEnabled;
      oscGainNode.gain.setValueAtTime(0, audioContext.currentTime);
      e.currentTarget.classList.toggle('active');
      window.addEventListener('keydown', fireKeySound);
      window.addEventListener('keyup', stopKeySound);
    }
  }
});

