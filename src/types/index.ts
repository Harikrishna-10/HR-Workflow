import type { Edge, Node } from "reactflow";

export interface NodeData {
  title: string;
  metadata?: Record<string, string>;
  description?: string;
  assignee?: string;
  dueDate?: string;
  approverRole?: string;
  autoApproveThreshold?: number;
  actionId?: string;
  actionParams?: Record<string, string>;
  endMessage?: string;
  summary?: boolean;
  customFields?: Record<string, any>;
  __validation?: string[]; // internal use only
}
export interface OnSelectionChangeParams {
  nodes: Node<any, string | undefined>[];
  edges: Edge[];
}

export type NodeType =
  | "start"
  | "task"
  | "approval"
  | "automated"
  | "end";

export interface WorkflowNode extends Node<NodeData> {
  type: NodeType;
}

export interface SimulationResult {
  steps: {
    step: string;
    status: "pending" | "completed" | "error";
    nodeId: string;
  }[];
  valid: boolean;
  errors?: string[];
}
