// Escapes user input before using it inside a RegExp — prevents ReDoS / injection.
export function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
