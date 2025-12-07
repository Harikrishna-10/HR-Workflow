import React, { useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

import { useWorkflowStore } from "../store/useWorkflowStore";
import { NodeSidebar } from "./NodeSidebar";
import { NodeEditor } from "./NodeEditor";
import { WorkflowTester } from "./WorkflowTester";

import {
  StartNode,
  TaskNode,
  ApprovalNode,
  AutomatedNode,
  EndNode,
} from "./CustomNodes";

import type { NodeType, OnSelectionChangeParams, WorkflowNode } from "../types";
import type { Connection, NodeChange, EdgeChange } from "reactflow";

const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  automated: AutomatedNode,
  end: EndNode,
};

export const WorkflowCanvas: React.FC = () => {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes,
    setEdges,
    setSelectedNode,
  } = useWorkflowStore();

  // Keep ReactFlow controlled ONLY using Zustand
  const nodes = storeNodes;
  const edges = storeEdges;

  // ReactFlow → Zustand sync for nodes
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, storeNodes);
      setNodes(updated as WorkflowNode[]);
    },
    [storeNodes, setNodes]
  );

  // ReactFlow → Zustand sync for edges
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, storeEdges);
      setEdges(updated);
    },
    [storeEdges, setEdges]
  );

  // Handle edge creation
  const onConnect = useCallback(
    (connection: Connection) => {
      const updated = addEdge(connection, storeEdges);
      setEdges(updated);
    },
    [storeEdges, setEdges]
  );

  // Handle selection
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    const selectedNode = params.nodes[0];

    if (!selectedNode) {
      setSelectedNode(null);
      return;
    }

    // Convert ReactFlow Node → WorkflowNode
    setSelectedNode(selectedNode as WorkflowNode);
  }, []);

  // Drag start from Sidebar
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  // Allow dropping
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Drop new node on canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/reactflow");
      if (!nodeType) return;

      const reactFlowBounds = (
        document.querySelector(".reactflow-wrapper") as HTMLElement
      )?.getBoundingClientRect();

      const pos = {
        x: event.clientX - (reactFlowBounds?.left ?? 0),
        y: event.clientY - (reactFlowBounds?.top ?? 0),
      };

      const newNode: WorkflowNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType as NodeType,
        position: pos,
        data: {
          title: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`,
        },
      };

      setNodes([...storeNodes, newNode]);
    },
    [storeNodes, setNodes]
  );

  // DELETE selected node with DELETE key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ignore if focus is input-like
      const active = document.activeElement;
      if (active) {
        const tag = active.tagName?.toLowerCase();
        const isEditable = (active as HTMLElement).isContentEditable;
        if (tag === "input" || tag === "textarea" || isEditable) {
          return; // user is typing — do not intercept
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const selId = useWorkflowStore.getState().selectedNode?.id;
        if (selId) useWorkflowStore.getState().removeNode(selId);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Sidebar */}
      <NodeSidebar onDragStart={onDragStart} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Canvas */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <div className="reactflow-wrapper" style={{ height: "100%" }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              panOnDrag
              zoomOnScroll
              onDragOver={onDragOver}
              onSelectionChange={onSelectionChange}
              fitView
            >
              <Background gap={12} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%", // ✅ Full height
            width: 340, // ✅ Fixed width
            zIndex: 20, // ✅ Above canvas
            background: "#ffffff",
            borderLeft: "1px solid #e5e7eb",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.08)", // ✅ Nice shadow
            overflow: "hidden", // ✅ Prevent scroll bleed
          }}
        >
          <NodeEditor />
        </div>

        <div
          style={{
            position: "relative",
            bottom: 10,
          }}
        >
          <WorkflowTester />
        </div>
      </div>
    </div>
  );
};
