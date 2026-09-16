import React, { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext(null);

let idCounter = 0;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = 'info') => {
    const id = idCounter++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ toasts, notify, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}
