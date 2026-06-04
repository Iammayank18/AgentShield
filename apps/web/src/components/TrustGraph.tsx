"use client";
import { useEffect, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import type { ExecutionStep } from "@agent-shield/shared-types";
import { Network } from "lucide-react";

const TRUST_NODE_STYLE: Record<string, React.CSSProperties> = {
  trusted: {
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.4)",
    color: "#86efac",
  },
  untrusted: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.4)",
    color: "#fca5a5",
  },
  sensitive: {
    background: "rgba(249,115,22,0.1)",
    border: "1px solid rgba(249,115,22,0.4)",
    color: "#fdba74",
  },
};

function stepToNode(step: ExecutionStep, index: number): Node {
  const isBlocked = step.metadata?.blocked === true;
  const style = isBlocked
    ? { background: "rgba(239,68,68,0.2)", border: "2px solid rgba(239,68,68,0.7)", color: "#fca5a5" }
    : TRUST_NODE_STYLE[step.trustLevel] ?? TRUST_NODE_STYLE.trusted;

  return {
    id: step.id,
    position: { x: index * 180, y: step.taintedBy?.length ? 120 : 0 },
    data: {
      label: (
        <div className="text-center px-1">
          <div className="text-[10px] font-semibold leading-tight">{step.label.substring(0, 24)}</div>
          <div className="text-[9px] opacity-60 mt-0.5">{step.trustLevel}</div>
        </div>
      ),
    },
    style: { ...style, borderRadius: 8, padding: "6px 8px", fontSize: 10, minWidth: 100 },
  };
}

interface TrustGraphProps {
  steps: ExecutionStep[];
}

export function TrustGraph({ steps }: TrustGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (steps.length === 0) return;

    const newNodes = steps.map((step, i) => stepToNode(step, i));

    const newEdges: Edge[] = [];
    steps.forEach((step) => {
      if (step.taintedBy && step.taintedBy.length > 0) {
        step.taintedBy.forEach((parentId) => {
          if (steps.find((s) => s.id === parentId)) {
            newEdges.push({
              id: `${parentId}-${step.id}`,
              source: parentId,
              target: step.id,
              style: { stroke: "#ef4444", strokeDasharray: "5,3", strokeWidth: 2 },
              animated: true,
            });
          }
        });
      } else if (steps.indexOf(step) > 0) {
        const prev = steps[steps.indexOf(step) - 1];
        newEdges.push({
          id: `${prev.id}-${step.id}`,
          source: prev.id,
          target: step.id,
          style: { stroke: "#475569", strokeWidth: 1.5 },
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [steps, setNodes, setEdges]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#1e1e2e]">
        <Network size={14} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Trust Graph</span>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-green-500 inline-block" /> trusted
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-red-500 inline-block border-dashed" /> tainted
          </span>
        </div>
      </div>
      <div className="flex-1 rounded-lg overflow-hidden bg-[#0d0d14] border border-[#1e1e2e]">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-xs font-mono">
            Graph populates as agent executes
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1e1e2e" gap={20} />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
