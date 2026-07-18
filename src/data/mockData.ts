export interface ShipDoc {
  id: string;
  type: 'Shipping Advice' | 'Custom Invoice' | 'Packing List' | 'Letter of Credit' | 'Shipping Instruction' | 'DocXPort' | 'Draft Insurance' | 'Detail for Insurance Purpose' | 'Draft B/L' | 'Shipping Particular' | 'Original B/L';
  fieldMapping: Record<string, string>;
  values: Record<string, string>;
}

export type TaskStatus =
  | 'Pending'
  | 'Attention'
  | 'Match'
  | 'Approved'
  | 'Rejected';

export type VerificationStatus =
  | 'Pending Verification'
  | 'Attention'
  | 'Rejected'
  | 'Match'
  | 'Match with condition'
  | 'Approved'
  | 'Incomplete';

export interface Verifications {
  customFormality: VerificationStatus;
  insurance: VerificationStatus;
  draftBL: VerificationStatus;
  blDate: VerificationStatus;
}

export interface Task {
  id: string;
  shipmentRef: string;
  shipper: string;
  consignee: string;
  submittedDate: string;
  lastUpdate?: string;
  assignedTo: string;
  documents: ShipDoc[];
  canonicalFields: string[];
  correctValues: Record<string, string>;
  fieldStatusOverrides?: Record<string, 'match' | 'mismatch' | 'match-with-condition'>;
  cellStatusOverrides?: Record<string, boolean>;
  manuallyEditedCells?: Record<string, true>;
  fieldEditHistory?: Record<string, Array<{ value: string; timestamp: string }>>;
  status: TaskStatus;
  verifications: Verifications;
}

export function deriveOverallStatus(v: Verifications): TaskStatus {
  const statuses = Object.values(v) as VerificationStatus[];
  if (statuses.includes('Rejected')) return 'Rejected';
  if (statuses.includes('Incomplete')) return 'Attention';
  if (statuses.includes('Attention')) return 'Attention';
  if (statuses.includes('Pending Verification')) return 'Pending';
  if (statuses.every(s => s === 'Approved')) return 'Approved';
  return 'Match';
}

// ─── CF document field mappings (canonical field → doc-specific label) ────────

const SA_FIELDS: Record<string, string> = {
  'INVOICE NO.': 'INVOICE NO.',
  'REF NO.': 'PROFORMA INVOICE NO.',
  "BUYER'S ORDER NO.": "BUYER'S ORDER NO.",
  'ETD PORT': 'ETD',
  'ETA PORT': 'ETA',
  'PRODUCT LINE ITEM#1': 'PRODUCT',
  'QUANTITY LINE ITEM#1': 'QUANTITY',
  'TOTAL QUANTITY': 'TOTAL QUANTITY',
  'TOTAL AMOUNT': 'TOTAL AMOUNT',
  'FREIGHT': 'FREIGHT',
  'INCOTERMS': 'INCOTERMS',
  'TOTAL NET WEIGHT': 'TOTAL NET WEIGHT',
  'TOTAL GROSS WEIGHT': 'TOTAL GROSS WEIGHT',
  'MARKS & NOS': 'MARKS & NOS',
};

const CI_FIELDS: Record<string, string> = {
  'INVOICE NO.': 'NO.',
  'REF NO.': 'REFERENCE NO.',
  "BUYER'S ORDER NO.": "BUYER'S ORDER NO.",
  'ETD PORT': 'FROM',
  'ETA PORT': 'TO',
  'PAYMENT TERM': 'PAYMENT TERM',
  'PRODUCT LINE ITEM#1': 'DESCRIPTION OF GOODS',
  'QUANTITY LINE ITEM#1': 'QUANTITY',
  'AMOUNT LINE ITEM#1': 'AMOUNT',
  'TOTAL AMOUNT': 'TOTAL AMOUNT',
  'FREIGHT': 'FREIGHT',
  'INCOTERMS': 'INCOTERMS',
  'TOTAL NET WEIGHT': 'TOTAL NET WEIGHT',
  'TOTAL GROSS WEIGHT': 'TOTAL GROSS WEIGHT',
  'MARKS & NOS': 'MARKS & NOS',
};

const PL_FIELDS: Record<string, string> = {
  'INVOICE NO.': 'NO.',
  'REF NO.': 'REFERENCE NO.',
  "BUYER'S ORDER NO.": "BUYER'S ORDER NO.",
  'ETD PORT': 'FROM',
  'ETA PORT': 'TO',
  'PAYMENT TERM': 'PAYMENT TERM',
  'PRODUCT LINE ITEM#1': 'DESCRIPTION OF GOODS',
  'QUANTITY LINE ITEM#1': 'QUANTITY',
  'FREIGHT': 'FREIGHT',
  'INCOTERMS': 'INCOTERMS',
  'TOTAL NET WEIGHT': 'TOTAL NET WEIGHT',
  'TOTAL GROSS WEIGHT': 'TOTAL GROSS WEIGHT',
  'MARKS & NOS': 'MARKS & NOS',
};

const SI_FIELDS: Record<string, string> = {
  'INCOTERMS': 'INCOTERMS',
  'MARKS & NOS': 'MARKS & NOS',
  'ORIGINAL SHIPPING DOCUMENTS AND COPY': 'ORIGINAL SHIPPING DOCUMENTS AND COPY',
};

const LC_FIELDS: Record<string, string> = { 'L/C NO.': 'L/C NO.' };
const CI_FIELDS_LC: Record<string, string> = { ...CI_FIELDS, 'L/C NO.': 'L/C NO.' };
const PL_FIELDS_LC: Record<string, string> = { ...PL_FIELDS, 'L/C NO.': 'L/C NO.' };

// SI consignee addresses for ORIGINAL SHIPPING DOCUMENTS AND COPY
const SI_ADDR = {
  SHANGHAI_GCM: 'GC MARKETING SOLUTIONS (SHANGHAI) COMPANY LIMITED\nROOM 13-042, 13TH FLOOR, 1000 LUJIAZUI RING RD., PUDONG, SHANGHAI, 200120, CHINA\nCONTACT PERSON: MR. ZHU WEI TEL: +86 13916595836 EMAIL: GCM-CHINA-SC@PTTGCGROUP.COM',
  TIANJIN_SPC: 'SINOPEC TIANJIN CHEMICALS CO., LTD.\n300 HUANGHAI ROAD, BINHAI NEW AREA, TIANJIN, 300451, CHINA\nCONTACT PERSON: MS. ZHANG LING TEL: +86 22 65979800 EMAIL: IMPORT@SINOPEC-TJ.COM',
  QINGDAO_JIFA: 'QINGDAO JIFA GROUP CO., LTD.\n88 MINJIANG ROAD, QINGDAO, SHANDONG, 266071, CHINA\nCONTACT PERSON: MR. WANG HAO TEL: +86 532 86662888 EMAIL: IMPORT@QDJIFA.COM',
  SHANGHAI_BASF: 'BASF TRADING (SHANGHAI) CO., LTD.\n333 JIUJIANG ROAD, HUANGPU DISTRICT, SHANGHAI, 200001, CHINA\nCONTACT PERSON: MR. PETER ZHANG TEL: +86 21 28050000 EMAIL: IMPORT.BASF@BASF.COM',
  SINGAPORE_DOW: 'DOW CHEMICAL SINGAPORE PTE. LTD.\n1 HARBOUR FRONT PLACE, HARBOURFRONT TOWER ONE, SINGAPORE, 098633\nCONTACT PERSON: MS. TAN MEI LING TEL: +65 6709 5000 EMAIL: IMPORT@DOW.COM',
  BUSAN_LG: 'LG CHEM LTD.\n30 BULMUSAN-RO, YEOSU, JEONNAM, SOUTH KOREA\nCONTACT PERSON: MR. KIM JOON HO TEL: +82 61 680 1114 EMAIL: IMPORT@LGCHEM.COM',
  JAKARTA_CAP: 'PT. CHANDRA ASRI PETROCHEMICAL TBK\nGEDUNG WISMA BARITO PACIFIC II, 7TH FLOOR, JL. S. PARMAN KAV.62-63, JAKARTA, 11410, INDONESIA\nCONTACT PERSON: MR. AGUS SANTOSO TEL: +62 21 5308509 EMAIL: IMPORT@CHANDRA-ASRI.COM',
  KLANG_PCS: 'PETRONAS CHEMICALS GROUP BHD\nLEVEL 9, PETRONAS TWIN TOWERS, KUALA LUMPUR CITY CENTRE, KUALA LUMPUR, 50088, MALAYSIA\nCONTACT PERSON: MS. NOOR AISHAH TEL: +60 3 2051 5000 EMAIL: PCSIMPORT@PETRONAS.COM.MY',
};

const CF_CANONICAL = [
  'INVOICE NO.', 'REF NO.', "BUYER'S ORDER NO.", 'ETD PORT', 'ETA PORT',
  'PAYMENT TERM',
  'PRODUCT LINE ITEM#1', 'QUANTITY LINE ITEM#1', 'AMOUNT LINE ITEM#1',
  'PRODUCT LINE ITEM#2', 'QUANTITY LINE ITEM#2', 'AMOUNT LINE ITEM#2',
  'PRODUCT LINE ITEM#3', 'QUANTITY LINE ITEM#3', 'AMOUNT LINE ITEM#3',
  'TOTAL QUANTITY', 'TOTAL AMOUNT',
  'FREIGHT', 'INCOTERMS', 'TOTAL NET WEIGHT', 'TOTAL GROSS WEIGHT', 'MARKS & NOS',
  'L/C NO.', 'ORIGINAL SHIPPING DOCUMENTS AND COPY',
];

const INS_CANONICAL = [
  'INSURANCE COMPANY', 'NAME OF ASSURED', 'CONVEYANCE',
  'SAILING/DESPATCHING DATE', 'VOYAGE FROM', 'TO',
  'AMOUNT INSURED HEREUNDER', 'INTEREST, MARKS AND NOS./SUBJECT - MATTER INSURED',
  'FOR CUSTOMER PURPOSE', 'CLAMS, IF ANY, PAYABLE AT/IN', 'INVOICE AMOUNT',
  'AS PER INVOICE NO.', 'FOR LETTER OF CREDIT PURPOSE',
];
const DBL_CANONICAL = ['Shipper', 'Consignee', 'Vessel Name', 'Gross Weight'];
const BLD_CANONICAL = ['GI Date', 'ETD Date', 'Manual Billing Date'];
export const ALL_CANONICAL = [...CF_CANONICAL, ...INS_CANONICAL, ...DBL_CANONICAL, ...BLD_CANONICAL];

