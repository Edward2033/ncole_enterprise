if (!import.meta.env.VITE_API_URL) {
  throw new Error('VITE_API_URL is not set');
}

export const API_BASE: string = import.meta.env.VITE_API_URL;
