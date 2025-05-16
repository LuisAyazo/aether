'use client';

/**
 * React 19 Compatibility Patch for Ant Design v5
 * 
 * React 19 adjusted the export method of react-dom, which causes compatibility issues with Ant Design v5:
 * 1. Wave effects (ripples) don't show
 * 2. Static methods of Modal, Notification, and Message components don't work
 * 
 * This component imports the official compatibility patch that fixes these issues.
 * It must be included at the top level of the application (in app/layout.tsx).
 * 
 * Documentation: https://ant.design/docs/react/compatible-react19#react-19-compatibility
 */
import '@ant-design/v5-patch-for-react-19';

export default function AntdReact19Patch() {
  return null; // This component doesn't render anything visible
}
