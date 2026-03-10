import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import QuickRecordView from './components/QuickRecordView';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const isQuickMode = window.location.hash.includes('quick');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isQuickMode ? <QuickRecordView /> : <App />}
  </React.StrictMode>
);
