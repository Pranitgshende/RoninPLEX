export const createHmac = () => ({
  update: () => ({
    digest: () => ''
  })
});
export const randomUUID = () => (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : 'uuid-' + Math.random());
export const timingSafeEqual = () => true;

export default { createHmac, randomUUID, timingSafeEqual };