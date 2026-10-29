/* =====================================================================
   XR DYNAMICS — PROJECT CONFIG
   Section order = array order.  kinds:
     "vehicle"  : local mp4 + interactive GLB viewport (Vehicle Dynamics only)
     "showcase" : one large local mp4 (poster shown if the file is missing)
     "stats"    : the three-item statement strip
     (none)     : standard project; videos = Drive links / { image } / { slides }
   - Drive links: set sharing to "Anyone with the link".
   - To swap a clip for a local file use { video: "assets/video/x.mp4", poster: "...", label: "..." }.
   - link: where the button goes; null shows "Project not hosted".
   ===================================================================== */
const D = id => `https://drive.google.com/file/d/${id}/view?usp=sharing`;

/* Teleoperation clips (Drive). 1-2 stay in Robotics, 3-4 are used in XR Interaction. */
const TELEOP = [
  D("1auHKqmb_3pX6-CcGPUCrzURR-o_vmsER"), D("12_1O5sF2GrRqA3nxrhUArN7XnZH3z5mO"),
  D("1vmRYNudguLOO_R8Z1Q4nknEGmol8VhfK"), D("1XhelwKwoSRyTek3e2uUjMV487Ms9RCpv")
];

const PROJECTS = [
  {
    id: "vehicle-dynamics",
    kind: "vehicle",
    name: "Vehicle Dynamics",
    video: "assets/video/vehicledynamics.mp4",
    poster: "assets/video/vehicledynamics.jpg",
    model: "assets/models/mustang.glb",
    description: "VR driving on a physics-based vehicle model with suspension, tires, drivetrain and aerodynamics.",
    explain: "Weight transfer, tire slip, suspension travel and drivetrain torque shape how the car accelerates, brakes and corners, and the driver feels it through the headset. Experiments were run on Meta Quest 2 and Meta Quest 3.",
    tech: ["Meta Quest 2 / 3", "Unreal Engine 5", "Chaos Physics", "C++", "OpenXR"],
    badge: true,
    linkLabel: "View on Fab",
    link: "https://www.fab.com/listings/86e8e62b-caf1-4cb6-a589-7d7cf601143f"
  },
  {
    id: "vr-drone-cockpit",
    kind: "showcase",
    name: "VR Drone",
    video: "assets/video/vr-drone.mp4",
    poster: "assets/video/vr-drone.jpg",
    description: "A VR cockpit for VTOL drones in Unreal Engine 5.8, flown with your hands on a touch flight display.",
    explain: "A glass cockpit with an attitude indicator and live telemetry: altitude, ground speed, vertical speed, pitch, roll, thrust-to-weight and load, plus per-rotor output for H1 to H4.",
    tech: ["Unreal Engine 5.8", "VR Cockpit", "VTOL", "Telemetry HUD", "Hand Interaction"],
    badge: true,
    linkLabel: "View on Fab",
    link: "https://www.fab.com/listings/fff21d70-c83f-4411-ad23-cbed73a1895c"
  },
  {
    id: "flight-dynamics",
    kind: "showcase",
    flip: true,
    name: "Flight Dynamics",
    /* Drop the clip at this path and it plays automatically; until then the cover image is shown. */
    video: "assets/video/flight-dynamics.mp4",
    poster: "cover.jpg",
    posterAlt: "Flight Dynamics plugin cover: a fighter jet taking off with afterburner on a dark runway",
    gallery: Array.from({ length: 15 }, (_, n) => `assets/slide-${String(n + 1).padStart(2, "0")}.jpg`),
    description: "A physics-based flight dynamics plugin for Unreal Engine 5.5 to 5.8, with real lift, drag and thrust simulated in the Chaos physics engine.",
    explain: "Realistic physics across the entire speed and altitude range, from runway take-off to landing. Advanced fly-by-wire keeps the aircraft inside its flight envelope while control surfaces follow the flight computer. Includes retractable landing gear, a feature-rich HUD (airspeed, Mach, G, angle of attack, altitude, vertical speed, thrust), three camera modes and an afterburner plume.",
    tech: ["Unreal Engine 5.5 - 5.8", "Chaos Physics", "Fly-by-Wire", "C++", "Flight Dynamics"],
    badge: true,
    linkLabel: "View on Fab",
    link: "https://www.fab.com/listings/ab848d4b-a42d-4d9b-9f28-c72ceada449b"
  },
  { kind: "stats" },
  {
    id: "physical-ai",
    name: "Physical AI Simulation",
    videos: [
      { src: D("15MAT5rJu8l7O7wZy522v2h_79KndFe_P"), label: "Physics Simulation 01" },
      { src: D("16Yu1kFCJESCnyLA3o7ElbS2UpScsxNbu"), label: "Physics Simulation 02" },
      { src: D("1YfiNn-AmFuifenn84SmFhLRVKYZ91Qot"), label: "Physics Simulation 03" }
    ],
    description: "Physics, sensors and reinforcement learning in Unreal Engine, for training and testing intelligent robotic systems.",
    explain: "Sensor simulation provides the perception layer, and physics-based robots learn control policies through reinforcement learning in the same environment, before they meet real hardware.",
    tech: ["Unreal Engine 5", "Sensor Simulation", "Reinforcement Learning", "Robotics", "Python"],
    badge: true,
    linkLabel: "View on Fab",
    link: "https://www.fab.com/listings/c172b7cc-627b-4665-a35b-3af1f253486c"
  },
  {
    id: "teleoperation",
    name: "Robotics",
    /* Video 2 is still the previous clip. To replace it:
       { video: "assets/video/robotics-02.mp4", poster: "assets/video/robotics-02.jpg", label: "..." } */
    videos: [{ src: TELEOP[0], label: "Teleoperation 01" }, { src: TELEOP[1], label: "Teleoperation 02" }],
    description: "XR-controlled robotics: an operator drives a real humanoid robot through a headset for warehouse operation.",
    explain: "Teleoperation dynamics of real humanoid robots: head and hand motion from Meta Quest 2 and Meta Quest 3 is mapped to the robot's body and arms, so one operator can handle warehouse tasks such as picking, carrying and placing. Experiments cover control response, latency and stability on the real machine.",
    tech: ["Meta Quest 2 / 3", "Humanoid Robots", "Warehouse Automation", "ROS 2", "Python"],
    link: null
  },
  {
    id: "xr-interaction",
    name: "XR Interaction",
    /* Previous video here (architecture walkthrough, Drive id 1acHx-3bKSOsBLOZVNms6vD89pzpdrNqa) is no longer displayed. */
    videos: [{ src: TELEOP[2], label: "XR teleoperation 03" }, { src: TELEOP[3], label: "XR teleoperation 04" }],
    description: "Hands and head as the interface: an operator in a Meta Quest headset controlling a real humanoid robot in XR.",
    explain: "Further footage from the XR robot teleoperation work: headset and hand tracking drive the machine directly. Separately, four pre-built interior environments for real-time VR walkthroughs, from an ocean-view villa to a city penthouse, are available on Fab.",
    tech: ["Meta Quest 2 / 3", "Unreal Engine 5", "OpenXR", "VR Interaction", "Hand Tracking"],
    badge: true,
    linkLabel: "Interior environments on Fab",
    link: "https://www.fab.com/listings/60d5361c-576c-4e6e-97d0-b7680edd3311"
  },
  { kind: "label", text: "More projects" },
  {
    id: "vr-flight-control",
    name: "VR Flight Control",
    videos: [D("1FySv33YDpeFj6nYDj_9p9xyYhpNBCROk"), D("1WKge83s7ZWFLK5QQ7wHg3SJ0yMPHQThu")],
    description: "Immersive aircraft control in VR, where the pilot's hands drive the stick and throttle of a physically simulated cockpit.",
    explain: "Flight dynamics: a six-degree-of-freedom aircraft model combines lift, drag, thrust and control-surface moments, so pitch, roll and yaw respond to real stick and throttle input. Experiments were run on Meta Quest 2 and Meta Quest 3.",
    tech: ["Meta Quest 2 / 3", "Unreal Engine 5", "OpenXR", "C++", "Flight Dynamics"],
    link: null
  },
  {
    id: "space-station",
    name: "VR-Space Station",
    videos: [D("176CmRi6BICqlwTMlddwWWMP3Aer3GsnD"), D("1PXn8u_nR9X-14hT4VJCV8brUeIqClg-Z")],
    description: "A modular VR space station template for building immersive space simulations and VR games.",
    explain: "Optimized VR controls in a sci-fi station with emissive and metallic materials, transparent glass surfaces and Niagara-animated elements, ready to customize in Unreal Engine.",
    tech: ["Meta Quest 2 / 3", "Unreal Engine 5", "OpenXR", "Niagara", "VR Template"],
    badge: true,
    linkLabel: "View on Fab",
    link: "https://www.fab.com/listings/2fe19cdf-d7ae-4ebb-a93a-5735a8c1915e"
  },
  {
    id: "xr-keypad",
    name: "XR-Keypad",
    videos: [{ image: "assets/tabs/xr-keypad.jpg", label: "Ready-to-run demo map", alt: "XR-Keypad demo map: a secure access terminal with two floating keypads" }],
    description: "A hand-tracked XR keypad plugin for Unreal Engine 5.8, delivered with a ready-to-run demo map.",
    explain: "Poke or pinch the keys with your hands, point with a ray, or use controllers and mouse, then grab the handle to move the keypad. The demo is a secure access terminal where you enter a code and a name, and switch layouts, themes and colors live.",
    tech: ["Unreal Engine 5.8", "Hand Tracking", "Controllers", "Blueprint + C++", "XR Input"],
    badge: true,
    linkLabel: "View on Fab",
    link: "https://www.fab.com/listings/28274d1c-dfe2-44cf-a471-12638ffcfc6f"
  }
];

