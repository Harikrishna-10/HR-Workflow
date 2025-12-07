// src/utils/validateWorkflow.ts
import type { WorkflowNode } from "../types";
import type { Edge } from "reactflow";

export interface NodeValidation {
  nodeId: string;
  errors: string[];
}

export const validateWorkflowStructure = (nodes: WorkflowNode[], edges: Edge[]) => {
  const errors: string[] = [];
  const nodeErrors: Record<string, string[]> = {};

  const startNodes = nodes.filter((n) => n.type === "start");
  if (startNodes.length !== 1) {
    errors.push("Exactly one Start node is required.");
    startNodes.forEach((n) => (nodeErrors[n.id] = [...(nodeErrors[n.id] || []), "Start node constraint"]));
  }

  if (nodes.length === 0) {
    errors.push("Workflow is empty.");
  }

  // Build adjacency maps for node-level validation
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  edges.forEach((e) => {
    outgoing.set(e.source, [...(outgoing.get(e.source) || []), e.target]);
    incoming.set(e.target, [...(incoming.get(e.target) || []), e.source]);
  });

  // simple node validations
  for (const n of nodes) {
    const myErrors: string[] = [];
    if (n.type === "start") {
      if ((outgoing.get(n.id) || []).length === 0) myErrors.push("Start node should have an outgoing connection.");
    }
    if (n.type === "end") {
      if ((incoming.get(n.id) || []).length === 0) myErrors.push("End node should have an incoming connection.");
    }
    if (n.type === "task") {
      if (!n.data.title || n.data.title.trim() === "") myErrors.push("Task title is required.");
    }
    if (myErrors.length) nodeErrors[n.id] = [...(nodeErrors[n.id] || []), ...myErrors];
  }

  // naive cycle detection using DFS (small graphs)
  const visitState = new Map<string, 0 | 1 | 2>(); 
  let foundCycle = false;
  const dfs = (id: string) => {
    if (foundCycle) return;
    const state = visitState.get(id) ?? 0;
    if (state === 1) { foundCycle = true; return; }
    if (state === 2) return;
    visitState.set(id, 1);
    for (const nb of outgoing.get(id) || []) dfs(nb);
    visitState.set(id, 2);
  };
  nodes.forEach((n) => { if (!(visitState.get(n.id))) dfs(n.id); });
  if (foundCycle) {
    errors.push("Cycle detected in workflow.");
    // mark all nodes (best-effort)
    nodes.forEach((n) => (nodeErrors[n.id] = [...(nodeErrors[n.id] || []), "Part of a cycle"]));
  }

  // compile node-level validations
  const nodeValidation: NodeValidation[] = nodes.map((n) => ({
    nodeId: n.id,
    errors: nodeErrors[n.id] ?? [],
  }));

  return {
    globalErrors: errors,
    nodeValidation,
  };
};
