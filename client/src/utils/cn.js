// Simple cn utility (className merge)
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

