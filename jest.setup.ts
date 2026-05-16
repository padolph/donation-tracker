import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn(() => 'mock-url');
  window.URL.revokeObjectURL = jest.fn();
}
