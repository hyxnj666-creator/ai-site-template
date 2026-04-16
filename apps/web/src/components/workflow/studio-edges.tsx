"use client";

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import { memo } from "react";

function AnimatedEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
}: EdgeProps & { data?: { animated?: boolean } }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isAnimated = data?.animated;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isAnimated ? "#a078ff" : "#6366f1",
          strokeWidth: 2,
          strokeDasharray: isAnimated ? "0" : "6 4",
          opacity: isAnimated ? 1 : 0.5,
          filter: isAnimated ? "drop-shadow(0 0 4px rgba(160,120,255,0.4))" : undefined,
        }}
      />
      {isAnimated && (
        <circle r="3" fill="#5de6ff" filter="drop-shadow(0 0 4px rgba(93,230,255,0.8))">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
      {label && (
        <foreignObject
          x={labelX - 30}
          y={labelY - 10}
          width={60}
          height={20}
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="flex items-center justify-center">
            <span className="rounded-md bg-surface-low/90 px-1.5 py-0.5 font-label-ui text-[9px] uppercase tracking-wider text-foreground-muted backdrop-blur-sm">
              {String(label)}
            </span>
          </div>
        </foreignObject>
      )}
    </>
  );
}

export const AnimatedEdge = memo(AnimatedEdgeInner);
