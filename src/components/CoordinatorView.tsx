import React, { useState } from 'react';
import { JobOffer, OfficialAlumniEntry, AlumniRecord } from '../types';
import {
  Shield,
  FileSpreadsheet,
  Mail,
  Users,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  BookOpen,
  Send,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  KeyRound,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Code,
  Copy,
  Check,
} from 'lucide-react';
import {
  OFFICIAL_FORMS,
  OFFICIAL_EMAILS,
  OFFICIAL_REGISTRY_SAMPLE,
  doSectorsMatch,
  verifyAlumniAgainstRegistry,
  normalizeText
} from '../utils/jobData';
import {
  getStoredSheetConfig,
  saveStoredSheetConfig,
  syncAlumniFromGoogleSheet,
  authenticateAgainstGoogleSheet,
  importAlumniViaCsv,
  fetchServerAlumni,
  saveSheetConfig,
  testSheetWrite,
  GoogleSheetConfig,
  DEFAULT_SHEET_NAME,
} from '../utils/googleSheetsSync';
import {
  signInWithGoogleSheets,
  getCachedGoogleAccessToken,
  setCachedGoogleAccessToken,
  googleSignOut,
  initGoogleAuth,
} from '../utils/googleAuth';
import {
  readGoogleSheetData,
  appendAlumniToGoogleSheet,
  appendOfferToGoogleSheet,
} from '../utils/googleSheetsApi';

