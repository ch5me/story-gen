import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

document.body.setAttribute('data-ch5-theme', 'dark');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('main: #root element not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
