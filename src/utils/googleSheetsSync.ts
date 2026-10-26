import { AlumniRecord, UserSession } from '../types';
import { normalizeText, normalizeDNI, parseCSV } from './jobData';

export interface GoogleSheetConfig {
  spreadsheetUrlOrId: string;
  sheetName: string; // Defaults to "Exalumnes"
  lastSyncTime: string | null;
  lastSyncStatus: 'success' | 'error' | 'pending' | 'not_configured';
  lastError?: string;
  totalAlumniInSheet: number;
}

const STORAGE_KEY_CONFIG = 'itaeb_sheet_config';
const STORAGE_KEY_SYNCED_ALUMNI = 'itaeb_synced_sheet_alumni';

export const DEFAULT_SHEET_NAME = 'Exalumnes';

/**
 * Obté la configuració guardada del full de càlcul Google Sheets
 */
export function getStoredSheetConfig(): GoogleSheetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        spreadsheetUrlOrId: parsed.spreadsheetUrlOrId || '',
        sheetName: parsed.sheetName || DEFAULT_SHEET_NAME,
        lastSyncTime: parsed.lastSyncTime || null,
        lastSyncStatus: parsed.lastSyncStatus || 'not_configured',
        lastError: parsed.lastError,
        totalAlumniInSheet: parsed.totalAlumniInSheet || 0,
      };
    }
  } catch (e) {
    console.warn('Error reading stored sheet config:', e);
  }

  return {
    spreadsheetUrlOrId: '',
    sheetName: DEFAULT_SHEET_NAME,
    lastSyncTime: null,
    lastSyncStatus: 'not_configured',
    totalAlumniInSheet: 0,
  };
}

/**
 * Desa la configuració del full de càlcul
 */
export function saveStoredSheetConfig(config: GoogleSheetConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving sheet config:', e);
  }
}

/**
 * Obté els alumni desats de la darrera sincronització amb el full de càlcul
 */
export function getStoredSyncedAlumni(): AlumniRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYNCED_ALUMNI);
    if (raw) {
      return JSON.parse(raw) as AlumniRecord[];
    }
  } catch (e) {
    console.warn('Error reading stored synced alumni:', e);
  }
  return [];
}

/**
 * Desa els alumni sincronitzats
 */
export function saveStoredSyncedAlumni(alumni: AlumniRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SYNCED_ALUMNI, JSON.stringify(alumni));
  } catch (e) {
    console.warn('Error saving synced alumni:', e);
  }
}

/**
 * Extreu l'ID del document de Google Sheets a partir d'un enllaç complet o d'un ID net.
 * Exemples:
 * - https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
 * - 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Si ja és un ID directe (normalment 44 caràcters alfanumèrics, guions i subratllats)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // Si és una URL de Google Sheets
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // Si és un enllaç de publicació web (pubhtml o pub?output=...)
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch && pubMatch[1]) {
    return pubMatch[1];
  }

  return trimmed;
}

/**
 * Carrega les files del Google Sheet mitjançant JSONP (Google Visualization API).
 * Aquesta tècnica evita completament els problemes de CORS al navegador, funcionant
 * amb qualsevol full que tingui l'opció "Qualsevol persona amb l'enllaç pot veure".
 */
