import { JobOffer, OfficialAlumniEntry, AlumniRecord } from '../types';

/**
 * Normalitza cadenes de text per comparar sectors (ignora majúscules, minúscules, accents, caràcters especials).
 * "Il·luminació d'espectacles" == "il·luminacio d'espectacles"
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // treu accents
    .replace(/·/g, '') // normalitza punt volat català
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Comprova si dos sectors o llistes de sectors coincideixen segons les regles de l'ITAEB.
 */
export function doSectorsMatch(alumniSectors: string[] | string, offerSectors: string[] | string): boolean {
  const normAlumni = (Array.isArray(alumniSectors) ? alumniSectors : alumniSectors.split(','))
    .map(s => normalizeText(s))
    .filter(Boolean);

  const normOffer = (Array.isArray(offerSectors) ? offerSectors : offerSectors.split(','))
    .map(s => normalizeText(s))
    .filter(Boolean);

  return normAlumni.some(aS => {
    return normOffer.some(oS => {
      // Coincidència exacta normalitzada o subcadena rellevant
      return aS === oS || aS.includes(oS) || oS.includes(aS);
    });
  });
}

/**
 * Normalitza el DNI (sense espais, sense guions, en majúscules).
 */
export function normalizeDNI(dni: string): string {
  if (!dni) return '';
  return dni.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

/**
 * Comprova si un DNI i una Especialitat coincideixen amb el registre oficial "Llistat alumni ITAEB".
 */
export function verifyAlumniAgainstRegistry(
  dni: string,
  especialitat: string,
  registry: OfficialAlumniEntry[]
): { verified: boolean; match?: OfficialAlumniEntry; reason?: string } {
  const cleanDNI = normalizeDNI(dni);
  const cleanSpec = normalizeText(especialitat);

  if (!cleanDNI) {
    return { verified: false, reason: 'DNI no indicat' };
  }

  // 1. Cercar per DNI
  const entriesWithDNI = registry.filter(e => normalizeDNI(e.dni) === cleanDNI);

  if (entriesWithDNI.length === 0) {
    return {
      verified: false,
      reason: "El DNI no consta al Llistat oficial d'alumni de l'ITAEB. Pot ser d'una promoció antiga o requereix revisió per empresa@itaeb.cat.",
    };
  }

  // 2. Comprovar si coincideix l'especialitat
  const exactMatch = entriesWithDNI.find(e => {
    const registrySpec = normalizeText(e.estudis);
    return registrySpec === cleanSpec || registrySpec.includes(cleanSpec) || cleanSpec.includes(registrySpec);
  });

  if (exactMatch) {
    return { verified: true, match: exactMatch };
  }

  return {
    verified: false,
    reason: `S'ha trobat l'alumne pel DNI però l'especialitat cursada no coincideix exactament amb el registre oficial (${entriesWithDNI[0].estudis}). Cal verificació manual a empresa@itaeb.cat.`,
  };
}

export const ALUMNI_FORM_SECTORS: string[] = [
  "Il·luminació per arts escèniques",
  "Sonorització per arts escèniques",
  "Maquinària escènica",
  "Producció d’audiovisuals i espectacles",
  "Realització d’audiovisuals i espectacles",
  "Postproducció",
  "Motion Graphics",
  "Muntatge d’esdeveniments",
  "Vídeo Discjòquei",
  "Interpretació",
  "Creació de continguts",
];

export const INITIAL_REGISTERED_ALUMNI: AlumniRecord[] = [
  {
    id: 'alu-001',
    marcaTemps: '15/07/2026 10:14:22',
    nomCognoms: 'Marc Martínez Soler',
    dni: '47812903K',
    correu: 'marc.martinez@gmail.com',
    contrasenya: 'itaeb2024',
    anyGraduacio: '2024',
    especialitat: "Il·luminació, captació i tractament d'imatge",
    sectorsInteres: ["Il·luminació per arts escèniques", "Muntatge d’esdeveniments"],
    notificacionsCorreu: true,
    verificat: true,
  },
  {
    id: 'alu-002',
    marcaTemps: '20/07/2026 12:30:15',
    nomCognoms: 'Laura Vila Garcia',
    dni: '39482104P',
    correu: 'laura.vila@gmail.com',
    contrasenya: 'itaeb2023',
    anyGraduacio: '2023',
    especialitat: 'Sonorització per a arts escèniques i espectacles',
    sectorsInteres: ['Sonorització per arts escèniques'],
    notificacionsCorreu: true,
    verificat: true,
  },
  {
    id: 'alu-003',
    marcaTemps: '01/09/2026 09:45:00',
    nomCognoms: 'Pol Puig Roig',
    dni: '48102934X',
    correu: 'pol.puig@gmail.com',
    contrasenya: 'itaeb2025',
    anyGraduacio: '2025',
    especialitat: "Realització de projectes d'audiovisuals i espectacles",
    sectorsInteres: ["Realització d’audiovisuals i espectacles", "Creació de continguts", "Postproducció"],
    notificacionsCorreu: true,
    verificat: true,
  },
  {
    id: 'alu-004',
    marcaTemps: '12/09/2026 18:05:12',
    nomCognoms: 'Clara Navarro Pons',
    dni: '53891023Z',
    correu: 'clara.navarro@hotmail.com',
    contrasenya: 'itaeb2024',
    anyGraduacio: '2024',
    especialitat: "Maquinària escènica i tecnologia de l'espectacle",
    sectorsInteres: ["Maquinària escènica", "Muntatge d’esdeveniments"],
    notificacionsCorreu: true,
    verificat: true,
  }
];

/**
 * Autentica un alumne amb el correu personal triat al formulari d'alta i la contrasenya
 */
export function authenticateWithCredentials(
  email: string,
  password: string,
  registeredAlumni: AlumniRecord[]
): {
  success: boolean;
  user?: {
    email: string;
    name: string;
    isMemberOfAlumniGroup: boolean;
    role: 'alumni' | 'coordinador' | 'convidat';
  };
  reason?: string;
} {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, reason: 'Cal indicar el correu electrònic i la contrasenya.' };
  }

  // 1. Accés administrador / coordinador
  if (cleanEmail === 'tac@itaeb.cat' || cleanEmail === 'empresa@itaeb.cat') {
    return {
      success: true,
      user: {
        email: cleanEmail,
        name: 'Coordinador Digital ITAEB',
        isMemberOfAlumniGroup: true,
        role: 'coordinador',
      },
    };
  }

  // 2. Comprovació d'alumni registrat pel correu personal i contrasenya
  const alumni = registeredAlumni.find(a => a.correu.trim().toLowerCase() === cleanEmail);

  if (!alumni) {
    return {
      success: false,
      reason: `El correu "${cleanEmail}" no consta com a alumni donat d'alta a la Borsa. Si ets graduat/da de l'ITAEB, has d'omplir el formulari d'alta. Recorda que no pot ser un correu @itaeb.cat.`,
    };
  }

  if (alumni.contrasenya !== cleanPass) {
    return {
      success: false,
      reason: 'La contrasenya introduïda no és correcta per a aquest correu.',
    };
  }

  return {
    success: true,
    user: {
      email: alumni.correu,
      name: alumni.nomCognoms,
      isMemberOfAlumniGroup: true,
      role: 'alumni',
    },
  };
}

