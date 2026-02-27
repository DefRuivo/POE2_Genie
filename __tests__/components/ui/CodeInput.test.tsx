import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CodeInput } from '@/components/ui/CodeInput';

describe('CodeInput', () => {
  it('renders with default length and emits joined value', () => {
    const onChange = jest.fn();
    render(<CodeInput onChange={onChange} />);

    const inputs = screen.getAllByPlaceholderText('-');
    expect(inputs).toHaveLength(6);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('uppercases typed chars and moves focus to next input', () => {
    const onChange = jest.fn();
    render(<CodeInput onChange={onChange} />);
    const inputs = screen.getAllByPlaceholderText('-') as HTMLInputElement[];

    inputs[0].focus();
    fireEvent.change(inputs[0], { target: { value: 'a' } });

    expect(inputs[0].value).toBe('A');
    expect(document.activeElement).toBe(inputs[1]);
    expect(onChange).toHaveBeenLastCalledWith('A');
  });

  it('keeps only the last character when multiple chars are provided', () => {
    const onChange = jest.fn();
    render(<CodeInput onChange={onChange} />);
    const [first] = screen.getAllByPlaceholderText('-') as HTMLInputElement[];

    fireEvent.change(first, { target: { value: 'ab' } });

    expect(first.value).toBe('B');
    expect(onChange).toHaveBeenLastCalledWith('B');
  });

  it('handles backspace on filled input by clearing current value', () => {
    render(<CodeInput onChange={() => undefined} />);
    const [first] = screen.getAllByPlaceholderText('-') as HTMLInputElement[];

    fireEvent.change(first, { target: { value: 'X' } });
    expect(first.value).toBe('X');

    fireEvent.keyDown(first, { key: 'Backspace' });
    expect(first.value).toBe('');
  });

  it('handles backspace on empty input by moving focus to previous', () => {
    render(<CodeInput onChange={() => undefined} />);
    const inputs = screen.getAllByPlaceholderText('-') as HTMLInputElement[];

    fireEvent.change(inputs[0], { target: { value: 'A' } });
    inputs[1].focus();
    fireEvent.keyDown(inputs[1], { key: 'Backspace' });

    expect(document.activeElement).toBe(inputs[0]);
  });

  it('supports ArrowLeft and ArrowRight navigation', () => {
    render(<CodeInput onChange={() => undefined} />);
    const inputs = screen.getAllByPlaceholderText('-') as HTMLInputElement[];

    inputs[2].focus();
    fireEvent.keyDown(inputs[2], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(inputs[1]);

    fireEvent.keyDown(inputs[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(inputs[2]);
  });

  it('handles paste by distributing sanitized code and focusing last filled input', () => {
    const onChange = jest.fn();
    render(<CodeInput onChange={onChange} />);
    const inputs = screen.getAllByPlaceholderText('-') as HTMLInputElement[];

    const clipboardData = {
      getData: jest.fn().mockReturnValue('ab-12$cd'),
    };

    fireEvent.paste(inputs[0], { clipboardData });

    expect(inputs.map((i) => i.value).join('')).toBe('AB12CD');
    expect(document.activeElement).toBe(inputs[5]);
    expect(onChange).toHaveBeenLastCalledWith('AB12CD');
  });

  it('respects disabled prop', () => {
    render(<CodeInput onChange={() => undefined} disabled />);
    const inputs = screen.getAllByPlaceholderText('-') as HTMLInputElement[];

    expect(inputs.every((input) => input.disabled)).toBe(true);
  });
});