export function fetchSheetViaJsonp(spreadsheetId: string, sheetName: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const callbackName = `gviz_callback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(
      sheetName
    )}&tqx=responseHandler:${callbackName}`;

    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Temps d'espera esgotat al connectar amb Google Sheets. Assegura't que el full està compartit com a "Qualsevol persona amb l'enllaç pot veure".`
        )
      );
    }, 9000);

    const cleanup = () => {
      clearTimeout(timeout);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      try {
        delete (window as unknown as Record<string, unknown>)[callbackName];
      } catch {
        (window as unknown as Record<string, unknown>)[callbackName] = undefined;
      }
    };

    (window as unknown as Record<string, unknown>)[callbackName] = (data: {
      status?: string;
      table?: {
        cols?: Array<{ label?: string }>;
        rows?: Array<{ c?: Array<{ v?: unknown; f?: string } | null> }>;
      };
      errors?: Array<{ message?: string; detailed_message?: string }>;
    }) => {
      cleanup();

      if (!data) {
        reject(new Error('Google Sheets ha retornat una resposta buida.'));
        return;
      }

      if (data.status === 'error') {
        const errMsg = data.errors?.[0]?.detailed_message || data.errors?.[0]?.message || 'Error desconegut de Google Sheets';
        reject(new Error(`Error al full de càlcul: ${errMsg}`));
        return;
      }

      const table = data.table;
      if (!table || !table.rows) {
        resolve([]);
        return;
      }

      // Convertir a matriu bidimensional de strings
      const resultRows: string[][] = [];

      // Incloure capçalera si n'hi ha als cols
      if (table.cols && table.cols.some(c => c && c.label)) {
        resultRows.push(table.cols.map(c => (c && c.label ? String(c.label) : '')));
      }

      for (const row of table.rows) {
        if (!row || !row.c) continue;
        const rowCells: string[] = [];
        for (const cell of row.c) {
          if (cell === null || cell === undefined) {
            rowCells.push('');
          } else {
            const val = cell.f !== undefined && cell.f !== null ? cell.f : cell.v !== undefined && cell.v !== null ? cell.v : '';
            rowCells.push(String(val).trim());
          }
        }
        if (rowCells.some(c => c.length > 0)) {
          resultRows.push(rowCells);
        }
      }

      resolve(resultRows);
    };

    script.onerror = () => {
      cleanup();
      reject(
        new Error(
          `No s'ha pogut carregar el full de càlcul de Google Sheets. Verifica l'enllaç i que estigui compartit ("Qualsevol persona amb l'enllaç pot veure").`
        )
      );
    };

    document.head.appendChild(script);
  });
}

/**
 * Carrega les files mitjançant descàrrega directa de CSV (útil si està publicat al web o suporta CORS)
 */
export async function fetchSheetViaCsv(spreadsheetId: string, sheetName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName
  )}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/csv',
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets ha retornat un codi HTTP ${response.status}`);
  }

  const csvText = await response.text();
  return parseCSV(csvText);
}

/**
 * Tenta carregar les dades de la fulla "Exalumnes" combinant JSONP i fetch CSV
 */
