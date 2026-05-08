import { getSheetsClient } from '@/lib/sheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const TAB = 'NotasCRM';

export type LoyaltyTier = '' | 'BRONCE' | 'ORO';

export interface LoyaltyInfo {
  tier: LoyaltyTier;
  discountPct: number;
  enrolledAt: string;
}

export function computeTier(totalReservas: number): LoyaltyTier {
  if (totalReservas >= 3) return 'ORO';
  if (totalReservas >= 2) return 'BRONCE';
  return '';
}

export function tierDiscount(tier: LoyaltyTier): number {
  if (tier === 'ORO') return 10;
  if (tier === 'BRONCE') return 5;
  return 0;
}

// Lee LoyaltyTier y LoyaltyEnrolledAt (cols D y E) de NotasCRM para todos los emails
export async function getAllLoyaltyData(): Promise<Map<string, LoyaltyInfo>> {
  const client = await getSheetsClient();
  const map = new Map<string, LoyaltyInfo>();
  if (!client) return map;
  try {
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A:E`,
    });
    for (const row of (res.data.values || []).slice(1)) {
      const email = (row[0] || '').toLowerCase();
      if (!email) continue;
      const tier = (row[3] || '') as LoyaltyTier;
      map.set(email, { tier, discountPct: tierDiscount(tier), enrolledAt: row[4] || '' });
    }
  } catch { /* sheet might not have cols D/E yet */ }
  return map;
}

export async function getLoyaltyByEmail(email: string): Promise<LoyaltyInfo> {
  const map = await getAllLoyaltyData();
  return map.get(email.toLowerCase()) ?? { tier: '', discountPct: 0, enrolledAt: '' };
}

// Enrola al huésped en el programa (escribe cols D y E en su fila de NotasCRM)
export async function enrollLoyaltyMember(email: string, tier: LoyaltyTier): Promise<void> {
  if (!tier) return;
  const client = await getSheetsClient();
  if (!client) return;
  try {
    const res = await client.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A:A`,
    });
    const rows = res.data.values || [];
    const rowIdx = rows.findIndex(r => r[0]?.toLowerCase() === email.toLowerCase());
    const ts = new Date().toISOString();

    if (rowIdx > 0) {
      // Actualizar cols D y E de la fila existente
      await client.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB}!D${rowIdx + 1}:E${rowIdx + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[tier, ts]] },
      });
    } else {
      // Crear fila nueva con email + tier (notas vacías)
      await client.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[email, '', ts, tier, ts]] },
      });
    }
    console.log(`🏅 Loyalty enrolado: ${email} → ${tier}`);
  } catch (e: any) {
    console.error('enrollLoyaltyMember error:', e.message);
  }
}

// Llama esto después de crear una reserva para detectar si aplica enrolar
export async function checkAndEnrollLoyalty(email: string, totalReservas: number): Promise<void> {
  if (!email || email === 'N/A') return;
  const tier = computeTier(totalReservas);
  if (!tier) return;
  const existing = await getLoyaltyByEmail(email);
  // Solo actualizar si subió de tier o no estaba enrolado
  if (existing.tier === tier) return;
  if (existing.tier === 'ORO') return; // no hacer downgrade
  await enrollLoyaltyMember(email, tier);
}
