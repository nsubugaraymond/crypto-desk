import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

const BUFFER_DATA = Symbol('bufferData');

class BufferPolyfill extends Uint8Array {
  constructor(arg?: any, encodingOrOffset?: any, length?: any) {
    let data: Uint8Array;
    
    if (typeof arg === 'string') {
      data = BufferPolyfill.fromString(arg, encodingOrOffset || 'utf8');
      super(data);
    } else if (typeof arg === 'number') {
      super(arg);
      return;
    } else if (arg instanceof ArrayBuffer) {
      super(arg, encodingOrOffset, length);
      return;
    } else if (Array.isArray(arg)) {
      super(arg);
      return;
    } else if (arg instanceof Uint8Array) {
      super(arg);
      return;
    } else if (arg && typeof arg === 'object' && arg[BUFFER_DATA] instanceof Uint8Array) {
      super(arg[BUFFER_DATA]);
      return;
    } else if (arg && typeof arg === 'object' && arg._data instanceof Uint8Array) {
      super(arg._data);
      return;
    } else {
      super(0);
    }
  }

  static fromString(str: string, encoding: string = 'utf8'): Uint8Array {
    if (encoding === 'hex') {
      const cleanHex = str.replace(/^0x/, '');
      const matches = cleanHex.match(/.{1,2}/g) || [];
      return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    }
    if (encoding === 'base64') {
      const binaryString = atob(str);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }

  static from(value: any, encodingOrMapFn?: string | ((v: any, k: number) => number), thisArg?: any): BufferPolyfill {
    if (value instanceof Uint8Array) {
      const buf = new BufferPolyfill(value.length);
      buf.set(value);
      return buf;
    }
    if (typeof encodingOrMapFn === 'function') {
      const arr = Array.from(value, encodingOrMapFn, thisArg);
      return new BufferPolyfill(arr);
    }
    return new BufferPolyfill(value, encodingOrMapFn);
  }

  static alloc(size: number, fill?: number): BufferPolyfill {
    const buf = new BufferPolyfill(size);
    if (fill !== undefined) {
      buf.fill(fill);
    }
    return buf;
  }

  static allocUnsafe(size: number): BufferPolyfill {
    return new BufferPolyfill(size);
  }

  static isBuffer(obj: any): boolean {
    return obj instanceof BufferPolyfill || obj instanceof Uint8Array;
  }

  static concat(list: any[], totalLength?: number): BufferPolyfill {
    if (list.length === 0) return new BufferPolyfill(0);
    
    const length = totalLength ?? list.reduce((acc, buf) => {
      if (buf instanceof Uint8Array) return acc + buf.length;
      if (buf && typeof buf.length === 'number') return acc + buf.length;
      return acc;
    }, 0);
    
    const result = new BufferPolyfill(length);
    let offset = 0;
    
    for (const buf of list) {
      let data: Uint8Array;
      if (buf instanceof Uint8Array) {
        data = buf;
      } else if (Array.isArray(buf)) {
        data = new Uint8Array(buf);
      } else {
        continue;
      }
      result.set(data, offset);
      offset += data.length;
    }
    
    return result;
  }

  toString(encoding: string = 'utf8'): string {
    if (encoding === 'hex') {
      return Array.from(this)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    }
    if (encoding === 'base64') {
      let binary = '';
      for (let i = 0; i < this.length; i++) {
        binary += String.fromCharCode(this[i]);
      }
      return btoa(binary);
    }
    const decoder = new TextDecoder();
    return decoder.decode(this);
  }

  write(string: string, offset: number = 0, encoding: string = 'utf8'): number {
    const data = BufferPolyfill.fromString(string, encoding);
    this.set(data, offset);
    return data.length;
  }

  toJSON(): { type: string; data: number[] } {
    return {
      type: 'Buffer',
      data: Array.from(this)
    };
  }
}



const globalObj = typeof globalThis !== 'undefined' ? globalThis : 
                  typeof global !== 'undefined' ? global : 
                  typeof window !== 'undefined' ? window : {};

if (typeof (globalObj as any).Buffer === 'undefined') {
  (globalObj as any).Buffer = BufferPolyfill;
  console.log('Buffer polyfill installed');
}

if (typeof (globalObj as any).process === 'undefined') {
  (globalObj as any).process = {
    env: {},
    version: 'v16.0.0',
    nextTick: (fn: Function, ...args: any[]) => {
      Promise.resolve().then(() => fn(...args));
    },
    browser: false,
  };
  console.log('process polyfill installed');
} else if (!(globalObj as any).process.version) {
  (globalObj as any).process.version = 'v16.0.0';
}

if (!(globalObj as any).process.env) {
  (globalObj as any).process.env = {};
}

export {};
