import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = '400px'
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-transparent transition-opacity z-40"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 h-full bg-blue-50 bg-opacity-90 backdrop-blur-md text-gray-900 shadow-xl z-50"
        style={{ 
          width,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isOpen ? 1 : 0,
          transformOrigin: 'right center',
          willChange: 'transform, opacity'
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-blue-100">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-blue-100 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default SidePanel;
