import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'sheet-config.json');
const ALUMNI_FILE = path.join(DATA_DIR, 'synced-alumni.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredSheetConfig {
  spreadsheetUrlOrId: string;
  sheetName: string;
  coordinatorToken?: string;
  appsScriptWebhookUrl?: string;
  lastSyncTime: string | null;
  lastSyncStatus: 'success' | 'error' | 'pending' | 'not_configured';
  lastError?: string;
  totalAlumniInSheet: number;
}

interface StoredAlumni {
  id: string;
  marcaTemps: string;
  nomCognoms: string;
  dni: string;
  correu: string;
  contrasenya: string;
  localPassword?: string;
  anyGraduacio: string;
  especialitat: string;
  sectorsInteres: string[];
  notificacionsCorreu: boolean;
  verificat: boolean;
}

const DEFAULT_CONFIG: StoredSheetConfig = {
  spreadsheetUrlOrId: '1YsrfzmjYt7tgixvfkDfkWOgkRJEL1U9aIC50jpPcZtI',
  sheetName: 'Exalumnes',
  lastSyncTime: null,
  lastSyncStatus: 'not_configured',
  totalAlumniInSheet: 0,
};

function readConfig(): StoredSheetConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading sheet config file:', err);
  }
  return DEFAULT_CONFIG;
}

function writeConfig(config: StoredSheetConfig) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing sheet config file:', err);
  }
}