/* Hero rolling tabs: image + the project id it scrolls to */
const TABS = [
  { title: "Flight Dynamics",       img: "assets/tabs/flight-dynamics.jpg",  target: "flight-dynamics" },
  { title: "Vehicle Dynamics",      img: "assets/tabs/vehicle-dynamics.jpg", target: "vehicle-dynamics" },
  { title: "Vehicle Sim & AD Toolkit", img: "assets/tabs/vehicle-toolkit.jpg", target: "physical-ai" },
  { title: "XR-Keypad",             img: "assets/tabs/xr-keypad.jpg",        target: "xr-keypad" },
  { title: "VR-Drone Cockpit",      img: "assets/tabs/vr-drone-cockpit.jpg", target: "vr-drone-cockpit" }
];

const MODEL_CREDIT = `3D model: <a href="https://sketchfab.com/3d-models/2019-ford-mustang-rtr-spec3-3d005089037f4b3cbbfed3d6ba188466" target="_blank" rel="noopener">2019 Ford Mustang RTR Spec3</a> by <a href="https://sketchfab.com/ddiaz-design" target="_blank" rel="noopener">Ddiaz Design</a>, <a href="http://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>`;

/* ===================================================================== */

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
function driveEmbed(input) {
  if (!input || input.includes("PASTE_")) return null;
  const m = input.match(/\/d\/([\w-]+)/) || input.match(/[?&]id=([\w-]+)/) || input.match(/^([\w-]{20,})$/);
  return m ? `https://drive.google.com/file/d/${m[1]}/preview` : input;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad = n => String(n).padStart(2, "0");

const UE = `<span class="ue"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.5 9.5v7.2c0 3.2 2.2 5.3 5.5 5.3s5.5-2.1 5.5-5.3V9.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>UNREAL ENGINE</span>`;
const EMPTY = `<div class="video-empty"><div class="play"></div><span>VIDEO COMING SOON</span></div><div class="corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`;
const ARROW = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12L12 2M5 2h7v7"/></svg>`;

const idx = (i, total) => `${pad(i)} / ${pad(total)}`;
const head = (p, n, total) => `<div class="project-head"><span class="idx">${idx(n, total)}</span>
  <h2 class="project-name">${esc(p.name)}</h2>${p.badge ? UE : ""}</div>`;
const info = p => `<div class="project-info">
  <div><p class="desc">${esc(p.description)}</p><p class="explain">${esc(p.explain)}</p></div>
  <div class="side">
    <ul class="tech">${p.tech.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
    ${p.link
      ? `<a class="view" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.linkLabel || "View Project")}${ARROW}</a>`
      : `<button type="button" class="view not-hosted" aria-live="polite">View Project</button>`}
  </div></div>`;

