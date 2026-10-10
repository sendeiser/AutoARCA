import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../src/components/untitled-ui/Button.jsx';
import InputField from '../src/components/untitled-ui/InputField.jsx';
import Badge from '../src/components/untitled-ui/Badge.jsx';
import AuthScreen from '../src/components/untitled-ui/AuthScreen.jsx';
import App from '../src/App.jsx';
import { authService } from '../src/services/authService.js';

describe('Untitled UI — Components & Design System', () => {
  it('renderiza el componente Button con variantes y estado de carga', () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button variant="primary" size="md" onClick={handleClick}>
        Continuar
      </Button>
    );

    const btn = screen.getByRole('button', { name: /Continuar/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('uui-btn-primary');
    expect(btn).toHaveClass('uui-btn-md');

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Estado isLoading
    rerender(
      <Button variant="primary" isLoading={true}>
        Cargando
      </Button>
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(document.querySelector('.uui-btn-spinner')).toBeInTheDocument();
  });

  it('renderiza InputField con label, hint, error y toggle de contraseña', () => {
    render(
      <InputField
        label="Clave Secreta"
        type="password"
        hint="Mínimo 6 caracteres"
        isPasswordToggle={true}
        defaultValue="secreto123"
      />
    );

    expect(screen.getByText('Clave Secreta')).toBeInTheDocument();
    expect(screen.getByText('Mínimo 6 caracteres')).toBeInTheDocument();

    const input = screen.getByLabelText('Clave Secreta');
    expect(input.type).toBe('password');

    // Toggle de visibilidad de password
    const toggleBtn = screen.getByRole('button', { name: /ver contraseña/i });
    fireEvent.click(toggleBtn);
    expect(input.type).toBe('text');

    fireEvent.click(screen.getByRole('button', { name: /ocultar contraseña/i }));
    expect(input.type).toBe('password');
  });

  it('renderiza Badge con estilos semánticos y status dot', () => {
    render(
      <Badge variant="success" hasDot={true}>
        Monotributo Activo
      </Badge>
    );

    expect(screen.getByText('Monotributo Activo')).toBeInTheDocument();
    expect(document.querySelector('.uui-badge-dot')).toBeInTheDocument();
  });
});

describe('Untitled UI — AuthScreen Split Layout & User Flow', () => {
  it('renderiza el split screen de autenticación con modo login por defecto', () => {
    render(<AuthScreen onAuthSuccess={vi.fn()} />);

    expect(screen.getByText(/Bienvenido de nuevo/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingresa tus credenciales/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar al Sistema/i })).toBeInTheDocument();
    expect(screen.getByText(/Accesos Rápidos Demo/i)).toBeInTheDocument();
  });

  it('permite alternar entre Iniciar Sesión y Registrarse', () => {
    render(<AuthScreen onAuthSuccess={vi.fn()} />);

    const regTab = screen.getByRole('tab', { name: /Registrarse/i });
    fireEvent.click(regTab);

    expect(screen.getByText(/Crea tu cuenta/i)).toBeInTheDocument();
    expect(screen.getByText(/Comercio \/ Monotributo/i)).toBeInTheDocument();
    expect(screen.getByText(/Estudio Contable/i)).toBeInTheDocument();
  });

  it('conmuta los campos específicos al cambiar de Comercio a Estudio Contable en el registro', () => {
    render(<AuthScreen onAuthSuccess={vi.fn()} />);

    // Cambiar a registro
    fireEvent.click(screen.getByRole('tab', { name: /Registrarse/i }));

    // Por defecto es Comercio: debe mostrar nombre de fantasía
    expect(screen.getByLabelText(/Nombre de Fantasía/i)).toBeInTheDocument();

    // Seleccionar Estudio Contable
    const accountantCard = screen.getByText(/Estudio Contable/i).closest('.uui-role-card');
    fireEvent.click(accountantCard);

    // Debe mostrar campos de Contador
    expect(screen.getByLabelText(/Matrícula Profesional/i)).toBeInTheDocument();
    expect(screen.getByText(/Jurisdicción \/ CPCE/i)).toBeInTheDocument();
  });

  it('inicia sesión correctamente mediante los accesos rápidos Demo 1-Click', () => {
    const handleAuthSuccess = vi.fn();
    render(<AuthScreen onAuthSuccess={handleAuthSuccess} />);

    const demoClientBtn = screen.getByRole('button', { name: /Cliente/i });
    fireEvent.click(demoClientBtn);

    expect(handleAuthSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'martin@comercio.com',
        role: 'client'
      })
    );
  });

  it('registra un nuevo usuario con contraseña y ejecuta onAuthSuccess', () => {
    const handleAuthSuccess = vi.fn();
    render(<AuthScreen onAuthSuccess={handleAuthSuccess} />);

    // Ir a registro
    fireEvent.click(screen.getByRole('tab', { name: /Registrarse/i }));

    // Completar datos
    fireEvent.change(screen.getByLabelText(/Nombre Completo o Razón Social/i), {
      target: { value: 'Nuevo Usuario Test' }
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test_usuario_nuevo@arca.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Mín. 4 caracteres/i), {
      target: { value: 'claveSegura123' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirma clave/i), {
      target: { value: 'claveSegura123' }
    });
    fireEvent.change(screen.getByLabelText(/CUIT/i), {
      target: { value: '20445566778' }
    });
    fireEvent.change(screen.getByLabelText(/Nombre de Fantasía/i), {
      target: { value: 'Café Del Test' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Ej. CONT-MENDEZ-9876/i), {
      target: { value: 'CONT-MENDEZ-9876' }
    });

    // Enviar registro
    const submitBtn = screen.getByRole('button', { name: /Completar Registro/i });
    fireEvent.click(submitBtn);

    expect(handleAuthSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test_usuario_nuevo@arca.com',
        full_name: 'Nuevo Usuario Test',
        role: 'client'
      })
    );
  });

  it('valida que las contraseñas coincidan en el registro', () => {
    render(<AuthScreen />);
    fireEvent.click(screen.getByRole('tab', { name: /Registrarse/i }));

    fireEvent.change(screen.getByLabelText(/Nombre Completo o Razón Social/i), {
      target: { value: 'Cliente Validacion' }
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'valida@comercio.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Mín. 4 caracteres/i), {
      target: { value: 'clave1234' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirma clave/i), {
      target: { value: 'distinta99' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Completar Registro/i }));
    expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
  });

  it('valida que el cliente ingrese obligatoriamente el código del contador registrado', () => {
    render(<AuthScreen />);
    fireEvent.click(screen.getByRole('tab', { name: /Registrarse/i }));

    fireEvent.change(screen.getByLabelText(/Nombre Completo o Razón Social/i), {
      target: { value: 'Cliente Sin Contador' }
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'sincontador@comercio.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Mín. 4 caracteres/i), {
      target: { value: '1234' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirma clave/i), {
      target: { value: '1234' }
    });

    // Sin código
    fireEvent.click(screen.getByRole('button', { name: /Completar Registro/i }));
    expect(screen.getByText(/código de vinculación de tu contador es obligatorio/i)).toBeInTheDocument();

    // Código inválido
    fireEvent.change(screen.getByPlaceholderText(/Ej. CONT-MENDEZ-9876/i), {
      target: { value: 'CODIGO-INEXISTENTE' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Completar Registro/i }));
    expect(screen.getByText(/No se encontró ningún estudio contable/i)).toBeInTheDocument();
  });
});

