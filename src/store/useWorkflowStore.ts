import { create } from "zustand";
import type { WorkflowNode, NodeData, SimulationResult } from "../types";
import { simulate } from "../api/mockApi";
import type { Edge } from "reactflow";
import { validateWorkflowStructure } from "../utils/validateWorkflow";

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: Edge[];
  selectedNode: WorkflowNode | null;
  simulationResult: SimulationResult | null;

  // history for undo/redo
  history: { nodes: WorkflowNode[]; edges: Edge[] }[];
  historyIndex: number;

  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: WorkflowNode | null) => void;
  setSimulationResult: (r: SimulationResult | null) => void;

  updateNode: (nodeId: string, data: Partial<NodeData>) => void;
  addNode: (node: WorkflowNode) => void;
  removeNode: (nodeId: string) => void;

  // extras
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  exportWorkflow: () => string;
  importWorkflow: (payload: { nodes: WorkflowNode[]; edges: Edge[] }) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => {
  const runValidationAndSet = (nodes: WorkflowNode[], edges: Edge[]) => {
    const validation = validateWorkflowStructure(nodes, edges);

    // attach __validation to node.data (non-enumerable or prefixed)
    const nodesWithValidation = nodes.map((n) => {
      const vn = {
        ...n,
        data: {
          ...n.data,
          __validation:
            validation.nodeValidation.find((v) => v.nodeId === n.id)?.errors ||
            [],
        },
      };
      return vn;
    });

    set({ nodes: nodesWithValidation, edges });
  };

  return {
    nodes: [],
    edges: [],
    selectedNode: null,
    simulationResult: null,
    history: [],
    historyIndex: -1,

    setNodes: (nodes) => {
      runValidationAndSet(nodes, get().edges);
      // push to history
      get().pushHistory();
    },
    setEdges: (edges) => {
      runValidationAndSet(get().nodes, edges);
      // push to history
      get().pushHistory();
    },

    setSelectedNode: (node) => set({ selectedNode: node }),
    setSimulationResult: (r) => set({ simulationResult: r }),

    updateNode: (nodeId, data) => {
      const newNodes = get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      );
      runValidationAndSet(newNodes, get().edges);
      get().pushHistory();
    },

    addNode: (node) => {
      const newNodes = [...get().nodes, node];
      runValidationAndSet(newNodes, get().edges);
      get().pushHistory();
    },

    removeNode: (nodeId) => {
      const newNodes = get().nodes.filter((n) => n.id !== nodeId);
      const newEdges = get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      runValidationAndSet(newNodes, newEdges);
      set({ selectedNode: null });
      get().pushHistory();
    },

    pushHistory: () => {
      const { nodes, edges, history } = get();
      const snapshot = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      };
      const next = history.slice(0, (get().historyIndex ?? -1) + 1);
      next.push(snapshot);
      set({ history: next, historyIndex: next.length - 1 });
    },

    undo: () => {
      const idx = get().historyIndex;
      if (idx > 0) {
        const snap = get().history[idx - 1];
        runValidationAndSet(snap.nodes, snap.edges);
        set({ historyIndex: idx - 1, selectedNode: null });
      }
    },

    redo: () => {
      const idx = get().historyIndex;
      if (idx < get().history.length - 1) {
        const snap = get().history[idx + 1];
        runValidationAndSet(snap.nodes, snap.edges);
        set({ historyIndex: idx + 1, selectedNode: null });
      }
    },
    runSimulation: async () => {
      const { nodes, edges } = get();

      // Clean data (remove validation field)
      const outgoingNodes = nodes.map((n) => ({
        ...n,
        data: (() => {
          const clone = { ...n.data };
          delete (clone as any).__validation;
          return clone;
        })(),
      }));

      const result = await simulate({
        nodes: outgoingNodes,
        edges,
      });

      set({ simulationResult: result });
    },

    exportWorkflow: () => {
      const payload = {
        nodes: get().nodes.map((n) => ({
          ...n,
          data: (() => {
            const d = { ...n.data };
            delete (d as any).__validation;
            return d;
          })(),
        })),
        edges: get().edges,
      };
      return JSON.stringify(payload, null, 2);
    },

    importWorkflow: (payload) => {
      // ensure types are okay
      runValidationAndSet(payload.nodes, payload.edges);
      get().pushHistory();
    },
  };
});
