import React from 'react';
import ConsolePageHeader from '../console/ConsolePageHeader';
import DashboardActionPanel from './DashboardActionPanel';
import ThreadUnreadSummary from '../threads/ThreadUnreadSummary';

export default function DashboardWorkspace({ title, description, action, children }) {
  return (
    <div className="space-y-8">
      <ConsolePageHeader title={title} description={description} />
      <ThreadUnreadSummary />
      {action && <DashboardActionPanel {...action} />}
      {children}
    </div>
  );
}
