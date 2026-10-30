export interface JobOffer {
  id: string;
  empresa: string;
  llocTreball: string;
  personaContacte: string;
  descripcio: string;
  requisits: string;
  tipusContracte: string;
  dataAlta: string;
  dataLimitCV: string;
  dataInici: string;
  contacte: string;
  sector: string[];
  estat: 'Oberta' | 'Tancada';
  notificat: string;
  alumni?: string;
  marcaTemps?: string;
}

export interface AlumniRecord {
  id: string;
  marcaTemps: string;
  nomCognoms: string;
  dni: string;
  correu: string; // Correu personal de contacte (no pot ser @itaeb.cat)
  contrasenya: string;
  anyGraduacio: string;
  especialitat: string;
  sectorsInteres: string[];
  notificacionsCorreu: boolean;
  verificat?: boolean;
}

export interface OfficialAlumniEntry {
  estudis: string;
  idalu: string;
  dni: string;
  cognoms: string;
  nom: string;
}

export type PageId = 'inici' | 'sobre' | 'alumni' | 'empreses' | 'ofertes' | 'coordinador' | 'perfil';

export interface UserSession {
  email: string;
  name: string;
  isMemberOfAlumniGroup: boolean; // member of alumni@itaeb.cat
  role: 'alumni' | 'coordinador' | 'convidat';
}
