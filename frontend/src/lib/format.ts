export const PROJECT_ID = '6a38e12e38d0f89d5363ebd1';
export const STORE_NAME = 'N_COLE Interpress';
export const CRM_SUBSCRIBE_URL = `https://famous.ai/api/crm/${PROJECT_ID}/subscribe`;

/** Format a price in RWF (integer). */
export function formatPrice(rwf: number): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rwf || 0);
}

/** Subscribe an email (and optional phone) to the project CRM. Never throws. */
export async function subscribeToCrm(params: {
  email: string;
  name?: string;
  phone?: string;
  smsOptIn?: boolean;
  source: string;
  tags?: string[];
}): Promise<void> {
  try {
    await fetch(CRM_SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: params.email,
        name: params.name || undefined,
        phone: params.phone || undefined,
        sms_opt_in: params.smsOptIn === true,
        source: params.source,
        tags: params.tags || [],
      }),
    });
  } catch {
    /* non-blocking */
  }
}
