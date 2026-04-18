export interface ShipDoc {
  id: string;
  type: 'Shipping Advice' | 'Custom Invoice' | 'Packing List' | 'Letter of Credit' | 'Shipping Instruction' | 'DocXPort' | 'Draft Insurance' | 'Detail for Insurance Purpose' | 'Draft B/L' | 'Shipping Particular' | 'Original B/L';
  fieldMapping: Record<string, string>;
  values: Record<string, string>;
}

export type TaskStatus =
  | 'Pending'
  | 'Needs Attention'
  | 'All Match'
  | 'Approved'
  | 'Rejected';

export type VerificationStatus =
  | 'Pending Verification'
  | 'Needs Attention'
  | 'Rejected'
  | 'All Matches'
  | 'Approved';

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
  assignedTo: string;
  documents: ShipDoc[];
  canonicalFields: string[];
  correctValues: Record<string, string>;
  status: TaskStatus;
  verifications: Verifications;
}

export function deriveOverallStatus(v: Verifications): TaskStatus {
  const statuses = Object.values(v) as VerificationStatus[];
  if (statuses.includes('Rejected')) return 'Rejected';
  if (statuses.includes('Needs Attention')) return 'Needs Attention';
  if (statuses.includes('Pending Verification')) return 'Pending';
  if (statuses.every(s => s === 'Approved')) return 'Approved';
  return 'All Match';
}

// ─── CF document field mappings (canonical field → doc-specific label) ────────

const SA_FIELDS: Record<string, string> = {
  'INVOICE NO.':          'INVOICE NO.',
  'REF NO.':              'PROFORMA INVOICE NO.',
  "BUYER'S ORDER NO.":    "BUYER'S ORDER NO.",
  'ETD PORT':             'ETD',
  'ETA PORT':             'ETA',
  'PRODUCT LINE ITEM#1':  'PRODUCT',
  'QUANTITY LINE ITEM#1': 'QUANTITY',
  'TOTAL QUANTITY':       'TOTAL QUANTITY',
  'TOTAL AMOUNT':         'TOTAL AMOUNT',
  'FREIGHT':              'FREIGHT',
  'INCOTERMS':            'INCOTERMS',
  'TOTAL NET WEIGHT':     'TOTAL NET WEIGHT',
  'TOTAL GROSS WEIGHT':   'TOTAL GROSS WEIGHT',
  'MARKS & NOS':          'MARKS & NOS',
};

const CI_FIELDS: Record<string, string> = {
  'INVOICE NO.':          'NO.',
  'REF NO.':              'REFERENCE NO.',
  "BUYER'S ORDER NO.":    "BUYER'S ORDER NO.",
  'ETD PORT':             'FROM',
  'ETA PORT':             'TO',
  'PAYMENT TERM':         'PAYMENT TERM',
  'PRODUCT LINE ITEM#1':  'DESCRIPTION OF GOODS',
  'QUANTITY LINE ITEM#1': 'QUANTITY',
  'AMOUNT LINE ITEM#1':   'AMOUNT',
  'TOTAL AMOUNT':         'TOTAL AMOUNT',
  'FREIGHT':              'FREIGHT',
  'INCOTERMS':            'INCOTERMS',
  'TOTAL NET WEIGHT':     'TOTAL NET WEIGHT',
  'TOTAL GROSS WEIGHT':   'TOTAL GROSS WEIGHT',
  'MARKS & NOS':          'MARKS & NOS',
};

const PL_FIELDS: Record<string, string> = {
  'INVOICE NO.':          'NO.',
  'REF NO.':              'REFERENCE NO.',
  "BUYER'S ORDER NO.":    "BUYER'S ORDER NO.",
  'ETD PORT':             'FROM',
  'ETA PORT':             'TO',
  'PAYMENT TERM':         'PAYMENT TERM',
  'PRODUCT LINE ITEM#1':  'DESCRIPTION OF GOODS',
  'QUANTITY LINE ITEM#1': 'QUANTITY',
  'FREIGHT':              'FREIGHT',
  'INCOTERMS':            'INCOTERMS',
  'TOTAL NET WEIGHT':     'TOTAL NET WEIGHT',
  'TOTAL GROSS WEIGHT':   'TOTAL GROSS WEIGHT',
  'MARKS & NOS':          'MARKS & NOS',
};

