export const COLORS = [
  '#1a6ab5','#c94a0a','#2a9d4e','#7b3fa0',
  '#c4920a','#0a8a9d','#c41a5a','#5a7a0a',
  '#0a4ac4','#9d2a0a','#0a9d7b','#7a0ac4',
  '#c4700a','#0a6ac4','#9d0a5a','#4a9d0a',
];

export function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
