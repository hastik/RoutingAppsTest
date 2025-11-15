import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadLayout } from './bootstrap/loadLayout.js';
import { ShellProvider } from './components/ShellProvider.jsx';
import { App } from './App.jsx';

loadLayout()
  .then((refs) => {
    const root = ReactDOM.createRoot(refs.rootContainer);
    root.render(
      <React.StrictMode>
        <ShellProvider refs={refs}>
          <App />
        </ShellProvider>
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('Failed to initialize React stack', error);
    const fallback = document.createElement('pre');
    fallback.textContent = `Unable to boot React app: ${error.message}`;
    document.body.appendChild(fallback);
  });