export async function fetchRawSheetRows(spreadsheetUrlOrId: string, sheetName: string = DEFAULT_SHEET_NAME): Promise<string[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetUrlOrId);
  if (!cleanId) {
    throw new Error("No s'ha proporcionat un enllaç o ID vàlid del full de càlcul Google Sheets.");
  }

  // 1. Primer intent amb JSONP (més fiable en navegadors sense problemes de CORS)
  try {
    const rows = await fetchSheetViaJsonp(cleanId, sheetName);
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (jsonpErr) {
    console.warn('JSONP fetch fallat, provant alternativa CSV...', jsonpErr);
  }

  // 2. Segon intent amb fetch CSV
  try {
    const rows = await fetchSheetViaCsv(cleanId, sheetName);
    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (csvErr) {
    console.warn('CSV fetch fallat:', csvErr);
    throw new Error(
      `No s'ha pogut accedir a la fulla "${sheetName}" del full de càlcul. Revisa que el full estigui compartit amb lectura o publicat al web.`
    );
  }

  return [];
}

/**
 * Mapeja les columnes del full "Exalumnes" a objectes AlumniRecord.
 * Detecta les columnes segons les capçaleres de la primera fila o utilitza
 * les posicions predeterminades del formulari oficial de Google Forms.
 *
 * Estructura esperada de columnes:
 * - Col A (0): Marca de temps
 * - Col B (1): Nom i cognoms
 * - Col C (2): Número de DNI o document
 * - Col D (3): Correu electrònic (personal, no @itaeb.cat)
 * - Col E (4): Contrasenya
 * - Col F (5): Any de graduació
 * - Col G (6): Especialitat cursada
 * - Col H (7): Sectors d'interès
 * - Col I (8): Notificacions per correu
 */
export function parseAlumniRecordsFromRows(rows: string[][]): AlumniRecord[] {
  if (!rows || rows.length === 0) return [];

  // Analitzar capçalera si existeix
  const firstRow = rows[0].map(h => normalizeText(h));
  const hasHeader =
    firstRow.some(h => h.includes('correu') || h.includes('email') || h.includes('nom') || h.includes('dni'));

  let emailCol = 3;
  let passCol = 4;
  let nameCol = 1;
  let dniCol = 2;
  let yearCol = 5;
  let specCol = 6;
  let sectorsCol = 7;
  let notifCol = 8;
  let timestampCol = 0;

  let dataStartIndex = 0;

  if (hasHeader) {
    dataStartIndex = 1;

    firstRow.forEach((header, index) => {
      if (header.includes('correu') || header.includes('email') || header.includes('mail')) {
        emailCol = index;
      } else if (header.includes('contrasenya') || header.includes('password') || header.includes('clau') || header.includes('pass')) {
        passCol = index;
      } else if (header.includes('nom') || header.includes('cognom')) {
        nameCol = index;
      } else if (header.includes('dni') || header.includes('document') || header.includes('nif')) {
        dniCol = index;
      } else if (header.includes('graduacio') || header.includes('any') || header.includes('promocio')) {
        yearCol = index;
      } else if (header.includes('especialitat') || header.includes('estudis') || header.includes('cicle')) {
        specCol = index;
      } else if (header.includes('sector') || header.includes('interes') || header.includes('ambits')) {
        sectorsCol = index;
      } else if (header.includes('notificacio') || header.includes('avis') || header.includes('rebre')) {
        notifCol = index;
      } else if (header.includes('marca') || header.includes('temps') || header.includes('data')) {
        timestampCol = index;
      }
    });
  }

  const alumniList: AlumniRecord[] = [];

  for (let r = dataStartIndex; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const email = (row[emailCol] || '').trim();
    if (!email || !email.includes('@')) {
      // Fila buida o sense correu electrònic vàlid
      continue;
    }

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
      id: `sheet-alu-${r}-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
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

/**
 * Realitza la sincronització completa amb el full de càlcul de Google Sheets
 */
export async function syncAlumniFromGoogleSheet(
  spreadsheetUrlOrId?: string,
  sheetName: string = DEFAULT_SHEET_NAME
): Promise<{
  success: boolean;
  alumni: AlumniRecord[];
  total: number;
  message: string;
  config: GoogleSheetConfig;
}> {
  const currentConfig = getStoredSheetConfig();
  const targetIdOrUrl = spreadsheetUrlOrId || currentConfig.spreadsheetUrlOrId;
  const targetSheet = sheetName || currentConfig.sheetName || DEFAULT_SHEET_NAME;

  if (!targetIdOrUrl) {
    const config: GoogleSheetConfig = {
      ...currentConfig,
      lastSyncStatus: 'not_configured',
      lastError: "No s'ha configurat cap enllaç del full de càlcul Google Sheets.",
    };
    saveStoredSheetConfig(config);
    return {
      success: false,
      alumni: getStoredSyncedAlumni(),
      total: 0,
      message: "No s'ha configurat cap enllaç de Google Sheets.",
      config,
    };
  }

  try {
    const rows = await fetchRawSheetRows(targetIdOrUrl, targetSheet);
    const parsedAlumni = parseAlumniRecordsFromRows(rows);

    const nowStr = `${new Date().toLocaleDateString('ca-ES')} ${new Date().toLocaleTimeString('ca-ES')}`;
    const newConfig: GoogleSheetConfig = {
      spreadsheetUrlOrId: targetIdOrUrl,
      sheetName: targetSheet,
      lastSyncTime: nowStr,
      lastSyncStatus: 'success',
      lastError: undefined,
      totalAlumniInSheet: parsedAlumni.length,
    };

    saveStoredSheetConfig(newConfig);
    saveStoredSyncedAlumni(parsedAlumni);

    return {
      success: true,
      alumni: parsedAlumni,
      total: parsedAlumni.length,
      message: `S'han sincronitzat correctament ${parsedAlumni.length} exalumnes des de la fulla "${targetSheet}" del full de càlcul.`,
      config: newConfig,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const failedConfig: GoogleSheetConfig = {
      ...currentConfig,
      spreadsheetUrlOrId: targetIdOrUrl,
      sheetName: targetSheet,
      lastSyncStatus: 'error',
      lastError: errorMsg,
    };
    saveStoredSheetConfig(failedConfig);

    return {
      success: false,
      alumni: getStoredSyncedAlumni(),
      total: getStoredSyncedAlumni().length,
      message: `Error al sincronitzar: ${errorMsg}`,
      config: failedConfig,
    };
  }
}

/**
 * Autentica les credencials directament verificant-les contra el full de càlcul "Exalumnes".
 * Si hi ha connexió activa amb Google Sheets, fa una consulta en viu o comprova la llista
 * sincronitzada i actualitzada.
 */
export async function authenticateAgainstGoogleSheet(
  email: string,
  password: string,
  fallbackAlumni: AlumniRecord[] = []
): Promise<{
  success: boolean;
  user?: UserSession;
  reason?: string;
  source: 'google_sheets_live' | 'google_sheets_synced' | 'local_fallback' | 'coordinator';
  alumniRecord?: AlumniRecord;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanEmail || !cleanPass) {
    return {
      success: false,
      reason: 'Cal indicar el correu electrònic i la contrasenya.',
      source: 'local_fallback',
    };
  }

  // 1. Comprovació de comptes de Coordinador / Administrador
  if (cleanEmail === 'tac@itaeb.cat' || cleanEmail === 'empresa@itaeb.cat') {
    return {
      success: true,
      user: {
        email: cleanEmail,
        name: 'Coordinador Digital ITAEB',
        isMemberOfAlumniGroup: true,
        role: 'coordinador',
      },
      source: 'coordinator',
    };
  }

  // 2. Comprovació d'alumni al full de càlcul Google Sheets
  const config = getStoredSheetConfig();
  let candidateList: AlumniRecord[] = [];
  let verifiedFromLiveSheet = false;

  // Si hi ha enllaç o ID configurat, intentem obtenir les dades directes del Google Sheet
  if (config.spreadsheetUrlOrId) {
    try {
      const syncResult = await syncAlumniFromGoogleSheet(config.spreadsheetUrlOrId, config.sheetName);
      if (syncResult.success && syncResult.alumni.length > 0) {
        candidateList = syncResult.alumni;
        verifiedFromLiveSheet = true;
      }
    } catch (e) {
      console.warn('No es pot fer la verificació en viu amb el full de càlcul, utilitzant memòria cau...', e);
    }
  }

  // Si no hem pogut fer consulta en viu, emprem la darrera llista sincronitzada o el fallback
  if (candidateList.length === 0) {
    const stored = getStoredSyncedAlumni();
    if (stored.length > 0) {
      candidateList = stored;
    } else {
      candidateList = fallbackAlumni;
    }
  }

  // Cercar l'alumni pel correu electrònic
  const alumni = candidateList.find(a => a.correu.trim().toLowerCase() === cleanEmail);

  if (!alumni) {
    return {
      success: false,
      reason: `El correu "${cleanEmail}" no s'ha trobat a la fulla "${
        config.sheetName || 'Exalumnes'
      }" del full de càlcul "ITAEB Borsa de Treball". Si ets graduat/da de l'ITAEB, has d'omplir el formulari d'alta oficial per constar al full de càlcul.`,
      source: verifiedFromLiveSheet ? 'google_sheets_live' : 'google_sheets_synced',
    };
  }

  // Comprovar contrasenya
  // Si té contrasenya registrada al full, cal que coincideixi
  if (alumni.contrasenya && alumni.contrasenya.trim().length > 0) {
    if (alumni.contrasenya.trim() !== cleanPass) {
      return {
        success: false,
        reason: `La contrasenya introduïda no coincideix amb la registrada a la fulla "${
          config.sheetName || 'Exalumnes'
        }" per al compte ${cleanEmail}.`,
        source: verifiedFromLiveSheet ? 'google_sheets_live' : 'google_sheets_synced',
      };
    }
  } else {
    // Si la cel·la de contrasenya estava buida al full, acceptem qualsevol contrasenya de seguretat mínima (>= 3 caràcters)
    if (cleanPass.length < 3) {
      return {
        success: false,
        reason: 'La contrasenya ha de tenir com a mínim 3 caràcters.',
        source: verifiedFromLiveSheet ? 'google_sheets_live' : 'google_sheets_synced',
      };
    }
  }

  return {
    success: true,
    user: {
      email: alumni.correu,
      name: alumni.nomCognoms,
      isMemberOfAlumniGroup: true,
      role: 'alumni',
    },
    alumniRecord: alumni,
    source: verifiedFromLiveSheet ? 'google_sheets_live' : 'google_sheets_synced',
  };
}
