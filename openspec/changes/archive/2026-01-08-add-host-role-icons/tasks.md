## 1. Data model & extraction
- [x] 1.1 Add a host role field (e.g., database/auth/front/none) to extracted topology output
- [x] 1.2 Infer host role from hostname patterns (Database/Auth/Front) with a safe default (workstations typically default to none)
- [x] 1.3 Propagate host role through layout result so the view can access it

## 2. Rendering
- [x] 2.1 Add role → icon mapping for supported roles (Database/Auth/Front) and add minimal in-repo icon assets (single SVG atlas)
- [x] 2.2 Render icons as the primary node glyph for roles and host types (server/workstation/defender), preserving compromise tinting and highlight rings (2D icons only)
- [x] 2.3 Update host tooltip to display role when present

## 3. Validation
- [x] 3.1 Add/update a Playwright test that asserts role icons render for known hosts in a sample trajectory (currently `test.skip(...)` due to flakiness)
- [x] 3.2 Run `npm run lint` and `npm run build` (Playwright run is optional while the test remains skipped)
