if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  throw new Error('VITE_API_URL is missing in production');
}

export const API_BASE: string =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