/* local mp4 with lazy source + minimal controls (see initVideos) */
function localVideo(src, poster, alt, label) {
  return `<div class="media" data-video="${esc(src)}">
    <img class="poster" src="${esc(poster)}" alt="${esc(alt || label || "")}" loading="lazy" decoding="async">
    <video muted loop playsinline preload="none" poster="${esc(poster)}" aria-label="${esc(label || "")}"></video>
    <div class="vbar" hidden>
      <button type="button" class="vb-play" aria-label="Play"></button>
      <span class="vb-track"><b></b></span>
      <button type="button" class="vb-mute" aria-label="Unmute"></button>
      <button type="button" class="vb-full" aria-label="Fullscreen"></button>
    </div>
  </div>`;
}

function cell(p, v, k) {
  if (v.video) return `<figure>${localVideo(v.video, v.poster, p.name, v.label)}<figcaption>${esc(v.label || "Demo " + pad(k + 1))}</figcaption></figure>`;
  if (v.image) {
    return `<figure><div class="video"><img class="cover-img" src="${esc(v.image)}" alt="${esc(v.alt || p.name)}" loading="lazy"></div><figcaption>${esc(v.label || "Image")}</figcaption></figure>`;
  }
  if (v.slides) return slideshow(p, v.slides, v.label);
  const src = driveEmbed(v.src);
  const media = src
    ? `<iframe src="${esc(src)}" title="${esc(p.name)} demo ${k + 1}" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>`
    : EMPTY;
  return `<figure><div class="video">${media}</div><figcaption>${esc(v.label || "Demo " + pad(k + 1))}</figcaption></figure>`;
}

