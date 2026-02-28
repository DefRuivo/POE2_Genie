import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MessageDialog } from '@/components/MessageDialog';

describe('MessageDialog', () => {
  it('returns null when closed', () => {
    const { container } = render(
      <MessageDialog
        isOpen={false}
        onClose={() => undefined}
        title="Hidden"
        message="hidden message"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders info dialog and triggers onClose', () => {
    const onClose = jest.fn();
    render(
      <MessageDialog
        isOpen
        onClose={onClose}
        title="Info title"
        message="Info message"
        type="info"
      />,
    );

    expect(screen.getByText('Info title')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /ok/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders specific icons/styles for error and success variants', () => {
    const { rerender, container } = render(
      <MessageDialog
        isOpen
        onClose={() => undefined}
        title="Error"
        message="Error message"
        type="error"
      />,
    );
    expect(container.querySelector('.fa-circle-xmark')).toBeInTheDocument();
    expect(container.querySelector('.poe-status-danger')).toBeInTheDocument();

    rerender(
      <MessageDialog
        isOpen
        onClose={() => undefined}
        title="Success"
        message="Success message"
        type="success"
      />,
    );
    expect(container.querySelector('.fa-circle-check')).toBeInTheDocument();
    expect(container.querySelector('.poe-status-success')).toBeInTheDocument();
  });
});
