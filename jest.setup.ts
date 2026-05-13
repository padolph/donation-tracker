import '@testing-library/jest-dom';

if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn(() => 'mock-url');
  window.URL.revokeObjectURL = jest.fn();
}
