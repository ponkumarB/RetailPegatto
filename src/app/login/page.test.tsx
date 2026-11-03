import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './page';
import '@testing-library/jest-dom';
import { toast } from 'sonner';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div ref={ref} {...rest}>{children}</div>;
    }),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock API service
vi.mock('@/service/api/login/api', () => ({
  loginUser: vi.fn().mockImplementation(({ username, password }) => {
    if (username === 'admin' && password === '123456') {
      return Promise.resolve({ access: 'mock-access', refresh: 'mock-refresh' });
    }
    return Promise.reject(new Error('Invalid username or password'));
  }),
  fetchUserProfile: vi.fn().mockResolvedValue({
    id: 1,
    username: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@example.com',
    is_superuser: true,
    Designation: 'Administrator',
    User_Photo: '',
    PhoneNo: '1234567890',
    City: 'Chennai',
    State: 'Tamil Nadu',
    Country: 'India',
    UserType: 'Admin',
    Url: 'igrid-muthu/pegatto_erp_fe',
    Organization_Id: 1
  }),
}));

vi.mock('@/service/api/add-ons/superadmin-addon/api', () => ({
  getTenantSubscriptionListAPI: vi.fn().mockResolvedValue({
    results: [
      {
        id: 1,
        Subscription_id: '1',
        Subscription_Name: 'Standard Plan',
        Base_users: 10,
        No_Of_Users: 10,
      }
    ]
  }),
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login page correctly with forms and banners', () => {
    render(<LoginPage />);

    // Check headers and branding
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Login$/i })).toBeInTheDocument();
  });

  it('shows error messages for empty fields on submission', () => {
    render(<LoginPage />);

    const loginButton = screen.getByRole('button', { name: /^Login$/i });
    fireEvent.click(loginButton);

    expect(screen.getByText('Please enter your username')).toBeInTheDocument();
  });

  it('shows error messages for missing password', () => {
    render(<LoginPage />);

    const usernameInput = screen.getByPlaceholderText('Enter your username');
    fireEvent.change(usernameInput, { target: { value: 'admin' } });

    const loginButton = screen.getByRole('button', { name: /^Login$/i });
    fireEvent.click(loginButton);

    expect(screen.getByText('Please enter your password')).toBeInTheDocument();
  });

  it('shows error for invalid credentials', async () => {
    render(<LoginPage />);

    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.change(usernameInput, { target: { value: 'wrong' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    const loginButton = screen.getByRole('button', { name: /^Login$/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Invalid username or password');
    });
  });

  it('successfully redirects on valid admin credentials', async () => {
    render(<LoginPage />);

    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });

    const loginButton = screen.getByRole('button', { name: /^Login$/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('navigates to forgot password page when link is clicked', () => {
    render(<LoginPage />);

    // Click Forgot Password link
    const forgotLink = screen.getByRole('button', { name: /Forgot Password\?/i });
    fireEvent.click(forgotLink);

    // Should push route to forgot password page
    expect(mockPush).toHaveBeenCalledWith('/login/forgot-password');
  });
});
