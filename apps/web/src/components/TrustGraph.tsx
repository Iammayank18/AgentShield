"use client";
import { useEffect, useCallback } from "react";
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, type Node, type Edge, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ExecutionStep } from "@agent-shield/shared-types";
import { Network, Shield, ShieldOff, ShieldAlert, Lock } from "lucide-react";

const TRUST_CONFIG = {
  trusted:   { bg: "rgba(16,185,129,0.08)", border: "rgba(52,211,153,0.35)", text: "#6ee7b7", glow: "rgba(52,211,153,0.15)", dot: "#34d399" },
  untrusted: { bg: "rgba(239,68,68,0.08)",  border: "rgba(248,113,113,0.35)", text: "#fca5a5", glow: "rgba(248,113,113,0.15)", dot: "#f87171" },
  sensitive: { bg: "rgba(245,158,11,0.08)", border: "rgba(251,191,36,0.35)", text: "#fcd34d", glow: "rgba(251,191,36,0.15)", dot: "#fbbf24" },
};

const STEP_ICONS: Record<string, string> = {
  input: "⌨",
  retrieval: "🔍",
  planning: "🧠",
  security_check: "🔒",
  tool_call: "⚡",
  response: "✓",
};

function TrustNode({ data }: { data: { label: string; trustLevel: string; type: string; isBlocked: boolean; taintCount: number } }) {
  const cfg = TRUST_CONFIG[data.trustLevel as keyof typeof TRUST_CONFIG] ?? TRUST_CONFIG.trusted;
  const blocked = data.isBlocked;

  return (
    <div
      style={{
        background: blocked ? "rgba(239,68,68,0.12)" : cfg.bg,
        border: `1px solid ${blocked ? "rgba(248,113,113,0.5)" : cfg.border}`,
        borderRadius: 12,
        padding: "8px 12px",
        minWidth: 110,
        boxShadow: `0 0 16px ${blocked ? "rgba(239,68,68,0.1)" : cfg.glow}`,
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: cfg.dot, border: "none", width: 6, height: 6 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 13 }}>{STEP_ICONS[data.type] ?? "◆"}</span>
        <span style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: cfg.text, fontWeight: 700 }}>
          {data.trustLevel.toUpperCase()}
        </span>
        {data.taintCount > 0 && (
          <span style={{ fontSize: 9, color: "#f87171", fontFamily: "monospace", marginLeft: "auto" }}>
            ☣{data.taintCount}
          </span>
        )}
      </div>
      <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.3, fontFamily: "Inter, sans-serif" }}>
        {data.label.length > 22 ? data.label.substring(0, 22) + "…" : data.label}
      </div>
      {blocked && (
        <div style={{
          position: "absolute", top: -8, right: -8,
          background: "rgba(239,68,68,0.9)", borderRadius: "50%",
          width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 9, color: "white" }}>✕</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: cfg.dot, border: "none", width: 6, height: 6 }} />
    </div>
  );
}

const nodeTypes = { trustNode: TrustNode };

function stepToNode(step: ExecutionStep, index: number): Node {
  const isBlocked = step.metadata?.blocked === true;

  return {
    id: step.id,
    type: "trustNode",
    position: { x: 60, y: index * 130 },
    data: {
      label: step.label,
      trustLevel: step.trustLevel,
      type: step.type,
      isBlocked,
      taintCount: step.taintedBy?.length ?? 0,
    },
  };
}

interface TrustGraphProps {
  steps: ExecutionStep[];
}

export function TrustGraph({ steps }: TrustGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (steps.length === 0) return;

    const newNodes = steps.map((step, i) => stepToNode(step, i));
    const newEdges: Edge[] = [];

    steps.forEach((step, idx) => {
      if (idx === 0) return;
      const prev = steps[idx - 1];
      const isTainted = (step.taintedBy?.length ?? 0) > 0;
      newEdges.push({
        id: `flow-${prev.id}-${step.id}`,
        source: prev.id,
        target: step.id,
        type: "smoothstep",
        style: isTainted
          ? { stroke: "#f87171", strokeDasharray: "4,3", strokeWidth: 2 }
          : { stroke: "#334155", strokeWidth: 1.5 },
        animated: isTainted,
        ...(isTainted && {
          label: "tainted",
          labelStyle: { fill: "#f87171", fontSize: 9, fontFamily: "JetBrains Mono, monospace" },
          labelBgStyle: { fill: "rgba(239,68,68,0.1)", rx: 4 },
        }),
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [steps, setNodes, setEdges]);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Network size={13} className="text-purple-400" />
        </div>
        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Trust Graph</span>
        <div className="ml-auto flex items-center gap-3 text-[9px] font-mono text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500/60 inline-block" /> trusted
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500/60 inline-block" /> tainted
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500/60 inline-block" /> sensitive
          </span>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-white/[0.04]"
           style={{ background: "radial-gradient(ellipse at center, rgba(20,20,40,0.8) 0%, rgba(7,7,13,1) 100%)" }}>
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
              <Network size={18} className="text-slate-700" />
            </div>
            <span className="text-slate-700 text-[11px] font-mono">Graph populates as agent executes</span>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1a1a2e" gap={24} size={1} />
            <Controls
              showInteractive={false}
              style={{ background: "rgba(13,13,22,0.8)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
