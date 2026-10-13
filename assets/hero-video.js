/* Homepage hero video: muted loop by default, one tap for sound.
   Viewers who ask for reduced motion see the poster and start it themselves. */
(function () {
  var fig = document.querySelector(".hero-video");
  if (!fig) return;
  var v = fig.querySelector("video"), sound = fig.querySelector(".hv-sound"), play = fig.querySelector(".hv-play");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showPlay(on) { play.hidden = !on; }
  function start() { var p = v.play(); if (p && p.catch) p.catch(function () { showPlay(true); }); showPlay(false); }

  if (reduce) { v.removeAttribute("autoplay"); v.pause(); showPlay(true); } else { start(); }

  play.addEventListener("click", start);
  sound.addEventListener("click", function () {
    var on = v.muted;
    v.muted = !on;
    if (on) { v.currentTime = 0; v.loop = false; start(); } else { v.loop = true; }
    sound.textContent = on ? "Mute" : "Turn sound on";
    sound.setAttribute("aria-pressed", String(on));
  });
  v.addEventListener("ended", function () {  // after a listen with sound, settle back into a silent loop
    v.muted = true; v.loop = true; sound.textContent = "Turn sound on"; sound.setAttribute("aria-pressed", "false"); start();
  });
})();
