export function parseRangeString(rangeString: string): string[] {
  if (!rangeString) return [];
  const parts = rangeString.split(',').map(s => s.trim()).filter(Boolean);
  const result = new Set<string>();

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          result.add(i.toString());
        }
      } else {
        // Fallback for single invalid split
        result.add(part);
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num)) {
        result.add(num.toString());
      } else {
        result.add(part); // allow exact string match fallback
      }
    }
  }

  return Array.from(result);
}
