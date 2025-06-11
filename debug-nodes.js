/**
 * Debug script to analyze node visibility issues
 * This script will help identify why 44 nodes are saved but not all are visible
 */

// Function to analyze node visibility and positioning
function debugNodeVisibility() {
  console.log('🔍 Starting Node Visibility Debug Analysis');
  console.log('=' .repeat(50));

  // Get React Flow instance
  const reactFlowContainer = document.querySelector('.react-flow');
  if (!reactFlowContainer) {
    console.error('❌ React Flow container not found');
    return;
  }

  // Try to get nodes from the React Flow store
  let nodes = [];
  let viewport = null;
  
  // Method 1: Try to get from React Flow instance
  try {
    const reactFlowInstance = window.reactFlowInstance || 
                              document.querySelector('.react-flow')?.__reactInternalInstance?.memoizedProps?.reactFlowInstance;
    
    if (reactFlowInstance?.getNodes) {
      nodes = reactFlowInstance.getNodes();
      viewport = reactFlowInstance.getViewport();
      console.log('✅ Found React Flow instance');
    }
  } catch (e) {
    console.log('⚠️ Could not access React Flow instance directly');
  }

  // Method 2: Try to get from global state or DOM
  if (nodes.length === 0) {
    try {
      // Look for nodes in the DOM
      const nodeElements = document.querySelectorAll('.react-flow__node');
      console.log(`📊 Found ${nodeElements.length} node elements in DOM`);
      
      // Try to extract node data from DOM
      nodeElements.forEach((el, index) => {
        const nodeData = {
          id: el.getAttribute('data-id') || `node-${index}`,
          type: el.className.match(/react-flow__node-(\w+)/)?.[1] || 'unknown',
          position: {
            x: parseFloat(el.style.transform?.match(/translateX\(([^)]+)px\)/)?.[1] || 0),
            y: parseFloat(el.style.transform?.match(/translateY\(([^)]+)px\)/)?.[1] || 0)
          },
          visible: !el.style.display || el.style.display !== 'none',
          hidden: el.hasAttribute('data-hidden') || el.style.visibility === 'hidden',
          bounds: el.getBoundingClientRect()
        };
        nodes.push(nodeData);
      });
    } catch (e) {
      console.error('❌ Error extracting nodes from DOM:', e);
    }
  }

  console.log(`📊 Total nodes found: ${nodes.length}`);
  
  // Analyze node types
  const nodeTypes = {};
  const hiddenNodes = [];
  const visibleNodes = [];
  const outOfViewportNodes = [];
  const groupedNodes = [];

  // Get viewport bounds
  const containerBounds = reactFlowContainer.getBoundingClientRect();
  const viewportBounds = viewport ? {
    left: -viewport.x / viewport.zoom,
    top: -viewport.y / viewport.zoom,
    right: (-viewport.x + containerBounds.width) / viewport.zoom,
    bottom: (-viewport.y + containerBounds.height) / viewport.zoom
  } : null;

  console.log('🖼️ Viewport Info:', {
    viewport,
    containerBounds: {
      width: containerBounds.width,
      height: containerBounds.height
    },
    viewportBounds
  });

  nodes.forEach(node => {
    // Count by type
    const type = node.type || 'unknown';
    nodeTypes[type] = (nodeTypes[type] || 0) + 1;

    // Check visibility status
    if (node.hidden || (node.style && node.style.display === 'none')) {
      hiddenNodes.push({
        id: node.id,
        type: node.type,
        reason: node.hidden ? 'hidden property' : 'display none',
        parentId: node.parentId
      });
    } else {
      visibleNodes.push(node);
    }

    // Check if node is in a group
    if (node.parentId) {
      groupedNodes.push({
        id: node.id,
        type: node.type,
        parentId: node.parentId,
        extent: node.extent
      });
    }

    // Check if node is outside viewport
    if (viewportBounds && node.position) {
      const nodeRight = node.position.x + (node.width || 150);
      const nodeBottom = node.position.y + (node.height || 80);
      
      if (node.position.x > viewportBounds.right || 
          nodeRight < viewportBounds.left ||
          node.position.y > viewportBounds.bottom ||
          nodeBottom < viewportBounds.top) {
        outOfViewportNodes.push({
          id: node.id,
          type: node.type,
          position: node.position,
          viewportBounds
        });
      }
    }
  });

  // Report findings
  console.log('\n📈 VISIBILITY ANALYSIS RESULTS:');
  console.log('=' .repeat(40));
  
  console.log(`🔢 Node Type Distribution:`);
  Object.entries(nodeTypes).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });

  console.log(`\n👁️ Visibility Status:`);
  console.log(`  - Visible nodes: ${visibleNodes.length}`);
  console.log(`  - Hidden nodes: ${hiddenNodes.length}`);
  console.log(`  - Grouped nodes: ${groupedNodes.length}`);
  console.log(`  - Out of viewport: ${outOfViewportNodes.length}`);

  if (hiddenNodes.length > 0) {
    console.log(`\n🙈 Hidden Nodes Details:`);
    hiddenNodes.forEach(node => {
      console.log(`  - ${node.id} (${node.type}) - ${node.reason}${node.parentId ? ` - in group: ${node.parentId}` : ''}`);
    });
  }

  if (groupedNodes.length > 0) {
    console.log(`\n📦 Grouped Nodes Details:`);
    const groupCounts = {};
    groupedNodes.forEach(node => {
      groupCounts[node.parentId] = (groupCounts[node.parentId] || 0) + 1;
    });
    Object.entries(groupCounts).forEach(([groupId, count]) => {
      console.log(`  - Group ${groupId}: ${count} nodes`);
    });
  }

  if (outOfViewportNodes.length > 0) {
    console.log(`\n🔍 Nodes Outside Viewport:`);
    outOfViewportNodes.slice(0, 5).forEach(node => {
      console.log(`  - ${node.id} (${node.type}) at (${node.position.x}, ${node.position.y})`);
    });
    if (outOfViewportNodes.length > 5) {
      console.log(`  ... and ${outOfViewportNodes.length - 5} more`);
    }
  }

  // Check for NON_COUNTABLE_NODE_TYPES filtering
  const nonCountableTypes = ['noteNode', 'textNode', 'areaNode'];
  const countableNodes = nodes.filter(node => !nonCountableTypes.includes(node.type));
  const nonCountableNodes = nodes.filter(node => nonCountableTypes.includes(node.type));

  console.log(`\n📊 Countable vs Non-Countable:`);
  console.log(`  - Countable nodes: ${countableNodes.length}`);
  console.log(`  - Non-countable nodes: ${nonCountableNodes.length} (${nonCountableTypes.join(', ')})`);

  // Check for duplicate IDs
  const nodeIds = nodes.map(n => n.id);
  const duplicateIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    console.log(`\n⚠️ Duplicate Node IDs Found: ${[...new Set(duplicateIds)].join(', ')}`);
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('=' .repeat(40));

  if (hiddenNodes.length > 0) {
    console.log('1. ✅ Check why these nodes are hidden - might be collapsed group children');
  }
  
  if (outOfViewportNodes.length > 0) {
    console.log('2. 🖼️ Use fitView() to see all nodes or check initial positioning');
  }

  if (groupedNodes.length > 0) {
    console.log('3. 📦 Verify group expansion/collapse logic');
  }

  console.log('4. 🔍 Check if nodes are positioned at extreme coordinates');
  console.log('5. 🎛️ Verify NON_COUNTABLE_NODE_TYPES filter in DiagramTreeSelect');

  return {
    totalNodes: nodes.length,
    visibleNodes: visibleNodes.length,
    hiddenNodes: hiddenNodes.length,
    groupedNodes: groupedNodes.length,
    outOfViewportNodes: outOfViewportNodes.length,
    nodeTypes,
    recommendations: 'See console output above'
  };
}

