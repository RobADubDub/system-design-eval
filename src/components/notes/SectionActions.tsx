'use client';

import { SectionAssistState, HintLevel } from '@/types/notesAssist';

interface SectionActionsProps {
  sectionId: string;
  sectionTitle: string;
  assistState: SectionAssistState;
  canUseAssist: boolean;
  isProblemSection: boolean;
  hasContent: boolean;
  onValidate: (sectionId: string, sectionTitle: string) => void;
  onGetHint: (sectionId: string, sectionTitle: string, level: HintLevel) => void;
}

export function SectionActions({
  sectionId,
  sectionTitle,
  assistState,
  canUseAssist,
  isProblemSection,
  hasContent,
  onValidate,
  onGetHint,
}: SectionActionsProps) {
  const { isLoading, currentHintLevel, validationResult } = assistState;

  // Don't show actions for the Problem section itself
  if (isProblemSection) {
    return null;
  }

  // Determine next hint level
  const nextHintLevel: HintLevel = currentHintLevel
    ? (Math.min(currentHintLevel + 1, 3) as HintLevel)
    : 1;

  const getHintButtonLabel = () => {
    if (isLoading) return 'Loading...';
    if (!currentHintLevel) return 'Get Hint';
    if (currentHintLevel >= 3) return 'All Hints Shown';
    return 'More Hints';
  };

  const getValidateButtonLabel = () => {
    if (isLoading) return 'Checking...';
    if (validationResult) return 'Check Again';
    return 'Check My Work';
  };

  const tooltipText = !canUseAssist
    ? 'Fill in the Problem section first to enable AI assistance'
    : '';

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* Get Hint button */}
      <button
        onClick={() => onGetHint(sectionId, sectionTitle, nextHintLevel)}
        disabled={!canUseAssist || isLoading || currentHintLevel === 3}
        title={tooltipText}
        className={`
          px-2 py-1 text-xs font-medium rounded transition-colors
          ${
            canUseAssist && !isLoading && currentHintLevel !== 3
              ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {getHintButtonLabel()}
      </button>

      {/* Check My Work button */}
      <button
        onClick={() => onValidate(sectionId, sectionTitle)}
        disabled={!canUseAssist || isLoading}
        title={tooltipText}
        className={`
          px-2 py-1 text-xs font-medium rounded transition-colors
          ${
            canUseAssist && !isLoading
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {getValidateButtonLabel()}
      </button>

      {/* Loading indicator */}
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
    </div>
  );
}
