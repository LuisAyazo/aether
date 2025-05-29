// Simple debug utility to help diagnose issues with the IaCTemplatePanel
import React, { useEffect } from 'react';

interface DebugPanelProps {
  message: string;
  data?: any;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ message, data }) => {
  useEffect(() => {
    console.log('DebugPanel rendered:', message, data);
  }, [message, data]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        borderRadius: '4px',
        zIndex: 10000,
        maxWidth: '400px',
        maxHeight: '200px',
        overflow: 'auto'
      }}
    >
      <h3>{message}</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default DebugPanel;