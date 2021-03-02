import wasm from "./genplus.js";
import "./genplus.wasm";
import "./main.js";
import "../css/style.css";
import Gamepad from "./gamepad.js";
const gamepad = new Gamepad();

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const SOUND_FREQUENCY = 44100;
const SAMPLING_PER_FPS = 736;
const GAMEPAD_API_INDEX = 32;

// emulator
let gens;
let romdata;
let vram;
let input;
let initialized = false;
let pause = false;

// canvas member
let canvas;
let canvasContext;
let canvasImageData;

// fps control
const FPS = 60;
const INTERVAL = 1000 / FPS;
let now;
let then;
let delta;
let startTime;
let fps;
let frame;

// audio member
const SOUND_DELAY_FRAME = 8;
let audioContext;
let audio_l;
let audio_r;
let soundShedTime = 0;
let soundDelayTime = (SAMPLING_PER_FPS * SOUND_DELAY_FRAME) / SOUND_FREQUENCY;

// for iOS
let isSafari = false;

wasm().then(function (module) {
  gens = module;
  // memory allocate
  gens._init();
  console.log(gens);
});

document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  var fileReader = new FileReader();
  fileReader.onload = function () {
    if (!this.result) return;
    setRom(this.result);
  };
  fileReader.readAsArrayBuffer(file);
});

const setRom = function (buf) {
  romdata = new Uint8Array(gens.HEAPU8.buffer, gens._get_rom_buffer_ref(buf.byteLength), buf.byteLength);
  romdata.set(new Uint8Array(buf));
  initialized = true;
  start();
};

const start = function () {
  if (!initialized) return;
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  // emulator start
  gens._start();
  // vram view
  vram = new Uint8ClampedArray(
    gens.HEAPU8.buffer,
    gens._get_frame_buffer_ref(),
    CANVAS_WIDTH * CANVAS_HEIGHT * 4
  );
  // audio view
  audio_l = new Float32Array(gens.HEAPF32.buffer, gens._get_web_audio_l_ref(), SAMPLING_PER_FPS);
  audio_r = new Float32Array(gens.HEAPF32.buffer, gens._get_web_audio_r_ref(), SAMPLING_PER_FPS);
  // input
  input = new Float32Array(gens.HEAPF32.buffer, gens._get_input_buffer_ref(), GAMEPAD_API_INDEX);

  // iOS
  let ua = navigator.userAgent;
  if (ua.match(/Safari/) && !ua.match(/Chrome/) && !ua.match(/Edge/)) {
    isSafari = true;
  }
  // game loop
  then = Date.now();
  loop();
};

let slctgamepad = -1;
window.addEventListener("gamepadconnected", (e) => {
  if (slctgamepad === -1) slctgamepad = e.gamepad.index;
});

const sound = function (audioBuffer) {
  let source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  let currentSoundTime = audioContext.currentTime;
  if (currentSoundTime < soundShedTime) {
    source.start(soundShedTime);
    soundShedTime += audioBuffer.duration;
  } else {
    source.start(currentSoundTime);
    soundShedTime = currentSoundTime + audioBuffer.duration + soundDelayTime;
  }
};

const loop = function () {
  requestAnimationFrame(loop);
  now = Date.now();
  delta = now - then;
  if (delta > INTERVAL && !pause) {
    gamepad.updateGamepad(input);

    // update
    gens._tick();
    then = now - (delta % INTERVAL);
    // draw
    canvasImageData.data.set(vram);
    canvasContext.putImageData(canvasImageData, 0, 0);
    // fps
    frame++;
    if (new Date().getTime() - startTime >= 1000) {
      fps = frame;
      frame = 0;
      startTime = new Date().getTime();
    }
    // sound
    gens._sound();
    // sound hack
    if (fps < FPS) {
      soundShedTime = 0;
    } else {
      let audioBuffer = audioContext.createBuffer(2, SAMPLING_PER_FPS, SOUND_FREQUENCY);
      audioBuffer.getChannelData(0).set(audio_l);
      audioBuffer.getChannelData(1).set(audio_r);
      sound(audioBuffer);
    }
    canvasContext.fillText("FPS " + fps, 0, 480 - 16);
  }
};
(function () {
  canvas = document.getElementById("screen");
  canvas.setAttribute("width", CANVAS_WIDTH);
  canvas.setAttribute("height", CANVAS_HEIGHT);
  let pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
  if (pixelRatio > 1 && window.screen.width < CANVAS_WIDTH) {
    canvas.style.width = CANVAS_WIDTH + "px";
    canvas.style.heigth = CANVAS_HEIGHT + "px";
  }
  canvasContext = canvas.getContext("2d");
  canvasImageData = canvasContext.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
  // for iOS audio context
  // audio init
  audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: SOUND_FREQUENCY,
  });
  // for iOS dummy audio
  let audioBuffer = audioContext.createBuffer(2, SAMPLING_PER_FPS, SOUND_FREQUENCY);
  let dummy = new Float32Array(SAMPLING_PER_FPS);
  dummy.fill(0);
  audioBuffer.getChannelData(0).set(dummy);
  audioBuffer.getChannelData(1).set(dummy);
  sound(audioBuffer);
  fps = 0;
  frame = FPS;
  startTime = new Date().getTime();
})();
