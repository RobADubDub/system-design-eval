'use client';

import ReactMarkdown from 'react-markdown';
import { GeneratedHint, HintLevel } from '@/types/notesAssist';

interface HintDisplayProps {
  hints: GeneratedHint[];
  currentLevel: HintLevel | null;
  canGetMoreHints: boolean;
  onGetMoreHints: (level: HintLevel) => void;
  onClear: () => void;
}

function getHintLevelLabel(level: HintLevel): string {
  switch (level) {
    case 1:
      return 'General Guidance';
    case 2:
      return 'System-Specific';
    case 3:
      return 'Detailed Suggestions';
    default:
      return `Level ${level}`;
  }
}

function getHintLevelColor(level: HintLevel): string {
  switch (level) {
    case 1:
      return 'border-amber-200 bg-amber-50';
    case 2:
      return 'border-orange-200 bg-orange-50';
    case 3:
      return 'border-red-200 bg-red-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
}

function getHintLevelTextColor(level: HintLevel): string {
  switch (level) {
    case 1:
      return 'text-amber-700';
    case 2:
      return 'text-orange-700';
    case 3:
      return 'text-red-700';
    default:
      return 'text-gray-700';
  }
}

export function HintDisplay({
  hints,
  currentLevel,
  canGetMoreHints,
  onGetMoreHints,
  onClear,
}: HintDisplayProps) {
  if (hints.length === 0 || currentLevel === null) return null;

  // Only show hints up to the current reveal level
  const visibleHints = hints.filter(h => h.level <= currentLevel);

  const nextLevel = currentLevel ? (Math.min(currentLevel + 1, 3) as HintLevel) : 1;
  const hasMoreLevels = currentLevel < 3 && hints.length === 3; // All hints loaded, more to reveal

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Hints
        </h4>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Clear hints"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Display hints up to current level */}
      {visibleHints.map((hint) => (
        <div
          key={hint.level}
          className={`p-3 border rounded-lg ${getHintLevelColor(hint.level)}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-medium ${getHintLevelTextColor(hint.level)}`}
            >
              {getHintLevelLabel(hint.level)}
            </span>
            <span className="text-xs text-gray-400">
              (Level {hint.level}/3)
            </span>
          </div>
          <div className="text-xs text-gray-700 hint-markdown">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li>{children}</li>,
              }}
            >
              {hint.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}

      {/* Reveal more hints button */}
      {hasMoreLevels && canGetMoreHints && (
        <button
          onClick={() => onGetMoreHints(nextLevel)}
          className="w-full px-3 py-2 text-xs font-medium rounded border transition-colors bg-white text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          Show {nextLevel === 2 ? 'System-Specific' : 'Detailed'} Hints
          <span className="ml-1 text-gray-400">(Level {nextLevel})</span>
        </button>
      )}

      {/* All hints shown message */}
      {currentLevel === 3 && (
        <p className="text-xs text-gray-500 text-center italic">
          All hint levels shown
        </p>
      )}
    </div>
  );
}
