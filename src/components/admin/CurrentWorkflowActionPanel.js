'use client';

import React from 'react';
import WorkflowActionPanel from './WorkflowActionPanel';

export default function CurrentWorkflowActionPanel(props) {
  return <WorkflowActionPanel {...props} hideIfNoAction={true} />;
}
