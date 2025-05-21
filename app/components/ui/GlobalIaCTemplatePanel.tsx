// Global IaC Template Panel Singleton for better rendering
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import IaCTemplatePanel from './IaCTemplatePanel';

interface ResourceData {
  label: string;
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
  resourceType: string;
}

// Singleton component to manage IaC templates display globally
export default function GlobalIaCTemplatePanel() {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [nodeId, setNodeId] = useState<string>('');
  const [resourceData, setResourceData] = useState<ResourceData | null>(null);

  useEffect(() => {
    console.log('GlobalIaCTemplatePanel: Initializing...');
    
    // Create portal element if it doesn't exist
    if (typeof window !== 'undefined') {
      let element = document.getElementById('iac-template-panel-portal');
      if (!element) {
        console.log('GlobalIaCTemplatePanel: Creating portal element');
        element = document.createElement('div');
        element.id = 'iac-template-panel-portal';
        element.style.position = 'fixed';
        element.style.top = '0';
        element.style.right = '0';
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.zIndex = '9999';
        element.style.pointerEvents = 'none';
        document.body.appendChild(element);
        console.log('GlobalIaCTemplatePanel: Portal element created and appended');
      }
      setPortalElement(element);
    }

    // Set up event listeners
    const handleOpenIaCPanel = (event: CustomEvent) => {
      console.log('Received openIaCPanel event:', event);
      console.log('Event type:', event.type);
      console.log('Event detail:', event.detail);
      
      if (!event.detail?.nodeId || !event.detail?.resourceData) {
        console.error('Invalid event data:', event.detail);
        return;
      }

      setNodeId(event.detail.nodeId);
      setResourceData(event.detail.resourceData);
      setIsOpen(true);
      
      console.log('GlobalIaCTemplatePanel: Panel state updated', {
        isOpen: true,
        nodeId: event.detail.nodeId,
        resourceData: event.detail.resourceData
      });
    };

    // Listen for events on both window and document
    window.addEventListener('openIaCPanel', handleOpenIaCPanel as EventListener);
    document.addEventListener('openIaCPanel', handleOpenIaCPanel as EventListener);
    
    console.log('Event listeners registered for openIaCPanel');

    return () => {
      window.removeEventListener('openIaCPanel', handleOpenIaCPanel as EventListener);
      document.removeEventListener('openIaCPanel', handleOpenIaCPanel as EventListener);
      console.log('Event listeners removed for openIaCPanel');
    };
  }, []); // Remove portalElement from dependencies to prevent recreation

  // Handle closing the panel
  const handleClose = () => {
    console.log('GlobalIaCTemplatePanel: Closing panel');
    setIsOpen(false);
    setNodeId('');
    setResourceData(null);
  };

  // Don't render anything until we have the portal element
  if (!portalElement) {
    console.log('GlobalIaCTemplatePanel: No portal element available');
    return null;
  }

  if (!isOpen || !resourceData) {
    console.log('GlobalIaCTemplatePanel: Panel not ready to render', {
      isOpen,
      hasResourceData: !!resourceData
    });
    return null;
  }

  console.log('GlobalIaCTemplatePanel: Rendering panel with data:', {
    isOpen,
    nodeId,
    resourceData
  });

  // Use createPortal to render the panel into the portal element
  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      <IaCTemplatePanel
        isOpen={isOpen}
        onClose={handleClose}
        nodeId={nodeId}
        resourceData={resourceData}
      />
    </div>,
    portalElement
  );
}