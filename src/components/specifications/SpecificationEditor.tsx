'use client';

import { useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { SpecItem, generateSpecItemId } from '@/types/diagram';

interface SpecificationEditorProps {
  items: SpecItem[];
  onUpdate: (items: SpecItem[]) => void;
  onClose: () => void;
  textClassName?: string; // Override text size class (default: 'text-sm')
}

// Convert SpecItem[] tree → indented plain text (2 spaces per level)
function itemsToText(items: SpecItem[], depth: number = 0): string {
  const lines: string[] = [];
  for (const item of items) {
    lines.push('  '.repeat(depth) + item.text);
    if (item.children.length > 0) {
      lines.push(itemsToText(item.children, depth + 1));
    }
  }
  return lines.join('\n');
}

// Parse indented text → SpecItem[] tree using a stack-based depth tracker
function textToItems(text: string): SpecItem[] {
  if (!text.trim()) {
    return [{ id: generateSpecItemId(), text: '', children: [] }];
  }

  const lines = text.split('\n');
  const root: SpecItem[] = [];
  const stack: { items: SpecItem[]; depth: number }[] = [{ items: root, depth: -1 }];

  for (const line of lines) {
    const stripped = line.replace(/^ */, '');
    const leadingSpaces = line.length - stripped.length;
    const depth = Math.floor(leadingSpaces / 2);

    const item: SpecItem = {
      id: generateSpecItemId(),
      text: stripped,
      children: [],
    };

    // Pop stack until we find a parent at a shallower depth
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    stack[stack.length - 1].items.push(item);
    stack.push({ items: item.children, depth });
  }

  return root;
}

export function SpecificationEditor({ items, onUpdate, onClose, textClassName = 'text-sm' }: SpecificationEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea, preserving ancestor scroll positions
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const scrollableAncestors: { el: Element; top: number }[] = [];
    let ancestor = textarea.parentElement;
    while (ancestor) {
      if (ancestor.scrollHeight > ancestor.clientHeight) {
        scrollableAncestors.push({ el: ancestor, top: ancestor.scrollTop });
      }
      ancestor = ancestor.parentElement;
    }

    textarea.style.height = 'auto';
    const maxHeight = 320;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';

    for (const { el, top } of scrollableAncestors) {
      el.scrollTop = top;
    }
  }, []);

  // Resize and focus on mount
  useEffect(() => {
    adjustHeight();
    textareaRef.current?.focus();
  }, [adjustHeight]);

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    onUpdate(textToItems(textarea.value));
    adjustHeight();
  }, [onUpdate, adjustHeight]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;

      // Find the full block of lines covered by the selection
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const nextNewline = value.indexOf('\n', selectionEnd);
      const lineEnd = nextNewline === -1 ? value.length : nextNewline;

      const selectedBlock = value.substring(lineStart, lineEnd);
      const lines = selectedBlock.split('\n');

      let newBlock: string;
      let newSelectionStart: number;
      let newSelectionEnd: number;

      if (e.shiftKey) {
        // Outdent: remove up to 2 leading spaces from each line
        const outdentedLines = lines.map(line => {
          if (line.startsWith('  ')) return line.substring(2);
          if (line.startsWith(' ')) return line.substring(1);
          return line;
        });
        newBlock = outdentedLines.join('\n');

        const firstLineDelta = lines[0].length - outdentedLines[0].length;
        const totalDelta = selectedBlock.length - newBlock.length;
        newSelectionStart = Math.max(lineStart, selectionStart - firstLineDelta);
        newSelectionEnd = selectionEnd - totalDelta;
      } else {
        // Indent: prepend 2 spaces to each line
        newBlock = lines.map(line => '  ' + line).join('\n');

        newSelectionStart = selectionStart + 2;
        newSelectionEnd = selectionEnd + lines.length * 2;
      }

      // Use execCommand so the change integrates with native undo
      textarea.setSelectionRange(lineStart, lineEnd);
      document.execCommand('insertText', false, newBlock);

      // Restore selection range after modification
      textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
    }
  }, [onClose]);

  return (
    <textarea
      ref={textareaRef}
      defaultValue={itemsToText(items)}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={`w-full min-w-[250px] bg-transparent border-none outline-none ${textClassName} text-gray-700 resize-none overflow-hidden scrollbar-thin`}
      placeholder="Enter specifications..."
      spellCheck={false}
    />
  );
}
