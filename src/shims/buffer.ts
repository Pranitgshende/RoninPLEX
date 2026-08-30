export class Buffer {
  static from(data: any, encoding?: string): any {
    if (typeof data === 'string') {
      if (encoding === 'base64') {
        const bin = typeof atob !== 'undefined' ? atob(data) : '';
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        return buf;
      }
      return new TextEncoder().encode(data);
    }
    if (Array.isArray(data) || data instanceof Uint8Array) {
      return new Uint8Array(data);
    }
    return new Uint8Array(0);
  }

  static isBuffer(obj: any): boolean {
    return obj instanceof Uint8Array;
  }

  static alloc(size: number): any {
    return new Uint8Array(size);
  }
}

export default { Buffer };