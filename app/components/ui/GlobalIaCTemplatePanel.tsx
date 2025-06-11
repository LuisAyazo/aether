// Global IaC Template Panel Singleton for better rendering
'use client';

import React from 'react';
const { useState, useEffect } = React; // Acceder a useState y useEffect desde el objeto React
import { createPortal } from 'react-dom';
import IaCTemplatePanel from './IaCTemplatePanel';
import { ResourceType } from '@/app/types/resourceConfig';

interface ResourceData {
  label: string;
  provider: 'aws' | 'gcp' | 'azure' | 'generic';
  resourceType: ResourceType;
}

// Singleton component to manage IaC templates display globally
export default function GlobalIaCTemplatePanel() {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [nodeId, setNodeId] = useState<string>('');
  const [resourceData, setResourceData] = useState<ResourceData | null>(null);

  useEffect(() => {
    // Create portal element if it doesn't exist
    if (typeof window !== 'undefined') {
      let element = document.getElementById('iac-template-panel-portal');
      if (!element) {
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
      }
      setPortalElement(element);
    }

    // Set up event listeners
    const handleOpenIaCPanel = (event: CustomEvent) => {
      if (!event.detail?.nodeId || !event.detail?.resourceData) {
        console.error('Invalid event data:', event.detail);
        return;
      }

      setNodeId(event.detail.nodeId);
      setResourceData(event.detail.resourceData);
      setIsOpen(true);
    };

    // Listen for events on both window and document
    window.addEventListener('openIaCPanel', handleOpenIaCPanel as EventListener);
    document.addEventListener('openIaCPanel', handleOpenIaCPanel as EventListener);

    return () => {
      window.removeEventListener('openIaCPanel', handleOpenIaCPanel as EventListener);
      document.removeEventListener('openIaCPanel', handleOpenIaCPanel as EventListener);
    };
  }, []); // Remove portalElement from dependencies to prevent recreation

  // Handle closing the panel
  const handleClose = () => {
    setIsOpen(false);
    setNodeId('');
    setResourceData(null);
  };

  // Don't render anything until we have the portal element
  if (!portalElement) {
    return null;
  }

  if (!isOpen || !resourceData) {
    return null;
  }

  // Use createPortal to render the panel into the portal element
  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      <IaCTemplatePanel
        isOpen={isOpen}
        onClose={handleClose}
        resourceData={{
          ...resourceData,
          nodeId: nodeId
        }}
      />
    </div>,
    portalElement
  );
}
