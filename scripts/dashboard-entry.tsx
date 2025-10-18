import React from 'react';
import { createRoot } from 'react-dom/client';
import StaticDashboard from '../src/components/StaticDashboard';

// Wait for DOM and data to be ready
declare global {
  interface Window {
    DASHBOARD_DATA: any;
  }
}

const rootElement = document.getElementById('dashboard-root');
if (rootElement && window.DASHBOARD_DATA) {
  const root = createRoot(rootElement);
  root.render(<StaticDashboard data={window.DASHBOARD_DATA} />);
}
