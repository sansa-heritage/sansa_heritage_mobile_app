// src/context/HelpSheetContext.tsx
import { createContext, useContext } from 'react';

export interface HelpSheetContextValue {
  openHelpSheet: (orderId?: string) => void;
  closeHelpSheet: () => void;
}

export const HelpSheetContext = createContext<HelpSheetContextValue>({
  openHelpSheet: () => {},
  closeHelpSheet: () => {},
});

export const useHelpSheet = () => useContext(HelpSheetContext);