export const dirname = (p: any) => (p ? String(p).split(/[\\/]/).slice(0, -1).join('/') || '.' : '.');
export const join = (...args: any[]) => args.filter(Boolean).map(String).join('/');
export const basename = (p: any) => (p ? String(p).split(/[\\/]/).pop() || '' : '');
export default { dirname, join, basename };