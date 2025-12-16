# Change: Ensure host metadata tooltip renders above action labels

## Why

When hovering over a host node to see its metadata (ID, type, subnet), the DeckGL tooltip can be obscured by the agent action labels that float above nodes. The host tooltip should always be visible on top since it's an interactive element triggered by user hover.

## What Changes

- Add explicit z-index to ActionLabel component to place it at a base layer
- Add CSS targeting DeckGL's tooltip container to ensure it renders above action labels

## Impact

- Affected specs: action-overlays
- Affected code: `src/view/NetworkGraph.tsx`, `src/index.css`
