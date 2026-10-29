# XR Dynamics v2

Static site, GitHub Pages ready (no build step, relative paths). Open `index.html` through any static server.

## Where things are
- `index.html`, `style.css`, `main.js` – page, styles, section data (`PROJECTS` array = section order).
- `vehicle-viewer.js` + `vendor/` – self-hosted Three.js viewer, loaded lazily; used ONLY in Vehicle Dynamics.
- `assets/models/mustang.glb` – optimised model (16.6 MB -> 2.6 MB, meshopt + WebP textures).
- `assets/video/` – local mp4 + posters (Vehicle Dynamics, VR Drone).
- `assets/hero-new.jpg` – hero image. `legacy/bg.js` – old point-cloud background, no longer loaded.

## To finish
- **Flight Dynamics video:** add `assets/video/flight-dynamics.mp4`. It plays automatically; until then `cover.jpg` is shown.
- **Robotics video 2:** in `main.js`, section `teleoperation`, replace the second entry with
  `{ video: "assets/video/robotics-02.mp4", poster: "assets/video/robotics-02.jpg", label: "..." }`.
- Robotics shows Teleoperation clips 1-2; XR Interaction shows clips 3-4 (same Drive files, no clip repeated).

## Licence note
The Mustang model is CC BY-NC-SA 4.0 (Ddiaz Design). Attribution is shown under the viewer. It is non-commercial:
replace it or obtain a commercial licence if this portfolio is used to sell services.
