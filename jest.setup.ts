import './jest.polyfills';
import '@testing-library/jest-dom';
import { Headers as NodeHeaders, Request as NodeRequest, Response as NodeResponse } from 'undici';

if (typeof global.Headers === 'undefined') {
  global.Headers = NodeHeaders as unknown as typeof global.Headers;
}
if (typeof global.Request === 'undefined') {
  global.Request = NodeRequest as unknown as typeof global.Request;
}
if (typeof global.Response === 'undefined') {
  global.Response = NodeResponse as unknown as typeof global.Response;
}

if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn(() => 'mock-url');
  window.URL.revokeObjectURL = jest.fn();
}
