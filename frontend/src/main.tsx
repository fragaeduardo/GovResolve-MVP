import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { api } from './services/api';
import { clearSavedChatSession } from './hooks/useChatSession';
import './styles/index.css';

// A demonstração sempre começa na tela de acesso após um carregamento completo.
api.logout();
clearSavedChatSession();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
