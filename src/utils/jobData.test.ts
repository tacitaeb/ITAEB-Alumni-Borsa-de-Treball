import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  normalizeDNI,
  doSectorsMatch,
  verifyAlumniAgainstRegistry,
  authenticateAlumniUser,
  parseCSV,
  OFFICIAL_REGISTRY_SAMPLE
} from './jobData';

test('normalizeText strips diacritics, lowercase, and handles catalan punt volat', () => {
  const t1 = normalizeText("Il·luminació d'espectacles");
  const t2 = normalizeText("il·luminacio d'espectacles");
  assert.equal(t1, t2);
  assert.equal(t1, "illuminacio d espectacles");
});

test('doSectorsMatch matches case-insensitive, accent-free sectors', () => {
  const alumniSectors = ["Sonorització per arts escèniques", "Tècnic de so"];
  const offerSectors = ["sonoritzacio per arts esceniques"];
  assert.equal(doSectorsMatch(alumniSectors, offerSectors), true);

  const nonMatching = ["Maquinària escènica"];
  assert.equal(doSectorsMatch(nonMatching, offerSectors), false);
});

test('normalizeDNI strips whitespace, hyphens, and uppercases', () => {
  assert.equal(normalizeDNI(" 47812903-k "), "47812903K");
  assert.equal(normalizeDNI("39.482.104-p"), "39482104P");
});

test('verifyAlumniAgainstRegistry accepts exact DNI and matching specialty', () => {
  const result = verifyAlumniAgainstRegistry(
    "47812903K",
    "Il·luminació, captació i tractament d'imatge",
    OFFICIAL_REGISTRY_SAMPLE
  );
  assert.equal(result.verified, true);
  assert.equal(result.match?.nom, "Marc");
});

test('verifyAlumniAgainstRegistry rejects unregistered DNI', () => {
  const result = verifyAlumniAgainstRegistry(
    "99999999Z",
    "Sonorització",
    OFFICIAL_REGISTRY_SAMPLE
  );
  assert.equal(result.verified, false);
  assert.ok(result.reason?.includes("no consta al Llistat oficial"));
});

test('verifyAlumniAgainstRegistry rejects matching DNI with mismatched specialty', () => {
  const result = verifyAlumniAgainstRegistry(
    "47812903K",
    "Comptabilitat i finances",
    OFFICIAL_REGISTRY_SAMPLE
  );
  assert.equal(result.verified, false);
  assert.ok(result.reason?.includes("no coincideix exactament"));
});

test('authenticateAlumniUser authenticates registered student by DNI', () => {
  const res = authenticateAlumniUser("47812903K", OFFICIAL_REGISTRY_SAMPLE);
  assert.equal(res.success, true);
  assert.equal(res.user?.name, "Marc Martínez Soler");
  assert.equal(res.user?.isMemberOfAlumniGroup, true);
});

test('authenticateAlumniUser rejects non-registered DNI', () => {
  const res = authenticateAlumniUser("00000000X", OFFICIAL_REGISTRY_SAMPLE);
  assert.equal(res.success, false);
  assert.ok(res.reason?.includes("no consta com a alumni"));
});

test('authenticateAlumniUser authenticates institutional emails', () => {
  const res = authenticateAlumniUser("laura.vila@itaeb.cat", OFFICIAL_REGISTRY_SAMPLE);
  assert.equal(res.success, true);
  assert.equal(res.user?.isMemberOfAlumniGroup, true);
});

test('parseCSV correctly handles quotes with commas and multiline content', () => {
  const sampleCSV = `Empresa,Lloc,Descripció\n"Sol de Nit, SL",Tècnic,"Requisits:\n- So en directe\n- Il·luminació"`;
  const rows = parseCSV(sampleCSV);
  assert.equal(rows.length, 2);
  assert.equal(rows[1][0], "Sol de Nit, SL");
  assert.equal(rows[1][1], "Tècnic");
  assert.ok(rows[1][2].includes("Requisits:"));
});
