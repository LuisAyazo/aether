import React, { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { websocketService } from '../../../services/websocketService';

interface CollaboratorCursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

interface CollaboratorCursorsProps {
  currentUserId: string;
}

const CollaboratorCursors: React.FC<CollaboratorCursorsProps> = ({ currentUserId }) => {
  const [collaborators, setCollaborators] = useState<CollaboratorCursor[]>([]);
  const { project } = useReactFlow();

  useEffect(() => {
    // Update collaborators when they move their cursor
    const handleCursorMove = (data: { userId: string; x: number; y: number }) => {
      if (data.userId === currentUserId) return; // Don't show own cursor
      
      setCollaborators(websocketService.getCollaborators().filter(c => c.userId !== currentUserId));
    };

    // Handle user join/leave
    const handleUserJoined = () => {
      setCollaborators(websocketService.getCollaborators().filter(c => c.userId !== currentUserId));
    };

    const handleUserLeft = () => {
      setCollaborators(websocketService.getCollaborators().filter(c => c.userId !== currentUserId));
    };

    // Subscribe to events
    websocketService.on('user:cursor:move', handleCursorMove);
    websocketService.on('user:joined', handleUserJoined);
    websocketService.on('user:left', handleUserLeft);

    // Initial load
    setCollaborators(websocketService.getCollaborators().filter(c => c.userId !== currentUserId));

    // Cleanup
    return () => {
      websocketService.off('user:cursor:move', handleCursorMove);
      websocketService.off('user:joined', handleUserJoined);
      websocketService.off('user:left', handleUserLeft);
    };
  }, [currentUserId]);

  // Send cursor position on mouse move
  useEffect(() => {
    const handleMouseMove = (event: Event) => {
      if (!project) return;
      
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as HTMLElement;
      
      if (!target) return;
      
      const bounds = target.getBoundingClientRect();
      const position = project({
        x: mouseEvent.clientX - bounds.left,
        y: mouseEvent.clientY - bounds.top,
      });
      
      websocketService.updateCursorPosition(position.x, position.y);
    };

    const flowElement = document.querySelector('.react-flow');
    if (flowElement) {
      flowElement.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (flowElement) {
        flowElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [project]);

  return (
    <div className="collaborator-cursors" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1000 }}>
      {collaborators.map((collaborator) => {
        const position = project ? project({ x: collaborator.x, y: collaborator.y }) : { x: collaborator.x, y: collaborator.y };
        
        return (
          <div
            key={collaborator.userId}
            className="collaborator-cursor"
            style={{
              position: 'absolute',
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)',
              transition: 'all 0.1s ease-out',
            }}
          >
            {/* Cursor */}
            <svg
              width="24"
              height="36"
              viewBox="0 0 24 36"
              fill="none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill={collaborator.color}
                stroke="white"
                strokeLinejoin="round"
              />
            </svg>
            
            {/* Name label */}
            <div
              style={{
                position: 'absolute',
                left: 20,
                top: 5,
                backgroundColor: collaborator.color,
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                userSelect: 'none',
              }}
            >
              {collaborator.userName}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CollaboratorCursors;
