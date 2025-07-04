/// <reference types="react" />
import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Specify full file extension to aid module resolver.
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);