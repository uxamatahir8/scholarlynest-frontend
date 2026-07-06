import React from 'react';
import ConsolePageHeader from '../console/ConsolePageHeader';
import DashboardActionPanel from './DashboardActionPanel';

export default function DashboardWorkspace({ title, description, action, children }) {
  return (
    <div className="space-y-8">
      <ConsolePageHeader title={title} description={description} />
      {action && <DashboardActionPanel {...action} />}
      {children}
    </div>
  );
}
