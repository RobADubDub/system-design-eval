'use client';

import { useState, useRef, useEffect } from 'react';
import { PROBLEM_TEMPLATES, getTemplatesByCategory } from '@/data/problemTemplates';
import { ProblemTemplate } from '@/types/notesAssist';

interface TemplateSelectorProps {
  onSelectTemplate: (template: ProblemTemplate) => void;
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const templatesByCategory = getTemplatesByCategory();
  const categories = Array.from(templatesByCategory.keys()).sort();

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
        Use Template
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1 w-64 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs text-gray-500">
              Select a template to pre-fill the problem statement
            </p>
          </div>

          {categories.map((category) => (
            <div key={category}>
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {category}
                </span>
              </div>
              {templatesByCategory.get(category)?.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {template.name}
                  </span>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                    {template.problemStatement.substring(0, 80)}...
                  </p>
                </button>
              ))}
            </div>
          ))}

          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400 text-center">
              {PROBLEM_TEMPLATES.length} templates available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