const SI_FIELDS: Record<string, string> = {
  'INCOTERMS':                            'INCOTERMS',
  'MARKS & NOS':                          'MARKS & NOS',
  'ORIGINAL SHIPPING DOCUMENTS AND COPY': 'ORIGINAL SHIPPING DOCUMENTS AND COPY',
};

const LC_FIELDS: Record<string, string> = { 'L/C NO.': 'L/C NO.' };
const CI_FIELDS_LC: Record<string, string> = { ...CI_FIELDS, 'L/C NO.': 'L/C NO.' };
const PL_FIELDS_LC: Record<string, string> = { ...PL_FIELDS, 'L/C NO.': 'L/C NO.' };

// SI consignee addresses for ORIGINAL SHIPPING DOCUMENTS AND COPY
const SI_ADDR = {
  SHANGHAI_GCM:  'GC MARKETING SOLUTIONS (SHANGHAI) COMPANY LIMITED\nROOM 13-042, 13TH FLOOR, 1000 LUJIAZUI RING RD., PUDONG, SHANGHAI, 200120, CHINA\nCONTACT PERSON: MR. ZHU WEI TEL: +86 13916595836 EMAIL: GCM-CHINA-SC@PTTGCGROUP.COM',
  TIANJIN_SPC:   'SINOPEC TIANJIN CHEMICALS CO., LTD.\n300 HUANGHAI ROAD, BINHAI NEW AREA, TIANJIN, 300451, CHINA\nCONTACT PERSON: MS. ZHANG LING TEL: +86 22 65979800 EMAIL: IMPORT@SINOPEC-TJ.COM',
  QINGDAO_JIFA:  'QINGDAO JIFA GROUP CO., LTD.\n88 MINJIANG ROAD, QINGDAO, SHANDONG, 266071, CHINA\nCONTACT PERSON: MR. WANG HAO TEL: +86 532 86662888 EMAIL: IMPORT@QDJIFA.COM',
  SHANGHAI_BASF: 'BASF TRADING (SHANGHAI) CO., LTD.\n333 JIUJIANG ROAD, HUANGPU DISTRICT, SHANGHAI, 200001, CHINA\nCONTACT PERSON: MR. PETER ZHANG TEL: +86 21 28050000 EMAIL: IMPORT.BASF@BASF.COM',
  SINGAPORE_DOW: 'DOW CHEMICAL SINGAPORE PTE. LTD.\n1 HARBOUR FRONT PLACE, HARBOURFRONT TOWER ONE, SINGAPORE, 098633\nCONTACT PERSON: MS. TAN MEI LING TEL: +65 6709 5000 EMAIL: IMPORT@DOW.COM',
  BUSAN_LG:      'LG CHEM LTD.\n30 BULMUSAN-RO, YEOSU, JEONNAM, SOUTH KOREA\nCONTACT PERSON: MR. KIM JOON HO TEL: +82 61 680 1114 EMAIL: IMPORT@LGCHEM.COM',
  JAKARTA_CAP:   'PT. CHANDRA ASRI PETROCHEMICAL TBK\nGEDUNG WISMA BARITO PACIFIC II, 7TH FLOOR, JL. S. PARMAN KAV.62-63, JAKARTA, 11410, INDONESIA\nCONTACT PERSON: MR. AGUS SANTOSO TEL: +62 21 5308509 EMAIL: IMPORT@CHANDRA-ASRI.COM',
  KLANG_PCS:     'PETRONAS CHEMICALS GROUP BHD\nLEVEL 9, PETRONAS TWIN TOWERS, KUALA LUMPUR CITY CENTRE, KUALA LUMPUR, 50088, MALAYSIA\nCONTACT PERSON: MS. NOOR AISHAH TEL: +60 3 2051 5000 EMAIL: PCSIMPORT@PETRONAS.COM.MY',
};

const CF_CANONICAL = [
  'INVOICE NO.', 'REF NO.', "BUYER'S ORDER NO.", 'ETD PORT', 'ETA PORT',
  'PAYMENT TERM', 'PRODUCT LINE ITEM#1', 'QUANTITY LINE ITEM#1', 'TOTAL QUANTITY',
  'AMOUNT LINE ITEM#1', 'TOTAL AMOUNT', 'FREIGHT', 'INCOTERMS',
  'TOTAL NET WEIGHT', 'TOTAL GROSS WEIGHT', 'MARKS & NOS',
  'L/C NO.', 'ORIGINAL SHIPPING DOCUMENTS AND COPY',
];

