import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import SizeGrid from '../SizeGrid';

// Mock translation function
const mockT = (key: string) => key;

describe('SizeGrid', () => {
  const defaultProps = {
    selectedSizes: [],
    onSizeToggle: vi.fn(),
    mode: 'multi' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all sizes 38-48', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid {...defaultProps} />
      </I18nextProvider>
    );

    for (let size = 38; size <= 48; size++) {
      expect(screen.getByText(size.toString())).toBeInTheDocument();
    }
  });

  it('renders in multi-select mode with checkboxes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid {...defaultProps} mode="multi" />
      </I18nextProvider>
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(11); // 38-48 = 11 sizes
  });

  it('renders in single-select mode with buttons', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid {...defaultProps} mode="single" />
      </I18nextProvider>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(11); // 38-48 = 11 sizes
  });

  it('calls onSizeToggle when a size is clicked in multi mode', () => {
    const onSizeToggle = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid {...defaultProps} onSizeToggle={onSizeToggle} mode="multi" />
      </I18nextProvider>
    );

    const checkbox = screen.getByLabelText(/size 40/i);
    fireEvent.click(checkbox);

    expect(onSizeToggle).toHaveBeenCalledWith('40');
  });

  it('calls onSizeToggle when a size is clicked in single mode', () => {
    const onSizeToggle = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid {...defaultProps} onSizeToggle={onSizeToggle} mode="single" />
      </I18nextProvider>
    );

    const button = screen.getByRole('button', { name: /40/i });
    fireEvent.click(button);

    expect(onSizeToggle).toHaveBeenCalledWith('40');
  });

  it('shows selected sizes in multi mode', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid {...defaultProps} selectedSizes={['40', '42']} mode="multi" />
      </I18nextProvider>
    );

    const checkbox40 = screen.getByLabelText(/size 40/i);
    const checkbox42 = screen.getByLabelText(/size 42/i);

    expect(checkbox40).toBeChecked();
    expect(checkbox42).toBeChecked();
  });

  it('shows selected size in single mode', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid {...defaultProps} selectedSizes={['40']} mode="single" />
      </I18nextProvider>
    );

    const button40 = screen.getByRole('button', { name: /40/i });
    expect(button40).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables sizes when disabledSizes prop is provided', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid {...defaultProps} disabledSizes={['40', '41']} mode="multi" />
      </I18nextProvider>
    );

    const checkbox40 = screen.getByLabelText(/size 40/i);
    const checkbox41 = screen.getByLabelText(/size 41/i);
    const checkbox42 = screen.getByLabelText(/size 42/i);

    expect(checkbox40).toBeDisabled();
    expect(checkbox41).toBeDisabled();
    expect(checkbox42).not.toBeDisabled();
  });

  it('does not call onSizeToggle when disabled size is clicked', () => {
    const onSizeToggle = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid
          {...defaultProps}
          onSizeToggle={onSizeToggle}
          disabledSizes={['40']}
          mode="multi"
        />
      </I18nextProvider>
    );

    const checkbox = screen.getByLabelText(/size 40/i);
    fireEvent.click(checkbox);

    expect(onSizeToggle).not.toHaveBeenCalled();
  });

  it('shows stock information when showStockInfo is true', () => {
    const getStockInfo = (size: string) => ({
      quantity: size === '40' ? 5 : 0,
      isLowStock: size === '40',
    });

    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid
          {...defaultProps}
          showStockInfo={true}
          getStockInfo={getStockInfo}
          mode="multi"
        />
      </I18nextProvider>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('has proper ARIA labels for accessibility', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SizeGrid {...defaultProps} mode="multi" />
      </I18nextProvider>
    );

    const container = screen.getByRole('group');
    expect(container).toHaveAttribute('aria-label');
  });
});




