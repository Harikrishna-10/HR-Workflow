import React from "react";
import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { NodeType } from "../types";

const nodeColors: Record<NodeType, string> = {
  start: "#10b981",
  task: "#3b82f6",
  approval: "#f59e0b",
  automated: "#6b7280",
  end: "#ef4444",
};

const containerStyle = (color: string, selected?: boolean): React.CSSProperties => ({
  position: "relative",
  minWidth: 180,
  padding: 12,
  borderRadius: 10,
  border: `2px solid ${color}`,
  background: "#fff",
  boxShadow: selected ? "0 8px 24px rgba(15,23,42,0.08)" : "0 2px 8px rgba(2,6,23,0.04)",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
});

export const BaseNode: React.FC<NodeProps> = ({ data, type, selected }) => {
  const color = nodeColors[type as NodeType] || "#444";

  // validation messages attached in store as data.__validation: string[]
  const validation: string[] = (data as any)?.__validation || [];

  return (
    <div style={containerStyle(color, selected)} title={validation.length ? validation.join("; ") : undefined}>
      {/* validation badge */}
      {validation.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 12,
            top: -12,
            background: "#fff7f7",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "2px 6px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: "12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            zIndex: 5,
          }}
        >
          !
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: color }} />
        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {data?.title || "Untitled"}
        </div>
      </div>

      {data?.description && (
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 8, maxHeight: 40, overflow: "hidden", textOverflow: "ellipsis" }}>
          {data.description}
        </div>
      )}

      {/* show first validation message inline to help user */}
      {validation.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#b91c1c" }}>{validation[0]}</div>
      )}

      <Handle type="target" position={Position.Left} style={{ background: "#cbd5e1" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#cbd5e1" }} />
    </div>
  );
};

export const StartNode = (props: NodeProps) => <BaseNode {...props} />;
export const TaskNode = (props: NodeProps) => <BaseNode {...props} />;
export const ApprovalNode = (props: NodeProps) => <BaseNode {...props} />;
export const AutomatedNode = (props: NodeProps) => <BaseNode {...props} />;
export const EndNode = (props: NodeProps) => <BaseNode {...props} />;
