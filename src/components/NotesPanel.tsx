'use client';

import { useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { DiagramNotes, NotesSection } from '@/types/diagram';
import { ProblemTemplate } from '@/types/notesAssist';
import { TemplateSelector } from './notes';

interface NotesSectionProps {
  section: NotesSection;
  onToggle: (sectionId: string) => void;
  onExpand: (sectionId: string) => void;
  onCollapse: (sectionId: string) => void;
  onUpdate: (sectionId: string, content: string) => void;
  shortcutNumber: number;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
  // AI Assist props
  canUseAssist: boolean;
  onOpenAIForHint: (sectionId: string, sectionTitle: string) => void;
  onOpenAIForValidation: (sectionId: string, sectionTitle: string) => void;
  onSelectTemplate?: (template: ProblemTemplate) => void;
}

function NotesSectionComponent({
  section,
  onToggle,
  onExpand,
  onCollapse,
  onUpdate,
  shortcutNumber,
  sectionRef,
  canUseAssist,
  onOpenAIForHint,
  onOpenAIForValidation,
  onSelectTemplate,
}: NotesSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isProblemSection = section.id === 'problem';

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [section.content, section.collapsed, adjustHeight]);

  // Handle keyboard navigation for collapse/expand
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onExpand(section.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onCollapse(section.id);
    }
  };

  return (
    <div ref={sectionRef} className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => onToggle(section.id)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors group"
      >
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            section.collapsed ? '' : 'rotate-90'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="flex-1 text-sm font-medium text-gray-700">
          {section.title}
        </span>
        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Ctrl+{shortcutNumber}
        </span>
      </button>

      {!section.collapsed && (
        <div className="px-3 pb-3">
          {/* Template selector for Problem section */}
          {isProblemSection && onSelectTemplate && (
            <div className="mb-2">
              <TemplateSelector onSelectTemplate={onSelectTemplate} />
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={section.content}
            onChange={(e) => {
              onUpdate(section.id, e.target.value);
              adjustHeight();
            }}
            placeholder={getPlaceholder(section.id)}
            className="w-full min-h-[80px] px-2 py-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ overflow: 'hidden' }}
          />

          {/* AI Assist actions for non-Problem sections */}
          {!isProblemSection && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onOpenAIForHint(section.id, section.title)}
                disabled={!canUseAssist}
                title={!canUseAssist ? 'Fill in the Problem section first' : 'Get a hint for this section'}
                className={`
                  px-2 py-1 text-xs font-medium rounded transition-colors
                  ${canUseAssist
                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Get Hint
              </button>

              <button
                onClick={() => onOpenAIForValidation(section.id, section.title)}
                disabled={!canUseAssist}
                title={!canUseAssist ? 'Fill in the Problem section first' : 'Check your work on this section'}
                className={`
                  px-2 py-1 text-xs font-medium rounded transition-colors
                  ${canUseAssist
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Check My Work
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getPlaceholder(sectionId: string): string {
  switch (sectionId) {
    case 'problem':
      return 'What system are we designing? E.g., "Design a video sharing platform like YouTube"';
    case 'functional':
      return '- Users can upload videos\n- Users can search for videos\n- Users can comment on videos';
    case 'workflows':
      return '1. User opens app\n2. User searches for video\n3. User watches video';
    case 'nonfunctional':
      return '- 99.9% uptime\n- <100ms P99 latency\n- Support 1M DAU';
    case 'entities':
      return 'User, Video, Comment, Like, Subscription';
    case 'apis':
      return 'POST /videos - Upload video\nGET /videos/{id} - Get video\nGET /videos/search - Search videos';
    case 'deepdives':
      return 'Video encoding pipeline:\n- Use FFmpeg for transcoding\n- Generate multiple resolutions (1080p, 720p, 480p)';
    default:
      return 'Enter notes...';
  }
}

interface NotesPanelProps {
  notes: DiagramNotes;
  onUpdateSection: (sectionId: string, content: string) => void;
  onToggleSection: (sectionId: string) => void;
  onExpandSection: (sectionId: string) => void;
  onCollapseSection: (sectionId: string) => void;
  sectionRefs?: Map<string, React.RefObject<HTMLDivElement | null>>;
  // AI Assist props
  canUseAssist: boolean;
  onOpenAIForHint: (sectionId: string, sectionTitle: string) => void;
  onOpenAIForValidation: (sectionId: string, sectionTitle: string) => void;
  onSelectTemplate: (template: ProblemTemplate) => void;
}

export function NotesPanel({
  notes,
  onUpdateSection,
  onToggleSection,
  onExpandSection,
  onCollapseSection,
  sectionRefs,
  canUseAssist,
  onOpenAIForHint,
  onOpenAIForValidation,
  onSelectTemplate,
}: NotesPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pt-1">
        {notes.sections.map((section, index) => (
          <NotesSectionComponent
            key={section.id}
            section={section}
            onToggle={onToggleSection}
            onExpand={onExpandSection}
            onCollapse={onCollapseSection}
            onUpdate={onUpdateSection}
            shortcutNumber={index + 1}
            sectionRef={sectionRefs?.get(section.id)}
            canUseAssist={canUseAssist}
            onOpenAIForHint={onOpenAIForHint}
            onOpenAIForValidation={onOpenAIForValidation}
            onSelectTemplate={section.id === 'problem' ? onSelectTemplate : undefined}
          />
        ))}
      </div>
    </div>
  );
}