/**
 * Valida i dona d'alta un nou alumni al sistema
 */
export function registerNewAlumni(
  data: {
    nomCognoms: string;
    dni: string;
    correu: string;
    contrasenya: string;
    anyGraduacio: string;
    especialitat: string;
    sectorsInteres: string[];
    notificacionsCorreu: boolean;
  },
  registry: OfficialAlumniEntry[]
): {
  success: boolean;
  newRecord?: AlumniRecord;
  reason?: string;
  autoAddedToGroup?: boolean;
} {
  const cleanEmail = data.correu.trim().toLowerCase();

  // El correu NO pot ser @itaeb.cat
  if (cleanEmail.endsWith('@itaeb.cat')) {
    return {
      success: false,
      reason: "El correu electrònic no pot ser del domini @itaeb.cat, ja que aquest compte es dona de baixa en finalitzar els estudis. Escriu el teu correu personal (Gmail, Outlook, etc.).",
    };
  }

  if (!data.contrasenya || data.contrasenya.trim().length < 4) {
    return {
      success: false,
      reason: "La contrasenya ha de tenir com a mínim 4 caràcters.",
    };
  }

  // Verificació amb el registre acadèmic oficial
  const verification = verifyAlumniAgainstRegistry(data.dni, data.especialitat, registry);

  const now = new Date();
  const timestamp = `${now.toLocaleDateString('ca-ES')} ${now.toLocaleTimeString('ca-ES')}`;

  const newRecord: AlumniRecord = {
    id: `alu-${Date.now()}`,
    marcaTemps: timestamp,
    nomCognoms: data.nomCognoms.trim(),
    dni: normalizeDNI(data.dni),
    correu: cleanEmail,
    contrasenya: data.contrasenya.trim(),
    anyGraduacio: data.anyGraduacio.trim(),
    especialitat: data.especialitat.trim(),
    sectorsInteres: data.sectorsInteres,
    notificacionsCorreu: data.notificacionsCorreu,
    verificat: verification.verified,
  };

  if (verification.verified) {
    return {
      success: true,
      newRecord,
      autoAddedToGroup: true,
    };
  } else {
    return {
      success: true, // Registrat per a revisió manual pel coordinador a empresa@itaeb.cat
      newRecord,
      autoAddedToGroup: false,
      reason: verification.reason || "Les dades no coincideixen automàticament i s'han enviat a revisió manual pel Coordinador d'Estada a l'Empresa.",
    };
  }
}

