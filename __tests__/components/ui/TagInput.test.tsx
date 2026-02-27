import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TagInput } from '@/components/ui/TagInput';

describe('TagInput', () => {
  function setup(initialTags: string[] = []) {
    const setTags = jest.fn();
    render(
      <TagInput
        tags={initialTags}
        setTags={setTags}
        suggestions={['Arc', 'Spark', 'Righteous Fire', 'Boneshatter']}
        placeholder="Add tag"
        icon="fa-bolt"
        chipColorClass="bg-rose-100 text-rose-700"
      />,
    );
    return { setTags };
  }

  it('renders existing tags and supports removing by click', () => {
    const { setTags } = setup(['Arc']);

    expect(screen.getByText('Arc')).toBeInTheDocument();
    const removeButton = screen.getByRole('button');
    fireEvent.click(removeButton);

    expect(setTags).toHaveBeenCalledWith([]);
  });

  it('adds a tag when pressing Enter', () => {
    const { setTags } = setup([]);
    const input = screen.getByPlaceholderText('Add tag');

    fireEvent.change(input, { target: { value: 'Lightning Warp' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });

    expect(setTags).toHaveBeenCalledWith(['Lightning Warp']);
  });

  it('removes last tag on Backspace when input is empty', () => {
    const { setTags } = setup(['Arc', 'Spark']);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(setTags).toHaveBeenCalledWith(['Arc']);
  });

  it('does not add duplicate tags and does not add tags over 50 chars', () => {
    const { setTags } = setup(['Arc']);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Arc' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });
    expect(setTags).not.toHaveBeenCalledWith(['Arc', 'Arc']);

    const longValue = 'x'.repeat(51);
    fireEvent.change(input, { target: { value: longValue } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });
    expect(setTags).not.toHaveBeenCalledWith(expect.arrayContaining([longValue]));
  });

  it('adds tag when value ends with comma or semicolon', () => {
    const { setTags } = setup([]);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Arc,' } });
    fireEvent.change(input, { target: { value: 'Spark;' } });

    expect(setTags).toHaveBeenCalledWith(['Arc']);
    expect(setTags).toHaveBeenCalledWith(['Spark']);
  });

  it('shows filtered suggestions and adds selected suggestion', () => {
    const { setTags } = setup(['Arc']);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'spa' } });

    const suggestion = screen.getByText('Spark');
    expect(suggestion).toBeInTheDocument();

    fireEvent.click(suggestion);
    expect(setTags).toHaveBeenCalledWith(['Arc', 'Spark']);
  });

  it('hides suggestions when clicking outside', () => {
    setup([]);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'arc' } });
    expect(screen.getByText('Arc')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Arc')).not.toBeInTheDocument();
  });

  it('focuses input when wrapper is clicked', () => {
    setup([]);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const wrapper = input.closest('.cursor-text') as HTMLElement;
    const focusSpy = jest.spyOn(input, 'focus');

    fireEvent.click(wrapper);
    expect(focusSpy).toHaveBeenCalled();
  });
});
