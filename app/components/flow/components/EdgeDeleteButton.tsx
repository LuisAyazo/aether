import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as ReactFlowLibrary from 'reactflow';
import { throttle } from '../utils/throttle'; // Asumiendo que throttle está en utils

type Edge = ReactFlowLibrary.Edge<ReactFlowLibrary.EdgeProps['data']>; // Usar un tipo más genérico para data si no se conoce CustomEdgeData aquí

interface EdgeDeleteButtonProps {
  edge: Edge;
  onEdgeDelete: (edge: Edge) => void;
}

const EdgeDeleteButton: React.FC<EdgeDeleteButtonProps> = ({ edge, onEdgeDelete }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  const updatePosition = useCallback(() => {
    const edgeElement = document.querySelector(`[data-testid="rf__edge-${edge.id}"] path`);
    if (!edgeElement || !(edgeElement instanceof SVGPathElement)) return;
    const pathLength = edgeElement.getTotalLength();
    const midPoint = edgeElement.getPointAtLength(pathLength / 2);
    const svgElement = edgeElement.closest('.react-flow__edges');
    if (!svgElement || !(svgElement instanceof SVGSVGElement)) return;
    const point = svgElement.createSVGPoint();
    point.x = midPoint.x; point.y = midPoint.y;
    const ctm = svgElement.getScreenCTM();
    if (!ctm) return;
    const screenPoint = point.matrixTransform(ctm);
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const finalX = screenPoint.x + scrollX; const finalY = screenPoint.y + scrollY;
    if (Math.abs(finalX - positionRef.current.x) > 0.5 || Math.abs(finalY - positionRef.current.y) > 0.5) {
      positionRef.current = { x: finalX, y: finalY };
      setPosition({ x: finalX, y: finalY });
    }
  }, [edge.id]);

  useEffect(() => {
    let animationFrameId: number; let isUpdating = false;
    const handleTransform = () => {
      if (!isUpdating) {
        isUpdating = true;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => { updatePosition(); isUpdating = false; });
      }
    };
    updatePosition();
    const observer = new MutationObserver(handleTransform);
    const edgeElement = document.querySelector(`[data-testid="rf__edge-${edge.id}"]`);
    if (edgeElement) observer.observe(edgeElement, { attributes: true, childList: true, subtree: true, attributeFilter: ['d', 'transform'] });
    const throttledTransform = throttle(handleTransform, 16);
    window.addEventListener('resize', throttledTransform);
    document.addEventListener('reactflow.transform', throttledTransform as EventListener);
    document.addEventListener('reactflow.nodedrag', throttledTransform as EventListener);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', throttledTransform);
      document.removeEventListener('reactflow.transform', throttledTransform as EventListener);
      document.removeEventListener('reactflow.nodedrag', throttledTransform as EventListener);
    };
  }, [edge.id, updatePosition]);

  return ( <div className="edge-delete-button" style={{ position: 'fixed', transform: 'translate(-50%, -50%)', left: `${position.x}px`, top: `${position.y}px`, width: '16px', height: '16px', backgroundColor: 'white', border: '1.5px solid #ff4d4d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', lineHeight: 1, color: '#ff4d4d', zIndex: 1000, pointerEvents: 'all', userSelect: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdgeDelete(edge); }}>×</div> );
};

export default EdgeDeleteButton;
