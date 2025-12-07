import React, { useEffect, useState } from "react";
import { useWorkflowStore } from "../store/useWorkflowStore";
import { useAutomations } from "../hooks/useAutomations"; // ✅ uses real automations hook
import type { WorkflowNode } from "../types";

type CustomField = { id: string; key: string; value: string };

export const NodeEditor: React.FC = () => {
  const selectedNode = useWorkflowStore(
    (s) => s.selectedNode
  ) as WorkflowNode | null;
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const removeNode = useWorkflowStore((s) => s.removeNode);

  const { data: automations, loading } = useAutomations();

  const defaultData = {
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    customFields: [] as CustomField[],
    approverRole: "",
    autoApproveThreshold: 0,
    actionId: "",
    actionParams: {},
    summary: false,
    endMessage: "",
  };

  const [local, setLocal] = useState<any>(defaultData);

  useEffect(() => {
    if (selectedNode?.data) {
      const { __validation, ...cleanData } = selectedNode.data as any;

      // normalize customFields if present as object -> array or missing
      let customFields: CustomField[] = [];
      if (Array.isArray(cleanData.customFields)) {
        customFields = cleanData.customFields.map((cf: any, i: number) =>
          typeof cf === "object" &&
          cf !== null &&
          ("key" in cf || "value" in cf)
            ? {
                id: String(i) + "-" + (cf.key ?? ""),
                key: cf.key ?? "",
                value: cf.value ?? "",
              }
            : { id: String(i), key: "", value: "" }
        );
      } else if (
        cleanData.customFields &&
        typeof cleanData.customFields === "object"
      ) {
        // object -> convert
        customFields = Object.entries(cleanData.customFields).map(
          ([k, v], i) => ({ id: `${i}-${k}`, key: k, value: String(v) })
        );
      }

      setLocal({ ...defaultData, ...cleanData, customFields });
    } else {
      setLocal(defaultData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        Select a node to edit
      </div>
    );
  }

  const handleInputChange = (field: string, value: any) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    updateNode(selectedNode.id, { [field]: value });
  };

  const handleActionChange = (actionId: string) => {
    const actionParams: Record<string, string> = {};
    const updated = { ...local, actionId, actionParams };
    setLocal(updated);
    updateNode(selectedNode.id, { actionId, actionParams });
  };

  const handleParamChange = (param: string, value: string) => {
    const newParams = { ...(local.actionParams || {}), [param]: value };
    const updated = { ...local, actionParams: newParams };
    setLocal(updated);
    updateNode(selectedNode.id, { actionParams: newParams });
  };

  // --- Custom fields helpers (for Task node) ---
  const addCustomField = () => {
    const newField: CustomField = {
      id: String(Date.now()),
      key: "",
      value: "",
    };
    const next = [...(local.customFields || []), newField];
    setLocal({ ...local, customFields: next });
    updateNode(selectedNode.id, { customFields: next });
  };

  const updateCustomField = (id: string, key: string, value: string) => {
    const next = (local.customFields || []).map((cf: CustomField) =>
      cf.id === id ? { ...cf, key, value } : cf
    );
    setLocal({ ...local, customFields: next });
    updateNode(selectedNode.id, { customFields: next });
  };

  const removeCustomField = (id: string) => {
    const next = (local.customFields || []).filter(
      (cf: CustomField) => cf.id !== id
    );
    setLocal({ ...local, customFields: next });
    updateNode(selectedNode.id, { customFields: next });
  };

  return (
    <div
      style={{
        width: "95%",
        height: "100%",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflowY: "auto",
        background: "#ffffff",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
            {String(selectedNode.type).charAt(0).toUpperCase() +
              String(selectedNode.type).slice(1)}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {selectedNode.id}
          </div>
        </div>
        <button
          onClick={() => removeNode(selectedNode.id)}
          style={{
            color: "#ef4444",
            border: "none",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
          title="Delete node"
        >
          Delete
        </button>
      </div>

      {/* Title Field - Always present */}
      <div style={{ flexShrink: 0 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            color: "#374151",
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          Title *
        </label>
        <input
          value={local.title || ""}
          onChange={(e) => handleInputChange("title", e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            transition: "border-color 0.2s",
          }}
          placeholder="Enter node title"
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
        />
      </div>

      {/* Task Fields */}
      {selectedNode.type === "task" && (
        <>
          <div style={{ flexShrink: 0 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                color: "#374151",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Description
            </label>
            <textarea
              value={local.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                minHeight: 100,
                resize: "vertical",
                transition: "border-color 0.2s",
              }}
              placeholder="Enter task description"
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#374151",
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Assignee
              </label>
              <input
                value={local.assignee || ""}
                onChange={(e) => handleInputChange("assignee", e.target.value)}
                placeholder="Assignee name or identifier"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#374151",
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Due Date
              </label>
              <input
                type="date"
                value={local.dueDate || ""}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Custom Key-Value Fields */}
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>
                Custom Fields
              </div>
              <button
                onClick={addCustomField}
                style={{
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  padding: "6px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                + Add
              </button>
            </div>

            {(local.customFields || []).length === 0 && (
              <div style={{ color: "#6b7280", fontSize: 13, padding: "8px 0" }}>
                No custom fields added
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(local.customFields || []).map((cf: CustomField) => (
                <div
                  key={cf.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    value={cf.key}
                    onChange={(e) =>
                      updateCustomField(cf.id, e.target.value, cf.value)
                    }
                    placeholder="Key"
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  />
                  <input
                    value={cf.value}
                    onChange={(e) =>
                      updateCustomField(cf.id, cf.key, e.target.value)
                    }
                    placeholder="Value"
                    style={{
                      padding: "8px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  />
                  <button
                    onClick={() => removeCustomField(cf.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "6px 8px",
                      borderRadius: 6,
                    }}
                    title="Remove field"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Approval Fields */}
      {selectedNode.type === "approval" && (
        <div style={{ flexShrink: 0 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#374151",
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Approver Role *
          </label>
          <input
            value={local.approverRole || ""}
            onChange={(e) => handleInputChange("approverRole", e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              transition: "border-color 0.2s",
            }}
            placeholder="e.g., Manager, Admin, HR"
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
          />
          <div style={{ marginTop: 10 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                color: "#374151",
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              Auto-approve threshold
            </label>
            <input
              type="number"
              value={local.autoApproveThreshold ?? 0}
              onChange={(e) =>
                handleInputChange(
                  "autoApproveThreshold",
                  Number(e.target.value)
                )
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
              }}
              min={0}
            />
          </div>
        </div>
      )}

      {/* Automated Fields */}
      {selectedNode.type === "automated" && (
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#374151",
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Automation Action *
          </label>

          {loading ? (
            <div
              style={{
                padding: "12px 10px",
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              Loading actions...
            </div>
          ) : (
            <select
              value={local.actionId || ""}
              onChange={(e) => handleActionChange(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${loading ? "#d1d5db" : "#d1d5db"}`,
                borderRadius: 6,
                fontSize: 14,
                background: loading ? "#f9fafb" : "#fff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              <option value="">Select action...</option>
              {automations?.map((action) => (
                <option key={action.id} value={action.id}>
                  {action.label}
                </option>
              ))}
            </select>
          )}

          {/* Dynamic Parameters */}
          {local.actionId && automations && !loading && (
            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {automations
                .find((a) => a.id === local.actionId)
                ?.params.map((param) => (
                  <div key={param}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        color: "#374151",
                        fontWeight: 500,
                        marginBottom: 4,
                      }}
                    >
                      {param
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </label>
                    <input
                      value={
                        (local.actionParams && local.actionParams[param]) || ""
                      }
                      onChange={(e) => handleParamChange(param, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 6,
                        fontSize: 14,
                        transition: "border-color 0.2s",
                      }}
                      placeholder={`Enter ${param.toLowerCase()}`}
                      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* End Fields */}
      {selectedNode.type === "end" && (
        <div style={{ flexShrink: 0 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 12,
              color: "#374151",
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            <input
              type="checkbox"
              checked={local.summary || false}
              onChange={(e) => handleInputChange("summary", e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Show Summary
          </label>
          {local.summary && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#374151",
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                End Message
              </label>
              <input
                value={local.endMessage || ""}
                onChange={(e) =>
                  handleInputChange("endMessage", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                }}
                placeholder="Workflow completed successfully!"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
