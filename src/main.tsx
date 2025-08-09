import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import React from 'react';

console.log("main.tsx executed");

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