/**
 * Parser de CSV compatible amb cometes i salts de línia dins de cel·les.
 */
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
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

/**
 * Dades inicials reals d'ofertes basades en el Google Sheet oficial de l'ITAEB
 */
export const INITIAL_OFFERS: JobOffer[] = [
  {
    id: 'oft-001',
    empresa: 'Sol de Nit Producciones',
    llocTreball: 'Regidor/a tècnic/a (Vilanova i la Geltrú)',
    personaContacte: 'Direcció Tècnica',
    descripcio: `Companyia de teatre professional amb seu a Catalunya busca un/a regidor/a tècnic/a d'il·luminació i so per a incorporar-se a una nova producció teatral que realitzarà gira escolar per tota Espanya.

Funcions principals:
• Operació i supervisió d'il·luminació i so durant assajos i representacions.
• Muntatge, ajust i control tècnic dels equips.
• Coordinació tècnica amb teatres i espais d'exhibició.
• Suport a la companyia durant la gira i resolució d'incidències tècniques.`,
    requisits: `• Coneixements d'il·luminació escènica i so en directe.
• Capacitat de treball en equip i autonomia.
• Disponibilitat per a viatjar per Espanya del novembre de 2026 fins a l'abril de 2027.
• Permís de conduir B1.`,
    tipusContracte: 'Temporal (Gira escolar)',
    dataAlta: '29/06/2026',
    dataLimitCV: '15/07/2026',
    dataInici: '01/09/2026',
    contacte: 'asomnipala@gmail.com (envieu missatge amb CV i breu perfil professional. Assumpte: «Regidor/a técnico/a – Nombre y Apellidos»)',
    sector: ["Il·luminació per arts escèniques", "Sonorització per arts escèniques"],
    estat: 'Oberta',
    notificat: 'SÍ',
    alumni: '',
    marcaTemps: '29/06/2026 14:05:51'
  },
  {
    id: 'oft-002',
    empresa: 'Grupo 9 Reinas',
    llocTreball: 'Creador/a de Contingut Júnior (Content Creator)',
    personaContacte: 'Maria José Ravanesi',
    descripcio: `Grup 9 Reines incorpora a l'equip un/a Creador/a de Contingut Júnior (Content Creator) a temps parcial disposat a trencar els motlles de la comunicació en restauració. Aquest lloc de treball ofereix l'oportunitat d'impulsar la nostra imatge amb total frescor i creativitat.

Si vius enganxat al format vídeo, respires storytelling i saps que la gastronomia es ven amb emocions, aquest és la teva feina per a créixer professionalment.

La teva Missió:
• Transformar la comunicació tradicional en contingut magnètic.
• Caçar històries reals dins dels nostres restaurants.
• Visibilitzar el talent i els èxits dels nostres professionals.
• Aportar frescor i noves idees a l'estratègia visual de la marca.

El que faràs en el teu dia a dia:
• Gravar i editar vídeos curts dinàmics (Reels, TikToks, Shorts).
• Redactar copywriting que enganxi i generi comunitat.
• Crear peces visuals estètiques amb una línia de disseny impecable.
• Moure't pels nostres 8 locals de Barcelona i zona del Vallès.`,
    requisits: `Perfil desitjat:
• Nadiu digital: les tendències d'internet són el teu hàbitat natural.
• Filmmaker àgil: guionitzes, enregistres i edites vídeo vertical amb destresa.
• Ull estètic: tens criteri visual i facilitat per al disseny gràfic.
• Proactiu/a: no esperes ordres, proposes solucions i les executes.
• Eines pròpies: comptes amb el teu propi equip de gravació (mòbil/càmera).
• Mobilitat: tens cotxe o moto per a desplaçar-te entre restaurants.

La vacant és ideal per algú que vulgui fer les seves primeres passes professionals en un entorn dinàmic, amb autonomia creativa i acompanyat per un equip amb experiència.`,
    tipusContracte: 'Indefinit (20h/setmana - 12.000 € brut anual + beneficis)',
    dataAlta: '09/07/2026',
    dataLimitCV: '16/07/2026',
    dataInici: '20/07/2026',
    contacte: 'Adjunta el teu CV + Portafolis (o enllaç als teus millors vídeos) i envia-los a: contrataciones@grupo9reinas.com',
    sector: ["Realització d’audiovisuals i espectacles", "Postproducció", "Creació de continguts"],
    estat: 'Oberta',
    notificat: 'SÍ',
    alumni: '',
    marcaTemps: '09/07/2026 18:21:36'
  },
  {
    id: 'oft-003',
    empresa: '700 Milles (música en directe a Barcelona)',
    llocTreball: 'Tècnic/a de so en directe',
    personaContacte: 'Joaquim Ullan',
    descripcio: `Muntatge, prova de so, line-check, sonorització del concert i desmuntatge per a sala de música en directe al centre de Barcelona. Els concerts es porten a terme habitualment cada dijous i divendres vespre.`,
    requisits: `• Tenir formació i experiència prèvia en sonorització per a espectacles de petit i mitjà format.
• Domini de taules digitals de so i microfonia estàndard.
• Agilitat i bona comunicació amb músics i bandes.`,
    tipusContracte: "Fix discontinu o en règim d'autònom",
    dataAlta: '14/09/2026',
    dataLimitCV: '21/09/2026',
    dataInici: '14/09/2026',
    contacte: 'joaquim.ullan@gmail.com',
    sector: ['Sonorització per arts escèniques'],
    estat: 'Oberta',
    notificat: 'SÍ',
    alumni: '',
    marcaTemps: '14/09/2026 20:44:39'
  },
  {
    id: 'oft-004',
    empresa: 'Focus Serveis Audiovisuals i Escènics',
    llocTreball: 'Cap de colla / Maquinista i Tècnic/a de Muntatge Escènic',
    personaContacte: 'Departament de Personal Tècnic',
    descripcio: `Empresa líder en gestió teatral a Catalunya cerca tècnic/a maquinista escènic per a teatres de la xarxa de Barcelona. Responsable del muntatge d'estructures, moviment d'elements escenogràfics durant la funció i compliment estricte de la normativa de seguretat en alçada.`,
    requisits: `• Graduat/da de l'ITAEB en Maquinària Escènica o Tècniques de l'Espectacle.
• Certificació de treballs en alçada (valorat, es pot facilitar formació).
• Proactivitat i capacitat resolutiva sota pressió.`,
    tipusContracte: 'Indefinit a jornada completa',
    dataAlta: '20/10/2026',
    dataLimitCV: '15/11/2026',
    dataInici: '01/12/2026',
    contacte: 'borsatreball@focus.cat (Assumpte: Candidatura Tècnic Maquinista - Nom)',
    sector: ["Maquinària escènica", "Muntatge d'estructures"],
    estat: 'Oberta',
    notificat: 'SÍ',
    alumni: '',
    marcaTemps: '20/10/2026 10:15:00'
  },
  {
    id: 'oft-005',
    empresa: 'Mediapro / Lavinia Serveis Audiovisuals',
    llocTreball: "Operador/a de Càmera de Plató i Exteriors",
    personaContacte: 'Selecció de Talent Audiovisual',
    descripcio: `Incorporació a l'equip d'operadors de càmera per a cobertura d'esdeveniments culturals, esportius i programes de televisió a la zona metropolitana de Barcelona. Maneig de càmeres de cadena, òptiques i sistemes de comunicació intercom.`,
    requisits: `• Graduat/da en Realització de Projectes Audiovisuals i Espectacles (ITAEB).
• Coneixement de sistemes broadcast i fluxos de treball multicàmera.
• Flexibilitat horària (caps de setmana segons calendari d'esdeveniments).`,
    tipusContracte: 'Temporal amb possibilitat d’indefinit',
    dataAlta: '22/10/2026',
    dataLimitCV: '10/11/2026',
    dataInici: '15/11/2026',
    contacte: 'rrhh.produccio@mediapro.tv',
    sector: ["Realització d’audiovisuals i espectacles", "Operació de càmera"],
    estat: 'Oberta',
    notificat: 'SÍ',
    alumni: '',
    marcaTemps: '22/10/2026 12:30:00'
  }
];