function readAlumni(): StoredAlumni[] {
  try {
    if (fs.existsSync(ALUMNI_FILE)) {
      const data = fs.readFileSync(ALUMNI_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading alumni file:', err);
  }
  return [];
}

function writeAlumni(alumni: StoredAlumni[]) {
  try {
    fs.writeFileSync(ALUMNI_FILE, JSON.stringify(alumni, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing alumni file:', err);
  }
}

export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch && pubMatch[1]) {
    return pubMatch[1];
  }
  return trimmed;
}

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/·/g, '')
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDNI(dni: string): string {
  if (!dni) return '';
  return dni.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

function parseAlumniFromRows(rows: string[][]): StoredAlumni[] {
  if (!rows || rows.length === 0) return [];

  const firstRow = rows[0].map(h => normalizeText(h));
  const hasHeader = firstRow.some(
    h => h.includes('correu') || h.includes('email') || h.includes('nom') || h.includes('dni')
  );

  let emailCol = 3;
  let passCol = 4;
  let nameCol = 1;
  let dniCol = 2;
  let yearCol = 5;
  let specCol = 6;
  let sectorsCol = 7;
  let notifCol = 8;
  let timestampCol = 0;
  let statusCol = -1;

  let startIndex = 0;
  if (hasHeader) {
    startIndex = 1;
    firstRow.forEach((h, idx) => {
      if (h.includes('notificacio') || h.includes('avis') || h.includes('rebre') || h.includes('ofertes')) {
        notifCol = idx;
      } else if (h.includes('correu') || h.includes('email') || h.includes('mail')) {
        emailCol = idx;
      } else if (h.includes('contrasenya') || h.includes('password') || h.includes('clau') || h.includes('pass')) {
        passCol = idx;
      } else if (h.includes('nom') || h.includes('cognom')) {
        nameCol = idx;
      } else if (h.includes('dni') || h.includes('document') || h.includes('nif')) {
        dniCol = idx;
      } else if (h.includes('graduacio') || h.includes('any') || h.includes('promocio')) {
        yearCol = idx;
      } else if (h.includes('especialitat') || h.includes('estudis') || h.includes('cicle')) {
        specCol = idx;
      } else if (h.includes('sector') || h.includes('interes') || h.includes('ambits')) {
        sectorsCol = idx;
      } else if (h.includes('marca') || h.includes('temps') || h.includes('data')) {
        timestampCol = idx;
      } else if (h.includes('verificat') || h.includes('estat') || h.includes('validat') || h.includes('aprovat') || h.includes('status')) {
        statusCol = idx;
      }
    });
  }

  const alumniList: StoredAlumni[] = [];
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const email = (row[emailCol] || '').trim();
    if (!email || !email.includes('@')) continue;

    const nomCognoms = (row[nameCol] || email.split('@')[0]).trim();
    const rawPass = (row[passCol] || '').trim();
    const dni = normalizeDNI(row[dniCol] || '');
    const anyGraduacio = (row[yearCol] || '2024').trim();
    const especialitat = (row[specCol] || "Tècniques de l'Espectacle").trim();
    const rawSectors = (row[sectorsCol] || '').trim();
    const sectorsInteres = rawSectors
      ? rawSectors.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
      : ["Il·luminació per arts escèniques", "Sonorització per arts escèniques"];
    const rawNotif = (row[notifCol] || '').toLowerCase().trim();
    const notificacionsCorreu = rawNotif.startsWith('s') || rawNotif.includes('yes') || rawNotif.includes('true');
    const marcaTemps = (row[timestampCol] || new Date().toLocaleDateString('ca-ES')).trim();

    // Comprovació de la columna d'Estat / Verificat
    let isVerified = true;
    if (statusCol !== -1 && row[statusCol] !== undefined) {
      const statusVal = normalizeText(row[statusCol] || '');
      // Si la columna té valor, només és vàlid si conté si, ok, validat, verificat, aprovat
      if (statusVal) {
        isVerified = statusVal.includes('si') || statusVal.includes('ok') || statusVal.includes('validat') || statusVal.includes('verificat') || statusVal.includes('aprovat') || statusVal === 'true';
      } else {
        // Cel·la buida a la columna Verificat = Pendent de verificació (NO aprovat encara)
        isVerified = false;
      }
    }

    alumniList.push({
      id: `alu-${i}-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      marcaTemps,
      nomCognoms,
      dni,
      correu: email,
      contrasenya: rawPass,
      anyGraduacio,
      especialitat,
      sectorsInteres,
      notificacionsCorreu,
      verificat: isVerified,
    });
  }

  return alumniList;
}

function mergeAlumniWithExisting(sheetAlumni: StoredAlumni[], existingList: StoredAlumni[]): StoredAlumni[] {
  const existingMap = new Map<string, StoredAlumni>();
  for (const a of existingList) {
    existingMap.set(a.correu.trim().toLowerCase(), a);
  }

  return sheetAlumni.map(sheetItem => {
    const existing = existingMap.get(sheetItem.correu.trim().toLowerCase());
    if (!existing) return sheetItem;

    // Preservar canvis personals d'usuari (contrasenya, contacte, sectors) mentre es manté el 'verificat' del full
    return {
      ...sheetItem,
      contrasenya: existing.localPassword || existing.contrasenya || sheetItem.contrasenya,
      localPassword: existing.localPassword,
      verificat: sheetItem.verificat, // Qui mana en l'estat és estrictament el full de càlcul
      nomCognoms: existing.nomCognoms || sheetItem.nomCognoms,
      sectorsInteres: existing.sectorsInteres?.length ? existing.sectorsInteres : sheetItem.sectorsInteres,
      notificacionsCorreu: typeof existing.notificacionsCorreu === 'boolean' ? existing.notificacionsCorreu : sheetItem.notificacionsCorreu,
    };
  });
}

async function fetchGoogleSheetRows(spreadsheetUrlOrId: string, sheetName: string, authToken?: string): Promise<string[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetUrlOrId);
  if (!cleanId) {
    throw new Error("No s'ha proporcionat un enllaç o identificador de full de càlcul vàlid.");
  }

  // 1. Si tenim un token OAuth de Google (Bearer), utilitzem l'API oficial de Google Sheets v4
  if (authToken) {
    try {
      const range = encodeURIComponent(`${sheetName}!A1:Z1000`);
      const v4Url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`;
      const res = await fetch(v4Url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const json = await res.json();
        const rawValues: (string | number)[][] = json.values || [];
        const rows: string[][] = rawValues.map(r => r.map(c => String(c ?? '').trim()));
        if (rows.length > 0) return rows;
      } else {
        const errJson = await res.json().catch(() => null);
        console.warn('Google Sheets v4 API error:', errJson);
      }
    } catch (apiErr) {
      console.warn('Error fetching via Google Sheets v4 API:', apiErr);
    }
  }

  // URL 2: Google Visualization API CSV export (per a fulls compartits per enllaç)
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName
  )}&_t=${Date.now()}`;

  try {
    const res = await fetch(gvizUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ITAEB-Borsa/1.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (res.ok) {
      const csvText = await res.text();
      if (!csvText.includes('<!DOCTYPE html>') && !csvText.includes('<html')) {
        const rows = parseCSV(csvText);
        if (rows.length > 0) return rows;
      }
    }
  } catch (err) {
    console.warn('Gviz CSV fetch error:', err);
  }

  // URL 3: Standard export CSV
  const exportUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&sheet=${encodeURIComponent(
    sheetName
  )}&_t=${Date.now()}`;

  try {
    const res = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ITAEB-Borsa/1.0',
      },
    });

    if (res.ok) {
      const csvText = await res.text();
      if (!csvText.includes('<!DOCTYPE html>') && !csvText.includes('<html')) {
        const rows = parseCSV(csvText);
        if (rows.length > 0) return rows;
      }
    }
  } catch (err) {
    console.warn('Export CSV fetch error:', err);
  }

  throw new Error(
    `No s'ha pogut accedir a la fulla "${sheetName}" del full de càlcul. Revisa que el compte de Google (tac@itaeb.cat) tingui permís d'Edició al document o que estigui compartit.`
  );
}

