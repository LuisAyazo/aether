// React Portal component for rendering content outside the normal DOM hierarchy
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  containerSelector?: string;
}

const Portal: React.FC<PortalProps> = ({ 
  children, 
  containerSelector = 'body' 
}) => {
  const [container, setContainer] = useState<Element | null>(null);

  useEffect(() => {
    // Wait for document to be available
    if (typeof document !== 'undefined') {
      const targetContainer = document.querySelector(containerSelector);
      setContainer(targetContainer);
    }
  }, [containerSelector]);

  if (!container) return null;
  
  return ReactDOM.createPortal(children, container);
};

export default Portal;
