import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';  // Optional, for your global CSS (if you use it)
import App from './App';  // Your main App component
import reportWebVitals from './reportWebVitals';  // Optional, for performance monitoring

// Render the App component inside the DOM element with the id 'root'
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') // This links to the div with id="root" in index.html
);

// Optional: Report web vitals for performance monitoring
reportWebVitals();
