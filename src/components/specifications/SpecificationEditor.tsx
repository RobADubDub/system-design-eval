'use client';

import { useCallback, useRef, useEffect, useState, KeyboardEvent } from 'react';
import { SpecItem, generateSpecItemId } from '@/types/diagram';

interface SpecificationEditorProps {
  items: SpecItem[];
  onUpdate: (items: SpecItem[]) => void;
  onClose: () => void;
}

interface FlatItem {
  item: SpecItem;
  depth: number;
  path: number[]; // Path to this item in the tree
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

export function SpecificationEditor({ items, onUpdate, onClose }: SpecificationEditorProps) {
  const [focusedPath, setFocusedPath] = useState<number[]>([0]);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const flatItems = flattenItems(items);

  // Focus the input for a given path
  const focusInput = useCallback((path: number[]) => {
    const pathKey = path.join('-');
    setTimeout(() => {
      const input = inputRefs.current.get(pathKey);
      input?.focus();
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

  // Insert new sibling after current item
  const insertSibling = useCallback((path: number[]) => {
    const newItems = cloneItems(items);
    const location = getParentAndIndex(newItems, path);
    if (!location) return;

    const newItem: SpecItem = {
      id: generateSpecItemId(),
      text: '',
      children: [],
    };
    location.parent.splice(location.index + 1, 0, newItem);
    onUpdate(newItems);

    // Focus the new item
    const newPath = [...path.slice(0, -1), path[path.length - 1] + 1];
    setFocusedPath(newPath);
    focusInput(newPath);
  }, [items, onUpdate, focusInput]);

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

    // Remove from current position
    location.parent.splice(index, 1);
    // Add as child of previous sibling
    prevSibling.children.push(item);

    onUpdate(newItems);

    // Update focus path
    const newPath = [...path.slice(0, -1), index - 1, prevSibling.children.length - 1];
    setFocusedPath(newPath);
    focusInput(newPath);
  }, [items, onUpdate, focusInput]);

  // Outdent item (make it sibling of parent)
  const outdentItem = useCallback((path: number[]) => {
    if (path.length <= 1) return; // Can't outdent top-level items

    const newItems = cloneItems(items);
    const location = getParentAndIndex(newItems, path);
    if (!location) return;

    const item = location.parent[location.index];

    // Get parent's location
    const parentPath = path.slice(0, -1);
    const parentLocation = getParentAndIndex(newItems, parentPath);
    if (!parentLocation) return;

    // Remove from current position
    location.parent.splice(location.index, 1);
    // Insert after parent
    parentLocation.parent.splice(parentLocation.index + 1, 0, item);

    onUpdate(newItems);

    // Update focus path
    const newPath = [...parentPath.slice(0, -1), parentLocation.index + 1];
    setFocusedPath(newPath);
    focusInput(newPath);
  }, [items, onUpdate, focusInput]);

  // Delete item and move focus
  const deleteItem = useCallback((path: number[]) => {
    const newItems = cloneItems(items);
    const location = getParentAndIndex(newItems, path);
    if (!location) return;

    // Don't delete if it's the only item
    if (location.parent.length === 1 && path.length === 1) {
      return;
    }

    // Remove the item
    location.parent.splice(location.index, 1);
    onUpdate(newItems);

    // Find previous item to focus
    const flat = flattenItems(items);
    const currentFlatIndex = flat.findIndex(f => f.path.join('-') === path.join('-'));
    if (currentFlatIndex > 0) {
      const prevPath = flat[currentFlatIndex - 1].path;
      setFocusedPath(prevPath);
      focusInput(prevPath);
    }
  }, [items, onUpdate, focusInput]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, path: number[], text: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      insertSibling(path);
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      indentItem(path);
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      outdentItem(path);
    } else if (e.key === 'Backspace' && text === '') {
      e.preventDefault();
      deleteItem(path);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const flat = flattenItems(items);
      const currentIndex = flat.findIndex(f => f.path.join('-') === path.join('-'));
      if (currentIndex > 0) {
        const prevPath = flat[currentIndex - 1].path;
        setFocusedPath(prevPath);
        focusInput(prevPath);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const flat = flattenItems(items);
      const currentIndex = flat.findIndex(f => f.path.join('-') === path.join('-'));
      if (currentIndex < flat.length - 1) {
        const nextPath = flat[currentIndex + 1].path;
        setFocusedPath(nextPath);
        focusInput(nextPath);
      }
    }
  }, [insertSibling, indentItem, outdentItem, deleteItem, onClose, items, focusInput]);

  // Focus first input on mount
  useEffect(() => {
    focusInput([0]);
  }, [focusInput]);

  // Note: Click-outside handling is done by SpecificationBox parent component

  const renderItem = (flatItem: FlatItem) => {
    const pathKey = flatItem.path.join('-');
    return (
      <div
        key={flatItem.item.id}
        className="flex items-center"
        style={{ paddingLeft: flatItem.depth * 16 }}
      >
        <span className="text-gray-400 mr-1 text-sm select-none">•</span>
        <input
          ref={(el) => {
            if (el) inputRefs.current.set(pathKey, el);
          }}
          type="text"
          value={flatItem.item.text}
          onChange={(e) => updateItemText(flatItem.path, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, flatItem.path, flatItem.item.text)}
          onFocus={() => setFocusedPath(flatItem.path)}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 py-0.5 px-1 focus:bg-gray-50 rounded"
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