// Function to fit all nodes in view
function fitAllNodesInView() {
  try {
    const reactFlowInstance = window.reactFlowInstance || 
                              document.querySelector('.react-flow')?.__reactInternalInstance?.memoizedProps?.reactFlowInstance;
    
    if (reactFlowInstance?.fitView) {
      console.log('📏 Fitting all nodes in view...');
      reactFlowInstance.fitView({ padding: 0.1, includeHiddenNodes: false });
      return true;
    }
  } catch (e) {
    console.error('❌ Error fitting view:', e);
  }
  return false;
}

// Function to show all hidden nodes (for debugging)
function showAllHiddenNodes() {
  try {
    const reactFlowInstance = window.reactFlowInstance;
    if (reactFlowInstance?.setNodes) {
      console.log('👁️ Showing all hidden nodes...');
      const nodes = reactFlowInstance.getNodes();
      const updatedNodes = nodes.map(node => ({
        ...node,
        hidden: false,
        style: { ...node.style, display: 'block' }
      }));
      reactFlowInstance.setNodes(updatedNodes);
      return true;
    }
  } catch (e) {
    console.error('❌ Error showing hidden nodes:', e);
  }
  return false;
}

// Export functions to global scope for console access
window.debugNodeVisibility = debugNodeVisibility;
window.fitAllNodesInView = fitAllNodesInView;
window.showAllHiddenNodes = showAllHiddenNodes;

console.log('🚀 Node debugging utilities loaded!');
console.log('Usage:');
console.log('  - debugNodeVisibility() - Analyze current node visibility');
console.log('  - fitAllNodesInView() - Fit all visible nodes in viewport');
console.log('  - showAllHiddenNodes() - Temporarily show all hidden nodes');