const INS_CANONICAL = ['Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge'];
const DBL_CANONICAL = ['Shipper', 'Consignee', 'Vessel Name', 'Gross Weight'];
const BLD_CANONICAL = ['GI Date', 'ETD Date', 'Manual Billing Date'];
const ALL_CANONICAL = [...CF_CANONICAL, ...INS_CANONICAL, ...DBL_CANONICAL, ...BLD_CANONICAL];

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
  if (hasLC) {
    return [
      { id: `${id}-sa`, type: 'Shipping Advice',   fieldMapping: { ...SA_FIELDS },    values: build(SA_FIELDS) },
      { id: `${id}-ci`, type: 'Custom Invoice',     fieldMapping: { ...CI_FIELDS_LC }, values: build(CI_FIELDS_LC, ciMismatches) },
      { id: `${id}-pl`, type: 'Packing List',       fieldMapping: { ...PL_FIELDS_LC }, values: build(PL_FIELDS_LC) },
      { id: `${id}-lc`, type: 'Letter of Credit',   fieldMapping: { ...LC_FIELDS },    values: build(LC_FIELDS) },
    ];
  }
  return [
    { id: `${id}-sa`, type: 'Shipping Advice',      fieldMapping: { ...SA_FIELDS }, values: build(SA_FIELDS) },
    { id: `${id}-ci`, type: 'Custom Invoice',        fieldMapping: { ...CI_FIELDS }, values: build(CI_FIELDS, ciMismatches) },
    { id: `${id}-pl`, type: 'Packing List',          fieldMapping: { ...PL_FIELDS }, values: build(PL_FIELDS) },
    { id: `${id}-si`, type: 'Shipping Instruction',  fieldMapping: { ...SI_FIELDS }, values: build(SI_FIELDS) },
  ];
}

function insDocs(id: string, vals: Record<string, string>, mismatch?: Record<string, string>): ShipDoc[] {
  return [{
    id: `${id}-ins`,
    type: 'Draft Insurance',
    fieldMapping: { 'Insured': 'insured_name', 'Sum Insured': 'sum_insured', 'Commodity': 'commodity', 'Port of Loading': 'pol', 'Port of Discharge': 'pod' },
    values: {
      insured_name: mismatch?.['Insured']           ?? vals['Insured'],
      sum_insured:  mismatch?.['Sum Insured']       ?? vals['Sum Insured'],
      commodity:    mismatch?.['Commodity']         ?? vals['Commodity'],
      pol:          mismatch?.['Port of Loading']   ?? vals['Port of Loading'],
      pod:          mismatch?.['Port of Discharge'] ?? vals['Port of Discharge'],
    },
  }];
}

function dblDocs(id: string, vals: Record<string, string>, mismatch?: Record<string, string>): ShipDoc[] {
  return [{
    id: `${id}-dbl`,
    type: 'Draft B/L',
    fieldMapping: { 'Shipper': 'shipper', 'Consignee': 'consignee', 'Vessel Name': 'vessel_name', 'Gross Weight': 'gross_weight' },
    values: {
      shipper:      mismatch?.['Shipper']      ?? vals['Shipper'],
      consignee:    mismatch?.['Consignee']    ?? vals['Consignee'],
      vessel_name:  mismatch?.['Vessel Name']  ?? vals['Vessel Name'],
      gross_weight: mismatch?.['Gross Weight'] ?? vals['Gross Weight'],
    },
  }];
}

function oblDoc(id: string, date: string): ShipDoc {
  return { id: `${id}-obl`, type: 'Original B/L', fieldMapping: { 'B/L Date': 'bl_date' }, values: { bl_date: date } };
}

// ─── Mock Tasks ───────────────────────────────────────────────────────────────

