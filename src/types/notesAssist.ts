// Hint level for progressive reveal
export type HintLevel = 1 | 2 | 3;

// AI-generated validation result
export interface ValidationResult {
  covered: string[];              // What user covered well
  missing: string[];              // Considerations to add
  suggestions: string[];          // Improvement tips
}

// AI-generated hint
export interface GeneratedHint {
  level: HintLevel;
  content: string;
}

// Per-section assistance state
export interface SectionAssistState {
  sectionId: string;
  currentHintLevel: HintLevel | null;
  hints: GeneratedHint[];         // Cached hints (generated on demand)
  validationResult: ValidationResult | null;
  isLoading: boolean;
}

// Overall assistance state (stored alongside notes)
export interface NotesAssistState {
  sections: SectionAssistState[];
}

// Optional: Problem templates for convenience (NOT required)
export interface ProblemTemplate {
  id: string;
  name: string;
  category: string;
  problemStatement: string;       // Just the problem text - no pre-defined answers
}

// Default assist state for a section
export function createDefaultSectionAssistState(sectionId: string): SectionAssistState {
  return {
    sectionId,
    currentHintLevel: null,
    hints: [],
    validationResult: null,
    isLoading: false,
  };
}

// Default assist state for all sections
export function createDefaultNotesAssistState(sectionIds: string[]): NotesAssistState {
  return {
    sections: sectionIds.map(createDefaultSectionAssistState),
  };
}
