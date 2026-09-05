# Validation — 2026-09-05

## Environment

- macOS / Node 25.8.2 / npm 11.11.1.
- Chrome 148.0.7778.97, headless Playwright.
- Desktop: 1440×1040 and 1280×900.
- Mobile browser emulation: 390×844, touch enabled. CDP touchStart/touchCancel used for contact input.
- Japanese responsive checks: 320, 390, 768, 1440px widths.

## Results

| Check | Result |
|---|---|
| TypeScript strict + production build | PASS |
| Node unit tests | 6 / 6 PASS |
| Main browser suite | 14 desktop + 2 mobile checks PASS |
| Input / lifecycle / responsive suite | 7 / 7 PASS |
| Fullscreen / mobile controls suite | 8 / 8 PASS |
| Production preview: load, walk, Enter, first stamp | PASS |
| Page exceptions | 0 in passing suites |

The main browser suite walks the avatar to all five stops through the rendered UI, collects five unique stamps, reaches completion, opens the passport, changes language, reloads, restores favorites and progress, and verifies cancel/confirm reset. Reading a remote place cannot grant a stamp.

Additional checks cover all time settings, the placeholder photo tabs, paused position stability, mobile path navigation, actual emulated touch contact and cancellation, and unavailable browser storage.

The input suite verifies actual arrow-key motion, Enter interaction, collision with a building, cleared input after leaving a screen, zoom and recenter, simulated WebGL context loss and retry with exactly one replacement canvas, and responsive Japanese layouts.

The fullscreen suite covers native entry and exit, external fullscreen exit events, 393×852 portrait and 852×393 landscape resizing, one retained canvas, unchanged stamps and position, page-scroll restoration, touch movement/cancellation, folded controls and outside-tap dismissal without map click-through. It also covers fullscreen-to-detail entry and stamp collection, Japanese controls, and simulated unsupported/rejected Fullscreen API requests that use the window-sized fallback. Buttons retain 44×44px hit areas around smaller visible icons. These checks use Chrome emulation, not physical Safari/Android devices.

Raw results:

- artifacts/browser-report.json
- artifacts/interaction-report.json
- artifacts/fullscreen-report.json
- artifacts/mobile-controls.png, mobile-fullscreen.png, mobile-map-tools.png, mobile-fullscreen-landscape.png
- artifacts/production-smoke.json
- artifacts/desktop-final.png
- artifacts/desktop.png, night.png, place.png, passport.png, complete.png
- artifacts/mobile.png, mobile-playing.png, mobile-place.png, mobile-passport.png

## Frame timing

During initial demo validation, while the game was visible in desktop headless Chrome, 120 browser requestAnimationFrame intervals were recorded: median **8.3ms**, p95 **9.2ms**.

These are browser scheduling intervals, not an independent measurement of Phaser draw completion, GPU time, native iOS/Android frame rate, thermals, or battery use. The engine is configured with a 60fps target; sustained 60fps on a mid-range physical device remains unverified.

## Build size

Latest build:

- Main JavaScript: approximately 248 kB, 81 kB gzip.
- Dynamically loaded world/Phaser chunk: approximately 1.21 MB, 322 kB gzip.
- CSS: approximately 49 kB, 11 kB gzip.
- Fonts are self-hosted local build assets.

Vite emits a large-chunk warning for the game-engine chunk. The UI and engine are already split through dynamic import. This warning is documented rather than hidden by increasing the warning threshold.

## Fixed during verification

- Phaser ignores a native keyboard event already marked defaultPrevented. Browser scrolling is now suppressed by Phaser's own capture list, and the redundant earlier DOM keyboard handler was removed.
- Phaser defers destruction to a game step. Cleanup wakes an already sleeping engine once so its pending destruction removes the canvas and releases the renderer.
- Location detail entry stops automatic movement before pausing, preserving the exact position on return.
- Resize now immediately recenters the camera on the player, avoiding a temporarily offscreen avatar after orientation/fullscreen changes.
- Focus outlines now require explicit Tab navigation. Verified in the in-app browser: fullscreen exit and tool-button clicks leave no outline; Tab shows the keyboard focus ring, and a subsequent pointer click clears it. Production build passed.

## Limits

No physical iPhone/Android testing, full accessibility conformance audit, real geographic-data validation, photography, 3D scanning, PWA offline reload test, native app export, remote analytics, or public deployment has been performed.

## 2026-09-06 — Real Seongsu neighborhood

- `npm test`: 7/7 passed. Validates progress sanitization, collection, persistence, route collision safety, and all 36 combinations of spawn + five arrival points, including the start/end connecting segments.
- `npm run build`: TypeScript and production build passed. The existing Phaser engine chunk still triggers Vite's >500kB advisory; it remains lazy-loaded.
- `tests/browser.mjs`: 17 checks passed against the production preview on localhost:5198. Actually walked to all five real stops; collected the full passport; checked English/Japanese, reload, favorites, reset and storage denial. The legacy fictional passport remained byte-for-byte unchanged after the new route and reset.
- `tests/interaction.mjs`: 7 checks passed. Held movement stops at the Scène polygon; Enter opens the nearby stop; pause/return, camera tools, context-loss retry and 320–1440px Japanese layouts passed. The measured 120 visible-page RAF samples were median 8.3ms / p95 10.1ms on this desktop; this is not phone GPU performance.
- `tests/fullscreen.mjs`: 8 checks passed against the production preview. Native fullscreen, unsupported/rejected fallback, rotation, outside-tap behavior, exit, same-canvas preservation and desktop Escape/external exit passed. A development-server run during ongoing edits had an Escape timeout; the stable production-preview run passed.
- Additional final-build check: all five detail pages show their real addresses and exact Naver Place links. The OSM credit remains visible in fullscreen and participates in the fallback's forward/backward Tab focus cycle.
- Visual review: desktop, mobile play, place detail and whole-world render. The Codex in-app browser also loaded the new map successfully at localhost:5173.
- Screenshots and machine-readable reports are in ignored `artifacts/`. These are separate test browser contexts; the user's current browser progress was not cleared.

The available OSM geometry is simplified for play. No on-site doorway survey, up-to-the-minute business verification, physical iPhone/Android test, public deployment or remote Git write was performed. Research provenance: [REAL_NEIGHBORHOOD.md](REAL_NEIGHBORHOOD.md).
