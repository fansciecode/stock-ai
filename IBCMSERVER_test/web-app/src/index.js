import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import 'antd/dist/reset.css';
// Remove or comment out the reportWebVitals import if you don't want to use it
// import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove or comment out the reportWebVitals call if you don't want to use it
// reportWebVitals();