function slideshow(p, slides, label) {
  const imgs = slides.map((u, n) => `<img src="${esc(u)}" alt="${esc(p.name)} screenshot ${n + 1} of ${slides.length}" ${n ? 'loading="lazy"' : ""}>`).join("");
  return `<figure><div class="video slideshow" role="region" aria-roledescription="carousel" aria-label="${esc(p.name)} screenshots">${imgs}
    <button type="button" class="ss-btn prev" aria-label="Previous image">&#8249;</button>
    <button type="button" class="ss-btn next" aria-label="Next image">&#8250;</button>
    <span class="ss-count" aria-live="off"></span></div><figcaption>${esc(label || "Gallery")}</figcaption></figure>`;
}

function render() {
  const real = PROJECTS.filter(p => p.id);
  let n = 0;
  document.getElementById("projects").innerHTML = PROJECTS.map(p => {
    if (p.kind === "stats") return `<section class="stats">
      <div><b>Meta Quest 2 &amp; 3</b><span>Headsets used for every experiment</span></div>
      <div><b>Real Humanoids</b><span>Teleoperated for warehouse operation</span></div>
      <div><b>Physics-First</b><span>Flight, vehicle and robot dynamics</span></div></section>`;
    if (p.kind === "label") return `<div class="more-label"><span>${esc(p.text)}</span></div>`;
    n++;
    const h = head(p, n, real.length);

    if (p.kind === "vehicle") {
      return `<article class="project showcase vehicle" id="${p.id}">
        <div class="wide">${h}
          <div class="vehicle-grid">
            <figure class="vg-video">${localVideo(p.video, p.poster, "Vehicle Dynamics VR driving demo", p.name + " demo")}<figcaption class="credit">VR driving demo</figcaption></figure>
            <figure class="vg-model">
              <div class="viewer" data-model="${esc(p.model)}" data-poster="${esc(p.poster)}">
                <img class="viewer-fallback" src="${esc(p.poster)}" alt="Vehicle model preview" loading="lazy" decoding="async">
                <div class="viewer-state" role="status"><span class="spin" aria-hidden="true"></span><em>Loading 3D model</em></div>
                <span class="viewer-hint" aria-hidden="true">Drag to rotate · scroll to zoom</span>
              </div>
              <figcaption class="credit">${MODEL_CREDIT}</figcaption>
            </figure>
          </div>
          ${info(p)}
        </div></article>`;
    }

    if (p.kind === "showcase") {
      const gal = p.gallery ? `<div class="gallery">${slideshow(p, p.gallery, "Gallery")}</div>` : "";
      return `<article class="project showcase${p.flip ? " flip" : ""}" id="${p.id}">
        <div class="wide">${h}
          <figure class="solo">${localVideo(p.video, p.poster, p.posterAlt || p.name, p.name + " demo")}</figure>
          ${info(p)}${gal}
        </div></article>`;
    }

    const list = (p.videos && p.videos.length ? p.videos : [null, null]).map(v => (v && typeof v === "object") ? v : { src: v });
    return `<article class="project" id="${esc(p.id || "")}">
      <div class="wide">${h}
        <div class="videos n${list.length}">${list.map((v, k) => cell(p, v, k)).join("")}</div>
        ${info(p)}
      </div></article>`;
  }).join("");
}

