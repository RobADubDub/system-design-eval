'use client';

import { useState } from 'react';
import { CloudNode, CloudNodeType, CloudNodeData } from '@/types/diagram';
import { getComponentLabel, getComponentColor, getComponentProperties } from '@/lib/components/registry';
import { COMPONENT_REFERENCE } from '@/lib/components/reference';

interface NodePropertiesPanelProps {
  node: CloudNode | null;
  onUpdateNode: (nodeId: string, data: Partial<CloudNodeData>) => void;
  onClose: () => void;
}

export function NodePropertiesPanel({ node, onUpdateNode, onClose }: NodePropertiesPanelProps) {
  const [referenceOpen, setReferenceOpen] = useState(false);

  if (!node) {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center text-gray-400">
        <p className="text-sm">Select a node to edit its properties</p>
      </div>
    );
  }

  const nodeType = node.type as CloudNodeType;
  const fields = getComponentProperties(nodeType);
  const color = getComponentColor(nodeType);

  const handleFieldChange = (key: string, value: string | number | boolean) => {
    // Convert string 'true'/'false' to boolean for persistence field
    let processedValue = value;
    if (key === 'persistence' && typeof value === 'string') {
      processedValue = value === 'true';
    }
    onUpdateNode(node.id, { [key]: processedValue });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-gray-800 text-sm">
            {getComponentLabel(nodeType)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Properties Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Label
          </label>
          <input
            type="text"
            value={node.data.label || ''}
            onChange={(e) => onUpdateNode(node.id, { label: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Description
          </label>
          <textarea
            value={node.data.description || ''}
            onChange={(e) => onUpdateNode(node.id, { description: e.target.value })}
            placeholder="What does this component do?"
            rows={2}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Type-specific fields */}
        {fields.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Technical Details
            </span>
            <div className="mt-2 space-y-3">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'select' && field.options ? (
                    <select
                      value={String((node.data as Record<string, unknown>)[field.key] ?? '')}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      value={String((node.data as Record<string, unknown>)[field.key] ?? '')}
                      onChange={(e) => handleFieldChange(field.key, parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String((node.data as Record<string, unknown>)[field.key] ?? '')}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Notes
          </label>
          <textarea
            value={node.data.notes || ''}
            onChange={(e) => onUpdateNode(node.id, { notes: e.target.value })}
            placeholder="Additional notes, constraints, considerations..."
            rows={3}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Reference */}
        {COMPONENT_REFERENCE[nodeType] && (
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => setReferenceOpen((prev) => !prev)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Reference
              </span>
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${referenceOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {referenceOpen && (
              <div className="mt-2 space-y-2">
                {COMPONENT_REFERENCE[nodeType]!.keyConcepts.map((concept) => (
                  <div key={concept.term}>
                    <span className="text-xs font-semibold text-gray-700">{concept.term}</span>
                    <p className="text-xs text-gray-500 leading-relaxed">{concept.description}</p>
                  </div>
                ))}
                {COMPONENT_REFERENCE[nodeType]!.learnMoreUrl && (
                  <a
                    href={COMPONENT_REFERENCE[nodeType]!.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-blue-500 hover:text-blue-600 mt-1"
                  >
                    Learn more &rarr;
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-gray-100 text-xs text-gray-400 text-center">
        Press Delete to remove node
      </div>
    </div>
  );
}
