/* =====================================================================
   Vehicle Dynamics 3D viewport — the only 3D model on the page.
   Loaded on demand by main.js (dynamic import) once the viewport nears the screen.
   Renders only while visible; pixel ratio capped; everything disposed on pagehide.
   ===================================================================== */
import * as THREE from "three";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { MeshoptDecoder } from "./vendor/meshopt_decoder.module.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

export function mountViewer(host, { reduced = false } = {}) {
  const state = host.querySelector(".viewer-state");
  const fallback = host.querySelector(".viewer-fallback");
  const setState = html => { if (state) state.innerHTML = html; };
  const fail = msg => { host.classList.add("failed"); host.classList.remove("ready"); setState(`<em>${msg}</em>`); };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return fail("3D preview unavailable on this device"); }

  const coarse = matchMedia("(pointer: coarse)").matches;
  const cap = coarse ? 1.5 : 1.75;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, cap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !coarse;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-label", "Interactive 3D vehicle model. Drag to rotate.");
  canvas.setAttribute("role", "img");
  host.prepend(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);

  // lights: cool key from above-front, faint rim from behind; the environment does the rest
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  key.castShadow = renderer.shadowMap.enabled;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9db8ff, 0.9);
  rim.position.set(-4, 2.5, -4);
  scene.add(rim);

  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.55 }));
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // soft floor glow so the car does not float in a void (no extra model)
  const glowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(120,150,210,.34)"); r.addColorStop(1, "rgba(120,150,210,0)");
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -0.002;
  scene.add(glow);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.6;
  controls.minPolarAngle = THREE.MathUtils.degToRad(55);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88);
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.7;
  canvas.style.touchAction = "pan-y";           // keep vertical page scroll on touch devices
  // wheel zoom only after the user has focused/clicked the model, so page scrolling is never hijacked
  controls.enableZoom = false;
  canvas.addEventListener("pointerdown", () => { controls.enableZoom = true; });
  canvas.addEventListener("pointerleave", () => { controls.enableZoom = false; });

  let idleTimer = 0, interacting = false;
  controls.addEventListener("start", () => { interacting = true; controls.autoRotate = false; clearTimeout(idleTimer); });
  controls.addEventListener("end", () => { interacting = false; if (!reduced) idleTimer = setTimeout(() => { controls.autoRotate = true; }, 4000); });

  let model = null, radius = 2.5, centerY = 0.6, dist = 6;
  const frame = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // fit the bounding sphere for both axes
    const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    dist = (radius / Math.sin(Math.min(vf, hf) / 2)) * 0.8;
    controls.minDistance = dist * 0.55; controls.maxDistance = dist * 1.25;
    const dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 1e-6) dir.set(0.8, 0.28, 1);
    dir.setLength(dist);
    camera.position.copy(controls.target).add(dir);
    camera.updateProjectionMatrix();
    needsRender = true;
  };

  let needsRender = true, visible = true, raf = 0, running = false;
  const clock = new THREE.Clock();
  const loop = () => {
    raf = 0; if (!visible || document.hidden) { running = false; return; }
    const moving = controls.autoRotate || interacting;
    const changed = controls.update(clock.getDelta());
    if (moving || changed || needsRender) { renderer.render(scene, camera); needsRender = false; }
    raf = requestAnimationFrame(loop);
  };
  const run = () => { if (!raf && visible && !document.hidden) { running = true; clock.getDelta(); raf = requestAnimationFrame(loop); } };
  controls.addEventListener("change", () => { needsRender = true; run(); });

  const ro = new ResizeObserver(() => { frame(); run(); });
  ro.observe(host);
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) run(); }, { threshold: 0.01 });
  io.observe(host);
  const onVis = () => run();
  document.addEventListener("visibilitychange", onVis);

  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; fail("3D preview paused: graphics context lost"); });
  canvas.addEventListener("webglcontextrestored", () => { host.classList.remove("failed"); host.classList.add("ready"); needsRender = true; run(); });

  const dispose = () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); clearTimeout(idleTimer);
    document.removeEventListener("visibilitychange", onVis);
    controls.dispose();
    scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach(m => { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); });
    });
    envTex.dispose(); pmrem.dispose(); glowTex.dispose(); renderer.dispose();
  };
  addEventListener("pagehide", dispose, { once: true });

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  loader.load(host.dataset.model, gltf => {
    model = gltf.scene;
    // normalise: uniform scale to ~4.8 units long (proportions untouched), rest on the ground, centred on x/z
    model.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(model);
    let sz = box.getSize(new THREE.Vector3());
    model.scale.multiplyScalar(4.8 / Math.max(sz.x, sz.z, 1e-6));
    model.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.x -= c.x; model.position.z -= c.z; model.position.y -= box.min.y;
    model.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(model);
    sz = box.getSize(new THREE.Vector3());
    radius = Math.max(sz.length() / 2, 0.5);
    centerY = sz.y * 0.45;
    model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = true; } });
    scene.add(model);

    const L = Math.max(sz.x, sz.z);
    shadowPlane.scale.setScalar(L / 6);
    glow.scale.setScalar(L * 2.2);
    key.position.set(L * 0.7, L * 1.2, L * 0.9);
    key.shadow.camera.left = -L; key.shadow.camera.right = L; key.shadow.camera.top = L; key.shadow.camera.bottom = -L;
    key.shadow.camera.near = 0.1; key.shadow.camera.far = L * 5; key.shadow.camera.updateProjectionMatrix();
    rim.position.set(-L, L * 0.7, -L);

    controls.target.set(0, centerY, 0);
    // three-quarter front view; long axis decides which side is "front"
    const longZ = sz.z >= sz.x;
    camera.position.set(longZ ? 0.85 : 1, 0.3, longZ ? 1 : 0.85).multiplyScalar(5);
    frame();
    host.classList.add("ready");
    if (fallback) fallback.remove();
    setState("");
    needsRender = true; run();
  }, ev => {
    if (ev.lengthComputable) setState(`<span class="spin" aria-hidden="true"></span><em>Loading 3D model ${Math.round(ev.loaded / ev.total * 100)}%</em>`);
  }, err => { console.warn("[viewer] model failed", err); fail("3D model could not be loaded"); });

  return { dispose };
}
