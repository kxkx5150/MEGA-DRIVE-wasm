'use strict';
window.addEventListener(
  "resize",
  (e) => {
    resizeCanvas();
  },
  true
);
window.addEventListener(
  "keydown",
  (e) => {

  },
  true
);
window.addEventListener(
  "keyup",
  (e) => {

  },
  true
);
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  var fileReader = new FileReader();
  fileReader.onload = function () {
    if (!this.result) return;
  };
  fileReader.readAsArrayBuffer(file);
});

const resizeCanvas = () => {
  setTimeout(() => {
    let canvas = document.getElementById("screen");
    const wh = window.innerHeight;
    const ww = window.innerWidth;
    const nw = 640;
    const nh = 480;
    const waspct = ww / wh;
    const naspct = nw / nh;

    if (waspct > naspct) {
      var val = wh / nh;
    } else {
      var val = ww / nw;
    }
    let ctrldiv = document.querySelector(".ctrl_div");
    canvas.style.height = 480 * val - ctrldiv.offsetHeight - 18 + "px";
    canvas.style.width = 640 * val - 24 + "px";
  }, 1200);
};
document.getElementById("setteings").addEventListener("click", (e) => {
  showSetting();
});
document.getElementById("settingdiv").addEventListener("click", (e) => {
  hideSetting();
});
document.getElementById("gamepad_button_container").addEventListener("click", (e) => {
  e.stopPropagation();
  e.preventDefault();
},true);
function hideSetting() {
  let elem = document.getElementById("settingdiv");
  if (elem.style.display == "block") {
    elem.style.left = "-500px";
    setTimeout(function () {
      elem.style.display = "none";
    }, 400);
  }
}
function showSetting() {
  document.getElementById("settingdiv").style.display = "block";
  setTimeout(function () {
    document.getElementById("settingdiv").style.left = 0;
  }, 10);
}
setTimeout(()=>{
  resizeCanvas(); 
},1000);
