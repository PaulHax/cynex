# Tasks: Agent Visibility Toggle

## 1. Add Agent Visibility State

- [x] Create `agentVisibility` state in App.tsx: `{ blue: boolean, red: boolean }` defaulting to both true
- [x] Create setter function to toggle individual agent visibility
- [x] Pass visibility state and setter to ActionHistory component
- [x] Pass visibility state to NetworkGraph component

## 2. Update ActionHistory Sidebar Header

- [x] Remove 🔵 emoji from blue agent label (line 74)
- [x] Remove 🔴 emoji from red agent label (line 75)
- [x] Add eye toggle button next to "BLUE" label
- [x] Add eye toggle button next to "RED" label
- [x] Style toggle buttons to show open/closed eye based on visibility state
- [x] Wire toggle buttons to visibility setter

## 3. Filter Network Graph Trails by Visibility

- [x] Accept `agentVisibility` prop in NetworkGraph
- [x] Filter `movements` to exclude hidden agents before creating trails
- [x] Verify trails only render for visible agents

## 4. Filter Action Labels by Visibility

- [x] Filter `currentBlueAction` display based on blue visibility
- [x] Filter `currentRedAction` display based on red visibility
- [x] Update ActionLabel overlay to respect visibility state

## 5. Filter Host Highlights by Visibility

- [x] Update `getHighlightColor` to return null for hidden agents
- [x] Verify node highlights only show for visible agents

## 6. Testing

- [x] Verify toggling blue hides blue trails, labels, and highlights
- [x] Verify toggling red hides red trails, labels, and highlights
- [x] Verify both can be toggled independently
- [x] Verify visibility persists across step range changes
