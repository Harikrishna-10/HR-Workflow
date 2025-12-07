import type { SimulationResult, WorkflowNode } from "../types";
import type { Edge } from "reactflow";

export interface AutomationAction {
  id: string;
  label: string;
  params: string[];
}

export const automations: AutomationAction[] = [
  { id: "send_email", label: "Send Email", params: ["to", "subject", "body"] },
  { id: "generate_doc", label: "Generate Document", params: ["template", "recipient"] },
  { id: "notify_slack", label: "Notify Slack", params: ["channel", "message"] },
];

export const getAutomations = async (): Promise<AutomationAction[]> => {
  await new Promise((r) => setTimeout(r, 250));
  return automations;
};

export const simulate = async (payload: {
  nodes: WorkflowNode[];
  edges: Edge[];
}): Promise<SimulationResult> => {
  const errors: string[] = [];
  const startNodes = payload.nodes.filter((n) => n.type === "start");
  if (startNodes.length !== 1) errors.push("Exactly one Start node is required.");
  if (payload.nodes.length === 0) errors.push("Graph is empty.");

  // naive cycle heuristic (optionally you can run full DFS)
  if (payload.edges.length > payload.nodes.length * 2) errors.push("Too many edges - possible cycle.");

  // order nodes simply by x,y
  const ordered = [...payload.nodes].sort((a, b) => {
    if ((a.position?.x ?? 0) === (b.position?.x ?? 0)) return (a.position?.y ?? 0) - (b.position?.y ?? 0);
    return (a.position?.x ?? 0) - (b.position?.x ?? 0);
  });

  // helper to find automation definition (if needed)
  const findAutomation = (id?: string) => automations.find((a) => a.id === id);

  type Step = { step: string; status: "pending" | "completed" | "error"; nodeId: string };

  const steps: Step[] = ordered.map((node, i) => {
    // default to completed
    let status: Step["status"] = "completed";
    const t = node.type;

    // Type-specific checks
    if (t === "start") {
      if (!node.data.title || node.data.title.trim() === "") {
        status = "error";
      }
    } else if (t === "task") {
      if (!node.data.title || node.data.title.trim() === "") status = "error";
    } else if (t === "approval") {
      // require approverRole (non-empty) — adjust per your rules
      if (!node.data.approverRole || node.data.approverRole.trim() === "") {
        status = "error";
      }
    } else if (t === "automated") {
      // require action selected and required action params filled
      const actionId = node.data.actionId;
      if (!actionId) {
        status = "error";
      } else {
        const def = findAutomation(actionId);
        if (def) {
          // ensure each required param is present and non-empty
          const params = node.data.actionParams || {};
          const missing = def.params.some((p) => !params[p] || String(params[p]).trim() === "");
          if (missing) status = "error";
        } else {
          // unknown action
          status = "error";
        }
      }
    } else if (t === "end") {
      // optional: require endMessage if summary flag true
      if (node.data.summary && (!node.data.endMessage || node.data.endMessage.trim() === "")) status = "error";
    }

    return {
      step: `${i + 1}. ${node.data.title || node.type}`,
      status,
      nodeId: node.id,
    };
  });

  return new Promise((resolve) =>
    setTimeout(() => {
      resolve({
        steps,
        valid: errors.length === 0,
        errors,
      });
    }, 400 + Math.min(600, payload.nodes.length * 50))
  );
};