const APPS_SCRIPT_OFFICIAL_CODE = `/**
 * ITAEB Borsa de Treball - Script Complet i Unificat (100% Gratuït)
 * Associat al full de càlcul: "ITAEB Borsa de Treball"
 * Sense cap cost ni dependència de Google Cloud Platform (GCP)
 */

// --- CONFIGURACIÓ DE FULLS I CORREUS ---
const SPREADSHEET_ID = '1YsrfzmjYt7tgixvfkDfkWOgkRJEL1U9aIC50jpPcZtI';
const FULL_OFERTES = 'Ofertes';
const FULL_EXALUMNES = 'Exalumnes';
const FULL_LLISTAT = 'Llistat alumni ITAEB';
const CORREU_BORSA = 'BorsaTreball@itaeb.cat';   // Remitent dels correus
const CORREU_ADMIN = 'empresa@itaeb.cat';        // Destinatari dels avisos d'incidència

// Helper: obté el full actiu o l'obre per ID (permet que funcioni tant lligat al full com a projecte nou independent)
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
}

// --- 1. UTILITAT DE NORMALITZACIÓ DE TEXT ---
function normalitza(str) {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '') // treu accents (à, è, é...)
    .replace(/·/g, '') // normalitza punt volat català
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9\\s]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

function normalitzarText(str) {
  return normalitza(str);
}

// --- 2. ENVIAMENT D'OFERTES DE TREBALL PER CORREU ALS EXALUMNES ---
function comprovarOfertesNoves() {
  const ss = getSpreadsheet();
  const fullOfertes = ss.getSheetByName(FULL_OFERTES);
  const fullExalumnes = ss.getSheetByName(FULL_EXALUMNES);
  if (!fullOfertes || !fullExalumnes) return;

  const ofertes = fullOfertes.getDataRange().getValues();
  const exalumnes = fullExalumnes.getDataRange().getValues();

  for (let i = 1; i < ofertes.length; i++) {
    const oferta = ofertes[i];
    const notificat = oferta[12]; // Columna 13: Notificat

    if (notificat === 'SÍ') continue;

    const sectorsOferta = (oferta[10] || '').toString().split(',')
      .map(s => normalitza(s))
      .filter(s => s.length > 0);

    if (sectorsOferta.length === 0) continue;

    for (let j = 1; j < exalumnes.length; j++) {
      const exalumne = exalumnes[j];
      const correu = (exalumne[3] || '').toString().trim(); // Col D: Correu
      const nom = (exalumne[1] || '').toString().trim();     // Col B: Nom
      const notificacions = normalitza(exalumne[8] || exalumne[7] || '');

      if (!correu) continue;
      if (notificacions !== 'si' && notificacions !== 'sí') continue;

      const sectorsExalumne = (exalumne[7] || exalumne[6] || '').toString().split(',')
        .map(s => normalitza(s))
        .filter(s => s.length > 0);

      const coincideix = sectorsOferta.some(so =>
        sectorsExalumne.some(se => se === so || se.indexOf(so) !== -1 || so.indexOf(se) !== -1)
      );

      if (coincideix) {
        const sectorsCoincidents = sectorsOferta
          .filter(so => sectorsExalumne.some(se => se === so || se.indexOf(so) !== -1 || so.indexOf(se) !== -1))
          .join(', ');

        try {
          GmailApp.sendEmail(
            correu,
            'Nova oferta de treball - ITAEB',
            \`Hola \${nom},\\n\\n\` +
            \`T'informem que s'ha publicat una nova oferta de treball en el sector "\${sectorsCoincidents}" que pot interessar-te:\\n\\n\` +
            \`Empresa: \${oferta[0]}\\n\` +
            \`Lloc de treball: \${oferta[1]}\\n\` +
            \`Persona de contacte: \${oferta[2]}\\n\` +
            \`Descripció: \${oferta[3]}\\n\` +
            \`Requisits: \${oferta[4]}\\n\` +
            \`Tipus de contracte: \${oferta[5]}\\n\` +
            \`Data límit enviament de currículums: \${oferta[7]}\\n\` +
            \`Data d'inici: \${oferta[8]}\\n\` +
            \`Contacte: \${oferta[9]}\\n\\n\` +
            \`Accedeix a la borsa de treball de l'ITAEB per veure totes les ofertes disponibles.\\n\\n\` +
            \`Salutacions,\\nEquip ITAEB\`,
            { from: CORREU_BORSA }
          );
        } catch(err) {
          Logger.log('Error enviant correu a ' + correu + ': ' + err);
        }
      }
    }

    fullOfertes.getRange(i + 1, 13).setValue('SÍ');
  }
}

// Activador horari per comprovar ofertes cada hora
function configurarActivadorHorari() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'comprovarOfertesNoves') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('comprovarOfertesNoves')
    .timeBased()
    .everyHours(1)
    .create();
}

// --- 3. VERIFICACIÓ AUTOMÀTICA EN ENVIAR EL FORMULARI D'ALTA (Google Form) ---
function onFormSubmit(e) {
  var ss = getSpreadsheet();
  var sheetExalumnes = ss.getSheetByName(FULL_EXALUMNES);
  var sheetOficial = ss.getSheetByName(FULL_LLISTAT);
  if (!sheetExalumnes || !sheetOficial) return;

  var lastRow = sheetExalumnes.getLastRow();
  if (lastRow < 2) return;

  var nomAlumne = sheetExalumnes.getRange(lastRow, 2).getValue().toString().trim();
  var dniAlumne = sheetExalumnes.getRange(lastRow, 3).getValue().toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  var correuAlumne = sheetExalumnes.getRange(lastRow, 4).getValue().toString().trim().toLowerCase();
  var especialitatAlumne = normalitza(sheetExalumnes.getRange(lastRow, 7).getValue());

  if (!correuAlumne || !dniAlumne) return;

  var dadesOficials = sheetOficial.getDataRange().getValues();
  var esGraduat = false;
  var coincidenciaDNI = false;

  for (var i = 1; i < dadesOficials.length; i++) {
    var estudisOficials = normalitza(dadesOficials[i][0]);
    var dniOficial = (dadesOficials[i][2] + "").toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (dniOficial === dniAlumne && dniOficial.length > 5) {
      coincidenciaDNI = true;
      if (estudisOficials === especialitatAlumne ||
          estudisOficials.indexOf(especialitatAlumne) !== -1 ||
          especialitatAlumne.indexOf(estudisOficials) !== -1) {
        esGraduat = true;
        break;
      }
    }
  }

  var colVerificat = 10;
  if (esGraduat) {
    sheetExalumnes.getRange(lastRow, colVerificat).setValue("SÍ");

    try {
      if (typeof AdminDirectory !== 'undefined' && AdminDirectory.Members) {
        AdminDirectory.Members.insert({ email: correuAlumne, role: 'MEMBER' }, 'alumni@itaeb.cat');
      }
    } catch(err) {
      Logger.log("Avís afegint a alumni@itaeb.cat: " + err);
    }

    try {
      GmailApp.sendEmail(
        correuAlumne,
        'Benvingut/da a la Borsa de Treball ITAEB',
        \`Hola \${nomAlumne},\\n\\nJa formes part de la borsa de treball oficial de l'ITAEB com a exalumne verificat.\\n\\nAviat rebràs notificacions de noves ofertes de treball que s'adaptin als teus interessos.\\n\\nSalutacions,\\nEquip ITAEB\`,
        { from: CORREU_BORSA }
      );
    } catch(e) {
      Logger.log('Avís correu benvinguda: ' + e);
    }

  } else if (coincidenciaDNI) {
    sheetExalumnes.getRange(lastRow, colVerificat).setValue("PENDENT (Especialitat diferent)");
    try {
      GmailApp.sendEmail(
        CORREU_ADMIN,
        'Inscripció pendent de verificació - ITAEB',
        \`L'alumne \${nomAlumne} (\${correuAlumne}) ha quedat PENDENT de verificació.\\n\\nMotiu: Especialitat cursada no coincident.\\nDNI: \${dniAlumne}\\nEspecialitat: \${especialitatAlumne}\`,
        { from: CORREU_BORSA }
      );
    } catch(e) {}
  } else {
    sheetExalumnes.getRange(lastRow, colVerificat).setValue("PENDENT (DNI no trobat)");
    try {
      GmailApp.sendEmail(
        CORREU_ADMIN,
        'Inscripció pendent de verificació - ITAEB',
        \`L'alumne \${nomAlumne} (\${correuAlumne}) ha quedat PENDENT de verificació.\\n\\nMotiu: DNI no trobat al registre oficial.\\nDNI: \${dniAlumne}\`,
        { from: CORREU_BORSA }
      );
    } catch(e) {}
  }
}

// Configurar activador automàtic en enviar el formulari
function configurarActivadorExalumnes() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(getSpreadsheet())
    .onFormSubmit()
    .create();
}

// --- 4. WEBHOOK PER ACTUALITZAR PERFIL I CONTRASENYA DES DE LA WEB ---
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No s'han rebut dades POST."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'update_alumni';

    if (action === 'test' || action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Connexió amb Google Apps Script establerta amb èxit! El full té permís d'escriptura actiu."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'update_alumni') {
      var ss = getSpreadsheet();
      var targetSheetName = payload.sheetName || FULL_EXALUMNES;
      var sheet = ss.getSheetByName(targetSheetName);

      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "No s'ha trobat la fulla '" + targetSheetName + "' al full de càlcul."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var targetEmail = (payload.originalEmail || "").toString().trim().toLowerCase();
      if (!targetEmail) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "Falta el correu identificador de l'alumne."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var values = sheet.getDataRange().getValues();
      var emailCol = 3;

      if (values.length > 0) {
        var header = values[0];
        for (var h = 0; h < header.length; h++) {
          var colName = (header[h] + "").toLowerCase();
          if (colName.indexOf('correu') !== -1 && colName.indexOf('notificaci') === -1) {
            emailCol = h;
            break;
          }
        }
      }

      var rowIndex = -1;
      for (var i = 1; i < values.length; i++) {
        var rowEmail = (values[i][emailCol] + "").toString().trim().toLowerCase();
        if (rowEmail === targetEmail) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "No s'ha trobat cap alumne amb el correu " + targetEmail + " a la fulla " + targetSheetName
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var a = payload.alumni || {};
      if (a.nomCognoms !== undefined && a.nomCognoms !== null) sheet.getRange(rowIndex, 2).setValue(a.nomCognoms);
      if (a.dni !== undefined && a.dni !== null) sheet.getRange(rowIndex, 3).setValue(a.dni);
      if (a.correu !== undefined && a.correu !== null) sheet.getRange(rowIndex, 4).setValue(a.correu);
      if (a.contrasenya !== undefined && a.contrasenya !== null) sheet.getRange(rowIndex, 5).setValue(a.contrasenya);
      if (a.anyGraduacio !== undefined && a.anyGraduacio !== null) sheet.getRange(rowIndex, 6).setValue(a.anyGraduacio);
      if (a.especialitat !== undefined && a.especialitat !== null) sheet.getRange(rowIndex, 7).setValue(a.especialitat);
      if (a.sectorsInteres !== undefined && a.sectorsInteres !== null) {
        var sectorsStr = Array.isArray(a.sectorsInteres) ? a.sectorsInteres.join(", ") : a.sectorsInteres;
        sheet.getRange(rowIndex, 8).setValue(sectorsStr);
      }
      if (typeof a.notificacionsCorreu === "boolean") {
        sheet.getRange(rowIndex, 9).setValue(a.notificacionsCorreu ? "Sí" : "No");
      }

      // Columna 10 (J): "Verificat" ES MANTÉ INTACTA per seguretat oficial

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        row: rowIndex,
        message: "Fila " + rowIndex + " del full oficial actualitzada amb èxit a Google Drive."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Acció no reconeguda: " + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    status: "ok",
    message: "ITAEB Borsa de Treball Webhook actiu i preparat."
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

interface CoordinatorViewProps {
  offers: JobOffer[];
  onToggleOfferStatus: (id: string) => void;
  onAddOffer: (newOffer: JobOffer) => void;
  registeredAlumni?: AlumniRecord[];
  onRegisterAlumni?: (record: AlumniRecord) => void;
  onAlumniSynced?: (alumni: AlumniRecord[]) => void;
}

export const CoordinatorView: React.FC<CoordinatorViewProps> = ({
  offers,
  onToggleOfferStatus,
  onAddOffer,
  registeredAlumni = [],
  onRegisterAlumni,
  onAlumniSynced,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'gestio' | 'alumni' | 'simulador'>('manual');
  const [alumniSearch, setAlumniSearch] = useState('');

  // Google Sheets state
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(getStoredSheetConfig);
  const [sheetInputUrl, setSheetInputUrl] = useState(sheetConfig.spreadsheetUrlOrId || '');
  const [sheetInputTab, setSheetInputTab] = useState(sheetConfig.sheetName || DEFAULT_SHEET_NAME);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetFeedback, setSheetFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Quick test verification tool for coordinator
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    source?: string;
  } | null>(null);

  // Password visibility in table
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Direct CSV / Copy-Paste import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvFeedback, setCsvFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleImportCsv = async () => {
    if (!csvContent.trim()) {
      setCsvFeedback({ success: false, message: 'Enganxa les línies CSV o dades de les cel·les.' });
      return;
    }
    setIsImportingCsv(true);
    setCsvFeedback(null);
    try {
      const res = await importAlumniViaCsv(csvContent);
      setCsvFeedback({ success: res.success, message: res.message });
      if (res.success) {
        if (res.config) setSheetConfig(res.config);
        const updatedList = await fetchServerAlumni();
        if (onAlumniSynced && updatedList.length > 0) {
          onAlumniSynced(updatedList);
        }
        setCsvContent('');
      }
    } catch (e) {
      setCsvFeedback({
        success: false,
        message: e instanceof Error ? e.message : 'Error en importar el CSV',
      });
    } finally {
      setIsImportingCsv(false);
    }
  };

  // Apps Script Webhook state for Google Sheet 2-way writeback
  const [webhookUrlInput, setWebhookUrlInput] = useState(sheetConfig.appsScriptWebhookUrl || '');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [showAppsScriptCode, setShowAppsScriptCode] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleSaveWebhook = async () => {
    setIsSavingWebhook(true);
    setWebhookFeedback(null);
    try {
      const res = await saveSheetConfig({
        appsScriptWebhookUrl: webhookUrlInput.trim(),
        onlySaveConfig: true,
      });
      if (res.success) {
        setSheetConfig(prev => ({ ...prev, appsScriptWebhookUrl: webhookUrlInput.trim() }));
        setWebhookFeedback({
          success: true,
          message: "URL del Webhook de Google Apps Script desada correctament al servidor!",
        });
      } else {
        setWebhookFeedback({
          success: false,
          message: res.message || 'Error en desar el Webhook.',
        });
      }
    } catch (err) {
      setWebhookFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Error en desar el Webhook.',
      });
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleTestWebhook = async () => {
    const url = webhookUrlInput.trim() || sheetConfig.appsScriptWebhookUrl;
    if (!url) {
      setWebhookFeedback({
        success: false,
        message: "Enganxa primer l'URL del Webhook de Google Apps Script (que acaba en /exec).",
      });
      return;
    }
    setIsTestingWebhook(true);
    setWebhookFeedback(null);
    try {
      const res = await testSheetWrite(url);
      setWebhookFeedback({
        success: res.success,
        message: res.message,
      });
      if (res.success && url !== sheetConfig.appsScriptWebhookUrl) {
        await saveSheetConfig({
          appsScriptWebhookUrl: url,
          onlySaveConfig: true,
        });
        setSheetConfig(prev => ({ ...prev, appsScriptWebhookUrl: url }));
      }
    } catch (err) {
      setWebhookFeedback({
        success: false,
        message: err instanceof Error ? err.message : "Error durant el test d'escriptura.",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleCopyScript = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(APPS_SCRIPT_OFFICIAL_CODE);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    }
  };

  // Google Account & OAuth state
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string } | null>(null);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  // Initialize auth listener
  React.useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser({ email: user.email || 'tac@itaeb.cat', name: user.displayName || 'Coordinador ITAEB' });
        setCachedGoogleAccessToken(token);
        if (typeof window !== 'undefined') {
          (window as unknown as { __GOOGLE_ACCESS_TOKEN__?: string }).__GOOGLE_ACCESS_TOKEN__ = token;
        }
      },
      () => {
        setGoogleUser(null);
        setCachedGoogleAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    setIsSigningInGoogle(true);
    setGoogleAuthError(null);
    try {
      const res = await signInWithGoogleSheets();
      if (res) {
        setGoogleUser({ email: res.user.email || 'tac@itaeb.cat', name: res.user.displayName || 'Coordinador ITAEB' });
        setCachedGoogleAccessToken(res.accessToken);
        if (typeof window !== 'undefined') {
          (window as unknown as { __GOOGLE_ACCESS_TOKEN__?: string }).__GOOGLE_ACCESS_TOKEN__ = res.accessToken;
          localStorage.setItem('itaeb_google_access_token', res.accessToken);
        }
        // Persistir token al servidor per permetre actualització de files
        saveSheetConfig({
          coordinatorToken: res.accessToken,
          onlySaveConfig: true,
        }).catch(e => console.warn('Error guardant token al servidor:', e));

        setSheetFeedback({
          success: true,
          message: `Compte connectat (${res.user.email}). Ara la web té permís d'Edició al Google Sheets!`,
        });
        // Auto trigger sync with the authenticated token
        if (sheetInputUrl.trim()) {
          setTimeout(() => handleSyncGoogleSheet(), 200);
        }
      }
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setGoogleAuthError(msg);
      setSheetFeedback({
        success: false,
        message: `Error en iniciar sessió amb Google: ${msg}`,
      });
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setCachedGoogleAccessToken(null);
    if (typeof window !== 'undefined') {
      delete (window as unknown as { __GOOGLE_ACCESS_TOKEN__?: string }).__GOOGLE_ACCESS_TOKEN__;
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSyncGoogleSheet = async () => {
    if (!sheetInputUrl.trim()) {
      setSheetFeedback({
        success: false,
        message: "Enganxa l'enllaç o ID del Google Spreadsheet 'ITAEB Borsa de Treball'.",
      });
      return;
    }

    setIsSyncingSheet(true);
    setSheetFeedback(null);

    try {
      const res = await syncAlumniFromGoogleSheet(sheetInputUrl.trim(), sheetInputTab.trim() || DEFAULT_SHEET_NAME);
      setSheetConfig(res.config);

      if (res.success) {
        setSheetFeedback({
          success: true,
          message: res.message,
        });
        if (onAlumniSynced && res.alumni.length > 0) {
          onAlumniSynced(res.alumni);
        }
      } else {
        setSheetFeedback({
          success: false,
          message: res.message,
        });
      }
    } catch (err) {
      setSheetFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Error en sincronitzar amb Google Sheets',
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleTestAlumniVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingCredentials(true);
    setTestResult(null);

    try {
      const res = await authenticateAgainstGoogleSheet(testEmail, testPassword, registeredAlumni);
      setTestResult({
        tested: true,
        success: res.success,
        message: res.success
          ? `Verificació correcta! S'ha trobat l'alumne "${res.user?.name}" (${res.user?.email}) a la fulla "${sheetConfig.sheetName || 'Exalumnes'}".`
          : res.reason || 'Credencials no coincidents al full de càlcul.',
        source: res.source,
      });
    } catch (err) {
      setTestResult({
        tested: true,
        success: false,
        message: err instanceof Error ? err.message : 'Error durant el test',
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  // Simulator states
  const [simOfferSector, setSimOfferSector] = useState("Il·luminació per arts escèniques");
  const [simAlumniSectors, setSimAlumniSectors] = useState("il·luminacio d'espectacles, So en directe");
  const [simMatchResult, setSimMatchResult] = useState<boolean | null>(null);

  // New offer form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newReqs, setNewReqs] = useState('');
  const [newContract, setNewContract] = useState('Indefinit');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newSectors, setNewSectors] = useState('Sonorització per arts escèniques');
  const [newDeadline, setNewDeadline] = useState('30/11/2026');

  const handleTestMatch = () => {
    const match = doSectorsMatch(simAlumniSectors, simOfferSector);
    setSimMatchResult(match);
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newJobTitle.trim()) return;

    const offer: JobOffer = {
      id: `oft-${Date.now()}`,
      empresa: newCompany.trim(),
      llocTreball: newJobTitle.trim(),
      personaContacte: newContactPerson.trim(),
      descripcio: newDesc.trim(),
      requisits: newReqs.trim(),
      tipusContracte: newContract,
      dataAlta: new Date().toLocaleDateString('ca-ES'),
      dataLimitCV: newDeadline,
      dataInici: 'Immediata',
      contacte: newContactEmail.trim() || 'rrhh@empresa.com',
      sector: newSectors.split(',').map(s => s.trim()).filter(Boolean),
      estat: 'Oberta',
      notificat: 'SÍ',
      marcaTemps: new Date().toLocaleString('ca-ES'),
    };

    onAddOffer(offer);
    setShowAddModal(false);
    // Reset
    setNewCompany('');
    setNewJobTitle('');
    setNewDesc('');
    setNewReqs('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-700 tracking-wider uppercase">
              Àrea del Coordinador Digital
            </span>
            <span className="text-xs bg-slate-900 text-amber-300 font-mono px-2 py-0.5 rounded-full font-semibold">
              tac@itaeb.cat
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Manual de Gestió & Eines del Sistema
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Guia operativa completa per administrar la Borsa de Treball de l'ITAEB sense cost ni intermediaris.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manual del Coordinador</span>
          </button>

          <button
            onClick={() => setActiveTab('gestio')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gestio'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Gestió d'Ofertes ({offers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alumni')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'alumni'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Exalumnes ({registeredAlumni.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('simulador')}
            className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulador'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulador de Regles</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Complete Official Manual */}
      {activeTab === 'manual' && (
        <div className="space-y-10">
          {/* Section 1: Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <span>Secció 1</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              1. Visió general del sistema
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              La Borsa de Treball de l'ITAEB connecta els exalumnes de l'Institut de Tècniques Audiovisuals i de l'Espectacle de Barcelona amb empreses del sector audiovisual i de l'espectacle. Està construïda íntegrament sobre eines que no tenen cap cost econòmic.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">1. Lloc web</span>
                <p className="text-xs text-slate-600">El portal que veuen els exalumnes verificats i on es publiquen les ofertes.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">2. Google Sheets</span>
                <p className="text-xs text-slate-600">Base de dades central amb 3 fulls: Ofertes, Exalumnes i Llistat Alumni ITAEB.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-900 block mb-1">3. Google Forms</span>
                <p className="text-xs text-slate-600">Formularis públics d'inscripció d'exalumnes i d'alta d'ofertes per a empreses.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Accounts & Emails */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <span>Secció 2</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              2. Comptes i correus del sistema
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Abans de fer qualsevol canvi, cal conèixer els comptes i correus que utilitza el sistema:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-800 font-bold">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Compte / Correu</th>
                    <th className="p-3 border-b border-slate-200">Funció exacta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-mono font-bold text-sky-700">{OFFICIAL_EMAILS.admin}</td>
                    <td className="p-3 text-slate-700">Compte administrador del lloc web i gestió del full "ITAEB Borsa de Treball"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-amber-700">{OFFICIAL_EMAILS.aliesRemitent}</td>
                    <td className="p-3 text-slate-700">Àlies remitent de tots els correus automàtics (benvingudes i ofertes)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-700">{OFFICIAL_EMAILS.avisosAdmin}</td>
                    <td className="p-3 text-slate-700">Destinatari dels avisos d'administrador i incidències de verificació</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-indigo-700">{OFFICIAL_EMAILS.grupGoogleAccés}</td>
                    <td className="p-3 text-slate-700">Grup de Google que dona accés exclusiu al lloc web i la borsa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Google Sheets structure */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <span>Secció 4</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              4. Estructura de la Base de Dades (Google Sheets)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Fitxer: <strong>"ITAEB Borsa de Treball"</strong> administrat per <code className="text-sky-700 font-semibold">{OFFICIAL_EMAILS.admin}</code>. Té 3 fulls:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 mb-2">
                  Full 1: "Ofertes" (15 columnes)
                </h3>
                <div className="text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>0: Empresa</div>
                  <div>1: Lloc de treball</div>
                  <div>2: Persona de contacte</div>
                  <div>3: Descripció</div>
                  <div>4: Requisits</div>
                  <div>5: Tipus de contracte</div>
                  <div>6: Data d'alta</div>
                  <div>7: Data límit CV</div>
                  <div>8: Data Inici</div>
                  <div>9: Contacte</div>
                  <div>10: Sector (separat per comes)</div>
                  <div>11: Estat ("Oberta" / "Tancada")</div>
                  <div>12: Notificat ("SÍ" o buit)</div>
                  <div>13: Alumni (ús intern)</div>
                  <div>14: Marca de temps</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 mb-2">
                  Full 2: "Exalumnes" (Columnes oficials del formulari)
                </h3>
                <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>0: <strong>Marca de temps</strong> (Data i hora)</div>
                  <div>1: <strong>Nom i cognoms</strong></div>
                  <div>2: <strong>Número de DNI o document</strong> (per validar)</div>
                  <div>3: <strong>Correu electrònic</strong> (personal, NO @itaeb.cat)</div>
                  <div>4: <strong>Contrasenya</strong> (per iniciar sessió a la web)</div>
                  <div>5: <strong>Any de graduació</strong></div>
                  <div>6: <strong>Especialitat cursada</strong></div>
                  <div>7: <strong>Sectors d'interès</strong> (11 sectors, per alertes)</div>
                  <div>8: <strong>Notificacions per correu</strong> (Sí / No)</div>
                </div>
                <div className="mt-3 text-[11px] text-sky-800 bg-sky-50 p-2 rounded-lg border border-sky-200">
                  Nota: El correu afegit és personal (no @itaeb.cat perquè el compte institucional d'alumne es dona de baixa). Quan es verifica l'alta, aquest correu s'afegeix directament al grup de Google Workspace <strong>alumni@itaeb.cat</strong>.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 mb-2">
                  Full 3: "Llistat alumni ITAEB" (Registre oficial per verificar)
                </h3>
                <div className="text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>0: Estudis</div>
                  <div>1: IDALU</div>
                  <div>2: DNI</div>
                  <div>3: Cognoms</div>
                  <div>4: Nom</div>
                </div>
              </div>
            </div>

            {/* How to publish / close offers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-900 block mb-1">Per publicar una nova oferta:</span>
                <ol className="list-decimal list-inside text-slate-700 space-y-1">
                  <li>S'afegeix una fila nova al full "Ofertes".</li>
                  <li>S'omplen tots els camps.</li>
                  <li>Poseu "Oberta" al camp Estat.</li>
                  <li>Deixeu el camp Notificat BUIT (el sistema l'omplirà).</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="font-bold text-rose-900 block mb-1">Per tancar una oferta coberta:</span>
                <ol className="list-decimal list-inside text-slate-700 space-y-1">
                  <li>Localitzeu l'oferta al full "Ofertes".</li>
                  <li>Canvieu el camp Estat de "Oberta" a "Tancada".</li>
                  <li>L'oferta desapareixerà automàticament de la web.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Section 5: Alta d'exalumnes & Automatització Google Apps Script */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <span>Secció 5</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              5. Automatització de Verificació i Alta al Grup alumni@itaeb.cat
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Perquè el formulari de Google <strong>(1X1MzJa2RjFkcsPZS8BHRZHV1vBvxxaA54fwE4aMW8I0)</strong> validi automàticament els requisits i afegeixi els graduats aprovats directament al grup de Google Workspace <strong>alumni@itaeb.cat</strong>:
            </p>

            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-2">
              <span className="font-bold block text-sm text-sky-900">Com funciona l'Opció B (Columna Verificat):</span>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>
                  Al vostre full de càlcul <strong>"Exalumnes"</strong> afegiu la columna <strong>"Verificat"</strong> (o Estat).
                </li>
                <li>
                  Quan un usuari entra a la web amb el seu correu i contrasenya, <strong>la web només li permet l'accés si el camp Verificat és "SÍ"</strong>. Si està buit o "NO", la web li indica que la seva sol·licitud està pendent de validació.
                </li>
              </ul>
            </div>

            {/* Apps Script to automate it */}
            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs space-y-3 font-mono">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-amber-400 font-sans">Script d'automatització automàtica (Google Apps Script):</span>
                <span>Extensions → Apps Script</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-normal">
                Copieu aquest codi al full de càlcul a <em>Extensions → Apps Script</em> amb un activador <em>"Al enviar el formulari" (onFormSubmit)</em>:
              </p>
              <pre className="p-3 bg-slate-950 rounded-lg overflow-x-auto text-[11px] text-emerald-300">
{`function normalitzarText(str) {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '') // treu accents (à, è, é...)
    .replace(/·/g, '') // normalitza punt volat català
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9\\s]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

function onFormSubmit(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetExalumnes = ss.getSheetByName("Exalumnes");
  var sheetOficial = ss.getSheetByName("Llistat alumni ITAEB");
  
  var lastRow = sheetExalumnes.getLastRow();
  // DNI (columna C / 3), correu (columna D / 4) i Especialitat (columna G / 7)
  var dniAlumne = sheetExalumnes.getRange(lastRow, 3).getValue().toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  var correuAlumne = sheetExalumnes.getRange(lastRow, 4).getValue().toString().trim().toLowerCase();
  var especialitatAlumne = normalitzarText(sheetExalumnes.getRange(lastRow, 7).getValue());
  
  // 1. Cercar si el DNI i l'Especialitat coincideixen al registre oficial de graduats
  var dadesOficials = sheetOficial.getDataRange().getValues();
  var esGraduat = false;
  var coincidenciaDNI = false;
  
  for (var i = 1; i < dadesOficials.length; i++) {
    // Columna A (0): Estudis/Especialitat oficial | Columna C (2): DNI oficial
    var estudisOficials = normalitzarText(dadesOficials[i][0]);
    var dniOficial = dadesOficials[i][2].toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (dniOficial === dniAlumne && dniOficial.length > 5) {
      coincidenciaDNI = true;
      // Comprovar si coincideix l'especialitat cursada (subcadena o exacta)
      if (estudisOficials === especialitatAlumne || 
          estudisOficials.indexOf(especialitatAlumne) !== -1 || 
          especialitatAlumne.indexOf(estudisOficials) !== -1) {
        esGraduat = true;
        break;
      }
    }
  }
  
  // 2. Columna 10 (J): "Verificat"
  var colVerificat = 10;
  if (esGraduat) {
    // DNI i Especialitat correctes -> "SÍ" i alta automàtica al grup
    sheetExalumnes.getRange(lastRow, colVerificat).setValue("SÍ");
    
    try {
      if (typeof AdminDirectory !== 'undefined' && AdminDirectory.Members) {
        AdminDirectory.Members.insert({
          email: correuAlumne,
          role: "MEMBER"
        }, "alumni@itaeb.cat");
      }
    } catch(err) {
      Logger.log("Avís al grup Workspace: " + err);
    }
  } else if (coincidenciaDNI) {
    // El DNI és vàlid però l'especialitat no coincideix exactament
    sheetExalumnes.getRange(lastRow, colVerificat).setValue("PENDENT (Especialitat diferent)");
  } else {
    // El DNI no consta al registre oficial
    sheetExalumnes.getRange(lastRow, colVerificat).setValue("PENDENT (DNI no trobat)");
  }
}`}
              </pre>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong>Procediment manual alternatiu a admin.google.com:</strong>
              <ol className="list-decimal list-inside space-y-1 mt-1 text-slate-700">
                <li>Aneu a <code className="font-bold">admin.google.com</code> → Directori → Grups → <strong>alumni@itaeb.cat</strong>.</li>
                <li>Cliqueu <em>"Afegir membres"</em> i poseu el correu de l'exalumne validat.</li>
                <li>Al full de càlcul, poseu <strong>"SÍ"</strong> a la columna Verificat de la seva fila.</li>
              </ol>
            </div>
          </div>

          {/* Section 7: Email Flows */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <span>Secció 7</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              7. Fluxos de correu del sistema
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Tots els correus surten des de <code className="text-sky-800 font-bold">{OFFICIAL_EMAILS.aliesRemitent}</code>:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-800 font-bold">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Correu</th>
                    <th className="p-3 border-b border-slate-200">Destinatari</th>
                    <th className="p-3 border-b border-slate-200">Quan s'envia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Benvinguda a la borsa</td>
                    <td className="p-3">Exalumne</td>
                    <td className="p-3">Quan es verifica correctament en inscriure's</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Nova oferta de treball</td>
                    <td className="p-3">Exalumnes amb sectors coincidents</td>
                    <td className="p-3">Cada hora, si hi ha ofertes noves sense notificar</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Inscripció no verificada</td>
                    <td className="p-3">{OFFICIAL_EMAILS.avisosAdmin}</td>
                    <td className="p-3">Quan un exalumne no es pot verificar automàticament</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Error tècnic</td>
                    <td className="p-3">{OFFICIAL_EMAILS.avisosAdmin}</td>
                    <td className="p-3">Si hi ha algun problema tècnic amb el sistema</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Recordatori de perfil pendent</td>
                    <td className="p-3">Exalumne</td>
                    <td className="p-3">24 hores després del registre sense informació completa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Offers (Open / Close & Add test offers) */}
      {activeTab === 'gestio' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Control d'Estat d'Ofertes (Full "Ofertes")
              </h3>
              <p className="text-xs text-slate-600">
                Segons el manual, quan es canvia l'estat d'Oberta a Tancada, l'oferta desapareix automàticament de la vista pública dels alumni.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar Oferta de Prova</span>
            </button>
          </div>

          {/* Table of offers */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Empresa & Lloc</th>
                    <th className="p-3.5">Data Alta</th>
                    <th className="p-3.5">Límit CV</th>
                    <th className="p-3.5">Sectors</th>
                    <th className="p-3.5">Notificat</th>
                    <th className="p-3.5">Estat actual</th>
                    <th className="p-3.5 text-right">Acció</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {offers.map(offer => {
                    const isOpen = offer.estat === 'Oberta';
                    return (
                      <tr key={offer.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{offer.llocTreball}</div>
                          <div className="text-slate-500 text-[11px]">{offer.empresa}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">{offer.dataAlta}</td>
                        <td className="p-3.5 whitespace-nowrap text-amber-800 font-medium">
                          {offer.dataLimitCV || '-'}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {offer.sector.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              offer.notificat === 'SÍ'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {offer.notificat || 'Pendent'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              isOpen
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isOpen ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{offer.estat}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => onToggleOfferStatus(offer.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              isOpen
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {isOpen ? 'Tancar oferta' : 'Reobrir oferta'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Llistat d'Exalumnes Donats d'Alta & Sincronització Google Sheets */}
      {activeTab === 'alumni' && (
        <div className="space-y-6">
          {/* Card 1: Google Sheets Direct Connection */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Sincronització amb Google Sheets: "ITAEB Borsa de Treball"
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aquest full de càlcul és la font oficial per verificar el correu i la contrasenya dels alumnes que volen accedir a la web.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                    sheetConfig.lastSyncStatus === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sheetConfig.lastSyncStatus === 'error'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {sheetConfig.lastSyncStatus === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : sheetConfig.lastSyncStatus === 'error' ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {sheetConfig.lastSyncStatus === 'success'
                      ? `Connectat (${sheetConfig.totalAlumniInSheet} alumnes)`
                      : sheetConfig.lastSyncStatus === 'error'
                      ? 'Error de sincronització'
                      : 'Pendent de connectar'}
                  </span>
                </span>
              </div>
            </div>

            {/* Google Account Authorization Banner (Permís d'Edició Oficial) */}
            <div className={`p-4 rounded-2xl border transition-all ${googleUser ? 'bg-emerald-50/70 border-emerald-300' : 'bg-sky-50/80 border-sky-300'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-sky-700" />
                      <span>Permís d'Edició Google Sheets (API oficial)</span>
                    </span>
                    {googleUser ? (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Autoritzat com {googleUser.email}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        Requereix autorització
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {googleUser
                      ? "Aquest navegador té una sessió activa de Google amb permís d'Edició i Lectura. El servidor pot sincronitzar el full encara que sigui privat i afegir-hi nous registres en temps real."
                      : "Perquè la web tingui permís d'Edició directe al vostre Google Sheet sense fer-lo públic, inicieu sessió amb el compte de coordinació de l'ITAEB (tac@itaeb.cat)."}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {googleUser ? (
                    <button
                      type="button"
                      onClick={handleGoogleDisconnect}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs text-slate-700 font-semibold transition cursor-pointer"
                    >
                      Desconnectar compte
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSigningInGoogle}
                      onClick={handleSignInWithGoogle}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>{isSigningInGoogle ? 'Autoritzant...' : "Donar permís amb Google (tac@itaeb.cat)"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Inputs for Spreadsheet URL & Tab name */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-7">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enllaç o ID del Google Spreadsheet ("ITAEB Borsa de Treball"):
                </label>
                <input
                  type="text"
                  value={sheetInputUrl}
                  onChange={e => setSheetInputUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit"
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pestanya / Fulla a verificar:
                </label>
                <input
                  type="text"
                  value={sheetInputTab}
                  onChange={e => setSheetInputTab(e.target.value)}
                  placeholder="Exalumnes"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <div className="lg:col-span-2">
                <button
                  type="button"
                  disabled={isSyncingSheet}
                  onClick={handleSyncGoogleSheet}
                  className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSheet ? 'Sincronitzant...' : 'Sincronitzar'}</span>
                </button>
              </div>
            </div>

            {sheetFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  sheetFeedback.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                {sheetFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{sheetFeedback.message}</span>
              </div>
            )}

            {/* Step-by-step instructions */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <span className="font-bold text-slate-800 block">
                Com preparar el full de Google Drive per permetre la verificació:
              </span>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Obre el full de càlcul <strong>"ITAEB Borsa de Treball"</strong> a Google Drive amb el compte <code className="font-bold text-sky-800">tac@itaeb.cat</code>.
                </li>
                <li>
                  Clica al botó blau <strong>"Comparteix"</strong> (a dalt a la dreta) i canvia "Accés general" a: <code className="font-semibold text-slate-900">Qualsevol persona amb l'enllaç</code> (amb rol de Lector).
                </li>
                <li>
                  Copia l'enllaç del navegador o de la finestra de compartir i enganxa'l a la casella superior.
                </li>
                <li>
                  Quan qualsevol alumne donat d'alta introdueixi el seu correu electrònic personal i la contrasenya, la web verificarà directament les files de la fulla <strong>Exalumnes</strong>.
                </li>
              </ol>
            </div>

            {/* Alternativa: Importació directa per CSV / Copiar-Enganxar cel·les */}
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCsvImport(!showCsvImport)}
                className="text-xs font-semibold text-sky-700 hover:text-sky-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>
                  {showCsvImport
                    ? 'Amagar importació directa per CSV'
                    : 'Alternativa: Copiar i enganxar directament les dades del full (CSV)'}
                </span>
              </button>

              {showCsvImport && (
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="text-xs text-slate-700">
                    <span className="font-bold block mb-1">Enganxa les dades del full de càlcul:</span>
                    <span>
                      Pots descarregar el full des de Google Drive (<em>Fitxer → Baixa → Valors separats per comes .csv</em>) o seleccionar totes les cel·les de la fulla <strong>Exalumnes</strong>, copiar-les i enganxar-les aquí:
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={csvContent}
                    onChange={e => setCsvContent(e.target.value)}
                    placeholder="Marca de temps,Nom i cognoms,DNI,Correu electrònic,Contrasenya,Any de graduació..."
                    className="w-full p-2.5 text-xs font-mono rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  {csvFeedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        csvFeedback.success
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}
                    >
                      {csvFeedback.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      )}
                      <span>{csvFeedback.message}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isImportingCsv || !csvContent.trim()}
                      onClick={handleImportCsv}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isImportingCsv ? 'animate-spin' : ''}`} />
                      <span>{isImportingCsv ? 'Important...' : 'Carregar al servidor per a tothom'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card: Google Apps Script Webhook per a Escriptura Directa al Full */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>Escriptura en Temps Real al Full (Google Apps Script Webhook)</span>
                    {sheetConfig.appsScriptWebhookUrl ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Actiu
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Pendent de configurar
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Permet que els canvis de contrasenya i perfil que fan els alumni a la web s'escriguin directament a la seva fila del Google Spreadsheet "ITAEB Borsa de Treball" (Drive).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAppsScriptCode(!showAppsScriptCode)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <Code className="w-3.5 h-3.5 text-sky-700" />
                <span>{showAppsScriptCode ? 'Amagar codi de l’script' : 'Veure codi de l’script'}</span>
              </button>
            </div>

            {/* Input per a la URL del Webhook */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                URL de l'aplicació web (Google Apps Script Webhook URL):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={webhookUrlInput}
                  onChange={e => setWebhookUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
                <button
                  type="button"
                  disabled={isSavingWebhook}
                  onClick={handleSaveWebhook}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>{isSavingWebhook ? 'Desant...' : 'Desar URL'}</span>
                </button>
                <button
                  type="button"
                  disabled={isTestingWebhook || (!webhookUrlInput.trim() && !sheetConfig.appsScriptWebhookUrl)}
                  onClick={handleTestWebhook}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-spin' : ''}`} />
                  <span>{isTestingWebhook ? 'Comprovant...' : 'Provar escriptura'}</span>
                </button>
              </div>
            </div>

            {webhookFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  webhookFeedback.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                {webhookFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{webhookFeedback.message}</span>
              </div>
            )}

            {/* Guia desplegable de Google Apps Script */}
            {showAppsScriptCode && (
              <div className="mt-4 p-5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="font-bold text-sm text-amber-400 block">
                      Instruccions per desplegar el Webhook a Google Sheets (1 minut)
                    </span>
                    <span className="text-xs text-slate-400">
                      Codi oficial per a sincronització bidireccional i verificació automàtica del formulari.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Codi copiat!' : 'Copiar codi complet'}</span>
                  </button>
                </div>

                <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 leading-relaxed">
                  <li>
                    Obre el full de càlcul <strong>"ITAEB Borsa de Treball"</strong> a Google Drive amb el compte <code className="text-amber-300">tac@itaeb.cat</code>.
                  </li>
                  <li>
                    Ves al menú superior: <strong>Extensions</strong> → <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Esborra qualsevol codi antic existent i enganxa el codi que hi ha a sota (clica el botó "Copiar codi complet").
                  </li>
                  <li>
                    <strong className="text-amber-300">MOLT IMPORTANT:</strong> Clica a la icona del disquet <strong>"Desa"</strong> (o prem <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Ctrl + S</kbd>) per desar el fitxer de codi.
                  </li>
                  <li>
                    Clica a dalt a la dreta al botó blau: <strong>Implementa</strong> (Deploy) → <strong>Implementació nova</strong>.
                  </li>
                  <li>
                    Fes clic a la icona d'engranatge ⚙️ (al costat de "Selecciona el tipus") i tria: <strong>Aplicació web</strong> (Web app).
                  </li>
                  <li>
                    A <em>"Descripció"</em>: escriu <code className="text-emerald-400">v1</code>. A <em>"Executa com a"</em>: tria <strong>Jo (tac@itaeb.cat)</strong>.
                  </li>
                  <li>
                    A <em>"Qui hi té accés"</em>: tria <strong>Qualsevol persona</strong> (Anyone).
                    <span className="block text-[11px] text-amber-200 mt-0.5 ml-4">
                      * Nota de domini: Si l'administrador de Google Workspace d'ITAEB no permet "Qualsevol persona", tria <strong>"Qualsevol persona de l'organització ITAEB"</strong>.
                    </span>
                  </li>
                  <li>
                    Clica al botó blau <strong>Implementa</strong>:
                    <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-700 mt-1.5 ml-4 space-y-1 text-[11px] text-slate-200">
                      <strong className="text-amber-300 block">Com passar la pantalla d'autorització de Google:</strong>
                      <p>1. Clica a <strong>"Autoritza l'accés"</strong> i selecciona el teu compte <code className="text-sky-300">tac@itaeb.cat</code>.</p>
                      <p>2. Si Google mostra un avís en vermell que diu <em>"Google no ha verificat aquesta aplicació"</em>, <strong>NO és un error</strong> (és l'avís de seguretat estàndard per a scripts propis).</p>
                      <p>3. Clica a l'enllaç petit de sota: <strong>"Avançat"</strong> (o <em>"Configuració avançada"</em> / <em>Advanced</em>).</p>
                      <p>4. Clica a <strong>"Vés a ITAEB Borsa de Treball (no segur)"</strong>.</p>
                      <p>5. Clica al botó <strong>"Permet"</strong> (Allow).</p>
                    </div>
                  </li>
                  <li>
                    Copia l'<strong>URL de l'aplicació web</strong> generada (acaba en <code className="text-emerald-400">/exec</code>), enganxa-la a la casella de dalt i clica <strong>"Desar URL"</strong> i després <strong>"Provar escriptura"</strong>.
                  </li>
                </ol>

                <div className="relative">
                  <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-[11px] font-mono text-emerald-300 border border-slate-800 max-h-72">
                    {APPS_SCRIPT_OFFICIAL_CODE}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Interactive Credential Tester for Coordinator */}
          <div className="bg-sky-50/60 p-6 rounded-3xl border border-sky-200 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-700" />
              <h3 className="font-bold text-slate-900 text-base">
                Simulador de Verificació d'Alumne al Full de Càlcul
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Pots comprovar si les credencials d'un alumne registrat seran validades pel sistema:
            </p>

            <form onSubmit={handleTestAlumniVerification} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correu personal de l'alumne:
                </label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="nom.cognom@gmail.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contrasenya:
                </label>
                <input
                  type="text"
                  required
                  value={testPassword}
                  onChange={e => setTestPassword(e.target.value)}
                  placeholder="Contrasenya"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={isTestingCredentials}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isTestingCredentials ? 'Verificant...' : 'Provar accés'}</span>
                </button>
              </div>
            </form>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-100/80 border border-emerald-300 text-emerald-950'
                    : 'bg-rose-100/80 border border-rose-300 text-rose-950'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-bold">{testResult.success ? 'Accés permès' : 'Accés denegat'}</div>
                  <div>{testResult.message}</div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Header of Alumni List & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">
                  Llistat d'Exalumnes ({registeredAlumni.length})
                </h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  Fulla "Exalumnes"
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Aquestes són les dades registrades amb el correu personal i la contrasenya d'accés a la borsa.
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={alumniSearch}
                onChange={e => setAlumniSearch(e.target.value)}
                placeholder="Cercar per correu, nom o DNI..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nom i Cognoms</th>
                    <th className="p-3.5">Correu Personal (Usuari)</th>
                    <th className="p-3.5">Contrasenya</th>
                    <th className="p-3.5">DNI</th>
                    <th className="p-3.5">Especialitat & Promoció</th>
                    <th className="p-3.5">Sectors d'Interès</th>
                    <th className="p-3.5">Estat Accés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {registeredAlumni
                    .filter(a => {
                      if (!alumniSearch.trim()) return true;
                      const q = alumniSearch.toLowerCase();
                      return (
                        a.nomCognoms.toLowerCase().includes(q) ||
                        a.correu.toLowerCase().includes(q) ||
                        a.dni.toLowerCase().includes(q)
                      );
                    })
                    .map(alumni => {
                      const isPassVisible = visiblePasswords[alumni.id] || false;
                      return (
                        <tr key={alumni.id} className="hover:bg-slate-50/70">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">
                              {alumni.nomCognoms}
                            </div>
                            <div className="text-[10px] text-slate-400">Data registre: {alumni.marcaTemps}</div>
                          </td>
                          <td className="p-3.5 font-mono font-medium text-slate-800">
                            {alumni.correu}
                          </td>
                          <td className="p-3.5 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                {isPassVisible ? alumni.contrasenya || '(Buit)' : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(alumni.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                                title={isPassVisible ? 'Amagar contrasenya' : 'Mostrar contrasenya'}
                              >
                                {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">
                            {alumni.dni}
                          </td>
                          <td className="p-3.5">
                            <div className="text-slate-800 font-medium">{alumni.especialitat}</div>
                            <div className="text-slate-500 text-[11px]">Promoció {alumni.anyGraduacio}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {alumni.sectorsInteres.map((s, idx) => (
                                <span key={idx} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5">
                            {alumni.verificat ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verificat (Accés actiu)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Pendent de verificació</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Match & Verification Simulator */}
      {activeTab === 'simulador' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sector matcher tester */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Simulador de Coincidència de Sectors</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Comprova la regla d'accents i majúscules
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              El manual estableix que la comparació de sectors ignora majúscules, minúscules i accents. Per exemple, <em>"Il·luminació d'espectacles"</em> i <em>"il·luminacio d'espectacles"</em> són idèntics.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sector de l'oferta nova (Full "Ofertes"):
                </label>
                <input
                  type="text"
                  value={simOfferSector}
                  onChange={e => setSimOfferSector(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sectors d'interès de l'exalumne (separats per comes):
                </label>
                <input
                  type="text"
                  value={simAlumniSectors}
                  onChange={e => setSimAlumniSectors(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                onClick={handleTestMatch}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Comprovar si coincideix i envia correu
              </button>

              {simMatchResult !== null && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                    simMatchResult
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {simMatchResult ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {simMatchResult
                      ? "COINCIDÈNCIA DETECTADA! El sistema enviaria el correu automàtic d'avís d'oferta a aquest alumni des de BorsaTreball@itaeb.cat."
                      : "SENSE COINCIDÈNCIA. L'exalumne no rebrà notificació d'aquesta oferta."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Official Registry Reference Sample */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Full "Llistat alumni ITAEB"</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Alumnes Oficials de Prova Registrats
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Registre oficial utilitzat pel sistema automàtic per verificar nous exalumnes que omplen el formulari d'alta:
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {OFFICIAL_REGISTRY_SAMPLE.map((alumni, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900">
                      {alumni.nom} {alumni.cognoms}
                    </span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-sky-700">
                      {alumni.dni}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px]">{alumni.estudis}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Expedient: {alumni.idalu}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal to add test offer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                Afegir Nova Oferta al Google Sheet "Ofertes"
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Empresa</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="Ex: Teatre Nacional de Catalunya"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lloc de treball</label>
                <input
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={e => setNewJobTitle(e.target.value)}
                  placeholder="Ex: Tècnic/a de so i microfonia"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Persona de contacte</label>
                <input
                  type="text"
                  value={newContactPerson}
                  onChange={e => setNewContactPerson(e.target.value)}
                  placeholder="Ex: Joan Ribas"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripció</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Detall de les funcions del lloc..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requisits</label>
                <textarea
                  rows={2}
                  value={newReqs}
                  onChange={e => setNewReqs(e.target.value)}
                  placeholder="Requisits tècnics i formatius..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipus de contracte</label>
                  <input
                    type="text"
                    value={newContract}
                    onChange={e => setNewContract(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data límit CV</label>
                  <input
                    type="text"
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sectors (separats per comes)</label>
                <input
                  type="text"
                  value={newSectors}
                  onChange={e => setNewSectors(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correu / Contacte per a CV</label>
                <input
                  type="text"
                  value={newContactEmail}
                  onChange={e => setNewContactEmail(e.target.value)}
                  placeholder="borsa@teatrenacional.cat"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold"
                >
                  Publicar oferta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
