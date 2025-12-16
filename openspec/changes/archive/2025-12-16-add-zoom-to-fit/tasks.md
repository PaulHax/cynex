## 1. Implementation

- [x] 1.1 Calculate topology bounding box dimensions (width and height) from subnet bounds
- [x] 1.2 Compute the zoom level that fits the bounding box within the viewport using deck.gl's OrthographicView zoom formula
- [x] 1.3 Add padding factor to prevent edge clipping
- [x] 1.4 Update the topology change effect to use calculated zoom instead of hardcoded `0`

## 2. Testing

- [x] 2.1 Verify small topologies (15 hosts) fit within viewport
- [x] 2.2 Verify large topologies (61 hosts) fit within viewport
- [x] 2.3 Verify zoom-to-fit triggers on trajectory change (dropdown)
