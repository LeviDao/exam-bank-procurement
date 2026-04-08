import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="color:red;padding:20px;font-family:sans-serif;height:100vh;background:black">
      <h3>Error: ${event.error?.message || event.message}</h3>
      <pre>${event.error?.stack}</pre>
    </div>`;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