/* ---------- reveals ---------- */
function reveal() {
  document.documentElement.classList.add("js");
  const items = document.querySelectorAll(".project,.stats div,.more-label");
  if (!("IntersectionObserver" in window)) return items.forEach(i => i.classList.add("in"));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.06 });
  items.forEach(i => io.observe(i));
}

document.addEventListener("click", e => {
  const b = e.target.closest(".not-hosted");
  if (!b) return;
  b.textContent = "Project not hosted";
  b.classList.add("off");
  clearTimeout(b._t);
  b._t = setTimeout(() => { b.textContent = "View Project"; b.classList.remove("off"); }, 2500);
});

/* ---------- slideshows ---------- */
function slideshows() {
  document.querySelectorAll(".slideshow").forEach(el => {
    const slides = [...el.querySelectorAll("img")];
    const count = el.querySelector(".ss-count");
    let i = 0, timer = null;
    const show = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("on", k === i));
      count.textContent = `${pad(i + 1)} / ${pad(slides.length)}`;
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const play = () => { if (!REDUCED && !timer) timer = setInterval(() => show(i + 1), 3500); };
    el.querySelector(".prev").addEventListener("click", () => { show(i - 1); stop(); play(); });
    el.querySelector(".next").addEventListener("click", () => { show(i + 1); stop(); play(); });
    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", play);
    el.addEventListener("focusin", stop);
    el.addEventListener("focusout", play);
    show(0);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? play() : stop()), { threshold: 0.3 }).observe(el);
    } else play();
  });
}