// ─── Helper: build CF document set ────────────────────────────────────────────

function cfDocs(id: string, vals: Record<string, string>, ciMismatches?: Record<string, string>, hasLC?: boolean): ShipDoc[] {
  function build(fieldMap: Record<string, string>, overrides?: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [canonical, label] of Object.entries(fieldMap)) {
      const v = overrides?.[canonical] ?? vals[canonical];
      if (v) out[label] = v;
    }
    return out;
  }

  // Extend field maps for additional line items present in vals
  const saFields: Record<string, string> = { ...SA_FIELDS };
  const ciFields: Record<string, string> = hasLC ? { ...CI_FIELDS_LC } : { ...CI_FIELDS };
  const plFields: Record<string, string> = hasLC ? { ...PL_FIELDS_LC } : { ...PL_FIELDS };
  for (let n = 2; vals[`PRODUCT LINE ITEM#${n}`]; n++) {
    saFields[`PRODUCT LINE ITEM#${n}`] = `PRODUCT ${n}`;
    saFields[`QUANTITY LINE ITEM#${n}`] = `QUANTITY ${n}`;
    ciFields[`PRODUCT LINE ITEM#${n}`] = `DESCRIPTION OF GOODS ${n}`;
    ciFields[`QUANTITY LINE ITEM#${n}`] = `QUANTITY ${n}`;
    ciFields[`AMOUNT LINE ITEM#${n}`] = `AMOUNT ${n}`;
    plFields[`PRODUCT LINE ITEM#${n}`] = `DESCRIPTION OF GOODS ${n}`;
    plFields[`QUANTITY LINE ITEM#${n}`] = `QUANTITY ${n}`;
  }

  if (hasLC) {
    return [
      { id: `${id}-sa`, type: 'Shipping Advice', fieldMapping: saFields, values: build(saFields) },
      { id: `${id}-ci`, type: 'Custom Invoice', fieldMapping: ciFields, values: build(ciFields, ciMismatches) },
      { id: `${id}-pl`, type: 'Packing List', fieldMapping: plFields, values: build(plFields) },
      { id: `${id}-lc`, type: 'Letter of Credit', fieldMapping: { ...LC_FIELDS }, values: build(LC_FIELDS) },
    ];
  }
  return [
    { id: `${id}-sa`, type: 'Shipping Advice', fieldMapping: saFields, values: build(saFields) },
    { id: `${id}-ci`, type: 'Custom Invoice', fieldMapping: ciFields, values: build(ciFields, ciMismatches) },
    { id: `${id}-pl`, type: 'Packing List', fieldMapping: plFields, values: build(plFields) },
    { id: `${id}-si`, type: 'Shipping Instruction', fieldMapping: { ...SI_FIELDS }, values: build(SI_FIELDS) },
  ];
}

// ─── Insurance document helpers ──────────────────────────────────────────────

const MONTH_TO_NUM: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function fmtUSD(n: number): string {
  const [i, d] = n.toFixed(2).split('.');
  return `USD ${i.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${d}`;
}

function parseGiDate(d: string): string {
  // "01 Mar 2026" → "01/03/2026"
  const p = d.split(' ');
  if (p.length !== 3) return d;
  return `${p[0]}/${MONTH_TO_NUM[p[1].toLowerCase()] ?? '01'}/${p[2]}`;
}

interface InsValsParams {
  invoiceNo: string; etdPort: string; etaPort: string; vesselName: string;
  giDate: string; totalAmount: string; totalQty: string;
  products: string[]; qtys: string[]; isLC?: boolean;
}

// Detail for Insurance Purpose — field labels exactly as in the document
const INS_DIP_FIELDS_BASE: Record<string, string> = {
  'INSURANCE COMPANY': 'INSURANCE COMPANY',
  'NAME OF ASSURED': 'NAME OF INSURED',
  'CONVEYANCE': 'CONVEYANCE',
  'SAILING/DESPATCHING DATE': 'SAILING (ON OR ABOUT) / DESPATCHING DATE',
  'VOYAGE FROM': 'VOYAGE FROM',
  'TO': 'TO',
  'AMOUNT INSURED HEREUNDER': 'AMOUNT INSURED HEREUNDER',
  'INTEREST, MARKS AND NOS./SUBJECT - MATTER INSURED': 'INTEREST, MARKS AND NOS./SUBJECT - MATTER INSURED',
  'INVOICE NO.': 'INVOICE NO.',
  'FOR CUSTOMER PURPOSE': 'FOR CUSTOMER PURPOSE',
  'CLAMS, IF ANY, PAYABLE AT/IN': 'CLAMS, IF ANY, PAYABLE AT/IN',
  'INVOICE AMOUNT': 'INVOICE AMOUNT',
  'AS PER INVOICE NO.': 'AS PER INVOICE NO.',
};
const INS_DIP_FIELDS_LC: Record<string, string> = {
  ...INS_DIP_FIELDS_BASE,
  'FOR LETTER OF CREDIT PURPOSE': 'FOR LETTER OF CREDIT PURPOSE',
};

// Draft Insurance — field labels exactly as in the document
const INS_DRAFT_FIELDS_BASE: Record<string, string> = {
  'INSURANCE COMPANY': 'INSURANCE COMPANY',
  'NAME OF ASSURED': 'NAME OF INSURED',
  'CONVEYANCE': 'CONVEYANCE',
  'SAILING/DESPATCHING DATE': 'SAILING/DESPATCHING DATE (ON OR ABOUT)',
  'VOYAGE FROM': 'VOYAGE FROM',
  'TO': 'TO',
  'AMOUNT INSURED HEREUNDER': 'AMOUNT INSURED HEREUNDER',
  'INTEREST, MARKS AND NOS./SUBJECT - MATTER INSURED': 'INTEREST MARKS AND NOS./SUBJECT-MATTER INSURED',
  'INVOICE NO.': 'MARKS AS PER INVOICE NO.',
  'FOR CUSTOMER PURPOSE': 'Clauses, Endorsements, Special Conditions and Warranties',
  'CLAMS, IF ANY, PAYABLE AT/IN': 'Claims, if any payable at/in',
  'INVOICE AMOUNT': 'INVOICE AMOUNT',
  'AS PER INVOICE NO.': 'ISSUED IN BANGKOK ON',
};
const INS_DRAFT_FIELDS_LC: Record<string, string> = {
  ...INS_DRAFT_FIELDS_BASE,
  'FOR LETTER OF CREDIT PURPOSE': 'FOR LETTER OF CREDIT PURPOSE',
};

function buildInsVals(p: InsValsParams): Record<string, string> {
  const amt = parseFloat(p.totalAmount.replace(/,/g, '')) || 0;
  const sumIns = fmtUSD(Math.round(amt * 1.1 * 100) / 100);
  const eta = p.etaPort;
  let country = eta;
  if (eta.includes('CHINA')) country = 'CHINA';
  else if (eta.includes('SINGAPORE')) country = 'SINGAPORE';
  else if (eta.includes('SOUTH KOREA')) country = 'SOUTH KOREA';
  else if (eta.includes('INDONESIA')) country = 'INDONESIA';
  else if (eta.includes('MALAYSIA')) country = 'MALAYSIA';
  const interestLines = p.products.map((prod, i) =>
    `${p.qtys[i]}.000 MT OF ${prod.toUpperCase()} IN 25 KG BAGS`
  );
  const interest = interestLines.length > 1
    ? interestLines.join('\n') + `\nTOTAL ${p.totalQty}.000 MT`
    : interestLines[0];
  const sailDate = parseGiDate(p.giDate); // "DD/MM/YYYY"
  const result: Record<string, string> = {
    'INSURANCE COMPANY': 'DHIPAYA INSURANCE PUBLIC COMPANY LIMITED',
    'NAME OF ASSURED': 'PTT GLOBAL CHEMICAL PUBLIC COMPANY LIMITED',
    'CONVEYANCE': p.vesselName,
    'SAILING/DESPATCHING DATE': sailDate,
    'VOYAGE FROM': p.etdPort,
    'TO': p.etaPort,
    'AMOUNT INSURED HEREUNDER': sumIns,
    'INTEREST, MARKS AND NOS./SUBJECT - MATTER INSURED': interest,
    'INVOICE NO.': p.invoiceNo,
    'FOR CUSTOMER PURPOSE': 'COVERING INSTITUTES CARGO CLAUSES (A), INSTITUTES STRIKES CLAUSES AND INSTITUTES WAR CLAUSES.',
    'CLAMS, IF ANY, PAYABLE AT/IN': country,
    'INVOICE AMOUNT': p.totalAmount + ' USD',
    'AS PER INVOICE NO.': `${p.invoiceNo} DD. ${sailDate}`,
  };
  if (p.isLC) result['FOR LETTER OF CREDIT PURPOSE'] = 'COVERING INSTITUTE CARGO CLAUSE (A)';
  return result;
}

export function insDocs(id: string, vals: Record<string, string>, mismatch?: Record<string, string>): ShipDoc[] {
  const isLC = !!vals['FOR LETTER OF CREDIT PURPOSE'];
  const dipFields = isLC ? INS_DIP_FIELDS_LC : INS_DIP_FIELDS_BASE;
  const draftFields = isLC ? INS_DRAFT_FIELDS_LC : INS_DRAFT_FIELDS_BASE;
  const buildVals = (fm: Record<string, string>, overrides?: Record<string, string>) => {
    const out: Record<string, string> = {};
    for (const [canonical, label] of Object.entries(fm)) {
      const v = overrides?.[canonical] ?? vals[canonical];
      if (v) out[label] = v;
    }
    return out;
  };
  return [
    { id: `${id}-dip`, type: 'Detail for Insurance Purpose', fieldMapping: dipFields, values: buildVals(dipFields) },
    { id: `${id}-ins`, type: 'Draft Insurance', fieldMapping: draftFields, values: buildVals(draftFields, mismatch) },
  ];
}

