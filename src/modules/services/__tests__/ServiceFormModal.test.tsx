import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceFormModal from '../ServiceFormModal';

describe('ServiceFormModal', () => {
  const mockOnSaved = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el modal cuando isOpen es true', () => {
    render(
      <ServiceFormModal
        isOpen={true}
        onDismiss={mockOnDismiss}
        onSaved={mockOnSaved}
        studentId="test-student-id"
      />
    );

    expect(screen.getByText(/nuevo servicio|editar servicio/i)).toBeInTheDocument();
  });

  it('debe validar campos requeridos', async () => {
    render(
      <ServiceFormModal
        isOpen={true}
        onDismiss={mockOnDismiss}
        onSaved={mockOnSaved}
        studentId="test-student-id"
      />
    );

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/nombre.*requerido/i)).toBeInTheDocument();
    });

    expect(mockOnSaved).not.toHaveBeenCalled();
  });

  it('debe enviar formulario con datos válidos', async () => {
    const user = userEvent.setup();

    render(
      <ServiceFormModal
        isOpen={true}
        onDismiss={mockOnDismiss}
        onSaved={mockOnSaved}
        studentId="test-student-id"
      />
    );

    // Llenar formulario
    await user.type(screen.getByLabelText(/nombre/i), 'Limpieza Dental');
    await user.type(screen.getByLabelText(/precio/i), '15000');
    await user.type(
      screen.getByLabelText(/descripción/i),
      'Limpieza dental profesional'
    );

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Limpieza Dental',
          price: 15000,
          description: 'Limpieza dental profesional',
        })
      );
    });
  });

  it('debe cargar datos existentes en modo edición', () => {
    const existingService = {
      id: '1',
      name: 'Ortodoncia',
      price: 50000,
      description: 'Tratamiento de ortodoncia',
      category: 'Correctiva',
    };

    render(
      <ServiceFormModal
        isOpen={true}
        onDismiss={mockOnDismiss}
        onSaved={mockOnSaved}
        studentId="test-student-id"
        initial={existingService}
        mode="edit"
      />
    );

    expect(screen.getByDisplayValue('Ortodoncia')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tratamiento de ortodoncia')).toBeInTheDocument();
  });

  it('debe llamar onDismiss al cancelar', async () => {
    const user = userEvent.setup();

    render(
      <ServiceFormModal
        isOpen={true}
        onDismiss={mockOnDismiss}
        onSaved={mockOnSaved}
        studentId="test-student-id"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('debe validar que el precio sea un número positivo', async () => {
    const user = userEvent.setup();

    render(
      <ServiceFormModal
        isOpen={true}
        onDismiss={mockOnDismiss}
        onSaved={mockOnSaved}
        studentId="test-student-id"
      />
    );

    await user.type(screen.getByLabelText(/nombre/i), 'Test Service');
    await user.type(screen.getByLabelText(/precio/i), '-1000');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/precio.*positivo/i)).toBeInTheDocument();
    });

    expect(mockOnSaved).not.toHaveBeenCalled();
  });
});
