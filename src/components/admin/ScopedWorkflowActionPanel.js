'use client';

import React from 'react';
import WorkflowActionPanel from './WorkflowActionPanel';

export default function ScopedWorkflowActionPanel(props) {
  return <WorkflowActionPanel {...props} hideIfNoAction />;
}
