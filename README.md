# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


HR Workflow Builder – Prototype

A visual workflow-automation tool that allows users to create, simulate, and export HR workflows using a drag-and-drop canvas. Built with React, React Flow, Zustand, TypeScript, and LocalStorage persistence.


1. Architecture Overview

| Layer            | Technology             | Purpose                                                  |
| ---------------- | ---------------------- | -------------------------------------------------------- |
| UI Framework     | **React + TypeScript** | Component-based UI, predictable typing                   |
| Canvas Engine    | **React Flow**         | Drag-drop nodes, edges, zoom/pan, custom node components |
| State Management | **Zustand**            | Central store for nodes, edges, selection, editor state  |
| Persistence      | **LocalStorage**       | Save/import/export workflows without backend             |
| UI Components    | **Custom Components**  | NodeEditor, WorkflowTester, CustomNodes, Toolbar         |

Module Breakdown
1. React Flow Canvas

Displays the workflow.

Handles creating, dragging, connecting, and deleting nodes.

Uses:
useNodesState()
useEdgesState()
Custom ReactFlow node types (start, task, approval, automated, end)

2. Zustand Store (workflowStore.ts)
Centralized logic:
nodes, edges
addNode(), updateNode(), removeNode()
undo() / redo()
importWorkflow() / exportWorkflow()
selectedNode
All workflow-specific validation logic

3. Node Editor Panel

Appears when a node is selected.
Lets user edit:
title
description
metadata
approval config
automation config

Dynamically loads automation actions (mock API).

4. Workflow Tester

Simulates workflow execution:
Runs through nodes step-by-step
Validates mandatory fields
Displays result list (green for valid, red for errors)

5. Custom Node Components

Each node type has:
Unique color
Icon
Minimal UI for readability
Handles selection highlight

6. Automation Action API (Mock)

Simple simulated API:

[
  { id: "send_email", params:["to","subject","body"] },
  { id: "generate_doc", params:["template","recipient"] },
  { id: "notify_slack", params:["channel","message"] }
]


2. How to Run the Project
Prerequisites

Node.js 18+
npm or yarn

Install Packages
npm install

Start Development Server
npm run dev

Your app will start at:
http://localhost:5173

3. Design Decisions
1. React Flow for workflow builder

React Flow gives:
 Drag-and-drop
 Zoom/pan
 Easy custom nodes
 Built-in state helpers

This saves weeks of custom canvas development.

2. Zustand for global data store

Chosen because:
Very small
Extremely easy state updates
No boilerplate
Perfect for React Flow since it needs shared state across components

3. LocalStorage persistence

No backend required — users should:
create workflow
refresh browser
continue where they left off
export/import JSON

4. Separate Simulation Logic
Simulation is isolated so in real systems you can:
connect to backend
add workflow execution engine
implement error logging

5. Strong TypeScript types

Types prevent runtime issues:
WorkflowNode
NodeData
NodeType
SimulationResult
Ensures node editor + canvas always stay in sync.

4. What Has Been Completed:
Core Features
Visual drag-and-drop workflow builder

5 Custom node types:
Add, edit, delete nodes
Draw connections
Undo / Redo
Zoom / Pan
Auto-persist workflow in localStorage
Export & import workflow JSON
Full workflow simulation engine

Node validation:
Start must exist
End must exist
Approval requires approverRole
Automated requires actionId & required params

Node Editor:
Supports live editing
Dynamic action parameters
Debounced updates
No accidental deletion on Backspace

UX Improvements:
Node highlight on select
Organized side panel
Scrollable tester results

5. What I Would Add With More Time
1. Conditional logic
IF/ELSE branches
Multi-path automation
Parallel flows

2. Edge-level metadata
Conditions on edges
Routing based on data

3. Node templates
Pre-defined workflow patterns:
Leave request
Onboarding
Resignation flow

4. Backend integration
Save workflows to DB
Execute workflows via API
User role management

5. Better simulation UI
Step-through execution
Animation highlighting active node
Error tracing

7. Role-based permissions
HR Manager view
Employee view
Approver dashboard

8. AI Workflow Generator
Enter prompt → system auto-builds workflow.

6. Folder Structure Overview

src/
 ├─ components/
 │   ├─ WorkflowCanvas/
 │   ├─ NodeEditor/
 │   ├─ WorkflowTester/
 │   ├─ CustomNodes/
 │   └─ Toolbar/
 ├─ store/
 │   └─ workflowStore.ts
 ├─ types/
 │   └─ workflow.ts
 ├─ api/
 │   └─ mockApi.ts
 ├─ hooks/
 │   └─ useAutomations.ts
 ├─ utils/
 │   └─ simulation.ts
 └─ App.tsx



