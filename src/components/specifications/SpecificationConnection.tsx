'use client';

interface SpecificationConnectionProps {
  specBox: DOMRect | null;
  nodeCenter: { x: number; y: number };
  isScrolling: boolean;
  containerOffset: { x: number; y: number };
}

export function SpecificationConnection({
  specBox,
  nodeCenter,
  isScrolling,
  containerOffset,
}: SpecificationConnectionProps) {
  if (!specBox) return null;

  // Calculate spec box center on left edge (connection point)
  const specConnectionX = specBox.left - containerOffset.x;
  const specConnectionY = specBox.top + specBox.height / 2 - containerOffset.y;

  // Node center position
  const nodeX = nodeCenter.x;
  const nodeY = nodeCenter.y;

  // Determine which edge of the spec box to connect from
  // based on relative position to node
  let startX = specConnectionX;
  const startY = specConnectionY;

  // If spec is to the left of node, connect from right edge
  if (specConnectionX + specBox.width / 2 < nodeX) {
    startX = specBox.right - containerOffset.x;
  }

  return (
    <line
      x1={startX}
      y1={startY}
      x2={nodeX}
      y2={nodeY}
      stroke="#e5e7eb"
      strokeWidth={1}
      strokeDasharray="4 4"
      opacity={isScrolling ? 0.6 : 0.3}
      style={{
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
      }}
    />
  );
}
