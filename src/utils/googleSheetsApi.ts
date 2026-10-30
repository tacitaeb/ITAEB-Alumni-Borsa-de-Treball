import { AlumniRecord } from '../types';
import { getCachedGoogleAccessToken } from './googleAuth';
import { extractSpreadsheetId, parseAlumniRecordsFromRows, saveStoredSyncedAlumni } from './googleSheetsSync';

/**
 * Llegeix totes les dades d'una fulla del full de càlcul mitjançant Google Sheets REST API v4
 */
export async function readGoogleSheetData(
  spreadsheetIdOrUrl: string,
  sheetName: string = 'Exalumnes',
  accessToken?: string
): Promise<{
  success: boolean;
  rows: string[][];
  alumni: AlumniRecord[];
  total: number;
  message: string;
}> {
  const token = accessToken || getCachedGoogleAccessToken();
  if (!token) {
    throw new Error("Cal connectar el compte de Google (tac@itaeb.cat) per accedir al full de càlcul.");
  }

  const cleanId = extractSpreadsheetId(spreadsheetIdOrUrl);
  if (!cleanId) {
    throw new Error("L'identificador del full de càlcul no és vàlid.");
  }

  const range = encodeURIComponent(`${sheetName}!A1:Z500`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const msg = errorBody?.error?.message || `Error HTTP ${response.status} de Google Sheets API`;
    throw new Error(`Google Sheets API: ${msg}`);
  }

  const data = await response.json();
  const rawValues: (string | number)[][] = data.values || [];
  const rows: string[][] = rawValues.map(row => row.map(cell => String(cell ?? '').trim()));

  const alumni = parseAlumniRecordsFromRows(rows);
  saveStoredSyncedAlumni(alumni);

  return {
    success: true,
    rows,
    alumni,
    total: alumni.length,
    message: `S'han llegit ${alumni.length} exalumnes des de la fulla "${sheetName}".`,
  };
}

/**
 * Afegeix una nova fila a la fulla "Exalumnes" del full de càlcul mitjançant Google Sheets API (append)
 */
export async function appendAlumniToGoogleSheet(
  spreadsheetIdOrUrl: string,
  sheetName: string = 'Exalumnes',
  alumni: {
    nomCognoms: string;
    dni: string;
    correu: string;
    contrasenya: string;
    anyGraduacio: string;
    especialitat: string;
    sectorsInteres: string[];
    notificacionsCorreu: boolean;
  },
  accessToken?: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const token = accessToken || getCachedGoogleAccessToken();
  if (!token) {
    throw new Error("Cal autorització de Google per escriure al full de càlcul.");
  }

  const cleanId = extractSpreadsheetId(spreadsheetIdOrUrl);
  if (!cleanId) {
    throw new Error("L'identificador del full de càlcul no és vàlid.");
  }

  const timestamp = `${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`;
  const rowValues = [
    timestamp,
    alumni.nomCognoms,
    alumni.dni,
    alumni.correu,
    alumni.contrasenya,
    alumni.anyGraduacio,
    alumni.especialitat,
    alumni.sectorsInteres.join(', '),
    alumni.notificacionsCorreu ? 'SÍ' : 'NO',
  ];

  const range = encodeURIComponent(`${sheetName}!A:I`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${sheetName}!A:I`,
      majorDimension: 'ROWS',
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const msg = errorBody?.error?.message || `Error HTTP ${response.status} en escriure al full`;
    throw new Error(`Google Sheets API: ${msg}`);
  }

  return {
    success: true,
    message: `S'ha afegit correctament l'alumne/a ${alumni.nomCognoms} (${alumni.correu}) a la fulla "${sheetName}".`,
  };
}

/**
 * Afegeix una nova oferta de treball a la fulla "Ofertes" del full de càlcul oficial
 */
export async function appendOfferToGoogleSheet(
  spreadsheetIdOrUrl: string,
  sheetName: string = 'Ofertes',
  offer: {
    empresa: string;
    llocTreball: string;
    personaContacte: string;
    descripcio: string;
    requisits: string;
    tipusContracte: string;
    dataLimitCV: string;
    contacte: string;
    sector: string[];
    estat: string;
  },
  accessToken?: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const token = accessToken || getCachedGoogleAccessToken();
  if (!token) {
    throw new Error("Cal autorització de Google per escriure al full de càlcul.");
  }

  const cleanId = extractSpreadsheetId(spreadsheetIdOrUrl);
  if (!cleanId) {
    throw new Error("L'identificador del full de càlcul no és vàlid.");
  }

  const timestamp = `${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`;
  const rowValues = [
    timestamp,
    offer.empresa,
    offer.llocTreball,
    offer.personaContacte,
    offer.descripcio,
    offer.requisits,
    offer.tipusContracte,
    offer.dataLimitCV,
    offer.contacte,
    offer.sector.join(', '),
    offer.estat,
  ];

  const range = encodeURIComponent(`${sheetName}!A:K`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${sheetName}!A:K`,
      majorDimension: 'ROWS',
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const msg = errorBody?.error?.message || `Error HTTP ${response.status} en escriure l'oferta`;
    throw new Error(`Google Sheets API: ${msg}`);
  }

  return {
    success: true,
    message: `S'ha desat correctament l'oferta "${offer.llocTreball}" de ${offer.empresa} al full oficial.`,
  };
}
