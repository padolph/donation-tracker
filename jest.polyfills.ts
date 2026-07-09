/* eslint-disable @typescript-eslint/no-explicit-any */
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = NodeReadableStream as unknown as typeof global.ReadableStream;
}

class MessagePortMock {
  onmessage: ((this: MessagePortMock, ev: any) => any) | null = null;
  onmessageerror: ((this: MessagePortMock, ev: any) => any) | null = null;
  _otherPort: MessagePortMock | null = null;

  postMessage(message: any) {
    if (this._otherPort) {
      const other = this._otherPort;
      setTimeout(() => {
        if (other.onmessage) {
          other.onmessage.call(other, { data: message });
        }
      }, 0);
    }
  }

  addEventListener(type: string, listener: any) {
    if (type === 'message') {
      this.onmessage = listener;
    }
  }

  removeEventListener(type: string, listener: any) {
    if (type === 'message' && this.onmessage === listener) {
      this.onmessage = null;
    }
  }

  start() {}
  close() {}
}

class MessageChannelMock {
  port1: MessagePortMock;
  port2: MessagePortMock;

  constructor() {
    this.port1 = new MessagePortMock();
    this.port2 = new MessagePortMock();
    this.port1._otherPort = this.port2;
    this.port2._otherPort = this.port1;
  }
}

if (typeof global.MessageChannel === 'undefined') {
  global.MessageChannel = MessageChannelMock as unknown as typeof global.MessageChannel;
}

if (typeof global.MessagePort === 'undefined') {
  global.MessagePort = MessagePortMock as unknown as typeof global.MessagePort;
}