async function updateGoogleSheetRow(
  spreadsheetUrlOrId: string,
  sheetName: string,
  originalEmail: string,
  updated: StoredAlumni,
  authToken?: string,
  webhookUrl?: string
): Promise<{ success: boolean; message: string; sheetUpdated: boolean }> {
  const cleanId = extractSpreadsheetId(spreadsheetUrlOrId);
  const cleanOrigEmail = originalEmail.trim().toLowerCase();

  // 1. Intent mitjançant Apps Script Webhook si està configurat (no depèn de tokens que caduquen)
  if (webhookUrl && webhookUrl.startsWith('https://script.google.com/')) {
    try {
      console.log(`[GoogleSheetSync] Executant Webhook Apps Script per a: ${cleanOrigEmail}`);
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_alumni',
          originalEmail: cleanOrigEmail,
          sheetName,
          alumni: updated,
        }),
        redirect: 'follow',
      });

      const text = await res.text();
      let json: { success?: boolean; message?: string; error?: string; row?: number } | null = null;
      try {
        json = JSON.parse(text);
      } catch {
        console.warn('[GoogleSheetSync] Resposta no JSON del Webhook:', text.slice(0, 100));
      }

      if (json && json.success) {
        return {
          success: true,
          message: json.message || `S'ha actualitzat la fila de l'exalumne directament al full "ITAEB Borsa de Treball" (Google Drive).`,
          sheetUpdated: true,
        };
      } else if (json && (json.message || json.error)) {
        return {
          success: false,
          message: `Avís del Google Sheet: ${json.message || json.error}`,
          sheetUpdated: false,
        };
      } else if (res.ok) {
        return {
          success: true,
          message: `Google Sheet actualitzat correctament via Webhook (HTTP ${res.status}).`,
          sheetUpdated: true,
        };
      }
    } catch (e) {
      console.warn('[GoogleSheetSync] Error en cridar el Webhook Apps Script:', e);
    }
  }

  // 2. Intent mitjançant Google Sheets REST API v4 (amb token Bearer de Google)
  if (authToken && cleanId) {
    try {
      const rows = await fetchGoogleSheetRows(cleanId, sheetName, authToken);
      if (rows && rows.length > 0) {
        const firstRow = rows[0].map(h => normalizeText(h));
        let emailCol = 3;
        firstRow.forEach((h, idx) => {
          if (h.includes('notificacio') || h.includes('avis') || h.includes('rebre') || h.includes('ofertes')) {
            // no és el correu
          } else if (h.includes('correu') || h.includes('email') || h.includes('mail')) {
            emailCol = idx;
          }
        });

        let rowIndex = -1;
        let origRow: string[] = [];
        for (let i = 1; i < rows.length; i++) {
          if ((rows[i][emailCol] || '').trim().toLowerCase() === cleanOrigEmail) {
            rowIndex = i + 1; // 1-indexed a Google Sheets
            origRow = rows[i];
            break;
          }
        }

        if (rowIndex !== -1) {
          const timestamp = origRow[0] || updated.marcaTemps || new Date().toLocaleDateString('ca-ES');
          const verificatVal = origRow[9] || (updated.verificat ? 'Sí' : 'No'); // PRESERVAT: Mai modificat per l'alumni

          const rowData = [
            timestamp,
            updated.nomCognoms,
            updated.dni,
            updated.correu,
            updated.contrasenya,
            updated.anyGraduacio,
            updated.especialitat,
            Array.isArray(updated.sectorsInteres) ? updated.sectorsInteres.join(', ') : updated.sectorsInteres,
            updated.notificacionsCorreu ? 'Sí' : 'No',
            verificatVal,
          ];

          const range = encodeURIComponent(`${sheetName}!A${rowIndex}:J${rowIndex}`);
          const v4Url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}?valueInputOption=USER_ENTERED`;

          const updateRes = await fetch(v4Url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: `${sheetName}!A${rowIndex}:J${rowIndex}`,
              majorDimension: 'ROWS',
              values: [rowData],
            }),
          });

          if (updateRes.ok) {
            return {
              success: true,
              message: `S'ha actualitzat la fila ${rowIndex} del full oficial "ITAEB Borsa de Treball" directament a Google Sheets.`,
              sheetUpdated: true,
            };
          } else {
            const errData = await updateRes.json().catch(() => null);
            console.warn('Google Sheets v4 API error:', errData);
            return {
              success: false,
              message: `Error de Google Sheets API (${updateRes.status}): ${errData?.error?.message || 'Permís denegat'}`,
              sheetUpdated: false,
            };
          }
        }
      }
    } catch (apiErr) {
      console.warn('Error updating Google Sheets via API v4:', apiErr);
      return {
        success: false,
        message: apiErr instanceof Error ? apiErr.message : 'Error en connectar amb Google Sheets',
        sheetUpdated: false,
      };
    }
  }

  return {
    success: false,
    message: "No hi ha cap sessió de Google amb permís d'Edició ni Webhook actiu per escriure al Google Drive.",
    sheetUpdated: false,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/sheet-config', (_req, res) => {
    const config = readConfig();
    res.json(config);
  });

  app.post('/api/sheet-config', async (req, res) => {
    try {
      const { spreadsheetUrlOrId, sheetName, coordinatorToken, appsScriptWebhookUrl } = req.body || {};
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
      const current = readConfig();

      const targetUrlOrId = String(spreadsheetUrlOrId !== undefined ? spreadsheetUrlOrId : (current.spreadsheetUrlOrId || '')).trim();
      const targetSheet = String(sheetName !== undefined ? sheetName : (current.sheetName || 'Exalumnes')).trim();
      const updatedCoordinatorToken = coordinatorToken !== undefined ? coordinatorToken : (bearerToken || current.coordinatorToken);
      const updatedWebhookUrl = appsScriptWebhookUrl !== undefined ? String(appsScriptWebhookUrl).trim() : current.appsScriptWebhookUrl;

      if (req.body?.onlySaveConfig) {
        const updated: StoredSheetConfig = {
          ...current,
          spreadsheetUrlOrId: targetUrlOrId || current.spreadsheetUrlOrId || '1YsrfzmjYt7tgixvfkDfkWOgkRJEL1U9aIC50jpPcZtI',
          sheetName: targetSheet || current.sheetName || 'Exalumnes',
          appsScriptWebhookUrl: updatedWebhookUrl !== undefined ? updatedWebhookUrl : current.appsScriptWebhookUrl,
          coordinatorToken: updatedCoordinatorToken !== undefined ? updatedCoordinatorToken : current.coordinatorToken,
        };
        writeConfig(updated);
        return res.json({ success: true, config: updated, message: 'Configuració del full i webhook desada correctament.' });
      }

      if (!targetUrlOrId) {
        const updated: StoredSheetConfig = {
          ...current,
          spreadsheetUrlOrId: '',
          sheetName: targetSheet,
          coordinatorToken: updatedCoordinatorToken,
          appsScriptWebhookUrl: updatedWebhookUrl,
          lastSyncStatus: 'not_configured',
          lastError: 'Falta l’enllaç o identificador del Google Spreadsheet.',
        };
        writeConfig(updated);
        return res.json({ success: false, config: updated, message: updated.lastError });
      }

      try {
        const activeToken = updatedCoordinatorToken || bearerToken;
        const rows = await fetchGoogleSheetRows(targetUrlOrId, targetSheet, activeToken);
        const alumni = parseAlumniFromRows(rows);
        const currentList = readAlumni();
        const merged = mergeAlumniWithExisting(alumni, currentList);
        writeAlumni(merged);

        const now = `${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`;
        const newConfig: StoredSheetConfig = {
          spreadsheetUrlOrId: targetUrlOrId,
          sheetName: targetSheet,
          coordinatorToken: updatedCoordinatorToken,
          appsScriptWebhookUrl: updatedWebhookUrl,
          lastSyncTime: now,
          lastSyncStatus: 'success',
          lastError: undefined,
          totalAlumniInSheet: merged.length,
        };
        writeConfig(newConfig);

        return res.json({
          success: true,
          config: newConfig,
          total: merged.length,
          message: `S'han sincronitzat correctament ${merged.length} exalumnes des de la fulla "${targetSheet}".`,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const failedConfig: StoredSheetConfig = {
          spreadsheetUrlOrId: targetUrlOrId,
          sheetName: targetSheet,
          lastSyncTime: current.lastSyncTime,
          lastSyncStatus: 'error',
          lastError: errorMsg,
          totalAlumniInSheet: current.totalAlumniInSheet,
        };
        writeConfig(failedConfig);

        return res.status(200).json({
          success: false,
          config: failedConfig,
          message: errorMsg,
        });
      }
    } catch (globalErr) {
      console.error('Error in /api/sheet-config:', globalErr);
      return res.status(200).json({
        success: false,
        message: globalErr instanceof Error ? globalErr.message : 'Error intern en desar la configuració.',
      });
    }
  });

  app.post('/api/sync-sheet', async (req, res) => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const current = readConfig();
    if (!current.spreadsheetUrlOrId) {
      res.status(400).json({
        success: false,
        message: "No hi ha cap full de càlcul configurat. Indica l'enllaç de Google Drive primer.",
      });
      return;
    }

    try {
      console.log('SYNC-SHEET called for id:', current.spreadsheetUrlOrId, 'sheet:', current.sheetName);
      const rows = await fetchGoogleSheetRows(current.spreadsheetUrlOrId, current.sheetName || 'Exalumnes', bearerToken);
      console.log('FETCHED ROWS COUNT:', rows ? rows.length : 'null');
      const alumni = parseAlumniFromRows(rows);
      const currentList = readAlumni();
      const merged = mergeAlumniWithExisting(alumni, currentList);
      writeAlumni(merged);

      const now = `${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`;
      const newConfig: StoredSheetConfig = {
        ...current,
        lastSyncTime: now,
        lastSyncStatus: 'success',
        lastError: undefined,
        totalAlumniInSheet: alumni.length,
      };
      writeConfig(newConfig);

      res.json({
        success: true,
        config: newConfig,
        total: alumni.length,
        message: `S'han sincronitzat ${alumni.length} exalumnes des del full de Google Sheets.`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const failedConfig: StoredSheetConfig = {
        ...current,
        lastSyncStatus: 'error',
        lastError: errorMsg,
      };
      writeConfig(failedConfig);
      res.status(400).json({ success: false, message: errorMsg, config: failedConfig });
    }
  });

  app.post('/api/test-sheet-write', async (req, res) => {
    const { webhookUrl } = req.body || {};
    const cfg = readConfig();
    const targetWebhook = (webhookUrl || cfg.appsScriptWebhookUrl || '').trim();

    if (!targetWebhook) {
      res.status(400).json({
        success: false,
        message: "No s'ha configurat cap URL de Webhook. Enganxa l'URL de l'Apps Script que acaba en /exec.",
      });
      return;
    }

    try {
      console.log(`[GoogleSheetSync] Provant Webhook: ${targetWebhook}`);
      const resp = await fetch(targetWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          sheetName: cfg.sheetName || 'Exalumnes',
        }),
        redirect: 'follow',
      });

      const text = await resp.text();
      let data: { success?: boolean; message?: string; error?: string } | null = null;
      try {
        data = JSON.parse(text);
      } catch {
        // text format
      }

      if (data && data.success) {
        res.json({
          success: true,
          message: data.message || "Connexió amb Google Apps Script establerta amb èxit! El full té permís d'escriptura actiu.",
        });
      } else {
        res.json({
          success: false,
          message: data?.error || data?.message || `El Webhook ha respost amb codi HTTP ${resp.status}: ${text.slice(0, 150)}`,
        });
      }
    } catch (err) {
      console.warn('[GoogleSheetSync] Error provant Webhook:', err);
      res.status(500).json({
        success: false,
        message: `Error en connectar amb el Webhook: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  });

  app.post('/api/import-csv', (req, res) => {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      res.status(400).json({ success: false, message: 'Cal enviar el contingut CSV.' });
      return;
    }

    try {
      const rows = parseCSV(csvContent);
      const alumni = parseAlumniFromRows(rows);
      writeAlumni(alumni);

      const now = `${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`;
      const current = readConfig();
      const newConfig: StoredSheetConfig = {
        ...current,
        lastSyncTime: now,
        lastSyncStatus: 'success',
        lastError: undefined,
        totalAlumniInSheet: alumni.length,
      };
      writeConfig(newConfig);

      res.json({
        success: true,
        config: newConfig,
        total: alumni.length,
        message: `S'han importat ${alumni.length} exalumnes correctament des de les dades facilitades.`,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : 'Error en processar el CSV',
      });
    }
  });

  app.get('/api/alumni-list', async (req, res) => {
    const config = readConfig();
    let alumni = readAlumni();

    if (config.spreadsheetUrlOrId && (req.query.refresh === 'true' || alumni.length === 0)) {
      try {
        const rows = await fetchGoogleSheetRows(config.spreadsheetUrlOrId, config.sheetName || 'Exalumnes');
        if (rows && rows.length > 0) {
          const fresh = parseAlumniFromRows(rows);
          if (fresh.length > 0) {
            alumni = fresh;
            writeAlumni(alumni);
            const now = `${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`;
            writeConfig({
              ...config,
              lastSyncTime: now,
              lastSyncStatus: 'success',
              lastError: undefined,
              totalAlumniInSheet: alumni.length,
            });
          }
        }
      } catch (err) {
        console.warn('Avís al consultar Google Sheets per a alumni-list:', err);
      }
    }

    res.json(alumni);
  });

  app.post('/api/update-alumni', async (req, res) => {
    try {
      const {
        originalEmail,
        nomCognoms,
        correu,
        contrasenya,
        dni,
        anyGraduacio,
        especialitat,
        sectorsInteres,
        notificacionsCorreu,
      } = req.body || {};

      if (!originalEmail) {
        res.status(400).json({ success: false, reason: "Falta el correu identificador de l'alumne." });
        return;
      }

      const cleanOrigEmail = String(originalEmail).trim().toLowerCase();
      const cleanNewEmail = correu ? String(correu).trim().toLowerCase() : cleanOrigEmail;

      if (cleanNewEmail.endsWith('@itaeb.cat')) {
        res.status(400).json({
          success: false,
          reason: "El correu de contacte no pot ser @itaeb.cat. Ha de ser un correu personal (Gmail, Outlook, etc.).",
        });
        return;
      }

      const list = readAlumni();
      const idx = list.findIndex(a => a.correu.trim().toLowerCase() === cleanOrigEmail);

      let updatedRecord: StoredAlumni;
      if (idx !== -1) {
        const currentRecord = list[idx];
        // Important: El camp verificat NO es pot modificar per l'usuari; es manté estrictament el que ja tenia
        updatedRecord = {
          ...currentRecord,
          nomCognoms: nomCognoms ? String(nomCognoms).trim() : currentRecord.nomCognoms,
          correu: cleanNewEmail,
          contrasenya: contrasenya !== undefined ? String(contrasenya).trim() : currentRecord.contrasenya,
          localPassword: contrasenya !== undefined ? String(contrasenya).trim() : currentRecord.localPassword,
          dni: dni ? normalizeDNI(String(dni)) : currentRecord.dni,
          anyGraduacio: anyGraduacio ? String(anyGraduacio).trim() : currentRecord.anyGraduacio,
          especialitat: especialitat ? String(especialitat).trim() : currentRecord.especialitat,
          sectorsInteres: Array.isArray(sectorsInteres) ? sectorsInteres : currentRecord.sectorsInteres,
          notificacionsCorreu: typeof notificacionsCorreu === 'boolean' ? notificacionsCorreu : currentRecord.notificacionsCorreu,
          verificat: currentRecord.verificat, // PRESERVAT INTACTE
        };
        list[idx] = updatedRecord;
      } else {
        // Si no es trobava al fitxer local, l'afegim com a nou registre conservant estat verificat
        const newPass = contrasenya !== undefined ? String(contrasenya).trim() : '';
        updatedRecord = {
          id: `alu-${Date.now()}-${cleanNewEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
          marcaTemps: new Date().toLocaleDateString('ca-ES'),
          nomCognoms: nomCognoms ? String(nomCognoms).trim() : cleanNewEmail.split('@')[0],
          correu: cleanNewEmail,
          contrasenya: newPass,
          localPassword: newPass,
          dni: dni ? normalizeDNI(String(dni)) : '',
          anyGraduacio: anyGraduacio ? String(anyGraduacio).trim() : '2024',
          especialitat: especialitat ? String(especialitat).trim() : "Tècniques de l'Espectacle",
          sectorsInteres: Array.isArray(sectorsInteres) ? sectorsInteres : [],
          notificacionsCorreu: typeof notificacionsCorreu === 'boolean' ? notificacionsCorreu : true,
          verificat: true,
        };
        list.push(updatedRecord);
      }

      writeAlumni(list);

      // Actualització directa al full de Google Sheets "ITAEB Borsa de Treball"
      const cfg = readConfig();
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : (req.body?.googleAccessToken || cfg.coordinatorToken);

      let sheetUpdated = false;
      let sheetMsg = '';

      if (cfg.spreadsheetUrlOrId) {
        try {
          const sheetRes = await updateGoogleSheetRow(
            cfg.spreadsheetUrlOrId,
            cfg.sheetName || 'Exalumnes',
            cleanOrigEmail,
            updatedRecord,
            bearerToken,
            cfg.appsScriptWebhookUrl
          );
          sheetUpdated = sheetRes.sheetUpdated;
          sheetMsg = sheetRes.message;
        } catch (sheetErr) {
          console.warn('Avís en actualitzar el Google Sheet:', sheetErr);
        }
      }

      res.json({
        success: true,
        updatedRecord,
        sheetUpdated,
        message: sheetUpdated
          ? "Dades del teu perfil actualitzades i sincronitzades directament al full de Google Sheets!"
          : "Dades desades correctament a la plataforma.",
        sheetMessage: sheetMsg,
      });
    } catch (err) {
      console.error('Error updating alumni:', err);
      res.status(500).json({
        success: false,
        reason: err instanceof Error ? err.message : "Error intern en desar les dades de l'alumne.",
      });
    }
  });

  app.post('/api/verify-alumni', async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      res.status(400).json({
        success: false,
        reason: 'Cal indicar el correu electrònic i la contrasenya.',
      });
      return;
    }

    // 1. Coordinators
    if (cleanEmail === 'tac@itaeb.cat' || cleanEmail === 'empresa@itaeb.cat') {
      res.json({
        success: true,
        user: {
          email: cleanEmail,
          name: 'Coordinador Digital ITAEB',
          isMemberOfAlumniGroup: true,
          role: 'coordinador',
        },
        source: 'coordinator',
      });
      return;
    }

    // 2. Read alumni with LIVE Google Sheets as authoritative source of truth
    const config = readConfig();
    let alumniList = readAlumni();

    // Si tenim el full de Google Sheets configurat, el consultem EN DIRECTE per tenir sempre les dades reals que el coordinador edita
    if (config.spreadsheetUrlOrId) {
      try {
        const liveRows = await fetchGoogleSheetRows(config.spreadsheetUrlOrId, config.sheetName || 'Exalumnes');
        if (liveRows && liveRows.length > 0) {
          const fresh = parseAlumniFromRows(liveRows);
          if (fresh.length > 0) {
            alumniList = mergeAlumniWithExisting(fresh, alumniList);
            writeAlumni(alumniList);

            // Actualitzar estat de sincronització a l'èxit
            const now = `${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`;
            writeConfig({
              ...config,
              lastSyncTime: now,
              lastSyncStatus: 'success',
              lastError: undefined,
              totalAlumniInSheet: alumniList.length,
            });
          }
        }
      } catch (err) {
        console.warn('Avís al consultar Google Sheets en viu, usant dades emmagatzemades:', err);
      }
    }

    // Check if sheet was never linked and no alumni stored
    if (!config.spreadsheetUrlOrId && alumniList.length === 0) {
      res.status(400).json({
        success: false,
        notConfigured: true,
        reason: `El full de càlcul "ITAEB Borsa de Treball" (fulla "${config.sheetName || 'Exalumnes'}") encara no està vinculat al servidor. El coordinador (tac@itaeb.cat) ha d'indicar l'enllaç de Google Drive per activar la verificació per a tothom.`,
      });
      return;
    }

    const alumni = alumniList.find(a => a.correu.trim().toLowerCase() === cleanEmail);
    if (!alumni) {
      res.status(401).json({
        success: false,
        reason: `El correu "${cleanEmail}" no s'ha trobat a la fulla "${
          config.sheetName || 'Exalumnes'
        }" del full de càlcul "ITAEB Borsa de Treball". Comprova que estiguis registrat/da al formulari d'alta oficial.`,
      });
      return;
    }

    const candidatePasswords = [
      alumni.contrasenya,
      alumni.localPassword,
    ].filter((p): p is string => Boolean(p && p.trim().length > 0));

    if (candidatePasswords.length > 0) {
      const isMatch = candidatePasswords.some(p => p.trim() === cleanPass);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          reason: `La contrasenya introduïda no és correcta per al correu ${cleanEmail} a la fulla "${
            config.sheetName || 'Exalumnes'
          }".`,
        });
        return;
      }
    } else {
      if (cleanPass.length < 3) {
        res.status(401).json({
          success: false,
          reason: 'La contrasenya ha de tenir un mínim de 3 caràcters.',
        });
        return;
      }
    }

    // Comprovació estricta de la columna Verificat / Estat
    if (alumni.verificat === false) {
      res.status(403).json({
        success: false,
        reason: `El compte "${cleanEmail}" està pendent de validació oficial per part de Coordinació. Un cop s'hagin revisat els requisits acadèmics i s'hagi marcat com a verificat al full de càlcul o afegit al grup alumni@itaeb.cat, tindràs accés a la borsa.`,
      });
      return;
    }

    res.json({
      success: true,
      user: {
        email: alumni.correu,
        name: alumni.nomCognoms,
        isMemberOfAlumniGroup: true,
        role: 'alumni',
      },
      alumniRecord: alumni,
      source: 'google_sheets_live',
    });
  });

  // Setup Vite dev server middleware
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    const cfg = readConfig();
    const sheetId = cfg.spreadsheetUrlOrId || '1YsrfzmjYt7tgixvfkDfkWOgkRJEL1U9aIC50jpPcZtI';
    fetchGoogleSheetRows(sheetId, cfg.sheetName || 'Exalumnes')
      .then(rows => {
        const list = parseAlumniFromRows(rows);
        if (list.length > 0) {
          const currentList = readAlumni();
          const merged = mergeAlumniWithExisting(list, currentList);
          writeAlumni(merged);
          const now = `${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`;
          writeConfig({
            ...cfg,
            spreadsheetUrlOrId: sheetId,
            lastSyncTime: now,
            lastSyncStatus: 'success',
            lastError: undefined,
            totalAlumniInSheet: list.length,
          });
          console.log(`[Google Sheets] Sincronitzats correctament ${list.length} exalumnes des de la fulla "${cfg.sheetName || 'Exalumnes'}".`);
        }
      })
      .catch(err => {
        console.warn('[Google Sheets] Avís en sincronització inicial:', err.message);
      });
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
