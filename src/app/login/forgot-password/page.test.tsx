import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPasswordPage from './page';
import '@testing-library/jest-dom';

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

describe('ForgotPasswordPage Component Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates through email step, OTP verification, and Change Password reset flow', async () => {
    render(<ForgotPasswordPage />);

    // --- STAGE 1: ENTER EMAIL ---
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your registered email')).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('Enter your registered email');
    fireEvent.change(emailInput, { target: { value: 'user@crmfarm.it' } });

    const sendButton = screen.getByRole('button', { name: /^Send Reset Link$/i });
    fireEvent.click(sendButton);

    // Transitions to loading state in email step
    expect(screen.getByRole('button', { name: /Sending Link.../i })).toBeInTheDocument();

    // Wait for transition to OTP step (1000ms delay in mock)
    await waitFor(() => {
      expect(screen.getByText('Enter OTP Code')).toBeInTheDocument();
    }, { timeout: 1500 });

    // --- STAGE 2: ENTER OTP ---
    expect(screen.getByText(/We sent a 6-digit verification code to/i)).toBeInTheDocument();
    
    // Renders 6 input boxes
    const otpInputs = screen.getAllByRole('textbox');
    expect(otpInputs).toHaveLength(6);

    // Fill in OTP code digit by digit
    fireEvent.change(otpInputs[0], { target: { value: '1' } });
    fireEvent.change(otpInputs[1], { target: { value: '2' } });
    fireEvent.change(otpInputs[2], { target: { value: '3' } });
    fireEvent.change(otpInputs[3], { target: { value: '4' } });
    fireEvent.change(otpInputs[4], { target: { value: '5' } });
    fireEvent.change(otpInputs[5], { target: { value: '6' } });

    const verifyButton = screen.getByRole('button', { name: /^Verify Code$/i });
    fireEvent.click(verifyButton);

    // Transitions to loading state in OTP verification step
    expect(screen.getByRole('button', { name: /Verifying.../i })).toBeInTheDocument();

    // Wait for transition to Reset step (1000ms delay in mock)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Change Password/i })).toBeInTheDocument();
    }, { timeout: 1500 });

    // --- STAGE 3: CHANGE PASSWORD (matches layout requirements) ---
    expect(screen.queryByLabelText('Current Password')).not.toBeInTheDocument(); // excluded
    expect(screen.getByPlaceholderText('Enter your new password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your new password')).toBeInTheDocument();
    expect(screen.getByText(/Password Strength:/i)).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText('Enter your new password');
    const confirmInput = screen.getByPlaceholderText('Confirm your new password');

    fireEvent.change(passwordInput, { target: { value: 'NewSecurePassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'NewSecurePassword123!' } });

    const updateButton = screen.getByRole('button', { name: /^Update Password$/i });
    fireEvent.click(updateButton);

    // Transitions to loading state in update step
    expect(screen.getByRole('button', { name: /Updating.../i })).toBeInTheDocument();

    // Wait for final redirect to login (1200ms delay in mock)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    }, { timeout: 2000 });
  });

  it('allows user to navigate back to sign in page from back link or cancel buttons', () => {
    render(<ForgotPasswordPage />);

    // Click Back to Sign In on email page
    const backToSignIn = screen.getByText('Back to Sign In');
    fireEvent.click(backToSignIn);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
