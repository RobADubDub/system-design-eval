'use client';

import { useCallback, useRef, useEffect, useState, KeyboardEvent } from 'react';
import { SpecItem, generateSpecItemId } from '@/types/diagram';

interface SpecificationEditorProps {
  items: SpecItem[];
  onUpdate: (items: SpecItem[]) => void;
  onClose: () => void;
  textClassName?: string; // Override text size class (default: 'text-sm')
}

interface FlatItem {
  item: SpecItem;
  depth: number;
  path: number[]; // Path to this item in the tree
}

// Convert path array to string key for lookups
function pathToKey(path: number[]): string {
  return path.join('-');
}

// Find index of a path in a flat item list
function findFlatIndex(flat: FlatItem[], path: number[]): number {
  const key = pathToKey(path);
  return flat.findIndex(f => pathToKey(f.path) === key);
}

// Flatten items for rendering/editing
function flattenItems(items: SpecItem[], depth: number = 0, path: number[] = []): FlatItem[] {
  const result: FlatItem[] = [];
  items.forEach((item, index) => {
    const currentPath = [...path, index];
    result.push({ item, depth, path: currentPath });
    if (item.children.length > 0) {
      result.push(...flattenItems(item.children, depth + 1, currentPath));
    }
  });
  return result;
}

// Deep clone items
function cloneItems(items: SpecItem[]): SpecItem[] {
  return items.map(item => ({
    ...item,
    children: cloneItems(item.children),
  }));
}

// Get item at path
function getItemAtPath(items: SpecItem[], path: number[]): SpecItem | null {
  if (path.length === 0) return null;
  const [first, ...rest] = path;
  if (first >= items.length) return null;
  if (rest.length === 0) return items[first];
  return getItemAtPath(items[first].children, rest);
}

// Get parent array and index for a path
function getParentAndIndex(items: SpecItem[], path: number[]): { parent: SpecItem[], index: number } | null {
  if (path.length === 0) return null;
  if (path.length === 1) return { parent: items, index: path[0] };

  const parentPath = path.slice(0, -1);
  const parent = getItemAtPath(items, parentPath);
  if (!parent) return null;
  return { parent: parent.children, index: path[path.length - 1] };
}

// Check if path points to the only root-level item
function isOnlyRootItem(items: SpecItem[], path: number[]): boolean {
  const location = getParentAndIndex(items, path);
  return location !== null && location.parent.length === 1 && path.length === 1;
}

