import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiagramTreeSelect from '@/app/components/ui/DiagramTreeSelect';
import { vi } from 'vitest';

const mockDiagrams = [
  { id: '1', name: 'API Gateway', path: 'backend/apis', isFolder: false },
  { id: '2', name: 'Database Layer', path: 'backend/db', isFolder: false },
  { id: 'folder-1', name: 'Frontend', path: 'frontend', isFolder: true }
];

describe('DiagramTreeSelect', () => {
  const mockOnChange = vi.fn();
  const mockOnDelete = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders diagram options correctly', () => {
    render(
      <DiagramTreeSelect
        diagrams={mockDiagrams}
        value="1"
        onChange={mockOnChange}
        onDeleteDiagram={mockOnDelete}
        showDeleteButton={true}
      />
    );
    
    fireEvent.click(screen.getByRole('combobox'));
    
    expect(screen.getByText('API Gateway')).toBeInTheDocument();
    expect(screen.getByText('Database Layer')).toBeInTheDocument();
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
    
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Database Layer'));
    
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
    
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-busy', 'true');
  });
});
