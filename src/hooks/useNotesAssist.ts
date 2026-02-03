'use client';

import { useState, useCallback } from 'react';
import {
  NotesAssistState,
  SectionAssistState,
  ValidationResult,
  GeneratedHint,
  HintLevel,
  createDefaultSectionAssistState,
} from '@/types/notesAssist';
import { DiagramNotes } from '@/types/diagram';

interface UseNotesAssistOptions {
  notes: DiagramNotes;
}

interface UseNotesAssistReturn {
  assistState: NotesAssistState;
  setAssistState: React.Dispatch<React.SetStateAction<NotesAssistState>>;
  getSectionAssist: (sectionId: string) => SectionAssistState;
  validateSection: (sectionId: string, sectionTitle: string) => Promise<void>;
  getHint: (sectionId: string, sectionTitle: string, level: HintLevel) => Promise<void>;
  clearSectionAssist: (sectionId: string) => void;
  clearAllAssist: () => void;
  getProblemStatement: () => string;
  canUseAssist: () => boolean;
}

export function useNotesAssist({ notes }: UseNotesAssistOptions): UseNotesAssistReturn {
  const [assistState, setAssistState] = useState<NotesAssistState>(() => ({
    sections: notes.sections.map(s => createDefaultSectionAssistState(s.id)),
  }));

  // Get the problem statement from notes
  const getProblemStatement = useCallback((): string => {
    const problemSection = notes.sections.find(s => s.id === 'problem');
    return problemSection?.content?.trim() || '';
  }, [notes.sections]);

  // Check if assist features can be used (problem statement exists)
  const canUseAssist = useCallback((): boolean => {
    return getProblemStatement().length > 0;
  }, [getProblemStatement]);

  // Get assist state for a specific section
  const getSectionAssist = useCallback(
    (sectionId: string): SectionAssistState => {
      const existing = assistState.sections.find(s => s.sectionId === sectionId);
      return existing || createDefaultSectionAssistState(sectionId);
    },
    [assistState.sections]
  );

  // Update a specific section's assist state
  const updateSectionAssist = useCallback(
    (sectionId: string, updates: Partial<SectionAssistState>) => {
      setAssistState(prev => ({
        sections: prev.sections.map(s =>
          s.sectionId === sectionId ? { ...s, ...updates } : s
        ),
      }));
    },
    []
  );

  // Validate a section's content
  const validateSection = useCallback(
    async (sectionId: string, sectionTitle: string): Promise<void> => {
      const problemStatement = getProblemStatement();
      if (!problemStatement) {
        console.warn('Cannot validate without a problem statement');
        return;
      }

      const section = notes.sections.find(s => s.id === sectionId);
      const userContent = section?.content?.trim() || '';

      // Set loading state
      updateSectionAssist(sectionId, { isLoading: true, validationResult: null });

      try {
        const response = await fetch('/api/ai/notes-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'validate',
            problemStatement,
            sectionId,
            sectionTitle,
            userContent,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to validate section');
        }

        const data = await response.json();

        const result: ValidationResult = {
          covered: data.covered || [],
          missing: data.missing || [],
          suggestions: data.suggestions || [],
        };

        updateSectionAssist(sectionId, { validationResult: result, isLoading: false });
      } catch (error) {
        console.error('Validation error:', error);
        updateSectionAssist(sectionId, { isLoading: false });
      }
    },
    [notes.sections, getProblemStatement, updateSectionAssist]
  );

  // Get hints for a section - fetches all levels at once, reveals progressively
  const getHint = useCallback(
    async (sectionId: string, sectionTitle: string, level: HintLevel): Promise<void> => {
      const problemStatement = getProblemStatement();

      if (!problemStatement) {
        console.warn('Cannot get hints without a problem statement');
        return;
      }

      // Check if hints are already cached
      const sectionState = assistState.sections.find(s => s.sectionId === sectionId);
      const hasAllHints = sectionState?.hints?.length === 3;

      // If hints are already loaded, just reveal the next level (no API call)
      if (hasAllHints) {
        setAssistState(prev => ({
          sections: prev.sections.map(s =>
            s.sectionId === sectionId
              ? { ...s, currentHintLevel: level }
              : s
          ),
        }));
        return;
      }

      const section = notes.sections.find(s => s.id === sectionId);
      const userContent = section?.content?.trim() || '';

      // Set loading state
      updateSectionAssist(sectionId, { isLoading: true });

      try {
        const response = await fetch('/api/ai/notes-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'hint',
            problemStatement,
            sectionId,
            sectionTitle,
            userContent,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get hints');
        }

        const data = await response.json();

        const hints: GeneratedHint[] = [];
        if (data.level1) hints.push({ level: 1, content: data.level1 });
        if (data.level2) hints.push({ level: 2, content: data.level2 });
        if (data.level3) hints.push({ level: 3, content: data.level3 });

        setAssistState(prev => ({
          sections: prev.sections.map(s =>
            s.sectionId === sectionId
              ? { ...s, hints, currentHintLevel: level, isLoading: false }
              : s
          ),
        }));
      } catch (error) {
        console.error('Get hint error:', error);
        updateSectionAssist(sectionId, { isLoading: false });
      }
    },
    [notes.sections, getProblemStatement, updateSectionAssist, assistState.sections]
  );

  // Clear assist state for a section
  const clearSectionAssist = useCallback((sectionId: string) => {
    updateSectionAssist(sectionId, {
      currentHintLevel: null,
      hints: [],
      validationResult: null,
      isLoading: false,
    });
  }, [updateSectionAssist]);

  // Clear all assist state
  const clearAllAssist = useCallback(() => {
    setAssistState(prev => ({
      sections: prev.sections.map(s => ({
        ...s,
        currentHintLevel: null,
        hints: [],
        validationResult: null,
        isLoading: false,
      })),
    }));
  }, []);

  return {
    assistState,
    setAssistState,
    getSectionAssist,
    validateSection,
    getHint,
    clearSectionAssist,
    clearAllAssist,
    getProblemStatement,
    canUseAssist,
  };
}
