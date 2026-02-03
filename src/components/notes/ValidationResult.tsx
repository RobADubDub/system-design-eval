'use client';

import ReactMarkdown from 'react-markdown';
import { ValidationResult as ValidationResultType } from '@/types/notesAssist';

interface ValidationResultProps {
  result: ValidationResultType | null;
  onClear: () => void;
}

export function ValidationResult({ result, onClear }: ValidationResultProps) {
  if (!result) return null;

  const hasCovered = result.covered.length > 0;
  const hasMissing = result.missing.length > 0;
  const hasSuggestions = result.suggestions.length > 0;

  return (
    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Feedback
        </h4>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Clear feedback"
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

      {/* Covered items - success */}
      {hasCovered && (
        <div className="mb-2">
          <div className="flex items-center gap-1 mb-1">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-medium text-green-700">Covered well</span>
          </div>
          <ul className="ml-5 space-y-0.5">
            {result.covered.map((item, index) => (
              <li key={index} className="text-xs text-green-600">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing items - warning */}
      {hasMissing && (
        <div className="mb-2">
          <div className="flex items-center gap-1 mb-1">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-xs font-medium text-amber-700">Consider adding</span>
          </div>
          <ul className="ml-5 space-y-0.5">
            {result.missing.map((item, index) => (
              <li key={index} className="text-xs text-amber-600">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions - info */}
      {hasSuggestions && (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span className="text-xs font-medium text-blue-700">Tips</span>
          </div>
          <ul className="ml-5 space-y-1">
            {result.suggestions.map((item, index) => (
              <li key={index} className="text-xs text-blue-600">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <span>{children}</span>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {item}
                </ReactMarkdown>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {!hasCovered && !hasMissing && !hasSuggestions && (
        <p className="text-xs text-gray-500 italic">No specific feedback at this time.</p>
      )}
    </div>
  );
}