export const mockTasks: Task[] = [

  // T01 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030001', shipmentRef: 'SHP-2026-001', shipper: 'PTT Global Chemical PCL',
    consignee: 'GC Marketing Solutions (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-01', assignedTo: 'jane.doe@pttgcgroup.com',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 736,560.00', 'Commodity': 'HDPE InnoPlus HD2200JP',
      'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'HUANGPU, CHINA',
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
      ...insDocs('doc-T01', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 736,560.00', 'Commodity': 'HDPE InnoPlus HD2200JP', 'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'HUANGPU, CHINA' }),
      ...dblDocs('doc-T01', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.', 'Vessel Name': 'MV PACIFIC EXPRESS', 'Gross Weight': '727,200 KG' }),
      oblDoc('doc-T01', '01 Mar 2026'),
    ],
  },

  // T02 — CF: Needs Attention (CI BUYER'S ORDER NO. wrong) | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030002', shipmentRef: 'SHP-2026-002', shipper: 'PTT Global Chemical PCL',
    consignee: 'Sinopec Tianjin Chemicals Co., Ltd.',
    submittedDate: '2026-03-02', assignedTo: 'john.smith@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 478,500.00', 'Commodity': 'LLDPE InnoPlus LL6100F',
      'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'TIANJIN, CHINA',
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
      ...insDocs('doc-T02', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 478,500.00', 'Commodity': 'LLDPE InnoPlus LL6100F', 'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'TIANJIN, CHINA' }),
      ...dblDocs('doc-T02', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Sinopec Tianjin Chemicals Co., Ltd.', 'Vessel Name': 'MV ASIAN STAR', 'Gross Weight': '505,000 KG' }),
      oblDoc('doc-T02', '02 Mar 2026'),
    ],
  },

  // T03 — CF: All Matches | Ins: Pending | BL: Pending | BL Date: Pending
  {
    id: '2026030003', shipmentRef: 'SHP-2026-003', shipper: 'PTT Global Chemical PCL',
    consignee: 'Qingdao Jifa Group Co., Ltd.',
    submittedDate: '2026-03-03', assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'Pending',
    verifications: { customFormality: 'All Matches', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 313,500.00', 'Commodity': 'PP InnoPlus HS150',
      'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'QINGDAO, CHINA',
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
    ],
  },

  // T04 — CF: All Matches | Ins: Needs Attention | BL: All Matches | BL Date: Pending
  {
    id: '2026030004', shipmentRef: 'SHP-2026-004', shipper: 'PTT Global Chemical PCL',
    consignee: 'BASF Trading (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-04', assignedTo: 'james.tan@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'Needs Attention', draftBL: 'All Matches', blDate: 'Pending Verification' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 413,600.00', 'Commodity': 'HDPE InnoPlus HB5400P',
      'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'SHANGHAI, CHINA',
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
      ...insDocs('doc-T04', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 413,600.00', 'Commodity': 'HDPE InnoPlus HB5400P', 'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'SHANGHAI, CHINA' },
        { 'Sum Insured': 'USD 400,000.00' }),  // ← insurance mismatch
      ...dblDocs('doc-T04', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'BASF Trading (Shanghai) Co., Ltd.', 'Vessel Name': 'MV GOLDEN BRIDGE', 'Gross Weight': '404,000 KG' }),
    ],
  },

  // T05 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: Pending
  {
    id: '2026030005', shipmentRef: 'SHP-2026-005', shipper: 'PTT Global Chemical PCL',
    consignee: 'Dow Chemical Singapore Pte. Ltd.',
    submittedDate: '2026-03-05', assignedTo: 'sarah.lim@pttgcgroup.com',
    status: 'Pending',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'Pending Verification' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 633,600.00', 'Commodity': 'PP InnoPlus MA2100',
      'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'SINGAPORE',
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
      ...insDocs('doc-T05', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 633,600.00', 'Commodity': 'PP InnoPlus MA2100', 'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'SINGAPORE' }),
      ...dblDocs('doc-T05', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Dow Chemical Singapore Pte. Ltd.', 'Vessel Name': 'MV EMERALD SEA', 'Gross Weight': '606,000 KG' }),
    ],
  },

  // T06 — CF: All Matches | Ins: All Matches | BL: Needs Attention | BL Date: All Matches
  {
    id: '2026030006', shipmentRef: 'SHP-2026-006', shipper: 'PTT Global Chemical PCL',
    consignee: 'LG Chem Ltd.',
    submittedDate: '2026-03-06', assignedTo: 'alice.tan@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'Needs Attention', blDate: 'All Matches' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 462,000.00', 'Commodity': 'LLDPE InnoPlus LL6101G',
      'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'BUSAN, SOUTH KOREA',
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
      ...insDocs('doc-T06', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 462,000.00', 'Commodity': 'LLDPE InnoPlus LL6101G', 'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'BUSAN, SOUTH KOREA' }),
      ...dblDocs('doc-T06', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'LG Chem Ltd.', 'Vessel Name': 'MV KOREA TRADER', 'Gross Weight': '484,800 KG' },
        { 'Vessel Name': 'MV KOREA EXPRESS' }),  // ← draftBL mismatch
      oblDoc('doc-T06', '06 Mar 2026'),
    ],
  },

  // T07 — CF: Needs Attention (CI PAYMENT TERM wrong) | Ins: Pending | BL: Pending | BL Date: Pending
  {
    id: '2026030007', shipmentRef: 'SHP-2026-007', shipper: 'PTT Global Chemical PCL',
    consignee: 'PT. Chandra Asri Petrochemical Tbk',
    submittedDate: '2026-03-07', assignedTo: 'john.smith@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 358,050.00', 'Commodity': 'HDPE InnoPlus HD2200JP',
      'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'JAKARTA, INDONESIA',
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
    submittedDate: '2026-03-08', assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 574,750.00', 'Commodity': 'PP InnoPlus HS150',
      'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'TIANJIN, CHINA',
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
      ...insDocs('doc-T08', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 574,750.00', 'Commodity': 'PP InnoPlus HS150', 'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'TIANJIN, CHINA' }),
      ...dblDocs('doc-T08', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Sinopec Tianjin Chemicals Co., Ltd.', 'Vessel Name': 'MV NORTHERN LIGHT', 'Gross Weight': '555,500 KG' }),
      oblDoc('doc-T08', '08 Mar 2026'),
    ],
  },

  // T09 — CF: All Matches | Ins: Pending | BL: All Matches | BL Date: Pending
  {
    id: '2026030009', shipmentRef: 'SHP-2026-009', shipper: 'PTT Global Chemical PCL',
    consignee: 'GC Marketing Solutions (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-09', assignedTo: 'jane.doe@pttgcgroup.com',
    status: 'Pending',
    verifications: { customFormality: 'All Matches', insurance: 'Pending Verification', draftBL: 'All Matches', blDate: 'Pending Verification' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050009', 'REF NO.': '3252010009', "BUYER'S ORDER NO.": '3252010009',
      'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'HUANGPU, CHINA',
      'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
      'PRODUCT LINE ITEM#1': 'LDPE InnoPlus LD2420H', 'QUANTITY LINE ITEM#1': '420',
      'TOTAL QUANTITY': '420', 'AMOUNT LINE ITEM#1': '382,200.00', 'TOTAL AMOUNT': '382,200.00',
      'FREIGHT': '16,800.00', 'INCOTERMS': 'CFR HUANGPU, CHINA',
      'TOTAL NET WEIGHT': '420,000', 'TOTAL GROSS WEIGHT': '424,200', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.SHANGHAI_GCM,
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 420,420.00', 'Commodity': 'LDPE InnoPlus LD2420H',
      'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'HUANGPU, CHINA',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.',
      'Vessel Name': 'MV CHINA FORTUNE', 'Gross Weight': '424,200 KG',
      'GI Date': '09 Mar 2026', 'ETD Date': '09 Mar 2026', 'Manual Billing Date': '09 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T09', {
        'INVOICE NO.': '1015050009', 'REF NO.': '3252010009', "BUYER'S ORDER NO.": '3252010009',
        'ETD PORT': 'LAEM CHABANG PORT, THAILAND', 'ETA PORT': 'HUANGPU, CHINA',
        'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
        'PRODUCT LINE ITEM#1': 'LDPE InnoPlus LD2420H', 'QUANTITY LINE ITEM#1': '420',
        'TOTAL QUANTITY': '420', 'AMOUNT LINE ITEM#1': '382,200.00', 'TOTAL AMOUNT': '382,200.00',
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
    submittedDate: '2026-03-10', assignedTo: 'james.tan@pttgcgroup.com',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050010', 'REF NO.': '3252010010', "BUYER'S ORDER NO.": '3252010010',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'QINGDAO, CHINA',
      'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
      'PRODUCT LINE ITEM#1': 'PP InnoPlus MA2100', 'QUANTITY LINE ITEM#1': '280',
      'TOTAL QUANTITY': '280', 'AMOUNT LINE ITEM#1': '268,800.00', 'TOTAL AMOUNT': '268,800.00',
      'FREIGHT': '11,200.00', 'INCOTERMS': 'CIF QINGDAO, CHINA',
      'TOTAL NET WEIGHT': '280,000', 'TOTAL GROSS WEIGHT': '282,800', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.QINGDAO_JIFA,
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 295,680.00', 'Commodity': 'PP InnoPlus MA2100',
      'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'QINGDAO, CHINA',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Qingdao Jifa Group Co., Ltd.',
      'Vessel Name': 'MV DRAGON GATE', 'Gross Weight': '282,800 KG',
      'GI Date': '10 Mar 2026', 'ETD Date': '10 Mar 2026', 'Manual Billing Date': '10 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T10', {
        'INVOICE NO.': '1015050010', 'REF NO.': '3252010010', "BUYER'S ORDER NO.": '3252010010',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'QINGDAO, CHINA',
        'PAYMENT TERM': 'T/T BEFORE SHIPMENT',
        'PRODUCT LINE ITEM#1': 'PP InnoPlus MA2100', 'QUANTITY LINE ITEM#1': '280',
        'TOTAL QUANTITY': '280', 'AMOUNT LINE ITEM#1': '268,800.00', 'TOTAL AMOUNT': '268,800.00',
        'FREIGHT': '11,200.00', 'INCOTERMS': 'CIF QINGDAO, CHINA',
        'TOTAL NET WEIGHT': '280,000', 'TOTAL GROSS WEIGHT': '282,800', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.QINGDAO_JIFA,
      }),
      ...insDocs('doc-T10', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 295,680.00', 'Commodity': 'PP InnoPlus MA2100', 'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'QINGDAO, CHINA' }),
      ...dblDocs('doc-T10', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Qingdao Jifa Group Co., Ltd.', 'Vessel Name': 'MV DRAGON GATE', 'Gross Weight': '282,800 KG' }),
      oblDoc('doc-T10', '10 Mar 2026'),
    ],
  },

  // T11 — CF: Needs Attention (CI AMOUNT wrong) | Ins: All Matches | BL: Needs Attention | BL Date: All Matches
  {
    id: '2026030011', shipmentRef: 'SHP-2026-011', shipper: 'PTT Global Chemical PCL',
    consignee: 'Petronas Chemicals Group Bhd',
    submittedDate: '2026-03-11', assignedTo: 'sarah.lim@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'All Matches', draftBL: 'Needs Attention', blDate: 'All Matches' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 651,420.00', 'Commodity': 'HDPE InnoPlus HB5400P',
      'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'PORT KLANG, MALAYSIA',
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
      ...insDocs('doc-T11', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 651,420.00', 'Commodity': 'HDPE InnoPlus HB5400P', 'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'PORT KLANG, MALAYSIA' }),
      ...dblDocs('doc-T11', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Petronas Chemicals Group Bhd', 'Vessel Name': 'MV MALAY EXPRESS', 'Gross Weight': '636,300 KG' },
        { 'Gross Weight': '630,000 KG' }),  // ← draftBL mismatch
      oblDoc('doc-T11', '11 Mar 2026'),
    ],
  },

  // T12 — CF: All Matches | Ins: Pending | BL: Pending | BL Date: All Matches
  {
    id: '2026030012', shipmentRef: 'SHP-2026-012', shipper: 'PTT Global Chemical PCL',
    consignee: 'LG Chem Ltd.',
    submittedDate: '2026-03-12', assignedTo: 'alice.tan@pttgcgroup.com',
    status: 'Pending',
    verifications: { customFormality: 'All Matches', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'All Matches' },
    canonicalFields: ALL_CANONICAL,
    correctValues: {
      'INVOICE NO.': '1015050012', 'REF NO.': '3252010012', "BUYER'S ORDER NO.": '3252010012',
      'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'BUSAN, SOUTH KOREA',
      'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
      'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6100F', 'QUANTITY LINE ITEM#1': '310',
      'TOTAL QUANTITY': '310', 'AMOUNT LINE ITEM#1': '269,700.00', 'TOTAL AMOUNT': '269,700.00',
      'FREIGHT': '12,400.00', 'INCOTERMS': 'CFR BUSAN, SOUTH KOREA',
      'TOTAL NET WEIGHT': '310,000', 'TOTAL GROSS WEIGHT': '313,100', 'MARKS & NOS': 'INNOPLUS',
      'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.BUSAN_LG,
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 296,670.00', 'Commodity': 'LLDPE InnoPlus LL6100F',
      'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'BUSAN, SOUTH KOREA',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'LG Chem Ltd.',
      'Vessel Name': 'MV ORIENT STAR', 'Gross Weight': '313,100 KG',
      'GI Date': '12 Mar 2026', 'ETD Date': '12 Mar 2026', 'Manual Billing Date': '12 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T12', {
        'INVOICE NO.': '1015050012', 'REF NO.': '3252010012', "BUYER'S ORDER NO.": '3252010012',
        'ETD PORT': 'MAP TA PHUT PORT, THAILAND', 'ETA PORT': 'BUSAN, SOUTH KOREA',
        'PAYMENT TERM': 'T/T 30 DAYS AFTER B/L DATE',
        'PRODUCT LINE ITEM#1': 'LLDPE InnoPlus LL6100F', 'QUANTITY LINE ITEM#1': '310',
        'TOTAL QUANTITY': '310', 'AMOUNT LINE ITEM#1': '269,700.00', 'TOTAL AMOUNT': '269,700.00',
        'FREIGHT': '12,400.00', 'INCOTERMS': 'CFR BUSAN, SOUTH KOREA',
        'TOTAL NET WEIGHT': '310,000', 'TOTAL GROSS WEIGHT': '313,100', 'MARKS & NOS': 'INNOPLUS',
        'ORIGINAL SHIPPING DOCUMENTS AND COPY': SI_ADDR.BUSAN_LG,
      }),
      oblDoc('doc-T12', '12 Mar 2026'),
    ],
  },

  // T13 — CF: All Matches | Ins: Needs Attention | BL: Needs Attention | BL Date: Pending
  {
    id: '2026030013', shipmentRef: 'SHP-2026-013', shipper: 'PTT Global Chemical PCL',
    consignee: 'BASF Trading (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-13', assignedTo: 'jane.doe@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'Needs Attention', draftBL: 'Needs Attention', blDate: 'Pending Verification' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 480,700.00', 'Commodity': 'PP InnoPlus HS150',
      'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'SHANGHAI, CHINA',
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
      ...insDocs('doc-T13', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 480,700.00', 'Commodity': 'PP InnoPlus HS150', 'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'SHANGHAI, CHINA' },
        { 'Commodity': 'PP InnoPlus HS200' }),  // ← insurance mismatch
      ...dblDocs('doc-T13', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'BASF Trading (Shanghai) Co., Ltd.', 'Vessel Name': 'MV SHANGHAI GLORY', 'Gross Weight': '464,600 KG' },
        { 'Consignee': 'BASF Chemical (Shanghai) Co., Ltd.' }),  // ← draftBL mismatch
    ],
  },

  // T14 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030014', shipmentRef: 'SHP-2026-014', shipper: 'PTT Global Chemical PCL',
    consignee: 'PT. Chandra Asri Petrochemical Tbk',
    submittedDate: '2026-03-14', assignedTo: 'john.smith@pttgcgroup.com',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 390,390.00', 'Commodity': 'LDPE InnoPlus LD2420H',
      'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'JAKARTA, INDONESIA',
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
      ...insDocs('doc-T14', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 390,390.00', 'Commodity': 'LDPE InnoPlus LD2420H', 'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'JAKARTA, INDONESIA' }),
      ...dblDocs('doc-T14', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'PT. Chandra Asri Petrochemical Tbk', 'Vessel Name': 'MV JAVA EXPRESS', 'Gross Weight': '393,900 KG' }),
      oblDoc('doc-T14', '14 Mar 2026'),
    ],
  },

  // T15 — CF: Needs Attention (CI REF NO. wrong) | Ins: All Matches | BL: All Matches | BL Date: Pending
  {
    id: '2026030015', shipmentRef: 'SHP-2026-015', shipper: 'PTT Global Chemical PCL',
    consignee: 'GC Marketing Solutions (Shanghai) Co., Ltd.',
    submittedDate: '2026-03-15', assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'Pending Verification' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 531,960.00', 'Commodity': 'HDPE InnoPlus HD2200JP',
      'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'HUANGPU, CHINA',
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
      ...insDocs('doc-T15', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 531,960.00', 'Commodity': 'HDPE InnoPlus HD2200JP', 'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'HUANGPU, CHINA' }),
      ...dblDocs('doc-T15', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'GC Marketing Solutions (Shanghai) Co., Ltd.', 'Vessel Name': 'MV SOUTH CHINA SEA', 'Gross Weight': '525,200 KG' }),
    ],
  },

  // T16 — CF: All Matches | Ins: All Matches | BL: Pending | BL Date: Pending
  {
    id: '2026030016', shipmentRef: 'SHP-2026-016', shipper: 'PTT Global Chemical PCL',
    consignee: 'Sinopec Tianjin Chemicals Co., Ltd.',
    submittedDate: '2026-03-16', assignedTo: 'james.tan@pttgcgroup.com',
    status: 'Pending',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 792,000.00', 'Commodity': 'PP InnoPlus MA2100',
      'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'TIANJIN, CHINA',
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
      ...insDocs('doc-T16', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 792,000.00', 'Commodity': 'PP InnoPlus MA2100', 'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'TIANJIN, CHINA' }),
    ],
  },

  // T17 — CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  {
    id: '2026030017', shipmentRef: 'SHP-2026-017', shipper: 'PTT Global Chemical PCL',
    consignee: 'Petronas Chemicals Group Bhd',
    submittedDate: '2026-03-17', assignedTo: 'sarah.lim@pttgcgroup.com',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 423,500.00', 'Commodity': 'LLDPE InnoPlus LL6101G',
      'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'PORT KLANG, MALAYSIA',
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
      ...insDocs('doc-T17', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 423,500.00', 'Commodity': 'LLDPE InnoPlus LL6101G', 'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'PORT KLANG, MALAYSIA' }),
      ...dblDocs('doc-T17', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Petronas Chemicals Group Bhd', 'Vessel Name': 'MV STRAITS FORTUNE', 'Gross Weight': '444,400 KG' }),
      oblDoc('doc-T17', '17 Mar 2026'),
    ],
  },

  // T18 — CF: All Matches | Ins: Needs Attention | BL: All Matches | BL Date: All Matches
  {
    id: '2026030018', shipmentRef: 'SHP-2026-018', shipper: 'PTT Global Chemical PCL',
    consignee: 'Qingdao Jifa Group Co., Ltd.',
    submittedDate: '2026-03-18', assignedTo: 'alice.tan@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'Needs Attention', draftBL: 'All Matches', blDate: 'All Matches' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 303,050.00', 'Commodity': 'PP InnoPlus HS150',
      'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'QINGDAO, CHINA',
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
      ...insDocs('doc-T18', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 303,050.00', 'Commodity': 'PP InnoPlus HS150', 'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'QINGDAO, CHINA' },
        { 'Port of Discharge': 'TIANJIN, CHINA' }),  // ← insurance mismatch
      ...dblDocs('doc-T18', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Qingdao Jifa Group Co., Ltd.', 'Vessel Name': 'MV PACIFIC JADE', 'Gross Weight': '292,900 KG' }),
      oblDoc('doc-T18', '18 Mar 2026'),
    ],
  },

  // T19 — CF: All Matches | Ins: All Matches | BL: Needs Attention | BL Date: Pending
  {
    id: '2026030019', shipmentRef: 'SHP-2026-019', shipper: 'PTT Global Chemical PCL',
    consignee: 'LG Chem Ltd.',
    submittedDate: '2026-03-19', assignedTo: 'john.smith@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'Needs Attention', blDate: 'Pending Verification' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 635,910.00', 'Commodity': 'HDPE InnoPlus HB5400P',
      'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'BUSAN, SOUTH KOREA',
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
      ...insDocs('doc-T19', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 635,910.00', 'Commodity': 'HDPE InnoPlus HB5400P', 'Port of Loading': 'LAEM CHABANG PORT, THAILAND', 'Port of Discharge': 'BUSAN, SOUTH KOREA' }),
      ...dblDocs('doc-T19', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'LG Chem Ltd.', 'Vessel Name': 'MV BUSAN PEARL', 'Gross Weight': '621,150 KG' },
        { 'Shipper': 'GC International Trading PCL' }),  // ← draftBL mismatch
    ],
  },

  // T20 — CF: Needs Attention (CI PRODUCT wrong) | Ins: Needs Attention | BL: All Matches | BL Date: All Matches
  {
    id: '2026030020', shipmentRef: 'SHP-2026-020', shipper: 'PTT Global Chemical PCL',
    consignee: 'Dow Chemical Singapore Pte. Ltd.',
    submittedDate: '2026-03-20', assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'Needs Attention', draftBL: 'All Matches', blDate: 'All Matches' },
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
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 354,090.00', 'Commodity': 'LLDPE InnoPlus LL6100F',
      'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'SINGAPORE',
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
      ...insDocs('doc-T20', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 354,090.00', 'Commodity': 'LLDPE InnoPlus LL6100F', 'Port of Loading': 'MAP TA PHUT PORT, THAILAND', 'Port of Discharge': 'SINGAPORE' },
        { 'Sum Insured': 'USD 340,000.00' }),  // ← insurance mismatch
      ...dblDocs('doc-T20', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Dow Chemical Singapore Pte. Ltd.', 'Vessel Name': 'MV SINGAPORE TRADER', 'Gross Weight': '373,700 KG' }),
      oblDoc('doc-T20', '20 Mar 2026'),
    ],
  },

];
