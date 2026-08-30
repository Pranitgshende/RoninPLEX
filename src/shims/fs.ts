export const existsSync = () => false;
export const mkdirSync = () => {};
export const statSync = () => ({ size: 0 });
export const unlinkSync = () => {};
export const openSync = () => 0;
export const writeSync = () => {};
export const closeSync = () => {};
export const writeFileSync = () => {};
export const rmdirSync = () => {};
export const mkdtempSync = () => '/tmp/temp';
export const createWriteStream = () => ({ write: () => {}, end: () => {}, on: () => {} });
export const createReadStream = () => ({ pipe: () => {}, on: () => {} });

export default {
  existsSync,
  mkdirSync,
  statSync,
  unlinkSync,
  openSync,
  writeSync,
  closeSync,
  writeFileSync,
  rmdirSync,
  mkdtempSync,
  createWriteStream,
  createReadStream,
};