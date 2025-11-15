import { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

const ShellContext = createContext(null);

export function ShellProvider({ refs, children }) {
  if (!refs?.rootContainer) {
    throw new Error('ShellProvider requires layout refs');
  }
  return <ShellContext.Provider value={refs}>{children}</ShellContext.Provider>;
}

export function useShellRefs() {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('Shell context missing');
  }
  return context;
}

export function PanelActionsPortal({ children }) {
  const { panelActions } = useShellRefs();
  if (!panelActions) return null;
  return createPortal(children, panelActions);
}
