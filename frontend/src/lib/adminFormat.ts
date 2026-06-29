export function fmtRWF(amount: number): string {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-RW', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-RW', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
