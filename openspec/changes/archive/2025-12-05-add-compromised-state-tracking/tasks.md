## 1. State Logic
- [x] 1.1 Create node state derivation function that computes compromise state from action history up to current step
- [x] 1.2 Define red actions that compromise hosts (ExploitRemoteService, PrivilegeEscalate, Impact)
- [x] 1.3 Define blue actions that restore hosts (Restore)

## 2. Visualization
- [x] 2.1 Update NetworkGraph to accept computed node states
- [x] 2.2 Modify node fill color based on compromise state (orange for compromised)
- [x] 2.3 Ensure state updates reactively when step changes

## 3. Integration
- [x] 3.1 Wire state computation into App component
- [x] 3.2 Pass node states to NetworkGraph
- [x] 3.3 Verify compromise colors appear correctly in UI