export function dblDocs(id: string, vals: Record<string, string>, mismatch?: Record<string, string>, mismatch2?: Record<string, string>): ShipDoc[] {
  const dbl: ShipDoc = {
    id: `${id}-dbl`,
    type: 'Draft B/L',
    fieldMapping: { 'Shipper': 'shipper', 'Consignee': 'consignee', 'Vessel Name': 'vessel_name', 'Gross Weight': 'gross_weight' },
    values: {
      shipper: mismatch?.['Shipper'] ?? vals['Shipper'],
      consignee: mismatch?.['Consignee'] ?? vals['Consignee'],
      vessel_name: mismatch?.['Vessel Name'] ?? vals['Vessel Name'],
      gross_weight: mismatch?.['Gross Weight'] ?? vals['Gross Weight'],
    },
  };
  const sp: ShipDoc = {
    id: `${id}-sp`,
    type: 'Shipping Particular',
    fieldMapping: { 'Shipper': 'SHIPPER', 'Consignee': 'CONSIGNEE', 'Vessel Name': 'VESSEL/VOYAGE', 'Gross Weight': 'TOTAL GROSS WEIGHT' },
    values: {
      'SHIPPER':            mismatch2?.['Shipper']      ?? mismatch?.['Shipper']      ?? vals['Shipper'],
      'CONSIGNEE':          mismatch2?.['Consignee']    ?? mismatch?.['Consignee']    ?? vals['Consignee'],
      'VESSEL/VOYAGE':      mismatch2?.['Vessel Name']  ?? mismatch?.['Vessel Name']  ?? vals['Vessel Name'],
      'TOTAL GROSS WEIGHT': mismatch2?.['Gross Weight'] ?? mismatch?.['Gross Weight'] ?? vals['Gross Weight'],
    },
  };
  return [dbl, sp];
}

function oblDoc(id: string, date: string): ShipDoc {
  return { id: `${id}-obl`, type: 'Original B/L', fieldMapping: { 'B/L Date': 'bl_date' }, values: { bl_date: date } };
}

// ─── Precomputed insurance vals (reused in correctValues & insDocs) ───────────

const IV01 = buildInsVals({ invoiceNo: '1015050001', etdPort: 'LAEM CHABANG PORT, THAILAND', etaPort: 'HUANGPU, CHINA', vesselName: 'MV PACIFIC EXPRESS', giDate: '01 Mar 2026', totalAmount: '669,600.00', totalQty: '720', products: ['HDPE InnoPlus HD2200JP'], qtys: ['720'] });
const IV02 = buildInsVals({ invoiceNo: '1015050002', etdPort: 'MAP TA PHUT PORT, THAILAND', etaPort: 'TIANJIN, CHINA', vesselName: 'MV ASIAN STAR', giDate: '02 Mar 2026', totalAmount: '435,000.00', totalQty: '500', products: ['LLDPE InnoPlus LL6100F'], qtys: ['500'], isLC: true });
const IV03 = buildInsVals({ invoiceNo: '1015050003', etdPort: 'LAEM CHABANG PORT, THAILAND', etaPort: 'QINGDAO, CHINA', vesselName: 'MV THAI SPIRIT', giDate: '03 Mar 2026', totalAmount: '285,000.00', totalQty: '300', products: ['PP InnoPlus HS150'], qtys: ['300'] });
const IV04 = buildInsVals({ invoiceNo: '1015050004', etdPort: 'MAP TA PHUT PORT, THAILAND', etaPort: 'SHANGHAI, CHINA', vesselName: 'MV GOLDEN BRIDGE', giDate: '04 Mar 2026', totalAmount: '376,000.00', totalQty: '400', products: ['HDPE InnoPlus HB5400P'], qtys: ['400'] });
const IV05 = buildInsVals({ invoiceNo: '1015050005', etdPort: 'LAEM CHABANG PORT, THAILAND', etaPort: 'SINGAPORE', vesselName: 'MV EMERALD SEA', giDate: '05 Mar 2026', totalAmount: '576,000.00', totalQty: '600', products: ['PP InnoPlus MA2100'], qtys: ['600'] });
const IV06 = buildInsVals({ invoiceNo: '1015050006', etdPort: 'MAP TA PHUT PORT, THAILAND', etaPort: 'BUSAN, SOUTH KOREA', vesselName: 'MV KOREA TRADER', giDate: '06 Mar 2026', totalAmount: '420,000.00', totalQty: '480', products: ['LLDPE InnoPlus LL6101G'], qtys: ['480'] });
const IV08 = buildInsVals({ invoiceNo: '1015050008', etdPort: 'MAP TA PHUT PORT, THAILAND', etaPort: 'TIANJIN, CHINA', vesselName: 'MV NORTHERN LIGHT', giDate: '08 Mar 2026', totalAmount: '522,500.00', totalQty: '550', products: ['PP InnoPlus HS150'], qtys: ['550'], isLC: true });
const IV10 = buildInsVals({ invoiceNo: '1015050010', etdPort: 'MAP TA PHUT PORT, THAILAND', etaPort: 'QINGDAO, CHINA', vesselName: 'MV DRAGON GATE', giDate: '10 Mar 2026', totalAmount: '267,800.00', totalQty: '280', products: ['PP InnoPlus MA2100', 'PP InnoPlus HS150'], qtys: ['180', '100'] });
const IV11 = buildInsVals({ invoiceNo: '1015050011', etdPort: 'LAEM CHABANG PORT, THAILAND', etaPort: 'PORT KLANG, MALAYSIA', vesselName: 'MV MALAY EXPRESS', giDate: '11 Mar 2026', totalAmount: '592,200.00', totalQty: '630', products: ['HDPE InnoPlus HB5400P'], qtys: ['630'], isLC: true });
const IV13 = buildInsVals({ invoiceNo: '1015050013', etdPort: 'LAEM CHABANG PORT, THAILAND', etaPort: 'SHANGHAI, CHINA', vesselName: 'MV SHANGHAI GLORY', giDate: '13 Mar 2026', totalAmount: '437,000.00', totalQty: '460', products: ['PP InnoPlus HS150'], qtys: ['460'] });
const IV14 = buildInsVals({ invoiceNo: '1015050014', etdPort: 'MAP TA PHUT PORT, THAILAND', etaPort: 'JAKARTA, INDONESIA', vesselName: 'MV JAVA EXPRESS', giDate: '14 Mar 2026', totalAmount: '354,900.00', totalQty: '390', products: ['LDPE InnoPlus LD2420H'], qtys: ['390'] });
const IV15 = buildInsVals({ invoiceNo: '1015050015', etdPort: 'LAEM CHABANG PORT, THAILAND', etaPort: 'HUANGPU, CHINA', vesselName: 'MV SOUTH CHINA SEA', giDate: '15 Mar 2026', totalAmount: '483,600.00', totalQty: '520', products: ['HDPE InnoPlus HD2200JP'], qtys: ['520'] });
const IV16 = buildInsVals({ invoiceNo: '1015050016', etdPort: 'MAP TA PHUT PORT, THAILAND', etaPort: 'TIANJIN, CHINA', vesselName: 'MV BOHAI TRADER', giDate: '16 Mar 2026', totalAmount: '720,000.00', totalQty: '750', products: ['PP InnoPlus MA2100'], qtys: ['750'] });
const IV17 = buildInsVals({ invoiceNo: '1015050017', etdPort: 'LAEM CHABANG PORT, THAILAND', etaPort: 'PORT KLANG, MALAYSIA', vesselName: 'MV STRAITS FORTUNE', giDate: '17 Mar 2026', totalAmount: '385,000.00', totalQty: '440', products: ['LLDPE InnoPlus LL6101G'], qtys: ['440'], isLC: true });
const IV18 = buildInsVals({ invoiceNo: '1015050018', etdPort: 'MAP TA PHUT PORT, THAILAND', etaPort: 'QINGDAO, CHINA', vesselName: 'MV PACIFIC JADE', giDate: '18 Mar 2026', totalAmount: '275,500.00', totalQty: '290', products: ['PP InnoPlus HS150'], qtys: ['290'] });
const IV19 = buildInsVals({ invoiceNo: '1015050019', etdPort: 'LAEM CHABANG PORT, THAILAND', etaPort: 'BUSAN, SOUTH KOREA', vesselName: 'MV BUSAN PEARL', giDate: '19 Mar 2026', totalAmount: '578,100.00', totalQty: '615', products: ['HDPE InnoPlus HB5400P'], qtys: ['615'] });
const IV20 = buildInsVals({ invoiceNo: '1015050020', etdPort: 'MAP TA PHUT PORT, THAILAND', etaPort: 'SINGAPORE', vesselName: 'MV SINGAPORE TRADER', giDate: '20 Mar 2026', totalAmount: '321,900.00', totalQty: '370', products: ['LLDPE InnoPlus LL6100F'], qtys: ['370'] });

// ─── Mock Tasks ───────────────────────────────────────────────────────────────

