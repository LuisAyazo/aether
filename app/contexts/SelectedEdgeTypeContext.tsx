"use client";

import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { LogicalEdgeType } from '@/app/config/edgeConfig'; // Asegúrate que la ruta sea correcta

interface SelectedEdgeTypeContextProps {
  selectedLogicalType: LogicalEdgeType | null;
  setSelectedLogicalType: Dispatch<SetStateAction<LogicalEdgeType | null>>;
}

const SelectedEdgeTypeContext = createContext<SelectedEdgeTypeContextProps | undefined>(undefined);

export const SelectedEdgeTypeProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLogicalType, setSelectedLogicalType] = useState<LogicalEdgeType | null>(null);

  return (
    <SelectedEdgeTypeContext.Provider value={{ selectedLogicalType, setSelectedLogicalType }}>
      {children}
    </SelectedEdgeTypeContext.Provider>
  );
};

export const useSelectedEdgeType = (): SelectedEdgeTypeContextProps => {
  const context = useContext(SelectedEdgeTypeContext);
  if (context === undefined) {
    throw new Error('useSelectedEdgeType must be used within a SelectedEdgeTypeProvider');
  }
  return context;
};
