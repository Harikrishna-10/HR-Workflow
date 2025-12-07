import React, { useState } from "react";
import { useWorkflowStore } from "../store/useWorkflowStore";
import { simulate } from "../api/mockApi";
import type { SimulationResult } from "../types";
import { useAutomations } from "../hooks/useAutomations";
import type { AutomationAction } from "../api/mockApi";

export const WorkflowTester: React.FC = () => {
  // load automations (used for validating automated node action ids)
  const { data: automations, loading: automationLoading } = useAutomations();

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const setSimulationResult = useWorkflowStore((s) => s.setSimulationResult);
  const simulationResult = useWorkflowStore((s) => s.simulationResult);

  const exportWorkflow = useWorkflowStore((s) => s.exportWorkflow);
  const importWorkflow = useWorkflowStore((s) => s.importWorkflow);
  const undo = useWorkflowStore((s) => s.undo);
  const redo = useWorkflowStore((s) => s.redo);
  const historyIndex = useWorkflowStore((s) => s.historyIndex);
  const historyLen = useWorkflowStore((s) => s.history.length);

  const [running, setRunning] = useState(false);

  const runSimulation = async () => {
    if (!nodes.length) {
      alert("Add some nodes to simulate the workflow.");
      return;
    }

    // Basic local validation: ensure automated nodes have actionId and, if automations are loaded, that action exists.
    const invalidAutomationNode = nodes.find((n) => {
      if (n.type !== "automated") return false;
      // safe access to node.data
      const d = (n.data || {}) as Record<string, any>;
      const actionId = (d.actionId ?? "") as string;
      if (!actionId || String(actionId).trim() === "") return true;
      // if automations are available, ensure the id exists
      if (Array.isArray(automations) && automations.length > 0) {
        return !automations.some((a: AutomationAction) => a.id === actionId);
      }
      return false;
    });

    if (invalidAutomationNode) {
      // If automations are still loading, give a clearer message
      if (automationLoading) {
        alert(
          "Automations are still loading. Please wait a moment and try again."
        );
        return;
      }

      const d = (invalidAutomationNode.data || {}) as Record<string, any>;
      const actionId = d.actionId ?? "";
      alert(
        `Automation node "${
          d.title || invalidAutomationNode.id
        }" has an invalid or missing action (${actionId}). Please select a valid automation action.`
      );
      return;
    }

    // Clean nodes: remove internal validation metadata (like __validation) before sending to API
    const cleanedNodes = nodes.map((n) => {
      const d = n.data || {};
      // remove __validation safely
      const { __validation, ...restData } = d as any;
      return { ...n, data: restData };
    });

    setRunning(true);
    try {
      const res: SimulationResult = await simulate({
        nodes: cleanedNodes,
        edges,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error("Simulation error", err);
      alert("Simulation failed. See console for details.");
    } finally {
      setRunning(false);
    }
  };

  const downloadExport = () => {
    try {
      const json = exportWorkflow();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workflow-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export workflow.");
    }
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || "{}"));
        if (parsed.nodes && parsed.edges) {
          importWorkflow(parsed);
        } else {
          alert("Invalid workflow file: missing nodes/edges.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // shared button style to keep things consistent
  const btnBase: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <div
      // outer wrapper - make it look like a card and prevent overflow + ensure it's not too wide
      style={{
        padding: 12,
        borderTop: "1px solid #e6e8eb",
        background: "#fff",
        boxShadow: "0 6px 20px rgba(16,24,40,0.06)",
        borderRadius: 10,
        maxWidth: 950,
        minWidth: 320,
        width: "100%",
        maxHeight: 400,
        overflow: "hidden",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16 }}>Workflow Test</div>

        {/* action bar - allow wrapping so it doesn't overflow */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap", // important: wrap on small widths
            justifyContent: "flex-end",
            maxWidth: "70%", // keep it from pushing the title away
          }}
        >
          <button
            onClick={runSimulation}
            disabled={running || nodes.length === 0}
            style={{
              ...btnBase,
              background: "#2563eb",
              color: "#fff",
              padding: "8px 12px",
              border: "none",
            }}
          >
            {running ? "Running..." : "Test Workflow"}
          </button>

          <button onClick={downloadExport} style={btnBase}>
            Export
          </button>

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.08)",
              cursor: "pointer",
              background: "#f8fafc",
              whiteSpace: "nowrap",
            }}
          >
            Import
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            style={{
              ...btnBase,
              background: historyIndex <= 0 ? "#f1f2f4" : "#fff",
            }}
          >
            Undo
          </button>

          <button
            onClick={redo}
            disabled={historyIndex >= historyLen - 1}
            style={{
              ...btnBase,
              background: historyIndex >= historyLen - 1 ? "#f1f2f4" : "#fff",
            }}
          >
            Redo
          </button>
        </div>
      </div>

      {/* results area */}
      <div
        style={{
          width: "100%",
          marginTop: 8,
          maxHeight: 180,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {simulationResult ? (
          simulationResult.valid ? (
            <div style={{ display: "grid", gap: 10, width: "100%" }}>
              {simulationResult.steps.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background:
                      s.status === "completed"
                        ? "#ecfdf5"
                        : s.status === "pending"
                        ? "#f8fafc"
                        : "#fff1f2",
                    borderLeft: `4px solid ${
                      s.status === "completed"
                        ? "#34d399"
                        : s.status === "pending"
                        ? "#cbd5e1"
                        : "#f87171"
                    }`,
                    boxSizing: "border-box",
                    width: "100%",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{s.step}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    Node: {s.nodeId}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 12,
                background: "#fff1f2",
                borderRadius: 8,
                width: "100%",
              }}
            >
              <div
                style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 6 }}
              >
                Validation Errors
              </div>
              <ul style={{ marginLeft: 16 }}>
                {simulationResult.errors?.map((e, i) => (
                  <li key={i} style={{ color: "#7f1d1d" }}>
                    • {e}
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : (
          <div style={{ color: "#475569" }}>
            Click "Test Workflow" to run a simulation
          </div>
        )}
      </div>
    </div>
  );
};