/* ---------- local videos: lazy source, one plays at a time ---------- */
function initVideos() {
  const medias = [...document.querySelectorAll(".media[data-video]")];
  let current = null;
  medias.forEach(m => {
    const v = m.querySelector("video"), bar = m.querySelector(".vbar");
    const bPlay = m.querySelector(".vb-play"), bMute = m.querySelector(".vb-mute"), bFull = m.querySelector(".vb-full");
    const fill = m.querySelector(".vb-track b"), track = m.querySelector(".vb-track");
    let loaded = false, failed = false, userPaused = false;

    const sync = () => {
      const playing = !v.paused;
      bPlay.setAttribute("aria-label", playing ? "Pause" : "Play");
      bPlay.classList.toggle("on", playing);
      bMute.classList.toggle("on", !v.muted);
      bMute.setAttribute("aria-label", v.muted ? "Unmute" : "Mute");
      m.classList.toggle("is-playing", playing);
    };
    const load = () => {
      if (loaded || failed) return;
      loaded = true;
      v.addEventListener("error", () => { failed = true; m.classList.add("no-video"); bar.hidden = true; }, { once: true });
      v.addEventListener("loadeddata", () => { m.classList.add("ready"); bar.hidden = false; }, { once: true });
      v.src = m.dataset.video; v.preload = "auto"; v.load();
    };
    const play = () => {
      if (failed) return;
      load();
      if (current && current !== v) current.pause();
      current = v;
      const pr = v.play(); if (pr && pr.catch) pr.catch(() => {});
    };
    v.addEventListener("play", () => { if (current && current !== v) current.pause(); current = v; sync(); });
    v.addEventListener("pause", sync);
    v.addEventListener("volumechange", sync);
    v.addEventListener("timeupdate", () => { if (v.duration) fill.style.width = (v.currentTime / v.duration * 100) + "%"; });
    bPlay.addEventListener("click", () => { if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); } });
    m.addEventListener("click", e => {          // click on the picture toggles playback
      if (e.target.closest(".vbar")) return;
      if (failed) return;
      if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); }
    });
    bMute.addEventListener("click", () => { v.muted = !v.muted; });
    bFull.addEventListener("click", () => {
      const f = v.requestFullscreen || v.webkitRequestFullscreen || v.webkitEnterFullscreen;
      if (document.fullscreenElement) document.exitFullscreen(); else if (f) f.call(v);
    });
    track.addEventListener("click", e => {
      if (!v.duration) return;
      const r = track.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration;
    });
    sync();

    if (!("IntersectionObserver" in window)) return;
    // preload shortly before it scrolls in; play only while mostly visible
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { load(); } }), { rootMargin: "400px 0px" }).observe(m);
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (!REDUCED && !userPaused) play(); }
      else { v.pause(); }
    }), { threshold: 0.55 }).observe(m);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && current) current.pause(); });
}

/* ---------- Vehicle Dynamics 3D viewport (lazy; the only 3D model on the page) ---------- */
function initViewer() {
  const el = document.querySelector(".viewer");
  if (!el) return;
  const fail = msg => { el.classList.add("failed"); const s = el.querySelector(".viewer-state"); if (s) s.innerHTML = `<em>${esc(msg)}</em>`; };
  const gl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } })();
  if (!gl) return fail("3D preview unavailable on this device");
  let started = false;
  const start = () => {
    if (started) return; started = true;
    import("./vehicle-viewer.js").then(m => m.mountViewer(el, { reduced: REDUCED })).catch(err => { console.warn("[viewer]", err); fail("3D preview unavailable"); });
  };
  if (!("IntersectionObserver" in window)) return start();
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); start(); } }), { rootMargin: "300px 0px" });
  io.observe(el);
}

render();
slideshows();
reveal();
initVideos();
initViewer();

/* ---------- hero: subtle pointer / scroll parallax on the image ---------- */
function heroParallax() {
  const media = document.querySelector(".hero-media");
  if (!media || REDUCED) return;
  const fine = matchMedia("(pointer: fine)").matches;
  let tx = 0, ty = 0, x = 0, y = 0, sy = 0, raf = 0, visible = true;
  const hero = document.querySelector(".hero");
  const loop = () => {
    x += (tx - x) * 0.06; y += (ty - y) * 0.06;
    media.style.transform = `translate3d(${x.toFixed(2)}px,${(y + sy).toFixed(2)}px,0) scale(1.04)`;
    raf = (visible && (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05)) ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(loop); };
  if (fine) hero.addEventListener("pointermove", e => {
    tx = (e.clientX / innerWidth - 0.5) * -14; ty = (e.clientY / innerHeight - 0.5) * -8; kick();
  }, { passive: true });
  addEventListener("scroll", () => { if (visible) { sy = Math.min(scrollY, innerHeight) * 0.12; kick(); media.style.transform = `translate3d(${x.toFixed(2)}px,${(y + sy).toFixed(2)}px,0) scale(1.04)`; } }, { passive: true });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
}
heroParallax();