describe('App Auth Gate & Logout Cycle', () => {
  it('activa el Auth Gate cuando forceAuthGate=true y permite loguearse para ver la app', () => {
    const { rerender } = render(<App forceAuthGate={true} />);

    // Debe renderizar la pantalla completa de Auth de Untitled UI
    expect(screen.getByText(/Bienvenido de nuevo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar al Sistema/i })).toBeInTheDocument();
    expect(screen.queryByTestId('pos-amount-display')).not.toBeInTheDocument();

    // Login demo
    const demoClientBtn = screen.getByRole('button', { name: /Cliente/i });
    fireEvent.click(demoClientBtn);

    // Ahora entra a la app principal
    expect(screen.getByText(/AutoARCA/i)).toBeInTheDocument();
    expect(screen.getByTestId('pos-amount-display')).toBeInTheDocument();
  });

  it('permite cerrar sesión desde el Header y regresa al AuthScreen', () => {
    render(<App />);

    // Verificamos que estamos adentro
    expect(screen.getByText(/AutoARCA/i)).toBeInTheDocument();

    // Hacemos clic en el botón de Salir en el Header
    const logoutBtn = screen.getByTestId('header-logout-btn');
    fireEvent.click(logoutBtn);

    // Ahora debe estar en la pantalla de bienvenida/login
    expect(screen.getByText(/Bienvenido de nuevo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar al Sistema/i })).toBeInTheDocument();
  });
});
