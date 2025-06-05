import React from 'react';
import { XMarkIcon, ServerIcon } from '@heroicons/react/24/outline';
import { Panel } from 'reactflow';
import { useEditorStore } from '../hooks/useEditorStore';
import type { ResourceCategory, ResourceItem } from '../types/editorTypes'; // Corregido los nombres de los tipos importados

interface ResourceSidebarProps {
  resourceCategories: ResourceCategory[]; // Usar el tipo corregido
  onDragStartSidebar: (event: React.DragEvent, item: ResourceItem) => void; // Usar el tipo corregido
}

export function ResourceSidebar({ resourceCategories, onDragStartSidebar }: ResourceSidebarProps) {
  // Seleccionar cada pieza del estado individualmente
  const sidebarOpen = useEditorStore(state => state.sidebarOpen);
  const setSidebarOpen = useEditorStore(state => state.setSidebarOpen);
  const searchTerm = useEditorStore(state => state.searchTerm);
  const setSearchTerm = useEditorStore(state => state.setSearchTerm);
  const collapsedCategories = useEditorStore(state => state.collapsedCategories);
  const toggleCollapsedCategory = useEditorStore(state => state.toggleCollapsedCategory);

  if (!sidebarOpen) {
    return null;
  }

  const filteredCategories = resourceCategories
    .map(category => ({
      ...category,
      items: category.items.filter(
        (item: ResourceItem) => // Tipar item explícitamente
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter(category => category.items.length > 0);

  return (
    <Panel 
      position="top-right" 
      style={{
        width:'360px', 
        background:'rgba(255,255,255,0.9)', 
        padding:'0', 
        borderRadius:'12px 0 0 12px', 
        height:'calc(100vh - 7.5rem)', // Ajustar según la altura del header de la app principal
        overflow:'hidden', 
        boxShadow:'0 4px 20px rgba(0,0,0,0.15)', 
        display:'flex', 
        flexDirection:'column',
        position:'fixed', // Asegurar que sea fixed para que no afecte el layout del canvas
        top:'calc(3.5rem + 20px)', // Asumiendo que el header principal es 3.5rem y hay un padding de 20px
        right:'0px',
        zIndex:999, // Un z-index menor que el menú contextual o modales si es necesario
        transform:'none',
        transition:'transform 0.3s ease-out, opacity 0.3s ease-out, width 0.3s ease-out',
        backdropFilter:'blur(10px)'
      }}
    >
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid rgba(230,230,230,0.9)',flexShrink:0,minHeight:'56px',backgroundColor:'rgba(250,250,250,0.95)',borderTopLeftRadius:'12px',borderTopRightRadius:'12px'}}>
        <h4 style={{margin:0,fontSize:'16px',fontWeight:'600',color:'#333'}}>Recursos</h4>
        <button 
          onClick={()=>setSidebarOpen(false)}
          style={{border:'none',background:'transparent',cursor:'pointer',width:'28px',height:'28px',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',transition:'background-color 0.2s',color:'#555'}}
          title="Ocultar Panel de Recursos"
          onMouseOver={e=>(e.currentTarget.style.backgroundColor='#e9e9e9')}
          onMouseOut={e=>(e.currentTarget.style.backgroundColor='transparent')}
        >
          <XMarkIcon className="w-5 h-5"/>
        </button>
      </div>
      <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(230,230,230,0.9)',backgroundColor:'rgba(250,250,250,0.95)'}}>
        <input 
          type="text"
          placeholder="Buscar recursos..."
          value={searchTerm}
          onChange={e=>setSearchTerm(e.target.value)}
          style={{width:'100%',padding:'8px 12px',borderRadius:'6px',border:'1px solid #ddd',fontSize:'14px',outline:'none',boxShadow:'inset 0 1px 2px rgba(0,0,0,0.075)'}}
        />
      </div>
      <div style={{overflowY:'auto',overflowX:'hidden',flexGrow:1,display:'flex',flexDirection:'column',backgroundColor:'rgba(255,255,255,0.9)',paddingBottom:'16px',scrollbarWidth:'thin',scrollbarColor:'#ccc #f1f1f1'}}>
        {filteredCategories.map(cat=>(
          <div key={cat.name} style={{borderBottom:'1px solid #f0f0f0'}}>
            <h5 
              onClick={()=>toggleCollapsedCategory(cat.name)}
              style={{cursor:'pointer',margin:0,padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'14px',fontWeight:'600',backgroundColor:collapsedCategories[cat.name]?'#ffffff':'#f8f8f8',transition:'background-color 0.2s'}}
              onMouseOver={e=>{if(!collapsedCategories[cat.name])return;e.currentTarget.style.backgroundColor='#f5f5f5';}}
              onMouseOut={e=>{if(!collapsedCategories[cat.name])return;e.currentTarget.style.backgroundColor='#ffffff';}}
            >
              <span>{cat.name}</span>
              <span style={{color:'#666'}}>{collapsedCategories[cat.name]?'▸':'▾'}</span>
            </h5>
            {!collapsedCategories[cat.name]&&(
              <ul style={{listStyleType:'none',padding:'2px 0',margin:0,backgroundColor:'#fdfdfd',maxHeight:'none',overflowY:'visible',position:'relative',zIndex:10001 /* Asegurar que esté sobre otros elementos si es necesario */}}>
                {cat.items.map((item: ResourceItem)=>( // Tipar item explícitamente
                  <li 
                    key={`${cat.name}-${item.type}-${item.name}`} // Clave más única
                    draggable 
                    onDragStart={e=>onDragStartSidebar(e,item)}
                    style={{padding:'6px 16px',margin:'0',cursor:'grab',display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'#444',transition:'background-color 0.15s'}}
                    onMouseOver={e=>{e.currentTarget.style.backgroundColor='#f0f0f0'}}
                    onMouseOut={e=>{e.currentTarget.style.backgroundColor='transparent'}}
                  >
                    <div style={{minWidth:'24px',display:'flex',alignItems:'center',justifyContent:'center',marginRight:'8px'}}>
                      {item.icon ? React.cloneElement(item.icon,{className:'w-5 h-5 text-gray-500'}) : <ServerIcon className="w-5 h-5 text-gray-400"/>}
                    </div>
                    <div style={{flex:1}}>
                      <span style={{fontWeight:'500'}}>{item.name}</span>
                      <p style={{fontSize:'11px',color:'#777',margin:'2px 0 0 0',lineHeight:'1.3'}}>{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
