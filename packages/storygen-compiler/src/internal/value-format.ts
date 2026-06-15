import type { VariableValue } from '@ch5me/storygen-schema';

/**
 * Format a {@link VariableValue} as a Python literal for Ren'Py `$` lines.
 * Strings are quoted with double quotes (escaped); booleans become Python
 * `True`/`False`; numbers render verbatim.
 */
export function formatPythonValue(value: VariableValue): string {
  if (typeof value === 'string') {
    return `"${escapeDoubleQuoted(value)}"`;
  }
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }
  return String(value);
}

/**
 * Format a {@link VariableValue} as an Ink literal. Ink uses `true`/`false`
 * lowercase booleans and double-quoted strings.
 */
export function formatInkValue(value: VariableValue): string {
  if (typeof value === 'string') {
    return `"${escapeDoubleQuoted(value)}"`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

/** Escape a string for embedding inside a double-quoted literal. */
export function escapeDoubleQuoted(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
