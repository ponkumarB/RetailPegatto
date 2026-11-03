import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DealProbabilityPage from './page';
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
    warning: vi.fn(),
    loading: vi.fn(),
  },
}));

describe('DealProbabilityPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially and transitions to full view', async () => {
    render(<DealProbabilityPage />);

    // Check that loading skeleton is rendered initially (animation-pulse is present)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Wait for the transition to full content view (800ms timer in page.tsx)
    await waitFor(() => {
      expect(screen.getByText('Define probability values for each deal stage. These values help forecast revenue more accurately.')).toBeInTheDocument();
    }, { timeout: 1500 });

    // Validate elements on screen
    expect(screen.getByRole('button', { name: /Add Stage/i })).toBeInTheDocument();

    // Table headers should exist
    expect(screen.getByText('Stage Order')).toBeInTheDocument();
    expect(screen.getByText('Stage Name')).toBeInTheDocument();
    expect(screen.getByText('Deal Probability (%)')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Static default stages should be rendered
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Qualified')).toBeInTheDocument();
    expect(screen.getByText('Needs Analysis')).toBeInTheDocument();
    expect(screen.getByText('Proposal')).toBeInTheDocument();
    expect(screen.getByText('Negotiation')).toBeInTheDocument();
    expect(screen.getByText('Closed Won')).toBeInTheDocument();
    expect(screen.getByText('Closed Lost')).toBeInTheDocument();

    // Informational alert banner should be present
    expect(screen.getByText('Probabilities should increase as deals move forward in the pipeline.')).toBeInTheDocument();

    // Footer actions should be present
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  it('allows user to edit probability values', async () => {
    render(<DealProbabilityPage />);

    await waitFor(() => {
      expect(screen.getByText('Define probability values for each deal stage. These values help forecast revenue more accurately.')).toBeInTheDocument();
    }, { timeout: 1500 });

    // In our component, probability inputs are type="text" but value is numeric.
    // Let's filter inputs that contain '10' initially (Lead is 10%)
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const leadProbInput = inputs.find((el: any) => el.value === '10');
    expect(leadProbInput).toBeDefined();

    // Change value
    if (leadProbInput) {
      fireEvent.change(leadProbInput, { target: { value: '15' } });
      expect(leadProbInput.value).toBe('15');
    }
  });
});
