// Script para debuggear las posiciones de los nodos en grupos
const fs = require('fs');

// Simular la conversión que hace el frontend
function convertToReactFlowNodes(customNodes) {
  return customNodes.map(node => {
    const reactFlowNode = {
      ...node,
      parentId: node.parentNode, // Conversión clave: parentNode -> parentId
      data: { ...node.data }
    };

    // Check if this node is a child of a minimized group
    if (node.parentNode) {
      const parentNode = customNodes.find(n => n.id === node.parentNode);
      if (parentNode?.data?.isMinimized) {
        reactFlowNode.hidden = true;
        reactFlowNode.style = {
          ...reactFlowNode.style,
          visibility: 'hidden',
          pointerEvents: 'none',
          opacity: 0
        };
      }
    }

    return reactFlowNode;
  });
}

// Simular la conversión inversa para guardar
function convertFromReactFlowNodes(reactFlowNodes) {
  return reactFlowNodes.map(n => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
    width: n.width,
    height: n.height,
    parentNode: n.parentId, // Conversión inversa: parentId -> parentNode
    style: n.style
  }));
}

// Datos de ejemplo
const backendNodes = [
  {
    id: 'group-1',
    type: 'group',
    position: { x: 100, y: 100 },
    data: { label: 'Mi Grupo', isMinimized: false },
    width: 400,
    height: 300
  },
  {
    id: 'node-1',
    type: 'aws_instance',
    position: { x: 50, y: 50 }, // Posición relativa dentro del grupo
    data: { label: 'EC2 Instance' },
    parentNode: 'group-1', // Backend usa parentNode
    width: 150,
    height: 80
  },
  {
    id: 'node-2',
    type: 'aws_s3_bucket',
    position: { x: 200, y: 150 }, // Posición relativa dentro del grupo
    data: { label: 'S3 Bucket' },
    parentNode: 'group-1', // Backend usa parentNode
    width: 150,
    height: 80
  }
];

console.log('=== DATOS DEL BACKEND ===');
console.log(JSON.stringify(backendNodes, null, 2));

console.log('\n=== CONVERSIÓN A REACTFLOW ===');
const reactFlowNodes = convertToReactFlowNodes(backendNodes);
console.log(JSON.stringify(reactFlowNodes, null, 2));

console.log('\n=== FILTRADO DE NODOS HIJOS (como en GroupFocusView) ===');
const groupId = 'group-1';
const childNodes = reactFlowNodes.filter(n => n.parentId === groupId || n.parentNode === groupId);
console.log('Nodos hijos encontrados:', childNodes.length);
console.log(JSON.stringify(childNodes, null, 2));

console.log('\n=== CONVERSIÓN PARA GUARDAR ===');
const nodesToSave = convertFromReactFlowNodes(reactFlowNodes);
console.log(JSON.stringify(nodesToSave, null, 2));

console.log('\n=== VERIFICACIÓN DE POSICIONES ===');
childNodes.forEach(node => {
  console.log(`Nodo ${node.id}:`);
  console.log(`  - Posición: x=${node.position?.x || 0}, y=${node.position?.y || 0}`);
  console.log(`  - ParentId: ${node.parentId}`);
  console.log(`  - ParentNode: ${node.parentNode}`);
});