/**
 * Registre oficial de l'ITAEB ("Llistat alumni ITAEB") per a validació de DNI + Especialitat
 */
export const OFFICIAL_REGISTRY_SAMPLE: OfficialAlumniEntry[] = [
  {
    estudis: "Il·luminació, captació i tractament d'imatge",
    idalu: "ITAEB-2024-041",
    dni: "47812903K",
    cognoms: "Martínez Soler",
    nom: "Marc"
  },
  {
    estudis: "Sonorització per a arts escèniques i espectacles",
    idalu: "ITAEB-2023-112",
    dni: "39482104P",
    cognoms: "Vila Garcia",
    nom: "Laura"
  },
  {
    estudis: "Realització de projectes d'audiovisuals i espectacles",
    idalu: "ITAEB-2025-089",
    dni: "48102934X",
    cognoms: "Puig Roig",
    nom: "Pol"
  },
  {
    estudis: "Maquinària escènica i tecnologia de l'espectacle",
    idalu: "ITAEB-2024-015",
    dni: "53891023Z",
    cognoms: "Navarro Pons",
    nom: "Clara"
  },
  {
    estudis: "Sonorització per a arts escèniques i espectacles",
    idalu: "ITAEB-2022-033",
    dni: "46738921B",
    cognoms: "Ferrer Serra",
    nom: "Jordi"
  }
];

export const OFFICIAL_FORMS = {
  altaExalumnes: "https://docs.google.com/forms/d/e/1FAIpQLSd4HOG4Xpk4cpkjJHpwY0TrKVGCO9Uwxv4bpBLHd_QYkZ-S9A/viewform?usp=sharing&ouid=110600584656605695276",
  altaOfertes: "https://docs.google.com/forms/d/e/1FAIpQLScujr0TmLGcYlz8wcg123YOb0PIEdczLDJs-LK8M2o1icSgww/viewform?usp=sharing&ouid=110600584656605695276",
};

export const OFFICIAL_EMAILS = {
  admin: "tac@itaeb.cat",
  aliesRemitent: "BorsaTreball@itaeb.cat",
  avisosAdmin: "empresa@itaeb.cat",
  grupGoogleAccés: "alumni@itaeb.cat"
};
