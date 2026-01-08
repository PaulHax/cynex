# Change: Add Host Role Icons in Network Graph

## Why
Some hosts in CAGE-style topologies have specific roles (e.g., Database, Auth) but are currently rendered with the same generic server/workstation shapes. This makes it harder to interpret trajectories quickly at a glance.

## What Changes
- Keep existing **host types** (`server`/`workstation`/`defender`) for shape + base styling.
- Infer a **host role** (e.g., `database`/`auth`/`front`) from hostname patterns in topology extraction.
- Render **icons as the primary node glyph** (replacing the generic circle glyphs) for:
	- role hosts (`database`/`auth`/`front`)
	- typed hosts (`server` tower, `workstation` laptop, `defender` badge)
- Preserve action-target highlighting via an outer ring.
- Show the inferred role in the host tooltip.

## Graphics Source
- Icons are shipped as small, in-repo assets in a single SVG atlas rendered via deck.gl's `IconLayer`.
- The atlas is authored to support tinting (IconLayer masking), and icon color reflects compromised state (same logic as the previous circle fill).
- Non-goal for this change: introducing 3D models (e.g., glTF via `ScenegraphLayer`). This can be a follow-up change if desired.

## Impact
- Affected specs: `graph-layout`, `network-graph`
- Affected code (expected): `src/network/extractTopology.ts`, `src/view/NetworkGraph.tsx`
- Non-goals: changing layout, adding new UI panels/filters/legends
