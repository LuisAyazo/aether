import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiagramTreeSelect from "../../../../../app/components/ui/DiagramTreeSelect";

const mockDiagrams = [
  { id: '1', name: 'API Gateway', path: 'backend/apis' },
  { id: '2', name: 'Database Layer', path: 'backend/db' },
  { id: '3', name: 'Frontend Service', path: 'frontend' }
];

describe('DiagramTreeSelect', () => {
  const mockOnChange = vi.fn();
  const mockOnDelete = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders diagram options correctly', async () => {
    render(
      <DiagramTreeSelect
        diagrams={mockDiagrams}
        value="1"
        onChange={mockOnChange}
        onDeleteDiagram={mockOnDelete}
        showDeleteButton={true}
      />
    );
    
    // El componente usa un div con clase selector, no un combobox
    const selector = screen.getByText('API Gateway');
    expect(selector).toBeInTheDocument();
    
    // Click en el selector para abrir el dropdown
    fireEvent.click(selector.closest('.flex.items-center') || selector);
    
    // Esperar a que aparezca el dropdown
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar diagramas...')).toBeInTheDocument();
    });
    
    // Los diagramas están organizados en carpetas, verificar que las carpetas existan
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
    
    // Expandir la carpeta backend
    const backendFolder = screen.getByText('backend');
    fireEvent.click(backendFolder);
    
    // Esperar a que aparezcan las subcarpetas
    await waitFor(() => {
      expect(screen.getByText('apis')).toBeInTheDocument();
      expect(screen.getByText('db')).toBeInTheDocument();
    });
    
    // Expandir la subcarpeta apis para ver API Gateway
    const apisFolder = screen.getByText('apis');
    fireEvent.click(apisFolder);
    
    // Expandir la subcarpeta db para ver Database Layer
    const dbFolder = screen.getByText('db');
    fireEvent.click(dbFolder);
    
    // Ahora deberían ser visibles los diagramas
    // Usamos getAllByText porque el diagrama seleccionado también aparece en el selector principal
    await waitFor(() => {
      const apiGatewayElements = screen.getAllByText('API Gateway');
      expect(apiGatewayElements.length).toBeGreaterThan(0);
      
      const databaseLayerElements = screen.getAllByText('Database Layer');
      expect(databaseLayerElements.length).toBeGreaterThan(0);
    });
  });

  it('calls onChange when selecting a diagram', async () => {
    const user = userEvent.setup();
    
    render(
      <DiagramTreeSelect
        diagrams={mockDiagrams}
        value={undefined}
        onChange={mockOnChange}
      />
    );
    
    // Click en el selector (que muestra el placeholder)
    const selector = screen.getByText('Seleccionar diagrama');
    await user.click(selector);
    
    // Esperar a que aparezca el dropdown
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar diagramas...')).toBeInTheDocument();
    });
    
    // Primero expandir la carpeta backend
    const backendFolder = screen.getByText('backend');
    await user.click(backendFolder);
    
    // Esperar a que aparezcan las subcarpetas
    await waitFor(() => {
      expect(screen.getByText('db')).toBeInTheDocument();
    });
    
    // Expandir la subcarpeta db
    const dbFolder = screen.getByText('db');
    await user.click(dbFolder);
    
    // Esperar a que el diagrama sea visible
    await waitFor(() => {
      expect(screen.getByText('Database Layer')).toBeInTheDocument();
    });
    
    // Click en el diagrama
    const databaseLayer = screen.getByText('Database Layer');
    await user.click(databaseLayer);
    
    expect(mockOnChange).toHaveBeenCalledWith('2');
  });

  it('shows loading state correctly', () => {
    render(
      <DiagramTreeSelect
        diagrams={[]}
        isLoading={true}
        onChange={mockOnChange}
      />
    );
    
    // El componente muestra un spinner cuando está cargando
    const spinner = document.querySelector('.ant-spin');
    expect(spinner).toBeInTheDocument();
  });
});
