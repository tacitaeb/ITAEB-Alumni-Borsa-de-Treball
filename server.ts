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
  anyGraduacio: string;
  especialitat: string;
  sectorsInteres: string[];
  notificacionsCorreu: boolean;
  verificat: boolean;
}

const DEFAULT_CONFIG: StoredSheetConfig = {
  spreadsheetUrlOrId: '',
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

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(parseCSVLine);
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

  let startIndex = 0;
  if (hasHeader) {
    startIndex = 1;
    firstRow.forEach((h, idx) => {
      if (h.includes('correu') || h.includes('email') || h.includes('mail')) {
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
      } else if (h.includes('notificacio') || h.includes('avis') || h.includes('rebre')) {
        notifCol = idx;
      } else if (h.includes('marca') || h.includes('temps') || h.includes('data')) {
        timestampCol = idx;
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
      verificat: true,
    });
  }

  return alumniList;
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
  )}`;

  try {
    const res = await fetch(gvizUrl, {
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
    console.warn('Gviz CSV fetch error:', err);
  }

  // URL 3: Standard export CSV
  const exportUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&sheet=${encodeURIComponent(
    sheetName
  )}`;

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/sheet-config', (_req, res) => {
    const config = readConfig();
    res.json(config);
  });

  app.post('/api/sheet-config', async (req, res) => {
    const { spreadsheetUrlOrId, sheetName } = req.body;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const current = readConfig();

    const targetUrlOrId = (spreadsheetUrlOrId !== undefined ? spreadsheetUrlOrId : current.spreadsheetUrlOrId).trim();
    const targetSheet = (sheetName !== undefined ? sheetName : current.sheetName || 'Exalumnes').trim();

    if (!targetUrlOrId) {
      const updated: StoredSheetConfig = {
        ...current,
        spreadsheetUrlOrId: '',
        sheetName: targetSheet,
        lastSyncStatus: 'not_configured',
        lastError: 'Falta l’enllaç o identificador del Google Spreadsheet.',
      };
      writeConfig(updated);
      res.json({ success: false, config: updated, message: updated.lastError });
      return;
    }

    try {
      const rows = await fetchGoogleSheetRows(targetUrlOrId, targetSheet, bearerToken);
      const alumni = parseAlumniFromRows(rows);
      writeAlumni(alumni);

      const now = `${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`;
      const newConfig: StoredSheetConfig = {
        spreadsheetUrlOrId: targetUrlOrId,
        sheetName: targetSheet,
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
        message: `S'han sincronitzat correctament ${alumni.length} exalumnes des de la fulla "${targetSheet}".`,
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

      res.status(400).json({
        success: false,
        config: failedConfig,
        message: errorMsg,
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
      const rows = await fetchGoogleSheetRows(current.spreadsheetUrlOrId, current.sheetName || 'Exalumnes', bearerToken);
      const alumni = parseAlumniFromRows(rows);
      writeAlumni(alumni);

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

  app.get('/api/alumni-list', (_req, res) => {
    const alumni = readAlumni();
    res.json(alumni);
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

    // 2. Read stored alumni from sheet
    const config = readConfig();
    let alumniList = readAlumni();

    // If config has sheet URL and alumni list is empty, try an on-demand sync
    if (alumniList.length === 0 && config.spreadsheetUrlOrId) {
      try {
        const rows = await fetchGoogleSheetRows(config.spreadsheetUrlOrId, config.sheetName || 'Exalumnes');
        alumniList = parseAlumniFromRows(rows);
        if (alumniList.length > 0) {
          writeAlumni(alumniList);
        }
      } catch (err) {
        console.warn('On-demand sync failed during verification:', err);
      }
    }

    // Check if sheet was never linked
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

    if (alumni.contrasenya && alumni.contrasenya.trim().length > 0) {
      if (alumni.contrasenya.trim() !== cleanPass) {
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
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
