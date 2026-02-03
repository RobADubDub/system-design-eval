'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { NodeSpecification, CloudNode, NODE_DIMENSIONS } from '@/types/diagram';
import { SpecificationBox } from './SpecificationBox';
import { useReactFlow } from '@xyflow/react';

interface SpecificationsLayerProps {
  specifications: NodeSpecification[];
  nodes: CloudNode[];
  isScrolling: boolean;
  onUpdateSpecification: (spec: NodeSpecification) => void;
  onDeleteSpecification: (nodeId: string) => void;
}

interface BoxCorners {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
}

interface ConnectionPosition {
  nodeId: string;
  // All positions relative to container
  specBoxCorners: BoxCorners | null;
  nodeCenter: { x: number; y: number };
}

// Find the corner closest to the target point
function getClosestCorner(corners: BoxCorners, target: { x: number; y: number }): { x: number; y: number } {
  const allCorners = [corners.topLeft, corners.topRight, corners.bottomLeft, corners.bottomRight];

  let closest = allCorners[0];
  let minDistance = Number.MAX_VALUE;

  for (const corner of allCorners) {
    const distance = Math.sqrt(
      Math.pow(corner.x - target.x, 2) + Math.pow(corner.y - target.y, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closest = corner;
    }
  }

  return closest;
}

export function SpecificationsLayer({
  specifications,
  nodes,
  isScrolling,
  onUpdateSpecification,
  onDeleteSpecification,
}: SpecificationsLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connections, setConnections] = useState<ConnectionPosition[]>([]);
  const [, forceUpdate] = useState(0);
  const { getViewport } = useReactFlow();

  // Calculate position in container coordinates
  const getContainerPosition = useCallback((spec: NodeSpecification) => {
    const node = nodes.find(n => n.id === spec.nodeId);
    if (!node) return null;

    const viewport = getViewport();

    // Node position in container coordinates (accounting for viewport pan and zoom)
    const nodeX = node.position.x * viewport.zoom + viewport.x;
    const nodeY = node.position.y * viewport.zoom + viewport.y;

    // Spec box position (node position + offset, scaled by zoom)
    const specX = nodeX + spec.offsetX * viewport.zoom;
    const specY = nodeY + spec.offsetY * viewport.zoom;

    // Node center
    const nodeCenterX = nodeX + (NODE_DIMENSIONS.minWidth / 2) * viewport.zoom;
    const nodeCenterY = nodeY + (NODE_DIMENSIONS.height / 2) * viewport.zoom;

    return {
      specPosition: { left: specX, top: specY },
      nodeCenter: { x: nodeCenterX, y: nodeCenterY },
    };
  }, [nodes, getViewport]);

  // Update connection positions
  const updateConnections = useCallback(() => {
    const newConnections: ConnectionPosition[] = [];

    for (const spec of specifications) {
      const positions = getContainerPosition(spec);
      if (!positions) continue;

      const boxElement = boxRefs.current.get(spec.nodeId);
      let specBoxCorners: BoxCorners | null = null;

      if (boxElement && containerRef.current) {
        const boxRect = boxElement.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        // Get all corners relative to container
        const left = boxRect.left - containerRect.left;
        const right = boxRect.right - containerRect.left;
        const top = boxRect.top - containerRect.top;
        const bottom = boxRect.bottom - containerRect.top;

        specBoxCorners = {
          topLeft: { x: left, y: top },
          topRight: { x: right, y: top },
          bottomLeft: { x: left, y: bottom },
          bottomRight: { x: right, y: bottom },
        };
      }

      newConnections.push({
        nodeId: spec.nodeId,
        specBoxCorners,
        nodeCenter: positions.nodeCenter,
      });
    }

    setConnections(newConnections);
  }, [specifications, getContainerPosition]);

  // Update on mount and periodically for viewport changes
  useEffect(() => {
    updateConnections();
    const interval = setInterval(updateConnections, 50);
    return () => clearInterval(interval);
  }, [updateConnections]);

  // Force re-render when boxes are mounted to get their refs
  useEffect(() => {
    const timer = setTimeout(() => forceUpdate(n => n + 1), 50);
    return () => clearTimeout(timer);
  }, [specifications.length]);

  // Handle position change for a spec box
  const handlePositionChange = useCallback((nodeId: string, newOffsetX: number, newOffsetY: number) => {
    const spec = specifications.find(s => s.nodeId === nodeId);
    if (!spec) return;

    onUpdateSpecification({
      ...spec,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    });
  }, [specifications, onUpdateSpecification]);

  const viewport = getViewport();

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 5 }}
    >
      {/* SVG layer for connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {connections.map(conn => {
          if (!conn.specBoxCorners) return null;

          const closestCorner = getClosestCorner(conn.specBoxCorners, conn.nodeCenter);

          return (
            <line
              key={`conn-${conn.nodeId}`}
              x1={closestCorner.x}
              y1={closestCorner.y}
              x2={conn.nodeCenter.x}
              y2={conn.nodeCenter.y}
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              opacity={isScrolling ? 0.7 : 0.4}
              style={{
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </svg>

      {/* Spec boxes layer */}
      {specifications.map(spec => {
        const positions = getContainerPosition(spec);
        if (!positions) return null;

        return (
          <div
            key={spec.nodeId}
            ref={(el) => {
              if (el) boxRefs.current.set(spec.nodeId, el);
            }}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              left: positions.specPosition.left,
              top: positions.specPosition.top,
              zIndex: 10,
            }}
          >
            <SpecificationBox
              spec={spec}
              availableHeight={300}
              zoom={viewport.zoom}
              onUpdate={onUpdateSpecification}
              onDelete={() => onDeleteSpecification(spec.nodeId)}
              onPositionChange={(newOffsetX, newOffsetY) => {
                handlePositionChange(spec.nodeId, newOffsetX, newOffsetY);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
