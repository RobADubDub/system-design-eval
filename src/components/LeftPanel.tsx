'use client';

import { ComponentPalette } from './ComponentPalette';
import { NotesPanel } from './NotesPanel';
import { DiagramNotes } from '@/types/diagram';
import { SectionAssistState, HintLevel, ProblemTemplate } from '@/types/notesAssist';

export type LeftPanelTab = 'components' | 'notes';

interface LeftPanelProps {
  activeTab: LeftPanelTab;
  onTabChange: (tab: LeftPanelTab) => void;
  notes: DiagramNotes;
  onUpdateNoteSection: (sectionId: string, content: string) => void;
  onToggleNoteSection: (sectionId: string) => void;
  onExpandNoteSection: (sectionId: string) => void;
  onCollapseNoteSection: (sectionId: string) => void;
  sectionRefs?: Map<string, React.RefObject<HTMLDivElement | null>>;
  // AI Assist props
  getSectionAssist: (sectionId: string) => SectionAssistState;
  canUseAssist: boolean;
  onValidateSection: (sectionId: string, sectionTitle: string) => void;
  onGetHint: (sectionId: string, sectionTitle: string, level: HintLevel) => void;
  onClearSectionAssist: (sectionId: string) => void;
  onSelectTemplate: (template: ProblemTemplate) => void;
}

export function LeftPanel({
  activeTab,
  onTabChange,
  notes,
  onUpdateNoteSection,
  onToggleNoteSection,
  onExpandNoteSection,
  onCollapseNoteSection,
  sectionRefs,
  getSectionAssist,
  canUseAssist,
  onValidateSection,
  onGetHint,
  onClearSectionAssist,
  onSelectTemplate,
}: LeftPanelProps) {
  return (
    <div className="bg-white border-r border-gray-200 w-full flex-shrink-0 flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => onTabChange('components')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'components'
              ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Components
        </button>
        <button
          onClick={() => onTabChange('notes')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'notes'
              ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Notes
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'components' ? (
          <ComponentPaletteContent />
        ) : (
          <NotesPanel
            notes={notes}
            onUpdateSection={onUpdateNoteSection}
            onToggleSection={onToggleNoteSection}
            onExpandSection={onExpandNoteSection}
            onCollapseSection={onCollapseNoteSection}
            sectionRefs={sectionRefs}
            getSectionAssist={getSectionAssist}
            canUseAssist={canUseAssist}
            onValidateSection={onValidateSection}
            onGetHint={onGetHint}
            onClearSectionAssist={onClearSectionAssist}
            onSelectTemplate={onSelectTemplate}
          />
        )}
      </div>
    </div>
  );
}

// Wrapper component that provides the ComponentPalette content without the outer container
function ComponentPaletteContent() {
  return (
    <div className="h-full">
      <ComponentPalette />
    </div>
  );
}
