import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AlertContext = createContext(null);

const getAlertTone = (message) => {
  const text = message.toString().toLowerCase();
  if (text.includes('erro') || text.includes('nao encontrado') || text.includes('não encontrado')) return 'danger';
  if (text.includes('maior') || text.includes('informe') || text.includes('invalido') || text.includes('inválido')) return 'warning';
  return 'success';
};

const getAlertTitle = (tone) => {
  if (tone === 'danger') return 'Ação não concluída';
  if (tone === 'warning') return 'Atenção';
  return 'Tudo certo';
};

export function AppAlertProvider({ children }) {
  const [alertData, setAlertData] = useState(null);

  const showAlert = useCallback((message, options = {}) => {
    const text = message?.toString?.() || '';
    const tone = options.tone || getAlertTone(text);

    setAlertData({
      message: text,
      tone,
      title: options.title || getAlertTitle(tone),
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertData(null);
  }, []);

  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message) => showAlert(message);

    return () => {
      window.alert = nativeAlert;
    };
  }, [showAlert]);

  useEffect(() => {
    if (!alertData) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') closeAlert();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alertData, closeAlert]);

  const value = useMemo(() => ({ showAlert, closeAlert }), [showAlert, closeAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      {alertData && (
        <div className="app-alert-backdrop" role="dialog" aria-modal="true" aria-labelledby="app-alert-title">
          <div className={`app-alert app-alert-${alertData.tone}`}>
            <div className="app-alert-icon" aria-hidden="true">
              {alertData.tone === 'success' ? 'OK' : '!'}
            </div>
            <div className="app-alert-content">
              <h2 id="app-alert-title">{alertData.title}</h2>
              <p>{alertData.message}</p>
            </div>
            <button className="btn btn-primary app-alert-button" onClick={closeAlert} autoFocus>
              Entendi
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export const useAppAlert = () => useContext(AlertContext);
