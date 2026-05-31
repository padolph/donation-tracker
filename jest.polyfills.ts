import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { MessageChannel, MessagePort } from 'node:worker_threads';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = NodeReadableStream as unknown as typeof global.ReadableStream;
}

if (typeof global.MessageChannel === 'undefined') {
  global.MessageChannel = MessageChannel as unknown as typeof global.MessageChannel;
}

if (typeof global.MessagePort === 'undefined') {
  global.MessagePort = MessagePort as unknown as typeof global.MessagePort;
}