/* ---------- hero rolling tabs ---------- */
function tabrail() {
  const root = document.getElementById("tabrail");
  if (!root) return;
  const N = TABS.length;
  const card = (t, k, dup) => `<a class="tab" href="#${esc(t.target)}"${dup ? ' tabindex="-1" aria-hidden="true"' : ""}>
    <span class="tab-img"><img src="${esc(t.img)}" alt="" ${k || dup ? 'loading="lazy"' : ""} draggable="false"></span>
    <span class="tab-label"><i>${pad(k + 1)}</i>${esc(t.title)}</span></a>`;
  root.innerHTML = `<div class="tabs-viewport" tabindex="-1" aria-label="Featured projects"><div class="tabs-track">${
    [0, 1, 2].map(c => TABS.map((t, k) => card(t, k, c !== 1)).join("")).join("")}</div></div>
    <div class="tab-ctrl"><span class="tab-bar"><b></b></span><span class="tab-count"></span>
      <button type="button" class="tab-btn" data-d="-1" aria-label="Previous">&#8249;</button>
      <button type="button" class="tab-btn" data-d="1" aria-label="Next">&#8250;</button></div>`;
  const vp = root.querySelector(".tabs-viewport"), cards = [...vp.querySelectorAll(".tab")];
  const bar = root.querySelector(".tab-bar b"), count = root.querySelector(".tab-count");
  let step, setW, pad0, pos = 0, paused = false, resume, frame = 0, onscreen = true;
  const measure = () => {
    step = cards[1].offsetLeft - cards[0].offsetLeft; setW = step * N;
    pad0 = document.querySelector(".hero-copy").getBoundingClientRect().left + parseFloat(getComputedStyle(document.querySelector(".hero-copy")).paddingLeft);
  };
  const wrap = () => { if (vp.scrollLeft < setW * 0.5) vp.scrollLeft += setW; else if (vp.scrollLeft >= setW * 1.5) vp.scrollLeft -= setW; pos = vp.scrollLeft; };
  const mark = () => {
    const i = ((Math.round((vp.scrollLeft + pad0 - setW) / step) % N) + N) % N;
    cards.forEach((c, k) => c.classList.toggle("on", k % N === i));
    count.textContent = `${pad(i + 1)} / ${pad(N)}`; bar.style.width = `${((i + 1) / N) * 100}%`;
  };
  const hold = ms => { paused = true; clearTimeout(resume); resume = setTimeout(() => { wrap(); paused = false; }, ms); };
  const tick = () => {
    if (onscreen) {
      if (!paused && !REDUCED) { pos += 0.45; vp.scrollLeft = pos; if (pos >= setW * 1.5) wrap(); }
      if (++frame % 8 === 0) mark();
    }
    requestAnimationFrame(tick);
  };
  const init = () => { measure(); vp.scrollLeft = pos = setW - pad0; mark(); };
  init();
  addEventListener("resize", init);
  new IntersectionObserver(es => { onscreen = es[0].isIntersecting; }).observe(root);
  vp.addEventListener("pointerenter", () => { paused = true; clearTimeout(resume); });
  vp.addEventListener("pointerleave", () => hold(400));
  vp.addEventListener("touchstart", () => hold(2500), { passive: true });
  vp.addEventListener("focusin", () => { paused = true; clearTimeout(resume); });
  vp.addEventListener("focusout", () => hold(400));
  root.querySelectorAll(".tab-btn").forEach(b => b.addEventListener("click", () => {
    hold(1200); vp.scrollBy({ left: step * Number(b.dataset.d), behavior: "smooth" });
  }));
  requestAnimationFrame(tick);
}
tabrail();