export function SpecificationEditor({ items, onUpdate, onClose, textClassName = 'text-sm' }: SpecificationEditorProps) {
  const [focusedPath, setFocusedPath] = useState<number[]>([0]);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const flatItems = flattenItems(items);

  // Combined focus update - sets state and triggers DOM focus
  const focusPath = useCallback((path: number[]) => {
    setFocusedPath(path);
    const key = pathToKey(path);
    setTimeout(() => {
      inputRefs.current.get(key)?.focus();
    }, 0);
  }, []);

  // Update text for an item at path
  const updateItemText = useCallback((path: number[], text: string) => {
    const newItems = cloneItems(items);
    const item = getItemAtPath(newItems, path);
    if (item) {
      item.text = text;
      onUpdate(newItems);
    }
  }, [items, onUpdate]);

  // Indent item (make it child of previous sibling)
  const indentItem = useCallback((path: number[]) => {
    if (path.length === 0) return;
    const index = path[path.length - 1];
    if (index === 0) return; // Can't indent first item

    const newItems = cloneItems(items);
    const location = getParentAndIndex(newItems, path);
    if (!location) return;

    const item = location.parent[index];
    const prevSibling = location.parent[index - 1];

    // Remove from current position and add as child of previous sibling
    location.parent.splice(index, 1);
    prevSibling.children.push(item);
    onUpdate(newItems);

    // Update focus to new nested position
    focusPath([...path.slice(0, -1), index - 1, prevSibling.children.length - 1]);
  }, [items, onUpdate, focusPath]);

  // Outdent item (make it sibling of parent)
  const outdentItem = useCallback((path: number[]) => {
    if (path.length <= 1) return; // Can't outdent top-level items

    const newItems = cloneItems(items);
    const location = getParentAndIndex(newItems, path);
    if (!location) return;

    const item = location.parent[location.index];
    const parentPath = path.slice(0, -1);
    const parentLocation = getParentAndIndex(newItems, parentPath);
    if (!parentLocation) return;

    // Remove from current position and insert after parent
    location.parent.splice(location.index, 1);
    parentLocation.parent.splice(parentLocation.index + 1, 0, item);
    onUpdate(newItems);

    // Update focus to new position after parent
    focusPath([...parentPath.slice(0, -1), parentLocation.index + 1]);
  }, [items, onUpdate, focusPath]);

  // Helper: Set cursor position after React re-render
  const setCursorPosition = useCallback((path: number[], position: number) => {
    setTimeout(() => {
      const input = inputRefs.current.get(pathToKey(path));
      input?.setSelectionRange(position, position);
    }, 0);
  }, []);

  // Helper: Get adjacent item in flat list
  const getAdjacentItem = useCallback((path: number[], direction: 'prev' | 'next'): FlatItem | null => {
    const flat = flattenItems(items);
    const index = findFlatIndex(flat, path);
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    return (targetIndex >= 0 && targetIndex < flat.length) ? flat[targetIndex] : null;
  }, [items]);

  // Core operation: Delete a line, focus adjacent line
  const deleteLine = useCallback((path: number[], focusDirection: 'prev' | 'next') => {
    if (isOnlyRootItem(items, path)) return;

    const flat = flattenItems(items);
    const flatIndex = findFlatIndex(flat, path);
    if (flatIndex < 0) return;

    const newItems = cloneItems(items);
    const location = getParentAndIndex(newItems, path);
    if (!location) return;

    location.parent.splice(location.index, 1);
    onUpdate(newItems);

    // Focus adjacent line
    const newFlat = flattenItems(newItems);
    if (focusDirection === 'prev' && flatIndex > 0) {
      focusPath(flat[flatIndex - 1].path);
    } else if (focusDirection === 'next' && flatIndex < newFlat.length) {
      focusPath(newFlat[flatIndex].path);
    } else if (newFlat.length > 0) {
      // Fallback to last item
      focusPath(newFlat[newFlat.length - 1].path);
    }
  }, [items, onUpdate, focusPath]);

  // Core operation: Split line at cursor (Enter in middle of text)
  const splitLine = useCallback((path: number[], cursorPos: number, text: string) => {
    const newItems = cloneItems(items);
    const location = getParentAndIndex(newItems, path);
    if (!location) return;

    const beforeCursor = text.slice(0, cursorPos);
    const afterCursor = text.slice(cursorPos);

    // Update current line with text before cursor
    location.parent[location.index].text = beforeCursor;

    // Insert new line with text after cursor
    const newItem: SpecItem = {
      id: generateSpecItemId(),
      text: afterCursor,
      children: [],
    };
    location.parent.splice(location.index + 1, 0, newItem);
    onUpdate(newItems);

    // Focus new line at position 0
    const newPath = [...path.slice(0, -1), path[path.length - 1] + 1];
    focusPath(newPath);
    setCursorPosition(newPath, 0);
  }, [items, onUpdate, focusPath, setCursorPosition]);

  // Core operation: Merge current line into previous (Backspace at start)
  const mergeWithPrevious = useCallback((path: number[], text: string) => {
    const prevItem = getAdjacentItem(path, 'prev');
    if (!prevItem) return;

    const mergePoint = prevItem.item.text.length;
    const newItems = cloneItems(items);

    // Append current text to previous
    const prevInNew = getItemAtPath(newItems, prevItem.path);
    if (!prevInNew) return;
    prevInNew.text += text;

    // Delete current line
    const location = getParentAndIndex(newItems, path);
    if (!location) return;
    location.parent.splice(location.index, 1);

    onUpdate(newItems);
    focusPath(prevItem.path);
    setCursorPosition(prevItem.path, mergePoint);
  }, [items, onUpdate, focusPath, setCursorPosition, getAdjacentItem]);

  // Core operation: Merge next line into current (Delete at end)
  const mergeWithNext = useCallback((path: number[], cursorPos: number) => {
    const nextItem = getAdjacentItem(path, 'next');
    if (!nextItem) return;

    const newItems = cloneItems(items);

    // Append next line's text to current
    const currentInNew = getItemAtPath(newItems, path);
    if (!currentInNew) return;
    currentInNew.text += nextItem.item.text;

    // Delete next line
    const nextLocation = getParentAndIndex(newItems, nextItem.path);
    if (!nextLocation) return;
    nextLocation.parent.splice(nextLocation.index, 1);

    onUpdate(newItems);
    focusPath(path);
    setCursorPosition(path, cursorPos);
  }, [items, onUpdate, focusPath, setCursorPosition, getAdjacentItem]);

  // Navigate to adjacent item in flat list
  const navigateToAdjacent = useCallback((path: number[], direction: 'up' | 'down') => {
    const flat = flattenItems(items);
    const currentIndex = findFlatIndex(flat, path);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < flat.length) {
      focusPath(flat[targetIndex].path);
    }
  }, [items, focusPath]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, path: number[], text: string) => {
    const input = e.target as HTMLInputElement;
    const cursorPos = input.selectionStart ?? 0;
    const isEmpty = text === '';
    const cursorAtStart = cursorPos === 0;
    const cursorAtEnd = cursorPos === text.length;

    const prevItem = getAdjacentItem(path, 'prev');
    const nextItem = getAdjacentItem(path, 'next');

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        splitLine(path, cursorPos, text);
        break;

      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          outdentItem(path);
        } else {
          indentItem(path);
        }
        break;

      case 'Delete':
        if (isEmpty) {
          // Empty line: delete it, focus next
          e.preventDefault();
          deleteLine(path, 'next');
        } else if (cursorAtEnd && nextItem) {
          // At end of line: merge next line into current
          e.preventDefault();
          mergeWithNext(path, cursorPos);
        }
        break;

      case 'Backspace':
        if (isEmpty) {
          // Empty line: delete it, focus previous
          e.preventDefault();
          deleteLine(path, 'prev');
        } else if (cursorAtStart && prevItem) {
          e.preventDefault();
          if (prevItem.item.text === '') {
            // Previous is empty: delete it, stay on current (which moves up)
            deleteLine(prevItem.path, 'next');
          } else {
            // Previous has text: merge current into previous
            mergeWithPrevious(path, text);
          }
        }
        break;

      case 'Escape':
        e.preventDefault();
        onClose();
        break;

      case 'ArrowUp':
        e.preventDefault();
        navigateToAdjacent(path, 'up');
        break;

      case 'ArrowDown':
        e.preventDefault();
        navigateToAdjacent(path, 'down');
        break;
    }
  }, [splitLine, indentItem, outdentItem, deleteLine, mergeWithPrevious, mergeWithNext, getAdjacentItem, navigateToAdjacent, onClose]);

  // Focus first input on mount
  useEffect(() => {
    focusPath([0]);
  }, [focusPath]);

  // Note: Click-outside handling is done by SpecificationBox parent component

  const renderItem = (flatItem: FlatItem) => {
    const key = pathToKey(flatItem.path);
    return (
      <div
        key={flatItem.item.id}
        className="flex items-center"
        style={{ paddingLeft: flatItem.depth * 16 }}
      >
        <span className={`text-gray-400 mr-1 ${textClassName} select-none`}>•</span>
        <input
          ref={(el) => {
            if (el) inputRefs.current.set(key, el);
          }}
          type="text"
          value={flatItem.item.text}
          onChange={(e) => updateItemText(flatItem.path, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, flatItem.path, flatItem.item.text)}
          onFocus={() => setFocusedPath(flatItem.path)}
          className={`flex-1 bg-transparent border-none outline-none ${textClassName} text-gray-700 py-0.5 px-1 focus:bg-gray-50 rounded`}
          placeholder="Enter text..."
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className="space-y-0.5 p-1">
      {flatItems.map(renderItem)}
    </div>
  );
}
