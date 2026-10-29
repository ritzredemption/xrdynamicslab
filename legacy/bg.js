/* =====================================================================
   XR DYNAMICS — living point-cloud background
   ---------------------------------------------------------------------
   * One fixed, full-screen WebGL canvas behind the page (#bg-canvas).
   * ~40-70k points on a flowing 3D landscape, rendered as GPU sprites.
   * Per-point spring / inertia / damping physics runs on the GPU
     (ping-pong half-float texture: left half = offset, right half = velocity).
   * The hero photo is hidden by default. It is revealed only where the
     cursor has pushed points away, through a screen-space "vacated area" mask.
   * Falls back to the original static hero image if WebGL2 / CDN is missing.

   To self-host Three.js instead of the CDN: download
   https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js
   next to this file and set THREE_URL = "./three.module.min.js".
   ===================================================================== */
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";

(async () => {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  let THREE;
  try { THREE = await import(THREE_URL); } catch (e) { return; }
  try { start(THREE, canvas); }
  catch (e) { console.warn("[bg] point-cloud disabled:", e); document.documentElement.classList.remove("has-bg"); }
})();

function start(THREE, canvas) {
  THREE.ColorManagement.enabled = false;           // all colours below are display-space values
  const BG = 0x05080d;
  const SHOW_PHOTO = false;                        // hero photo reveal disabled: pixels simply appear around the cursor
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance", stencil: false, depth: false });
  if (!renderer.capabilities.isWebGL2) throw new Error("WebGL2 required");
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(BG, 1);
  renderer.autoClear = true;
  const ext = renderer.extensions;
  const physics = !reduced && (ext.has("EXT_color_buffer_float") || ext.has("EXT_color_buffer_half_float"));

  /* ---------- quality tiers (cols x rows, pixel-ratio cap) ---------- */
  const TIERS = [
    { cols: 640, rows: 260, dpr: 1.5 },
    { cols: 440, rows: 180, dpr: 1.4 },
    { cols: 300, rows: 120, dpr: 1.1 }
  ];
  let tier = 0;
  const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  if (coarse || innerWidth < 760) tier = 1;
  if (mem <= 2 || cores <= 2) tier = 2; else if (mem <= 4 && cores <= 4) tier = Math.max(tier, 1);

  /* ---------- scene constants ---------- */
  const CAM_Z = 22, CAM_Y = 8, Z_NEAR = 17, Z_LEN = 150, BASE_W = 170;
  const BASE_FOV = 42;

  /* ---------- terrain: identical in GLSL and JS ---------- */
  const GLSL_COMMON = /* glsl */`
    uniform sampler2D tState;
    uniform vec2  uGrid;
    uniform float uWidth, uTime;
    float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    float terrain(vec2 p, float t){
      vec2 q = p + vec2(4.0*sin(p.y*0.045 + t*0.07), 4.0*cos(p.x*0.038 - t*0.06));
      float h = 2.4*sin(q.x*0.085 + q.y*0.040 + t*0.20)
              + 1.5*sin(q.x*0.045 - q.y*0.095 - t*0.16 + 1.3)
              + 0.7*sin(q.x*0.210 + q.y*0.170 + t*0.28 + 2.1)
              + 0.28*sin(q.x*0.480 - q.y*0.390 - t*0.40);
      float f = 1.0 - smoothstep(-110.0, 10.0, p.y);
      return h * (1.2 + 1.0*f);
    }
    vec3 restPos(vec2 ref, float t){
      vec2 id = floor(ref * uGrid);
      vec2 j = vec2(hash12(id + 3.1), hash12(id + 9.7)) - 0.5;
      float v = ref.y;
      float x = (ref.x - 0.5) * uWidth + j.x * 0.12 * (uWidth / uGrid.x);
      float z = ${Z_NEAR.toFixed(1)} - ${Z_LEN.toFixed(1)} * (0.55*v + 0.45*v*v) + j.y * 0.12;
      return vec3(x, terrain(vec2(x, z), t), z);
    }`;
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const terrainJS = (x, z, t) => {
    const qx = x + 4 * Math.sin(z * 0.045 + t * 0.07), qz = z + 4 * Math.cos(x * 0.038 - t * 0.06);
    const h = 2.4 * Math.sin(qx * 0.085 + qz * 0.040 + t * 0.20)
            + 1.5 * Math.sin(qx * 0.045 - qz * 0.095 - t * 0.16 + 1.3)
            + 0.7 * Math.sin(qx * 0.210 + qz * 0.170 + t * 0.28 + 2.1)
            + 0.28 * Math.sin(qx * 0.480 - qz * 0.390 - t * 0.40);
    return h * (1.2 + 1.0 * (1 - sstep(-110, 10, z)));
  };

  /* ---------- shared uniforms ---------- */
  const shared = {
    uGrid:  { value: new THREE.Vector2(1, 1) },
    uWidth: { value: BASE_W },
    uTime:  { value: reduced ? 14 : 0 },
    tState: { value: null }
  };
  const U = o => Object.assign({}, shared, o);

  /* ---------- simulation pass (full-screen triangle) ---------- */
  const triGeo = new THREE.BufferGeometry();
  triGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const simCam = new THREE.Camera();
  const simU = U({
    uRes: { value: new THREE.Vector2(2, 1) }, uDt: { value: 1 / 60 },
    uK: { value: 5.5 }, uC: { value: 2.0 }, uRadius: { value: 10 }, uActive: { value: 0 },
    uMA: { value: new THREE.Vector2() }, uMB: { value: new THREE.Vector2() }, uMVel: { value: new THREE.Vector2() }
  });
  const simMat = new THREE.ShaderMaterial({
    uniforms: simU, depthTest: false, depthWrite: false,
    vertexShader: `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform vec2 uRes, uMA, uMB, uMVel;
      uniform float uDt, uK, uC, uRadius, uActive;
      void main(){
        vec2 uv   = gl_FragCoord.xy / uRes;
        bool isV  = uv.x >= 0.5;
        vec2 uvP  = vec2(isV ? uv.x - 0.5 : uv.x, uv.y);
        vec2 uvV  = uvP + vec2(0.5, 0.0);
        vec3 d = texture2D(tState, uvP).xyz;
        vec3 v = texture2D(tState, uvV).xyz;
        vec2 ref = vec2(uvP.x * 2.0, uvP.y);
        vec2 id  = floor(ref * uGrid);
        float h1 = hash12(id), h2 = hash12(id + 17.1), h3 = hash12(id + 43.7);

        vec3 rest = restPos(ref, uTime);
        vec2 pxz  = rest.xz + d.xz;

        // distance to the cursor's path this frame (segment A->B) => no gaps on fast moves
        vec2 ab = uMB - uMA;
        float L2 = dot(ab, ab);
        float s  = L2 > 1e-5 ? clamp(dot(pxz - uMA, ab) / L2, 0.0, 1.0) : 1.0;
        vec2 rel = pxz - (uMA + ab * s);
        float dist = length(rel);
        vec2 dir = dist > 1e-3 ? rel / dist : vec2(cos(h1 * 6.2831), sin(h1 * 6.2831));
        float q = dist / uRadius;
        float fall = exp(-q * q * 1.7) * uActive;

        float k    = uK * (0.78 + 0.5 * h3);              // each point has its own stiffness
        float push = uK * uRadius * 0.60;
        float lift = uK * uRadius * 0.34;
        vec3 F = vec3(0.0);
        F.xz += dir * fall * push * (0.55 + 0.9 * h1);                       // scatter away
        F.xz += vec2(-dir.y, dir.x) * fall * push * (h2 - 0.5) * 0.7;        // slight swirl
        F.xz += uMVel * fall * 0.55;                                         // drag along the wake
        F.y  += fall * lift * (0.45 + 0.9 * h2);                             // rise

        vec3 acc = F - d * k - v * uC;                    // spring + damping
        v += acc * uDt;                                   // inertia
        d += v * uDt;
        float m = length(d), mx = uRadius * 2.4 + 2.0;
        if (m > mx) d *= mx / m;
        gl_FragColor = isV ? vec4(v, 0.0) : vec4(d, 0.0);
      }`
  });
  const simMesh = new THREE.Mesh(triGeo, simMat); simMesh.frustumCulled = false;
  const simScene = new THREE.Scene(); simScene.add(simMesh);

  /* ---------- hero photo (revealed through the mask) ---------- */
  const heroEl = document.querySelector(".hero");
  const heroImgEl = document.querySelector(".hero-img");
  const imgTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  imgTex.needsUpdate = true;
  const maskRT = new THREE.WebGLRenderTarget(4, 4, {
    type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    depthBuffer: false, stencilBuffer: false
  });
  const imgU = {
    tImg: { value: imgTex }, tMask: { value: maskRT.texture },
    uView: { value: new THREE.Vector2(1, 1) }, uHero: { value: new THREE.Vector3(0, 1, 1) },
    uImgSize: { value: new THREE.Vector2(1920, 1080) }, uPar: { value: new THREE.Vector2() },
    uObjX: { value: 0.7 }, uBase: { value: reduced || !physics ? 0.3 : 0 }
  };
  const imgMat = new THREE.ShaderMaterial({
    uniforms: imgU, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tImg, tMask;
      uniform vec2 uView, uImgSize, uPar;
      uniform vec3 uHero;          // x: hero top (viewport px), y: width, z: height
      uniform float uObjX, uBase;
      varying vec2 vUv;
      void main(){
        vec2 m = texture2D(tMask, vUv).rg;                    // r: sum(energy*w)  g: sum(w)
        float energy = m.x / (m.y + 1e-4);                    // local mean displacement
        float cover  = 1.0 - exp(-m.y * 1.2);
        float rev = smoothstep(0.08, 0.60, energy) * cover;
        rev = max(rev, uBase);

        vec2 px = vec2(vUv.x * uView.x, (1.0 - vUv.y) * uView.y) - uPar;
        float hy = px.y - uHero.x;
        float s  = max(uHero.y / uImgSize.x, uHero.z / uImgSize.y) * 1.03;   // object-fit: cover
        vec2 drawn = uImgSize * s;
        vec2 off = vec2((uHero.y - drawn.x) * uObjX, (uHero.z - drawn.y) * 0.5);
        vec2 iuv = vec2((px.x - off.x) / drawn.x, (hy - off.y) / drawn.y);
        float inside = step(0.0, hy) * smoothstep(0.0, 90.0, uHero.z - hy);
        vec3 img = texture2D(tImg, vec2(iuv.x, 1.0 - iuv.y)).rgb;
        gl_FragColor = vec4(img * 0.94, rev * inside);
      }`
  });
  const imgMesh = new THREE.Mesh(triGeo, imgMat); imgMesh.frustumCulled = false; imgMesh.renderOrder = 0;

  const srcUrl = (heroImgEl && (heroImgEl.currentSrc || heroImgEl.src)) || "assets/hero.jpg";
  if (SHOW_PHOTO) new THREE.TextureLoader().load(srcUrl, t => {
    t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
    imgTex.dispose(); imgU.tImg.value = t;
    imgU.uImgSize.value.set(t.image.naturalWidth || t.image.width, t.image.naturalHeight || t.image.height);
    if (reduced) draw();
  });

  /* ---------- points ---------- */
  const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 1, 400);
  const ptsU = U({
    uFocalPx: { value: 1000 }, uSpacing: { value: 0.4 }, uPointScale: { value: 0.19 },
    uMinPx: { value: 1.6 }, uDim: { value: 1 }, uEnergyScale: { value: 5 }
  });
  const ptsMat = new THREE.ShaderMaterial({
    uniforms: ptsU, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: GLSL_COMMON + /* glsl */`
      attribute vec2 aRef;
      uniform float uFocalPx, uSpacing, uPointScale, uMinPx, uDim, uEnergyScale;
      varying vec3 vCol; varying float vA;
      void main(){
        vec2 uvP = vec2(aRef.x * 0.5, aRef.y);
        vec3 d = texture2D(tState, uvP).xyz;
        vec3 rest = restPos(aRef, uTime);
        vec4 mv = viewMatrix * vec4(rest + d, 1.0);
        float dist = -mv.z;
        gl_Position = projectionMatrix * mv;

        // slope-based lighting from the undisturbed surface
        float e = 0.35;
        float hx = terrain(rest.xz + vec2(e, 0.0), uTime) - terrain(rest.xz - vec2(e, 0.0), uTime);
        float hz = terrain(rest.xz + vec2(0.0, e), uTime) - terrain(rest.xz - vec2(0.0, e), uTime);
        vec3 n = normalize(vec3(-hx, 2.0 * e, -hz));
        float lam = dot(n, normalize(vec3(-0.35, 0.55, -0.75))) * 0.5 + 0.5;
        float hN  = clamp(rest.y * 0.07 + 0.5, 0.0, 1.0);
        float h1  = hash12(floor(aRef * uGrid));
        float en  = smoothstep(0.02, 0.9, length(d) / uEnergyScale);

        // each pixel drifts through the palette: deep blue -> blue -> violet -> magenta
        float ph = aRef.x * 0.80 + 0.22 * sin(uTime * 0.35 + rest.y * 0.30 + rest.x * 0.02)
                 + (h1 - 0.5) * 0.30 + hN * 0.20 + en * 0.45;
        ph = clamp(ph, 0.0, 1.0) * 3.0;
        vec3 c0 = vec3(0.30, 0.33, 0.40), c1 = vec3(0.40, 0.44, 0.52), c2 = vec3(0.50, 0.52, 0.58), c3 = vec3(0.60, 0.61, 0.65);   // muted greys with a cool tint
        vec3 col = ph < 1.0 ? mix(c0, c1, ph) : (ph < 2.0 ? mix(c1, c2, ph - 1.0) : mix(c2, c3, ph - 2.0));
        col = mix(col, vec3(0.74, 0.76, 0.81), clamp(pow(lam, 4.0) * 0.25 + en * 0.35, 0.0, 1.0));

        float lit = 0.16 + 0.85 * pow(lam, 2.4) + 0.30 * hN * hN;
        float vis = 0.035 + 0.965 * smoothstep(0.02, 0.45, en);   // hidden at rest, appears under the cursor
        float tw  = 0.86 + 0.14 * sin(uTime * 1.7 + h1 * 60.0);
        float fog  = 1.0 - smoothstep(55.0, 170.0, dist);
        float near = smoothstep(3.0, 11.0, dist);
        float edge = 1.0 - smoothstep(0.80, 1.0, abs(aRef.x - 0.5) * 2.0);

        // keep the hero copy (left side) readable: calm the field behind it
        vec2 sc = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
        float textZone = mix(1.0, 0.42, (1.0 - smoothstep(0.30, 0.66, sc.x)) * smoothstep(0.05, 0.40, sc.y) * (1.0 - smoothstep(0.62, 0.95, sc.y)));

        float spPx = uSpacing * uFocalPx / dist;
        float raw  = spPx * uPointScale * (1.0 + en * 0.30);
        float core = clamp(raw, uMinPx, 8.0);
        gl_PointSize = core * 1.25;
        vA = lit * tw * vis * (1.0 + en * 0.6) * fog * near * edge * min(raw / uMinPx, 1.0) * uDim * textZone * 1.15;
        vCol = col;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){
        // crisp square pixel with a hair of edge softness
        vec2 c = abs(gl_PointCoord * 2.0 - 1.0);
        float m = max(c.x, c.y);
        float box = 1.0 - smoothstep(0.72, 0.80, m);
        gl_FragColor = vec4(vCol, box * vA);
      }`
  });
  const maskU = U({ uFocalPx: { value: 300 }, uSpacing: { value: 0.4 }, uEnergyScale: { value: 5 } });
  const maskMat = new THREE.ShaderMaterial({
    uniforms: maskU, transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    vertexShader: GLSL_COMMON + /* glsl */`
      attribute vec2 aRef;
      uniform float uFocalPx, uSpacing, uEnergyScale;
      varying float vE;
      void main(){
        vec2 uvP = vec2(aRef.x * 0.5, aRef.y);
        vec3 d = texture2D(tState, uvP).xyz;
        vec4 mv = viewMatrix * vec4(restPos(aRef, uTime), 1.0);   // where the point *came from*
        float dist = -mv.z;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uSpacing * uFocalPx / dist * 3.6, 12.0, 56.0);
        vE = smoothstep(0.05, 0.9, length(d) / uEnergyScale);
        if (dist < 3.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying float vE;
      void main(){
        vec2 c = gl_PointCoord * 2.0 - 1.0;
        float r2 = dot(c, c);
        if (r2 > 1.0) discard;
        float w = exp(-r2 * 3.2);
        gl_FragColor = vec4(vE * w, w, 0.0, 1.0);
      }`
  });

  const scene = new THREE.Scene(); if (SHOW_PHOTO) scene.add(imgMesh);
  const maskScene = new THREE.Scene();
  let points = null, maskPoints = null, geo = null, rtA = null, rtB = null;

  /* ---------- (re)build particle buffers for a tier ---------- */
  function build() {
    const { cols, rows } = TIERS[tier];
    if (points) { scene.remove(points); maskScene.remove(maskPoints); geo.dispose(); }
    [rtA, rtB].forEach(r => r && r.dispose());
    const n = cols * rows, ref = new Float32Array(n * 2);
    for (let j = 0, i = 0; j < rows; j++) for (let k = 0; k < cols; k++, i += 2) { ref[i] = (k + 0.5) / cols; ref[i + 1] = (j + 0.5) / rows; }
    geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute("aRef", new THREE.BufferAttribute(ref, 2));
    points = new THREE.Points(geo, ptsMat); points.frustumCulled = false; points.renderOrder = 1; scene.add(points);
    maskPoints = new THREE.Points(geo, maskMat); maskPoints.frustumCulled = false; maskScene.add(maskPoints);
    if (physics) {
      const o = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false };
      rtA = new THREE.WebGLRenderTarget(cols * 2, rows, o); rtB = new THREE.WebGLRenderTarget(cols * 2, rows, o);
      renderer.setClearColor(0x000000, 0);
      [rtA, rtB].forEach(r => { renderer.setRenderTarget(r); renderer.clear(); });
      renderer.setRenderTarget(null); renderer.setClearColor(BG, 1);
      simU.uRes.value.set(cols * 2, rows);
    } else {
      const z = new THREE.DataTexture(new Uint8Array(4), 1, 1); z.needsUpdate = true;   // zero offsets
      rtA = { texture: z, dispose() {} };
    }
    shared.uGrid.value.set(cols, rows);
    shared.tState.value = rtA.texture;
    resize(true);
  }

  /* ---------- sizing ---------- */
  let W = 1, H = 1, dpr = 1, tanHalf = Math.tan(BASE_FOV * Math.PI / 360);
  function resize(force) {
    const w = innerWidth, h = Math.round(canvas.clientHeight) || innerHeight;
    if (!force && w === W && h === H) return;
    W = w; H = h;
    dpr = Math.min(window.devicePixelRatio || 1, TIERS[tier].dpr);
    renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
    const aspect = W / H;
    const hMin = 2 * Math.atan(Math.tan(BASE_FOV * Math.PI / 360) * 1.25);
    let fov = BASE_FOV;
    if (aspect < 1.25) fov = Math.min(68, 2 * Math.atan(Math.tan(hMin / 2) / aspect) * 180 / Math.PI);
    camera.fov = fov; camera.aspect = aspect; camera.updateProjectionMatrix();
    tanHalf = Math.tan(fov * Math.PI / 360);
    shared.uWidth.value = BASE_W * Math.min(1.4, Math.max(0.45, aspect / 1.78));
    const sp = shared.uWidth.value / TIERS[tier].cols;
    ptsU.uSpacing.value = maskU.uSpacing.value = sp;
    const mw = Math.ceil(W / 4), mh = Math.ceil(H / 4);
    if (SHOW_PHOTO) maskRT.setSize(mw, mh);
    maskU.uFocalPx.value = mh / (2 * tanHalf);
    ptsU.uFocalPx.value = renderer.domElement.height / (2 * tanHalf);
    ptsU.uMinPx.value = 0.9 + 0.5 * dpr;
    imgU.uView.value.set(W, H);
    imgU.uObjX.value = W <= 820 ? 0.75 : 0.7;
    readHero();
  }
  const hero = { top: 0, w: 1, h: 1 };
  function readHero() {
    if (!heroEl) return;
    const r = heroEl.getBoundingClientRect();
    hero.top = r.top; hero.w = r.width; hero.h = r.height;
    imgU.uHero.value.set(hero.top, hero.w, hero.h);
  }

  /* ---------- pointer / touch ---------- */
  const ptr = { x: 0, y: 0, inside: false, px: 0, py: 0, lastUser: -1e9 };
  const userMoved = (x, y) => { ptr.x = x; ptr.y = y; ptr.inside = true; ptr.lastUser = performance.now(); ghost = null; };
  addEventListener("pointermove", e => { if (e.pointerType !== "touch") { userMoved(e.clientX, e.clientY); ptr.px = e.clientX / W - 0.5; ptr.py = e.clientY / H - 0.5; } }, { passive: true });
  const touch = e => { const t = e.touches[0]; if (t) userMoved(t.clientX, t.clientY); };
  addEventListener("touchstart", touch, { passive: true });
  addEventListener("touchmove", touch, { passive: true });
  const leave = () => { ptr.inside = false; };
  addEventListener("touchend", leave, { passive: true }); addEventListener("touchcancel", leave, { passive: true });
  document.documentElement.addEventListener("mouseleave", leave); addEventListener("blur", leave);

  /* intro / idle demo: a ghost cursor sweeps the hero so the reveal is discoverable (also on touch) */
  let ghost = null, nextIdle = 900;
  const startGhost = now => { ghost = { t0: now, dur: 4600 }; };
  const ease = u => u * u * (3 - 2 * u);

  /* ---------- ray -> landscape ---------- */
  const tmpV = new THREE.Vector3(), dirV = new THREE.Vector3();
  function pick(cx, cy, time) {
    tmpV.set(cx / W * 2 - 1, -(cy / H) * 2 + 1, 0.5).unproject(camera);
    dirV.copy(tmpV).sub(camera.position).normalize();
    if (dirV.y > -0.012) return null;
    const o = camera.position;
    let t = -o.y / dirV.y;
    for (let i = 0; i < 4; i++) {
      const x = o.x + dirV.x * t, z = o.z + dirV.z * t;
      t = Math.min(165, Math.max(6, (terrainJS(x, z, time) - o.y) / dirV.y));
    }
    return { x: o.x + dirV.x * t, z: o.z + dirV.z * t, dist: t };
  }

  /* ---------- main loop ---------- */
  const mouse = { x: 0, z: 0, has: false }, mA = new THREE.Vector2(), mB = new THREE.Vector2(), mVel = new THREE.Vector2();
  let act = 0, radius = 10, lastActive = -1e9, time = reduced ? 14 : 0, last = performance.now(), simAcc = 0;
  let par = { x: 0, y: 0 }, camTgt = new THREE.Vector3(), lastSy = -1, frames = 0, emaDt = 1 / 60, lastTierChange = 0, shown = false, raf = 0;
  const radiusPx = coarse ? 120 : 190;

  function draw() {
    renderer.render(scene, camera);
  }

  let skip = false;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (scrollY > innerHeight * 1.2) { skip = !skip; if (skip) return; }   // 30 fps is plenty for a faint backdrop
    const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    if (frames > 45) emaDt += (dt - emaDt) * 0.04;
    frames++;
    time += dt; shared.uTime.value = time;

    // scroll
    const sy = scrollY, sc = Math.min(sy / H, 2);
    if (sy !== lastSy || frames % 30 === 0) { readHero(); lastSy = sy; }
    ptsU.uDim.value = 1 - 0.55 * sstep(0.08, 0.7, sy / H);   // fainter once you leave the hero, still just visible

    // camera: eased parallax from the real cursor + gentle scroll tilt
    const k = 1 - Math.exp(-dt * 3);
    par.x += ((ptr.inside && !coarse ? ptr.px : 0) - par.x) * k;
    par.y += ((ptr.inside && !coarse ? ptr.py : 0) - par.y) * k;
    camera.position.set(par.x * 3.2, CAM_Y - par.y * 1.1, CAM_Z);
    camTgt.set(-par.x * 1.6, -3.5 - sc * 2.5 + par.y * 0.8, -30);
    camera.lookAt(camTgt); camera.updateMatrixWorld();
    imgU.uPar.value.set(-par.x * 14, -par.y * 8);

    // idle demo
    if (!reduced && physics) {
      const idleFor = now - Math.max(ptr.lastUser, 0);
      if (!ghost && !ptr.inside && idleFor > nextIdle && sy < H * 0.4) { startGhost(now); nextIdle = 22000; }
    }
    let cx = ptr.x, cy = ptr.y, want = ptr.inside;
    if (ghost) {
      const u = (now - ghost.t0) / ghost.dur;
      if (u >= 1) { ghost = null; ptr.lastUser = now; }
      else {
        cx = W * (0.14 + 0.72 * ease(u)); cy = H * (0.55 + 0.13 * Math.sin(u * Math.PI * 2.5 + 0.6));
        want = u > 0.03 && u < 0.97;
      }
    }

    if (physics) {
      // cursor -> point on the landscape, smoothed so deformation flows
      const hit = want ? pick(cx, cy, time) : null;
      act += ((hit ? 1 : 0) - act) * (1 - Math.exp(-dt * 5));
      if (hit) {
        const rWorld = Math.min(36, Math.max(2.5, radiusPx * 2 * hit.dist * tanHalf / H));
        radius += (rWorld - radius) * (1 - Math.exp(-dt * 6));
        if (!mouse.has || act < 0.05) { mouse.x = hit.x; mouse.z = hit.z; mouse.has = true; mA.set(hit.x, hit.z); }
        const f = 1 - Math.exp(-dt * 14);
        mA.set(mouse.x, mouse.z);
        mouse.x += (hit.x - mouse.x) * f; mouse.z += (hit.z - mouse.z) * f;
        mB.set(mouse.x, mouse.z);
        const vx = (mB.x - mA.x) / Math.max(dt, 1e-3), vz = (mB.y - mA.y) / Math.max(dt, 1e-3);
        mVel.x += (vx - mVel.x) * 0.25; mVel.y += (vz - mVel.y) * 0.25;
        const vm = mVel.length(), vmax = radius * 6;
        if (vm > vmax) mVel.multiplyScalar(vmax / vm);
      } else { mVel.multiplyScalar(0.9); mA.copy(mB); }
      if (act > 0.003) lastActive = now;

      simU.uActive.value = act; simU.uRadius.value = radius; simU.uMA.value.copy(mA); simU.uMB.value.copy(mB); simU.uMVel.value.copy(mVel);
      ptsU.uEnergyScale.value = maskU.uEnergyScale.value = radius * 0.5;

      if (now - lastActive < 6000) {                      // sim sleeps once everything has settled
        simAcc += dt;
        let steps = 0;
        while (simAcc >= 1 / 60 && steps < 3) {
          simU.uDt.value = 1 / 60; simMat.uniforms.tState.value = rtA.texture;
          renderer.setRenderTarget(rtB); renderer.render(simScene, simCam);
          const t = rtA; rtA = rtB; rtB = t; shared.tState.value = rtA.texture;
          simAcc -= 1 / 60; steps++;
        }
        if (steps === 3) simAcc = 0;
        if (SHOW_PHOTO) {
          renderer.setRenderTarget(maskRT); renderer.setClearColor(0x000000, 1); renderer.clear();
          renderer.render(maskScene, camera);
          renderer.setRenderTarget(null); renderer.setClearColor(BG, 1);
        }
      }
    }
    renderer.render(scene, camera);

    if (!shown && frames > 2) { shown = true; root.classList.add("has-bg"); }

    // adaptive quality: drop pixel ratio / density if we can't hold ~50 fps
    if (frames > 150 && now - lastTierChange > 2500 && emaDt > 1 / 46 && tier < TIERS.length - 1) {
      tier++; lastTierChange = now; emaDt = 1 / 60; frames = 46; build();
    }
  }

  /* ---------- go ---------- */
  build();
  let rz = 0;
  addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { resize(); if (reduced) draw(); }, 120); });
  addEventListener("scroll", () => { if (reduced) { readHero(); draw(); } }, { passive: true });
  addEventListener("load", () => { readHero(); if (reduced) draw(); });
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); cancelAnimationFrame(raf); root.classList.remove("has-bg"); shown = false; });
  canvas.addEventListener("webglcontextrestored", () => { build(); last = performance.now(); if (!reduced) raf = requestAnimationFrame(frame); else draw(); });

  if (reduced) {                       // static, calm: one frame, redrawn only on resize/scroll
    camera.position.set(0, CAM_Y, CAM_Z); camTgt.set(0, -3.5, -30); camera.lookAt(camTgt); camera.updateMatrixWorld();
    readHero(); draw(); draw(); root.classList.add("has-bg");
  } else raf = requestAnimationFrame(frame);
}
