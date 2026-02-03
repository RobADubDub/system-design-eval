'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface EditingContextType {
  editingNodeId: string | null;
  triggerEdit: (nodeId: string) => void;
  clearEditing: () => void;
}

const EditingContext = createContext<EditingContextType | null>(null);

export function EditingProvider({ children }: { children: ReactNode }) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const triggerEdit = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
  }, []);

  const clearEditing = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  return (
    <EditingContext.Provider value={{ editingNodeId, triggerEdit, clearEditing }}>
      {children}
    </EditingContext.Provider>
  );
}

export function useEditing() {
  const context = useContext(EditingContext);
  if (!context) {
    throw new Error('useEditing must be used within an EditingProvider');
  }
  return context;
}
