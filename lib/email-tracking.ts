import { getSheetsClient } from '@/lib/sheets';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const TAB_SENT  = 'EmailsEnviados';
const TAB_FB    = 'Feedback';

export type EmailSequenceType =
  | 'post_day1'    // +1 día después checkout: encuesta
  | 'post_day7'    // +7 días: invitación Google Maps
  | 'post_day30'   // +30 días: oferta de regreso
  | 'pre_day3'     // -3 días antes checkin: restaurante
  | 'pre_checkin'; // día del checkin: guía de bienvenida

export interface SentEmailRecord {
  confirmacion: string;
  emailType: EmailSequenceType;
  enviadoAt: string;
  emailDestino: string;
  resendId: string;
}

async function ensureTab(client: NonNullable<Awaited<ReturnType<typeof getSheetsClient>>>, title: string, headers: string[]) {
  try {
    await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${title}!A1` });
  } catch {
    await client.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
    await client.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${title}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }
}

export async function getEmailsSent(): Promise<Set<string>> {
  const client = await getSheetsClient();
  if (!client) return new Set();
  await ensureTab(client, TAB_SENT, ['Confirmacion', 'EmailType', 'EnviadoAt', 'EmailDestino', 'ResendId']);
  try {
    const res = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${TAB_SENT}!A:B` });
    const rows = (res.data.values || []).slice(1);
    return new Set(rows.filter(r => r[0] && r[1]).map(r => `${r[0]}:${r[1]}`));
  } catch { return new Set(); }
}

export async function markEmailSent(record: SentEmailRecord): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await ensureTab(client, TAB_SENT, ['Confirmacion', 'EmailType', 'EnviadoAt', 'EmailDestino', 'ResendId']);
  await client.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TAB_SENT}!A:E`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[record.confirmacion, record.emailType, record.enviadoAt, record.emailDestino, record.resendId]] },
  });
}

export async function saveFeedback(confirmacion: string, rating: number, comment: string, ip: string): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;
  await ensureTab(client, TAB_FB, ['Fecha', 'Confirmacion', 'Rating', 'Comentario', 'IP']);
  await client.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TAB_FB}!A:E`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[new Date().toISOString(), confirmacion, rating, comment, ip]] },
  });
}
