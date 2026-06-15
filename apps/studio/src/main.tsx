import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// Theme is a DOM attribute (no React ThemeProvider): firefly tokens resolve from
// the [data-ch5-theme] selector. Set it before render so the first paint is themed.
document.body.setAttribute('data-ch5-theme', 'dark');

const container = document.getElementById('root');
if (!container) {
  throw new Error('Studio bootstrap: #root element is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
