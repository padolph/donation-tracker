import React from 'react';
import { render, screen } from '@testing-library/react';
import CustomItemForm from '../CustomItemForm';

describe('CustomItemForm', () => {
  it('selects all text in highValue and mediumValue numeric inputs on focus', () => {
    const mockOnItemCreated = jest.fn();
    const mockOnCancel = jest.fn();

    render(<CustomItemForm onItemCreated={mockOnItemCreated} onCancel={mockOnCancel} />);

    const highValueInput = screen.getByLabelText(/High Value/i) as HTMLInputElement;
    const selectHighSpy = jest.spyOn(highValueInput, 'select');
    highValueInput.focus();
    expect(selectHighSpy).toHaveBeenCalled();

    const mediumValueInput = screen.getByLabelText(/Medium Value/i) as HTMLInputElement;
    const selectMediumSpy = jest.spyOn(mediumValueInput, 'select');
    mediumValueInput.focus();
    expect(selectMediumSpy).toHaveBeenCalled();
  });
});