export const mockTasks: Task[] = [

  // T01 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030001', shipmentRef: 'SHP-2026-001', shipper: 'PTT Global Chemical PCL',
    consignee: 'GC Marketing Solutions (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-01T08:00:00Z', lastUpdate: '2026-03-01T09:00:00Z', assignedTo: 'jane.doe@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050001', 'REF NO.': '3252010001', "BUYER'S ORDER NO.": '3252010001',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'HUANGPU, CHINA',
      'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
      'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HD2200JP', 'QUANTITY LINE ITEM#1': '720',
      'TOTAL QUANTITY': '720', 'AMOUNT LINE ITEM#1': '669,600.00', 'TOTAL AMOUNT': '669,600.00',
      'FREIGHT': '28,800.00', 'INCOTERMS': 'CIF HUANGPU, CHINA',
      'TOTAL NET WEIGHT': '720,000', 'TOTAL GROSS WEIGHT': '727,200', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_GCM,
      ...IV01,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.',
      'Vessel Name': 'MV PACIFIC EXPRESS', 'Gross Weight': '727,200 KG',
      'GI Date': '01 Mar 2026', 'ETD Date': '01 Mar 2026', 'Manual Billing Date': '01 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T01', {
        'INVOICE NO.': '1015050001', 'REF NO.': '3252010001', "BUYER'S ORDER NO.": '3252010001',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'HUANGPU, CHINA',
        'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
        'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HD2200JP', 'QUANTITY LINE ITEM#1': '720',
        'TOTAL QUANTITY': '720', 'AMOUNT LINE ITEM#1': '669,600.00', 'TOTAL AMOUNT': '669,600.00',
        'FREIGHT': '28,800.00', 'INCOTERMS': 'CIF HUANGPU, CHINA',
        'TOTAL NET WEIGHT': '720,000', 'TOTAL GROSS WEIGHT': '727,200', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_GCM,
      }),
      ...insDocs('doc-T01', IV01),
      ...dblDocs('doc-T01', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.', 'Vessel Name': 'MV PACIFIC EXPRESS', 'Gross Weight': '727,200 KG' }),
      oblDoc('doc-T01', '01 Mar 2026'),
    ],
  },

  // T02 — CF: Needs Attention (CI BUYER'S ORDER NO. wrong) | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030002', shipmentRef: 'SHP-2026-002', shipper: 'PTT Global Chemical PCL',
    consignee: 'Sinopec Tianjin Chemicals Co., Ltd.',
    submittedDate: '2026-03-02T08:05:00Z', lastUpdate: '2026-03-02T10:30:00Z', assignedTo: 'john.smith@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050002', 'REF NO.': '3252010002', "BUYER'S ORDER NO.": '3252010002',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'TIANJIN, CHINA',
      'PAYMENT TERM': 'IRREVOCABLE L/C AT SIGHT',
      'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6100F', 'QUANTITY LINE ITEM#1': '500',
      'TOTAL QUANTITY': '500', 'AMOUNT LINE ITEM#1': '435,000.00', 'TOTAL AMOUNT': '435,000.00',
      'FREIGHT': '20,000.00', 'INCOTERMS': 'CIF TIANJIN, CHINA',
      'TOTAL NET WEIGHT': '500,000', 'TOTAL GROSS WEIGHT': '505,000', 'MARKS & NOS': 'INNOPLUS',
      'L/C NO.': 'LLQ1225ILS359656',
      ...IV02,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Sinopec Tianjin Chemicals Co., Ltd.',
      'Vessel Name': 'MV ASIAN STAR', 'Gross Weight': '505,000 KG',
      'GI Date': '02 Mar 2026', 'ETD Date': '02 Mar 2026', 'Manual Billing Date': '02 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T02', {
        'INVOICE NO.': '1015050002', 'REF NO.': '3252010002', "BUYER'S ORDER NO.": '3252010002',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'TIANJIN, CHINA',
        'PAYMENT TERM': 'IRREVOCABLE L/C AT SIGHT',
        'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6100F', 'QUANTITY LINE ITEM#1': '500',
        'TOTAL QUANTITY': '500', 'AMOUNT LINE ITEM#1': '435,000.00', 'TOTAL AMOUNT': '435,000.00',
        'FREIGHT': '20,000.00', 'INCOTERMS': 'CIF TIANJIN, CHINA',
        'TOTAL NET WEIGHT': '500,000', 'TOTAL GROSS WEIGHT': '505,000', 'MARKS & NOS': 'INNOPLUS',
        'L/C NO.': 'LLQ1225ILS359656',
      }, { "BUYER'S ORDER NO.": '3252019999' }, true),  // ← CI mismatch, L/C docs
      ...insDocs('doc-T02', IV02),
      ...dblDocs('doc-T02', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Sinopec Tianjin Chemicals Co., Ltd.', 'Vessel Name': 'MV ASIAN STAR', 'Gross Weight': '505,000 KG' }),
      oblDoc('doc-T02', '02 Mar 2026'),
    ],
  },

  // T03 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030003', shipmentRef: 'SHP-2026-003', shipper: 'PTT Global Chemical PCL',
    consignee: 'Qingdao Jifa Group Co., Ltd.',
    submittedDate: '2026-03-03T08:10:00Z', lastUpdate: '2026-03-03T11:15:00Z', assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050003', 'REF NO.': '3252010003', "BUYER'S ORDER NO.": '3252010003',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'QINGDAO, CHINA',
      'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
      'PRODUCT LINE ITEM#1': 'PP InnoPlus HS150', 'QUANTITY LINE ITEM#1': '300',
      'TOTAL QUANTITY': '300', 'AMOUNT LINE ITEM#1': '285,000.00', 'TOTAL AMOUNT': '285,000.00',
      'FREIGHT': '12,000.00', 'INCOTERMS': 'CFR QINGDAO, CHINA',
      'TOTAL NET WEIGHT': '300,000', 'TOTAL GROSS WEIGHT': '303,000', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.QINGDAO_JIFA,
      ...IV03,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Qingdao Jifa Group Co., Ltd.',
      'Vessel Name': 'MV THAI SPIRIT', 'Gross Weight': '303,000 KG',
      'GI Date': '03 Mar 2026', 'ETD Date': '03 Mar 2026', 'Manual Billing Date': '03 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T03', {
        'INVOICE NO.': '1015050003', 'REF NO.': '3252010003', "BUYER'S ORDER NO.": '3252010003',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'QINGDAO, CHINA',
        'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
        'PRODUCT LINE ITEM#1': 'PP InnoPlus HS150', 'QUANTITY LINE ITEM#1': '300',
        'TOTAL QUANTITY': '300', 'AMOUNT LINE ITEM#1': '285,000.00', 'TOTAL AMOUNT': '285,000.00',
        'FREIGHT': '12,000.00', 'INCOTERMS': 'CFR QINGDAO, CHINA',
        'TOTAL NET WEIGHT': '300,000', 'TOTAL GROSS WEIGHT': '303,000', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.QINGDAO_JIFA,
      }),
      ...insDocs('doc-T03', IV03),
      ...dblDocs('doc-T03', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Qingdao Jifa Group Co., Ltd.', 'Vessel Name': 'MV THAI SPIRIT', 'Gross Weight': '303,000 KG' }),
      oblDoc('doc-T03', '03 Mar 2026'),
    ],
  },

  // T04 — CF: All Matches | Ins: Needs Attention | BL: All Matches | BL Date: Pending
  {
    id: '2026030004', shipmentRef: 'SHP-2026-004', shipper: 'PTT Global Chemical PCL',
    consignee: 'BASF Trading (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-04T08:15:00Z', lastUpdate: '2026-03-04T12:00:00Z', assignedTo: 'james.tan@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050004', 'REF NO.': '3252010004', "BUYER'S ORDER NO.": '3252010004',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'SHANGHAI, CHINA',
      'PAYMENT TERM': 'D/P AT SIGHT',
      'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HB5400P', 'QUANTITY LINE ITEM#1': '400',
      'TOTAL QUANTITY': '400', 'AMOUNT LINE ITEM#1': '376,000.00', 'TOTAL AMOUNT': '376,000.00',
      'FREIGHT': '16,000.00', 'INCOTERMS': 'CIF SHANGHAI, CHINA',
      'TOTAL NET WEIGHT': '400,000', 'TOTAL GROSS WEIGHT': '404,000', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_BASF,
      ...IV04,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'BASF Trading (Shanghai) Co., Ltd.',
      'Vessel Name': 'MV GOLDEN BRIDGE', 'Gross Weight': '404,000 KG',
      'GI Date': '04 Mar 2026', 'ETD Date': '04 Mar 2026', 'Manual Billing Date': '04 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T04', {
        'INVOICE NO.': '1015050004', 'REF NO.': '3252010004', "BUYER'S ORDER NO.": '3252010004',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'SHANGHAI, CHINA',
        'PAYMENT TERM': 'D/P AT SIGHT',
        'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HB5400P', 'QUANTITY LINE ITEM#1': '400',
        'TOTAL QUANTITY': '400', 'AMOUNT LINE ITEM#1': '376,000.00', 'TOTAL AMOUNT': '376,000.00',
        'FREIGHT': '16,000.00', 'INCOTERMS': 'CIF SHANGHAI, CHINA',
        'TOTAL NET WEIGHT': '400,000', 'TOTAL GROSS WEIGHT': '404,000', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_BASF,
      }),
      ...insDocs('doc-T04', IV04, { 'AMOUNT INSURED HEREUNDER': 'USD 400,000.00' }),  // ← insurance mismatch
      ...dblDocs('doc-T04', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'BASF Trading (Shanghai) Co., Ltd.', 'Vessel Name': 'MV GOLDEN BRIDGE', 'Gross Weight': '404,000 KG' }),
    ],
  },

  // T05 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: Pending
  {
    id: '2026030005', shipmentRef: 'SHP-2026-005', shipper: 'PTT Global Chemical PCL',
    consignee: 'Dow Chemical Singapore Pte. Ltd.',
    submittedDate: '2026-03-05T08:20:00Z', lastUpdate: '2026-03-05T12:00:00Z', assignedTo: 'sarah.lim@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050005', 'REF NO.': '3252010005', "BUYER'S ORDER NO.": '3252010005',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'SINGAPORE',
      'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
      'PRODUCT LINE ITEM#1': 'PP InnoPlus MA2100', 'QUANTITY LINE ITEM#1': '600',
      'TOTAL QUANTITY': '600', 'AMOUNT LINE ITEM#1': '576,000.00', 'TOTAL AMOUNT': '576,000.00',
      'FREIGHT': '', 'INCOTERMS': 'FOB LAEM CHABANG PORT, THAILAND',
      'TOTAL NET WEIGHT': '600,000', 'TOTAL GROSS WEIGHT': '606,000', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SINGAPORE_DOW,
      ...IV05,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Dow Chemical Singapore Pte. Ltd.',
      'Vessel Name': 'MV EMERALD SEA', 'Gross Weight': '606,000 KG',
      'GI Date': '05 Mar 2026', 'ETD Date': '05 Mar 2026', 'Manual Billing Date': '05 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T05', {
        'INVOICE NO.': '1015050005', 'REF NO.': '3252010005', "BUYER'S ORDER NO.": '3252010005',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'SINGAPORE',
        'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
        'PRODUCT LINE ITEM#1': 'PP InnoPlus MA2100', 'QUANTITY LINE ITEM#1': '600',
        'TOTAL QUANTITY': '600', 'AMOUNT LINE ITEM#1': '576,000.00', 'TOTAL AMOUNT': '576,000.00',
        'FREIGHT': '', 'INCOTERMS': 'FOB LAEM CHABANG PORT, THAILAND',
        'TOTAL NET WEIGHT': '600,000', 'TOTAL GROSS WEIGHT': '606,000', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SINGAPORE_DOW,
      }),
      ...insDocs('doc-T05', IV05),
      ...dblDocs('doc-T05', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Dow Chemical Singapore Pte. Ltd.', 'Vessel Name': 'MV EMERALD SEA', 'Gross Weight': '606,000 KG' }),
    ],
  },

  // T06 — CF: All Matches | Ins: All Matches | BL: Needs Attention | BL Date: All Matches
  {
    id: '2026030006', shipmentRef: 'SHP-2026-006', shipper: 'PTT Global Chemical PCL',
    consignee: 'LG Chem Ltd.',
    submittedDate: '2026-03-06T08:25:00Z', lastUpdate: '2026-03-06T12:00:00Z', assignedTo: 'alice.tan@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050006', 'REF NO.': '3252010006', "BUYER'S ORDER NO.": '3252010006',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'BUSAN, SOUTH KOREA',
      'PAYMENT TERM': 'D/P AT SIGHT',
      'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6101G', 'QUANTITY LINE ITEM#1': '480',
      'TOTAL QUANTITY': '480', 'AMOUNT LINE ITEM#1': '420,000.00', 'TOTAL AMOUNT': '420,000.00',
      'FREIGHT': '19,200.00', 'INCOTERMS': 'CIF BUSAN, SOUTH KOREA',
      'TOTAL NET WEIGHT': '480,000', 'TOTAL GROSS WEIGHT': '484,800', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.BUSAN_LG,
      ...IV06,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'LG Chem Ltd.',
      'Vessel Name': 'MV KOREA TRADER', 'Gross Weight': '484,800 KG',
      'GI Date': '06 Mar 2026', 'ETD Date': '06 Mar 2026', 'Manual Billing Date': '06 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T06', {
        'INVOICE NO.': '1015050006', 'REF NO.': '3252010006', "BUYER'S ORDER NO.": '3252010006',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'BUSAN, SOUTH KOREA',
        'PAYMENT TERM': 'D/P AT SIGHT',
        'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6101G', 'QUANTITY LINE ITEM#1': '480',
        'TOTAL QUANTITY': '480', 'AMOUNT LINE ITEM#1': '420,000.00', 'TOTAL AMOUNT': '420,000.00',
        'FREIGHT': '19,200.00', 'INCOTERMS': 'CIF BUSAN, SOUTH KOREA',
        'TOTAL NET WEIGHT': '480,000', 'TOTAL GROSS WEIGHT': '484,800', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.BUSAN_LG,
      }),
      ...insDocs('doc-T06', IV06),
      ...dblDocs('doc-T06', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'LG Chem Ltd.', 'Vessel Name': 'MV KOREA TRADER', 'Gross Weight': '484,800 KG' },
        { 'Vessel Name': 'MV KOREA EXPRESS' }),  // ← draftBL mismatch
      // oblDoc('doc-T06', '06 Mar 2026'),
    ],
  },

  // T07 — CF: Needs Attention (CI PAYMENT TERM wrong) | Ins: Pending | BL: Pending | BL Date: Pending
  {
    id: '2026030007', shipmentRef: 'SHP-2026-007', shipper: 'PTT Global Chemical PCL',
    consignee: 'PT. Chandra Asri Petrochemical Tbk',
    submittedDate: '2026-03-07T08:30:00Z', lastUpdate: '2026-03-07T12:00:00Z', assignedTo: 'john.smith@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050007', 'REF NO.': '3252010007', "BUYER'S ORDER NO.": '3252010007',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'JAKARTA, INDONESIA',
      'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
      'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HD2200JP', 'QUANTITY LINE ITEM#1': '350',
      'TOTAL QUANTITY': '350', 'AMOUNT LINE ITEM#1': '325,500.00', 'TOTAL AMOUNT': '325,500.00',
      'FREIGHT': '14,000.00', 'INCOTERMS': 'CIF JAKARTA, INDONESIA',
      'TOTAL NET WEIGHT': '350,000', 'TOTAL GROSS WEIGHT': '353,500', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.JAKARTA_CAP,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'PT. Chandra Asri Petrochemical Tbk',
      'Vessel Name': 'MV JAVA PEARL', 'Gross Weight': '353,500 KG',
      'GI Date': '07 Mar 2026', 'ETD Date': '07 Mar 2026', 'Manual Billing Date': '07 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T07', {
        'INVOICE NO.': '1015050007', 'REF NO.': '3252010007', "BUYER'S ORDER NO.": '3252010007',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'JAKARTA, INDONESIA',
        'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
        'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HD2200JP', 'QUANTITY LINE ITEM#1': '350',
        'TOTAL QUANTITY': '350', 'AMOUNT LINE ITEM#1': '325,500.00', 'TOTAL AMOUNT': '325,500.00',
        'FREIGHT': '14,000.00', 'INCOTERMS': 'CIF JAKARTA, INDONESIA',
        'TOTAL NET WEIGHT': '350,000', 'TOTAL GROSS WEIGHT': '353,500', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.JAKARTA_CAP,
      }, { 'PAYMENT TERM': 'L/C AT SIGHT' }),  // ← CI mismatch
    ],
  },

  // T08 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030008', shipmentRef: 'SHP-2026-008', shipper: 'PTT Global Chemical PCL',
    consignee: 'Sinopec Tianjin Chemicals Co., Ltd.',
    submittedDate: '2026-03-08T08:35:00Z', lastUpdate: '2026-03-08T12:00:00Z', assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050008', 'REF NO.': '3252010008', "BUYER'S ORDER NO.": '3252010008',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'TIANJIN, CHINA',
      'PAYMENT TERM': 'IRREVOCABLE L/C AT SIGHT',
      'PRODUCT LINE ITEM#1': 'PP InnoPlus HS150', 'QUANTITY LINE ITEM#1': '550',
      'TOTAL QUANTITY': '550', 'AMOUNT LINE ITEM#1': '522,500.00', 'TOTAL AMOUNT': '522,500.00',
      'FREIGHT': '22,000.00', 'INCOTERMS': 'CIF TIANJIN, CHINA',
      'TOTAL NET WEIGHT': '550,000', 'TOTAL GROSS WEIGHT': '555,500', 'MARKS & NOS': 'INNOPLUS',
      'L/C NO.': 'LLQ1226ILS441283',
      ...IV08,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Sinopec Tianjin Chemicals Co., Ltd.',
      'Vessel Name': 'MV NORTHERN LIGHT', 'Gross Weight': '555,500 KG',
      'GI Date': '08 Mar 2026', 'ETD Date': '08 Mar 2026', 'Manual Billing Date': '08 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T08', {
        'INVOICE NO.': '1015050008', 'REF NO.': '3252010008', "BUYER'S ORDER NO.": '3252010008',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'TIANJIN, CHINA',
        'PAYMENT TERM': 'IRREVOCABLE L/C AT SIGHT',
        'PRODUCT LINE ITEM#1': 'PP InnoPlus HS150', 'QUANTITY LINE ITEM#1': '550',
        'TOTAL QUANTITY': '550', 'AMOUNT LINE ITEM#1': '522,500.00', 'TOTAL AMOUNT': '522,500.00',
        'FREIGHT': '22,000.00', 'INCOTERMS': 'CIF TIANJIN, CHINA',
        'TOTAL NET WEIGHT': '550,000', 'TOTAL GROSS WEIGHT': '555,500', 'MARKS & NOS': 'INNOPLUS',
        'L/C NO.': 'LLQ1226ILS441283',
      }, undefined, true),
      ...insDocs('doc-T08', IV08),
      ...dblDocs('doc-T08', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Sinopec Tianjin Chemicals Co., Ltd.', 'Vessel Name': 'MV NORTHERN LIGHT', 'Gross Weight': '555,500 KG' }),
      oblDoc('doc-T08', '08 Mar 2026'),
    ],
  },

  // T09 — CF: All Matches | Ins: Pending | BL: All Matches | BL Date: Pending
  {
    id: '2026030009', shipmentRef: 'SHP-2026-009', shipper: 'PTT Global Chemical PCL',
    consignee: 'GC Marketing Solutions (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-09T08:40:00Z', lastUpdate: '2026-03-09T12:00:00Z', assignedTo: 'jane.doe@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050009', 'REF NO.': '3252010009', "BUYER'S ORDER NO.": '3252010009',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'HUANGPU, CHINA',
      'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
      'PRODUCT LINE ITEM#1': 'LDPE InnoPlus LD2420H', 'QUANTITY LINE ITEM#1': '300',
      'PRODUCT LINE ITEM#2': 'HDPE InnoPlus HD2200JP', 'QUANTITY LINE ITEM#2': '120', 'AMOUNT LINE ITEM#2': '111,600.00',
      'TOTAL QUANTITY': '420', 'AMOUNT LINE ITEM#1': '273,000.00', 'TOTAL AMOUNT': '384,600.00',
      'FREIGHT': '16,800.00', 'INCOTERMS': 'CFR HUANGPU, CHINA',
      'TOTAL NET WEIGHT': '420,000', 'TOTAL GROSS WEIGHT': '424,200', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_GCM,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.',
      'Vessel Name': 'MV CHINA FORTUNE', 'Gross Weight': '424,200 KG',
      'GI Date': '09 Mar 2026', 'ETD Date': '09 Mar 2026', 'Manual Billing Date': '09 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T09', {
        'INVOICE NO.': '1015050009', 'REF NO.': '3252010009', "BUYER'S ORDER NO.": '3252010009',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'HUANGPU, CHINA',
        'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
        'PRODUCT LINE ITEM#1': 'LDPE InnoPlus LD2420H', 'QUANTITY LINE ITEM#1': '300',
        'PRODUCT LINE ITEM#2': 'HDPE InnoPlus HD2200JP', 'QUANTITY LINE ITEM#2': '120', 'AMOUNT LINE ITEM#2': '111,600.00',
        'TOTAL QUANTITY': '420', 'AMOUNT LINE ITEM#1': '273,000.00', 'TOTAL AMOUNT': '384,600.00',
        'FREIGHT': '16,800.00', 'INCOTERMS': 'CFR HUANGPU, CHINA',
        'TOTAL NET WEIGHT': '420,000', 'TOTAL GROSS WEIGHT': '424,200', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_GCM,
      }),
      ...dblDocs('doc-T09', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.', 'Vessel Name': 'MV CHINA FORTUNE', 'Gross Weight': '424,200 KG' }),
    ],
  },

  // T10 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030010', shipmentRef: 'SHP-2026-010', shipper: 'PTT Global Chemical PCL',
    consignee: 'Qingdao Jifa Group Co., Ltd.',
    submittedDate: '2026-03-10T08:45:00Z', lastUpdate: '2026-03-10T12:00:00Z', assignedTo: 'james.tan@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050010', 'REF NO.': '3252010010', "BUYER'S ORDER NO.": '3252010010',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'QINGDAO, CHINA',
      'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
      'PRODUCT LINE ITEM#1': 'PP InnoPlus MA2100', 'QUANTITY LINE ITEM#1': '180',
      'PRODUCT LINE ITEM#2': 'PP InnoPlus HS150', 'QUANTITY LINE ITEM#2': '100', 'AMOUNT LINE ITEM#2': '95,000.00',
      'TOTAL QUANTITY': '280', 'AMOUNT LINE ITEM#1': '172,800.00', 'TOTAL AMOUNT': '267,800.00',
      'FREIGHT': '11,200.00', 'INCOTERMS': 'CIF QINGDAO, CHINA',
      'TOTAL NET WEIGHT': '280,000', 'TOTAL GROSS WEIGHT': '282,800', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.QINGDAO_JIFA,
      ...IV10,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Qingdao Jifa Group Co., Ltd.',
      'Vessel Name': 'MV DRAGON GATE', 'Gross Weight': '282,800 KG',
      'GI Date': '10 Mar 2026', 'ETD Date': '10 Mar 2026', 'Manual Billing Date': '10 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T10', {
        'INVOICE NO.': '1015050010', 'REF NO.': '3252010010', "BUYER'S ORDER NO.": '3252010010',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'QINGDAO, CHINA',
        'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
        'PRODUCT LINE ITEM#1': 'PP InnoPlus MA2100', 'QUANTITY LINE ITEM#1': '180',
        'PRODUCT LINE ITEM#2': 'PP InnoPlus HS150', 'QUANTITY LINE ITEM#2': '100', 'AMOUNT LINE ITEM#2': '95,000.00',
        'TOTAL QUANTITY': '280', 'AMOUNT LINE ITEM#1': '172,800.00', 'TOTAL AMOUNT': '267,800.00',
        'FREIGHT': '11,200.00', 'INCOTERMS': 'CIF QINGDAO, CHINA',
        'TOTAL NET WEIGHT': '280,000', 'TOTAL GROSS WEIGHT': '282,800', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.QINGDAO_JIFA,
      }),
      ...insDocs('doc-T10', IV10),
      ...dblDocs('doc-T10', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Qingdao Jifa Group Co., Ltd.', 'Vessel Name': 'MV DRAGON GATE', 'Gross Weight': '282,800 KG' }),
      // oblDoc('doc-T10', '10 Mar 2026'),
    ],
  },

  // T11 — CF: Needs Attention (CI AMOUNT wrong) | Ins: All Matches | BL: Needs Attention | BL Date: All Matches
  {
    id: '2026030011', shipmentRef: 'SHP-2026-011', shipper: 'PTT Global Chemical PCL',
    consignee: 'Petronas Chemicals Group Bhd',
    submittedDate: '2026-03-11T08:50:00Z', lastUpdate: '2026-03-11T12:00:00Z', assignedTo: 'sarah.lim@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050011', 'REF NO.': '3252010011', "BUYER'S ORDER NO.": '3252010011',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'PORT KLANG, MALAYSIA',
      'PAYMENT TERM': 'IRREVOCABLE L/C AT SIGHT',
      'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HB5400P', 'QUANTITY LINE ITEM#1': '630',
      'TOTAL QUANTITY': '630', 'AMOUNT LINE ITEM#1': '592,200.00', 'TOTAL AMOUNT': '592,200.00',
      'FREIGHT': '25,200.00', 'INCOTERMS': 'CIF PORT KLANG, MALAYSIA',
      'TOTAL NET WEIGHT': '630,000', 'TOTAL GROSS WEIGHT': '636,300', 'MARKS & NOS': 'INNOPLUS',
      'L/C NO.': 'LLQ1227ILS502947',
      ...IV11,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Petronas Chemicals Group Bhd',
      'Vessel Name': 'MV MALAY EXPRESS', 'Gross Weight': '636,300 KG',
      'GI Date': '11 Mar 2026', 'ETD Date': '11 Mar 2026', 'Manual Billing Date': '11 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T11', {
        'INVOICE NO.': '1015050011', 'REF NO.': '3252010011', "BUYER'S ORDER NO.": '3252010011',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'PORT KLANG, MALAYSIA',
        'PAYMENT TERM': 'IRREVOCABLE L/C AT SIGHT',
        'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HB5400P', 'QUANTITY LINE ITEM#1': '630',
        'TOTAL QUANTITY': '630', 'AMOUNT LINE ITEM#1': '592,200.00', 'TOTAL AMOUNT': '592,200.00',
        'FREIGHT': '25,200.00', 'INCOTERMS': 'CIF PORT KLANG, MALAYSIA',
        'TOTAL NET WEIGHT': '630,000', 'TOTAL GROSS WEIGHT': '636,300', 'MARKS & NOS': 'INNOPLUS',
        'L/C NO.': 'LLQ1227ILS502947',
      }, { 'AMOUNT LINE ITEM#1': '580,000.00', 'TOTAL AMOUNT': '580,000.00' }, true),  // ← CI mismatch, L/C docs
      ...insDocs('doc-T11', IV11),
      ...dblDocs('doc-T11', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Petronas Chemicals Group Bhd', 'Vessel Name': 'MV MALAY EXPRESS', 'Gross Weight': '636,300 KG' },
        { 'Gross Weight': '630,000 KG' }),  // ← draftBL mismatch
      // oblDoc('doc-T11', '11 Mar 2026'),
    ],
  },

  // T12 — CF: All Matches | Ins: Pending | BL: Pending | BL Date: All Matches
  {
    id: '2026030012', shipmentRef: 'SHP-2026-012', shipper: 'PTT Global Chemical PCL',
    consignee: 'LG Chem Ltd.',
    submittedDate: '2026-03-12T08:55:00Z', lastUpdate: '2026-03-12T12:00:00Z', assignedTo: 'alice.tan@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050012', 'REF NO.': '3252010012', "BUYER'S ORDER NO.": '3252010012',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'BUSAN, SOUTH KOREA',
      'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
      'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6100F', 'QUANTITY LINE ITEM#1': '210',
      'PRODUCT LINE ITEM#2': 'LLDPE InnoPlus LL6101G', 'QUANTITY LINE ITEM#2': '100', 'AMOUNT LINE ITEM#2': '87,500.00',
      'TOTAL QUANTITY': '310', 'AMOUNT LINE ITEM#1': '182,700.00', 'TOTAL AMOUNT': '270,200.00',
      'FREIGHT': '12,400.00', 'INCOTERMS': 'CFR BUSAN, SOUTH KOREA',
      'TOTAL NET WEIGHT': '310,000', 'TOTAL GROSS WEIGHT': '313,100', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.BUSAN_LG,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'LG Chem Ltd.',
      'Vessel Name': 'MV ORIENT STAR', 'Gross Weight': '313,100 KG',
      'GI Date': '12 Mar 2026', 'ETD Date': '12 Mar 2026', 'Manual Billing Date': '12 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T12', {
        'INVOICE NO.': '1015050012', 'REF NO.': '3252010012', "BUYER'S ORDER NO.": '3252010012',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'BUSAN, SOUTH KOREA',
        'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
        'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6100F', 'QUANTITY LINE ITEM#1': '210',
        'PRODUCT LINE ITEM#2': 'LLDPE InnoPlus LL6101G', 'QUANTITY LINE ITEM#2': '100', 'AMOUNT LINE ITEM#2': '87,500.00',
        'TOTAL QUANTITY': '310', 'AMOUNT LINE ITEM#1': '182,700.00', 'TOTAL AMOUNT': '270,200.00',
        'FREIGHT': '12,400.00', 'INCOTERMS': 'CFR BUSAN, SOUTH KOREA',
        'TOTAL NET WEIGHT': '310,000', 'TOTAL GROSS WEIGHT': '313,100', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.BUSAN_LG,
      }),
      // oblDoc('doc-T12', '12 Mar 2026'),
    ],
  },

  // T13 — CF: All Matches | Ins: Needs Attention | BL: Needs Attention | BL Date: Pending
  {
    id: '2026030013', shipmentRef: 'SHP-2026-013', shipper: 'PTT Global Chemical PCL',
    consignee: 'BASF Trading (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-13T09:00:00Z', lastUpdate: '2026-03-13T12:00:00Z', assignedTo: 'jane.doe@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050013', 'REF NO.': '3252010013', "BUYER'S ORDER NO.": '3252010013',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'SHANGHAI, CHINA',
      'PAYMENT TERM': 'D/P AT SIGHT',
      'PRODUCT LINE ITEM#1': 'PP InnoPlus HS150', 'QUANTITY LINE ITEM#1': '460',
      'TOTAL QUANTITY': '460', 'AMOUNT LINE ITEM#1': '437,000.00', 'TOTAL AMOUNT': '437,000.00',
      'FREIGHT': '18,400.00', 'INCOTERMS': 'CIF SHANGHAI, CHINA',
      'TOTAL NET WEIGHT': '460,000', 'TOTAL GROSS WEIGHT': '464,600', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_BASF,
      ...IV13,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'BASF Trading (Shanghai) Co., Ltd.',
      'Vessel Name': 'MV SHANGHAI GLORY', 'Gross Weight': '464,600 KG',
      'GI Date': '13 Mar 2026', 'ETD Date': '13 Mar 2026', 'Manual Billing Date': '13 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T13', {
        'INVOICE NO.': '1015050013', 'REF NO.': '3252010013', "BUYER'S ORDER NO.": '3252010013',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'SHANGHAI, CHINA',
        'PAYMENT TERM': 'D/P AT SIGHT',
        'PRODUCT LINE ITEM#1': 'PP InnoPlus HS150', 'QUANTITY LINE ITEM#1': '460',
        'TOTAL QUANTITY': '460', 'AMOUNT LINE ITEM#1': '437,000.00', 'TOTAL AMOUNT': '437,000.00',
        'FREIGHT': '18,400.00', 'INCOTERMS': 'CIF SHANGHAI, CHINA',
        'TOTAL NET WEIGHT': '460,000', 'TOTAL GROSS WEIGHT': '464,600', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_BASF,
      }),
      ...insDocs('doc-T13', IV13, { 'INTEREST, MARKS AND NOS./SUBJECT - MATTER INSURED': '460.000 MT OF PP INNOPLUS HS200 IN 25 KG BAGS' }),  // ← insurance mismatch
      ...dblDocs('doc-T13', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'BASF Trading (Shanghai) Co., Ltd.', 'Vessel Name': 'MV SHANGHAI GLORY', 'Gross Weight': '464,600 KG' },
        { 'Consignee': 'BASF Chemical (Shanghai) Co., Ltd.' }),  // ← draftBL mismatch
    ],
  },

  // T14 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030014', shipmentRef: 'SHP-2026-014', shipper: 'PTT Global Chemical PCL',
    consignee: 'PT. Chandra Asri Petrochemical Tbk',
    submittedDate: '2026-03-14T09:05:00Z', lastUpdate: '2026-03-14T12:00:00Z', assignedTo: 'john.smith@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050014', 'REF NO.': '3252010014', "BUYER'S ORDER NO.": '3252010014',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'JAKARTA, INDONESIA',
      'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
      'PRODUCT LINE ITEM#1': 'LDPE InnoPlus LD2420H', 'QUANTITY LINE ITEM#1': '390',
      'TOTAL QUANTITY': '390', 'AMOUNT LINE ITEM#1': '354,900.00', 'TOTAL AMOUNT': '354,900.00',
      'FREIGHT': '15,600.00', 'INCOTERMS': 'CFR JAKARTA, INDONESIA',
      'TOTAL NET WEIGHT': '390,000', 'TOTAL GROSS WEIGHT': '393,900', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.JAKARTA_CAP,
      ...IV14,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'PT. Chandra Asri Petrochemical Tbk',
      'Vessel Name': 'MV JAVA EXPRESS', 'Gross Weight': '393,900 KG',
      'GI Date': '14 Mar 2026', 'ETD Date': '14 Mar 2026', 'Manual Billing Date': '14 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T14', {
        'INVOICE NO.': '1015050014', 'REF NO.': '3252010014', "BUYER'S ORDER NO.": '3252010014',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'JAKARTA, INDONESIA',
        'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
        'PRODUCT LINE ITEM#1': 'LDPE InnoPlus LD2420H', 'QUANTITY LINE ITEM#1': '390',
        'TOTAL QUANTITY': '390', 'AMOUNT LINE ITEM#1': '354,900.00', 'TOTAL AMOUNT': '354,900.00',
        'FREIGHT': '15,600.00', 'INCOTERMS': 'CFR JAKARTA, INDONESIA',
        'TOTAL NET WEIGHT': '390,000', 'TOTAL GROSS WEIGHT': '393,900', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.JAKARTA_CAP,
      }),
      ...insDocs('doc-T14', IV14),
      ...dblDocs('doc-T14', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'PT. Chandra Asri Petrochemical Tbk', 'Vessel Name': 'MV JAVA EXPRESS', 'Gross Weight': '393,900 KG' }),
      // oblDoc('doc-T14', '14 Mar 2026'),
    ],
  },

  // T15 — CF: Needs Attention (CI REF NO. wrong) | Ins: All Matches | BL: All Matches | BL Date: Pending
  {
    id: '2026030015', shipmentRef: 'SHP-2026-015', shipper: 'PTT Global Chemical PCL',
    consignee: 'GC Marketing Solutions (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-15T09:10:00Z', lastUpdate: '2026-03-15T12:00:00Z', assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050015', 'REF NO.': '3252010015', "BUYER'S ORDER NO.": '3252010015',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'HUANGPU, CHINA',
      'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
      'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HD2200JP', 'QUANTITY LINE ITEM#1': '520',
      'TOTAL QUANTITY': '520', 'AMOUNT LINE ITEM#1': '483,600.00', 'TOTAL AMOUNT': '483,600.00',
      'FREIGHT': '20,800.00', 'INCOTERMS': 'CIF HUANGPU, CHINA',
      'TOTAL NET WEIGHT': '520,000', 'TOTAL GROSS WEIGHT': '525,200', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_GCM,
      ...IV15,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.',
      'Vessel Name': 'MV SOUTH CHINA SEA', 'Gross Weight': '525,200 KG',
      'GI Date': '15 Mar 2026', 'ETD Date': '15 Mar 2026', 'Manual Billing Date': '15 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T15', {
        'INVOICE NO.': '1015050015', 'REF NO.': '3252010015', "BUYER'S ORDER NO.": '3252010015',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'HUANGPU, CHINA',
        'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
        'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HD2200JP', 'QUANTITY LINE ITEM#1': '520',
        'TOTAL QUANTITY': '520', 'AMOUNT LINE ITEM#1': '483,600.00', 'TOTAL AMOUNT': '483,600.00',
        'FREIGHT': '20,800.00', 'INCOTERMS': 'CIF HUANGPU, CHINA',
        'TOTAL NET WEIGHT': '520,000', 'TOTAL GROSS WEIGHT': '525,200', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_GCM,
      }, { 'REF NO.': '3252011111' }),  // ← CI mismatch
      ...insDocs('doc-T15', IV15),
      ...dblDocs('doc-T15', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.', 'Vessel Name': 'MV SOUTH CHINA SEA', 'Gross Weight': '525,200 KG' }),
    ],
  },

  // T16 — CF: All Matches | Ins: All Matches | BL: Pending | BL Date: Pending
  {
    id: '2026030016', shipmentRef: 'SHP-2026-016', shipper: 'PTT Global Chemical PCL',
    consignee: 'Sinopec Tianjin Chemicals Co., Ltd.',
    submittedDate: '2026-03-16T09:15:00Z', lastUpdate: '2026-03-16T12:00:00Z', assignedTo: 'james.tan@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050016', 'REF NO.': '3252010016', "BUYER'S ORDER NO.": '3252010016',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'TIANJIN, CHINA',
      'PAYMENT TERM': 'D/P AT SIGHT',
      'PRODUCT LINE ITEM#1': 'PP InnoPlus MA2100', 'QUANTITY LINE ITEM#1': '750',
      'TOTAL QUANTITY': '750', 'AMOUNT LINE ITEM#1': '720,000.00', 'TOTAL AMOUNT': '720,000.00',
      'FREIGHT': '30,000.00', 'INCOTERMS': 'CIF TIANJIN, CHINA',
      'TOTAL NET WEIGHT': '750,000', 'TOTAL GROSS WEIGHT': '757,500', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.TIANJIN_SPC,
      ...IV16,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Sinopec Tianjin Chemicals Co., Ltd.',
      'Vessel Name': 'MV BOHAI TRADER', 'Gross Weight': '757,500 KG',
      'GI Date': '16 Mar 2026', 'ETD Date': '16 Mar 2026', 'Manual Billing Date': '16 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T16', {
        'INVOICE NO.': '1015050016', 'REF NO.': '3252010016', "BUYER'S ORDER NO.": '3252010016',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'TIANJIN, CHINA',
        'PAYMENT TERM': 'D/P AT SIGHT',
        'PRODUCT LINE ITEM#1': 'PP InnoPlus MA2100', 'QUANTITY LINE ITEM#1': '750',
        'TOTAL QUANTITY': '750', 'AMOUNT LINE ITEM#1': '720,000.00', 'TOTAL AMOUNT': '720,000.00',
        'FREIGHT': '30,000.00', 'INCOTERMS': 'CIF TIANJIN, CHINA',
        'TOTAL NET WEIGHT': '750,000', 'TOTAL GROSS WEIGHT': '757,500', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.TIANJIN_SPC,
      }),
      ...insDocs('doc-T16', IV16),
    ],
  },

  // T17 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030017', shipmentRef: 'SHP-2026-017', shipper: 'PTT Global Chemical PCL',
    consignee: 'Petronas Chemicals Group Bhd',
    submittedDate: '2026-03-17T09:20:00Z', lastUpdate: '2026-03-17T12:00:00Z', assignedTo: 'sarah.lim@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050017', 'REF NO.': '3252010017', "BUYER'S ORDER NO.": '3252010017',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'PORT KLANG, MALAYSIA',
      'PAYMENT TERM': 'IRREVOCABLE L/C AT SIGHT',
      'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6101G', 'QUANTITY LINE ITEM#1': '440',
      'TOTAL QUANTITY': '440', 'AMOUNT LINE ITEM#1': '385,000.00', 'TOTAL AMOUNT': '385,000.00',
      'FREIGHT': '17,600.00', 'INCOTERMS': 'CIF PORT KLANG, MALAYSIA',
      'TOTAL NET WEIGHT': '440,000', 'TOTAL GROSS WEIGHT': '444,400', 'MARKS & NOS': 'INNOPLUS',
      'L/C NO.': 'LLQ1228ILS618364',
      ...IV17,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Petronas Chemicals Group Bhd',
      'Vessel Name': 'MV STRAITS FORTUNE', 'Gross Weight': '444,400 KG',
      'GI Date': '17 Mar 2026', 'ETD Date': '17 Mar 2026', 'Manual Billing Date': '17 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T17', {
        'INVOICE NO.': '1015050017', 'REF NO.': '3252010017', "BUYER'S ORDER NO.": '3252010017',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'PORT KLANG, MALAYSIA',
        'PAYMENT TERM': 'IRREVOCABLE L/C AT SIGHT',
        'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6101G', 'QUANTITY LINE ITEM#1': '440',
        'TOTAL QUANTITY': '440', 'AMOUNT LINE ITEM#1': '385,000.00', 'TOTAL AMOUNT': '385,000.00',
        'FREIGHT': '17,600.00', 'INCOTERMS': 'CIF PORT KLANG, MALAYSIA',
        'TOTAL NET WEIGHT': '440,000', 'TOTAL GROSS WEIGHT': '444,400', 'MARKS & NOS': 'INNOPLUS',
        'L/C NO.': 'LLQ1228ILS618364',
      }, undefined, true),
      ...insDocs('doc-T17', IV17),
      ...dblDocs('doc-T17', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Petronas Chemicals Group Bhd', 'Vessel Name': 'MV STRAITS FORTUNE', 'Gross Weight': '444,400 KG' }),
      // oblDoc('doc-T17', '17 Mar 2026'),
    ],
  },

  // T18 — CF: All Matches | Ins: Needs Attention | BL: All Matches | BL Date: All Matches
  {
    id: '2026030018', shipmentRef: 'SHP-2026-018', shipper: 'PTT Global Chemical PCL',
    consignee: 'Qingdao Jifa Group Co., Ltd.',
    submittedDate: '2026-03-18T09:25:00Z', lastUpdate: '2026-03-18T12:00:00Z', assignedTo: 'alice.tan@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050018', 'REF NO.': '3252010018', "BUYER'S ORDER NO.": '3252010018',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'QINGDAO, CHINA',
      'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
      'PRODUCT LINE ITEM#1': 'PP InnoPlus HS150', 'QUANTITY LINE ITEM#1': '290',
      'TOTAL QUANTITY': '290', 'AMOUNT LINE ITEM#1': '275,500.00', 'TOTAL AMOUNT': '275,500.00',
      'FREIGHT': '11,600.00', 'INCOTERMS': 'CFR QINGDAO, CHINA',
      'TOTAL NET WEIGHT': '290,000', 'TOTAL GROSS WEIGHT': '292,900', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.QINGDAO_JIFA,
      ...IV18,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Qingdao Jifa Group Co., Ltd.',
      'Vessel Name': 'MV PACIFIC JADE', 'Gross Weight': '292,900 KG',
      'GI Date': '18 Mar 2026', 'ETD Date': '18 Mar 2026', 'Manual Billing Date': '18 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T18', {
        'INVOICE NO.': '1015050018', 'REF NO.': '3252010018', "BUYER'S ORDER NO.": '3252010018',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'QINGDAO, CHINA',
        'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
        'PRODUCT LINE ITEM#1': 'PP InnoPlus HS150', 'QUANTITY LINE ITEM#1': '290',
        'TOTAL QUANTITY': '290', 'AMOUNT LINE ITEM#1': '275,500.00', 'TOTAL AMOUNT': '275,500.00',
        'FREIGHT': '11,600.00', 'INCOTERMS': 'CFR QINGDAO, CHINA',
        'TOTAL NET WEIGHT': '290,000', 'TOTAL GROSS WEIGHT': '292,900', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.QINGDAO_JIFA,
      }),
      ...insDocs('doc-T18', IV18, { 'TO': 'TIANJIN, CHINA' }),  // ← insurance mismatch
      ...dblDocs('doc-T18', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Qingdao Jifa Group Co., Ltd.', 'Vessel Name': 'MV PACIFIC JADE', 'Gross Weight': '292,900 KG' }),
      // oblDoc('doc-T18', '18 Mar 2026'),
    ],
  },

  // T19 — CF: All Matches | Ins: All Matches | BL: Needs Attention | BL Date: Pending
  {
    id: '2026030019', shipmentRef: 'SHP-2026-019', shipper: 'PTT Global Chemical PCL',
    consignee: 'LG Chem Ltd.',
    submittedDate: '2026-03-19T09:30:00Z', lastUpdate: '2026-03-19T12:00:00Z', assignedTo: 'john.smith@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050019', 'REF NO.': '3252010019', "BUYER'S ORDER NO.": '3252010019',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'BUSAN, SOUTH KOREA',
      'PAYMENT TERM': 'D/P AT SIGHT',
      'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HB5400P', 'QUANTITY LINE ITEM#1': '615',
      'TOTAL QUANTITY': '615', 'AMOUNT LINE ITEM#1': '578,100.00', 'TOTAL AMOUNT': '578,100.00',
      'FREIGHT': '24,600.00', 'INCOTERMS': 'CIF BUSAN, SOUTH KOREA',
      'TOTAL NET WEIGHT': '615,000', 'TOTAL GROSS WEIGHT': '621,150', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.BUSAN_LG,
      ...IV19,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'LG Chem Ltd.',
      'Vessel Name': 'MV BUSAN PEARL', 'Gross Weight': '621,150 KG',
      'GI Date': '19 Mar 2026', 'ETD Date': '19 Mar 2026', 'Manual Billing Date': '19 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T19', {
        'INVOICE NO.': '1015050019', 'REF NO.': '3252010019', "BUYER'S ORDER NO.": '3252010019',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'BUSAN, SOUTH KOREA',
        'PAYMENT TERM': 'D/P AT SIGHT',
        'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HB5400P', 'QUANTITY LINE ITEM#1': '615',
        'TOTAL QUANTITY': '615', 'AMOUNT LINE ITEM#1': '578,100.00', 'TOTAL AMOUNT': '578,100.00',
        'FREIGHT': '24,600.00', 'INCOTERMS': 'CIF BUSAN, SOUTH KOREA',
        'TOTAL NET WEIGHT': '615,000', 'TOTAL GROSS WEIGHT': '621,150', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.BUSAN_LG,
      }),
      ...insDocs('doc-T19', IV19),
      ...dblDocs('doc-T19', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'LG Chem Ltd.', 'Vessel Name': 'MV BUSAN PEARL', 'Gross Weight': '621,150 KG' },
        { 'Shipper': 'GC International Trading PCL' }),  // ← draftBL mismatch
    ],
  },

  // T20 — CF: Needs Attention (CI PRODUCT wrong) | Ins: Needs Attention | BL: All Matches | BL Date: All Matches
  {
    id: '2026030020', shipmentRef: 'SHP-2026-020', shipper: 'PTT Global Chemical PCL',
    consignee: 'Dow Chemical Singapore Pte. Ltd.',
    submittedDate: '2026-03-20T09:35:00Z', lastUpdate: '2026-03-20T12:00:00Z', assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050020', 'REF NO.': '3252010020', "BUYER'S ORDER NO.": '3252010020',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'SINGAPORE',
      'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
      'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6100F', 'QUANTITY LINE ITEM#1': '370',
      'TOTAL QUANTITY': '370', 'AMOUNT LINE ITEM#1': '321,900.00', 'TOTAL AMOUNT': '321,900.00',
      'FREIGHT': '', 'INCOTERMS': 'FOB MAP TA PHUT PORT, THAILAND',
      'TOTAL NET WEIGHT': '370,000', 'TOTAL GROSS WEIGHT': '373,700', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SINGAPORE_DOW,
      ...IV20,
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Dow Chemical Singapore Pte. Ltd.',
      'Vessel Name': 'MV SINGAPORE TRADER', 'Gross Weight': '373,700 KG',
      'GI Date': '20 Mar 2026', 'ETD Date': '20 Mar 2026', 'Manual Billing Date': '20 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T20', {
        'INVOICE NO.': '1015050020', 'REF NO.': '3252010020', "BUYER'S ORDER NO.": '3252010020',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'SINGAPORE',
        'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
        'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6100F', 'QUANTITY LINE ITEM#1': '370',
        'TOTAL QUANTITY': '370', 'AMOUNT LINE ITEM#1': '321,900.00', 'TOTAL AMOUNT': '321,900.00',
        'FREIGHT': '', 'INCOTERMS': 'FOB MAP TA PHUT PORT, THAILAND',
        'TOTAL NET WEIGHT': '370,000', 'TOTAL GROSS WEIGHT': '373,700', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SINGAPORE_DOW,
      }, { 'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6201F' }),  // ← CI mismatch
      ...insDocs('doc-T20', IV20, { 'AMOUNT INSURED HEREUNDER': 'USD 340,000.00' }),  // ← insurance mismatch
      ...dblDocs('doc-T20', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Dow Chemical Singapore Pte. Ltd.', 'Vessel Name': 'MV SINGAPORE TRADER', 'Gross Weight': '373,700 KG' }),
      // oblDoc('doc-T20', '20 Mar 2026'),
    ],
  },

  // T21 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '0000000000', shipmentRef: 'SHP-2026-021', shipper: 'PTT Global Chemical PCL',
    consignee: 'GC Marketing Solutions (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-21T10:00:00Z', lastUpdate: '2026-03-21T11:00:00Z', assignedTo: 'jane.doe@pttgcgroup.com',
    status: 'Attention',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '0000000000', 'REF NO.': '3252010021', "BUYER'S ORDER NO.": '3252010021',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'SHANGHAI, CHINA',
      'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
      'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HD2200JP', 'QUANTITY LINE ITEM#1': '500',
      'TOTAL QUANTITY': '500', 'AMOUNT LINE ITEM#1': '465,000.00', 'TOTAL AMOUNT': '465,000.00',
      'FREIGHT': '20,000.00', 'INCOTERMS': 'CIF SHANGHAI, CHINA',
      'TOTAL NET WEIGHT': '500,000', 'TOTAL GROSS WEIGHT': '505,000', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_GCM,
      ...buildInsVals({ invoiceNo: '0000000000', etdPort: 'LAEM CHABANG PORT, THAILAND', etaPort: 'SHANGHAI, CHINA', vesselName: 'MV ORIENT PHOENIX', giDate: '21 Mar 2026', totalAmount: '465,000.00', totalQty: '500', products: ['HDPE InnoPlus HD2200JP'], qtys: ['500'] }),
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.',
      'Vessel Name': 'MV ORIENT PHOENIX', 'Gross Weight': '505,000 KG',
      'GI Date': '21 Mar 2026', 'ETD Date': '21 Mar 2026', 'Manual Billing Date': '21 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T21', {
        'INVOICE NO.': '00000000000', 'REF NO.': '3252010021', "BUYER'S ORDER NO.": '3252010021',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'SHANGHAI, CHINA',
        'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
        'PRODUCT LINE ITEM#1': 'HDPE InnoPlus HD2200JP', 'QUANTITY LINE ITEM#1': '500',
        'TOTAL QUANTITY': '500', 'AMOUNT LINE ITEM#1': '465,000.00', 'TOTAL AMOUNT': '465,000.00',
        'FREIGHT': '20,000.00', 'INCOTERMS': 'CIF SHANGHAI, CHINA',
        'TOTAL NET WEIGHT': '500,000', 'TOTAL GROSS WEIGHT': '505,000', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_GCM,
      }),
      ...insDocs('doc-T21', buildInsVals({ invoiceNo: '0000000000', etdPort: 'LAEM CHABANG PORT, THAILAND', etaPort: 'SHANGHAI, CHINA', vesselName: 'MV ORIENT PHOENIX', giDate: '21 Mar 2026', totalAmount: '465,000.00', totalQty: '500', products: ['HDPE InnoPlus HD2200JP'], qtys: ['500'] })),
      ...dblDocs('doc-T21', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.', 'Vessel Name': 'MV ORIENT PHOENIX', 'Gross Weight': '505,000 KG' }),
      // oblDoc('doc-T21', '21 Mar 2026'),
    ],
  },

];
