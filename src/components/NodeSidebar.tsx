import React from "react";
import type { NodeType } from "../types";
import { PlayCircle, User, CheckCircle, Zap, StopCircle } from "lucide-react";

const nodeTypes: Array<{
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    type: "start",
    label: "Start",
    icon: <PlayCircle size={18} />,
    color: "#10b981",
  },
  { type: "task", label: "Task", icon: <User size={18} />, color: "#3b82f6" },
  {
    type: "approval",
    label: "Approval",
    icon: <CheckCircle size={18} />,
    color: "#f59e0b",
  },
  {
    type: "automated",
    label: "Automated",
    icon: <Zap size={18} />,
    color: "#6b7280",
  },
  {
    type: "end",
    label: "End",
    icon: <StopCircle size={18} />,
    color: "#ef4444",
  },
];

export const NodeSidebar: React.FC<{
  onDragStart: (e: React.DragEvent, type: NodeType) => void;
}> = ({ onDragStart }) => {
  return (
    <div
      style={{
        width: 200,
        padding: 12,
        borderRight: "1px solid #e5e7eb",
        background: "#fafafa",
      }}
    >
      <h3 style={{ marginBottom: 12, fontWeight: 700 }}>Nodes</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {nodeTypes.map((n) => (
          <div
            key={n.type}
            draggable
            onDragStart={(e) => onDragStart(e, n.type)}
            style={{
              padding: 10,
              borderRadius: 8,
              background: "#fff",
              border: "1px dashed #e5e7eb",
              cursor: "grab",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 6,
                  border: `2px solid ${n.color}`,
                }}
              >
                {n.icon}
              </div>
              <div style={{ fontWeight: 600 }}>{n.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
