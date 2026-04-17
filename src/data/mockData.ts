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

// Helper to build standard CF docs
function cfDocs(id: string, vals: Record<string, string>, ciMismatches?: Record<string, string>): ShipDoc[] {
  return [
    {
      id: `${id}-sa`,
      type: 'Shipping Advice',
      fieldMapping: {
        'PROFORMA INVOICE NO.': 'PROFORMA INVOICE NO.',
        'Invoice no.':          'Invoice no.',
        "Buyer's order No.":    "Buyer's order No.",
        'etd <port>':           'etd <port>',
        'eta <port>':           'eta <port>',
        'product (line item)':  'product (line item)',
        'quantity (line item)': 'quantity (line item)',
        'Quantity (Total)':     'Quantity (Total)',
      },
      values: {
        'PROFORMA INVOICE NO.': vals['PROFORMA INVOICE NO.'],
        'Invoice no.':          vals['Invoice no.'],
        "Buyer's order No.":    vals["Buyer's order No."],
        'etd <port>':           vals['etd <port>'],
        'eta <port>':           vals['eta <port>'],
        'product (line item)':  vals['product (line item)'],
        'quantity (line item)': vals['quantity (line item)'],
        'Quantity (Total)':     vals['Quantity (Total)'],
      },
    },
    {
      id: `${id}-ci`,
      type: 'Custom Invoice',
      fieldMapping: {
        'PROFORMA INVOICE NO.': 'Contract No.',
        'Invoice no.':          'Invoice No.',
        "Buyer's order No.":    'PO No.',
        'etd <port>':           'Port of Loading',
        'eta <port>':           'Port of Discharge',
        'product (line item)':  'Description',
        'quantity (line item)': 'Quantity',
        'Quantity (Total)':     'Total Quantity',
      },
      values: {
        'Contract No.':     ciMismatches?.['PROFORMA INVOICE NO.'] ?? vals['PROFORMA INVOICE NO.'],
        'Invoice No.':      ciMismatches?.['Invoice no.']          ?? vals['Invoice no.'],
        'PO No.':           ciMismatches?.["Buyer's order No."]    ?? vals["Buyer's order No."],
        'Port of Loading':  ciMismatches?.['etd <port>']           ?? vals['etd <port>'],
        'Port of Discharge':ciMismatches?.['eta <port>']           ?? vals['eta <port>'],
        'Description':      ciMismatches?.['product (line item)']  ?? vals['product (line item)'],
        'Quantity':         ciMismatches?.['quantity (line item)']  ?? vals['quantity (line item)'],
        'Total Quantity':   ciMismatches?.['Quantity (Total)']      ?? vals['Quantity (Total)'],
      },
    },
  ];
}

function insDocs(id: string, vals: Record<string, string>, mismatch?: Record<string, string>): ShipDoc[] {
  return [
    {
      id: `${id}-ins`,
      type: 'Draft Insurance',
      fieldMapping: {
        'Insured':           'insured_name',
        'Sum Insured':       'sum_insured',
        'Commodity':         'commodity',
        'Port of Loading':   'pol',
        'Port of Discharge': 'pod',
      },
      values: {
        insured_name: mismatch?.['Insured']            ?? vals['Insured'],
        sum_insured:  mismatch?.['Sum Insured']        ?? vals['Sum Insured'],
        commodity:    mismatch?.['Commodity']          ?? vals['Commodity'],
        pol:          mismatch?.['Port of Loading']    ?? vals['Port of Loading'],
        pod:          mismatch?.['Port of Discharge']  ?? vals['Port of Discharge'],
      },
    },
  ];
}

function dblDocs(id: string, vals: Record<string, string>, mismatch?: Record<string, string>): ShipDoc[] {
  return [
    {
      id: `${id}-dbl`,
      type: 'Draft B/L',
      fieldMapping: {
        'Shipper':     'shipper',
        'Consignee':   'consignee',
        'Vessel Name': 'vessel_name',
        'Gross Weight':'gross_weight',
      },
      values: {
        shipper:      mismatch?.['Shipper']      ?? vals['Shipper'],
        consignee:    mismatch?.['Consignee']    ?? vals['Consignee'],
        vessel_name:  mismatch?.['Vessel Name']  ?? vals['Vessel Name'],
        gross_weight: mismatch?.['Gross Weight'] ?? vals['Gross Weight'],
      },
    },
  ];
}

function oblDoc(id: string, date: string): ShipDoc {
  return {
    id: `${id}-obl`,
    type: 'Original B/L',
    fieldMapping: { 'B/L Date': 'bl_date' },
    values: { bl_date: date },
  };
}

export const mockTasks: Task[] = [

  // ─── T01 ─ CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches (has OBL)
  // Overall: All Match
  {
    id: '2026030001',
    shipmentRef: 'SHP-2026-001',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Sinopec International Ltd',
    submittedDate: '2026-03-01',
    assignedTo: 'jane.doe@pttgcgroup.com',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-001', 'Invoice no.': 'CI-2026-001', "Buyer's order No.": 'BO-30001',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Tianjin, China',
      'product (line item)': 'Polyethylene', 'quantity (line item)': '500 MT', 'Quantity (Total)': '500 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 350,000.00', 'Commodity': 'Polyethylene',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Tianjin, China',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Sinopec International Ltd', 'Vessel Name': 'MV Pacific Express', 'Gross Weight': '500,000 KG',
      'GI Date': '01 Mar 2026', 'ETD Date': '01 Mar 2026', 'Manual Billing Date': '01 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T01', { 'PROFORMA INVOICE NO.': 'PFI-2026-001', 'Invoice no.': 'CI-2026-001', "Buyer's order No.": 'BO-30001', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Tianjin, China', 'product (line item)': 'Polyethylene', 'quantity (line item)': '500 MT', 'Quantity (Total)': '500 MT' }),
      ...insDocs('doc-T01', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 350,000.00', 'Commodity': 'Polyethylene', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Tianjin, China' }),
      ...dblDocs('doc-T01', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Sinopec International Ltd', 'Vessel Name': 'MV Pacific Express', 'Gross Weight': '500,000 KG' }),
      oblDoc('doc-T01', '01 Mar 2026'),
    ],
  },

  // ─── T02 ─ CF: Needs Attention | Ins: All Matches | BL: All Matches | BL Date: All Matches
  // Overall: Needs Attention
  {
    id: '2026030002',
    shipmentRef: 'SHP-2026-002',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Dow Chemical Asia Pacific',
    submittedDate: '2026-03-02',
    assignedTo: 'john.smith@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-002', 'Invoice no.': 'CI-2026-002', "Buyer's order No.": 'BO-30002',
      'etd <port>': 'Laem Chabang, Thailand', 'eta <port>': 'Singapore',
      'product (line item)': 'Polypropylene', 'quantity (line item)': '300 MT', 'Quantity (Total)': '300 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 210,000.00', 'Commodity': 'Polypropylene',
      'Port of Loading': 'Laem Chabang, Thailand', 'Port of Discharge': 'Singapore',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Dow Chemical Asia Pacific', 'Vessel Name': 'MV Asian Star', 'Gross Weight': '300,000 KG',
      'GI Date': '02 Mar 2026', 'ETD Date': '02 Mar 2026', 'Manual Billing Date': '02 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T02',
        { 'PROFORMA INVOICE NO.': 'PFI-2026-002', 'Invoice no.': 'CI-2026-002', "Buyer's order No.": 'BO-30002', 'etd <port>': 'Laem Chabang, Thailand', 'eta <port>': 'Singapore', 'product (line item)': 'Polypropylene', 'quantity (line item)': '300 MT', 'Quantity (Total)': '300 MT' },
        { "Buyer's order No.": 'BO-99999' }  // ← mismatch
      ),
      ...insDocs('doc-T02', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 210,000.00', 'Commodity': 'Polypropylene', 'Port of Loading': 'Laem Chabang, Thailand', 'Port of Discharge': 'Singapore' }),
      ...dblDocs('doc-T02', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Dow Chemical Asia Pacific', 'Vessel Name': 'MV Asian Star', 'Gross Weight': '300,000 KG' }),
      oblDoc('doc-T02', '02 Mar 2026'),
    ],
  },

  // ─── T03 ─ CF: All Matches | Ins: Pending | BL: Pending | BL Date: Pending (no OBL)
  // Overall: Pending Document
  {
    id: '2026030003',
    shipmentRef: 'SHP-2026-003',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'BASF SE',
    submittedDate: '2026-03-03',
    assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'Pending',
    verifications: { customFormality: 'All Matches', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-003', 'Invoice no.': 'CI-2026-003', "Buyer's order No.": 'BO-30003',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Hamburg, Germany',
      'product (line item)': 'Styrene Monomer', 'quantity (line item)': '800 MT', 'Quantity (Total)': '800 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 600,000.00', 'Commodity': 'Styrene Monomer',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Hamburg, Germany',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'BASF SE', 'Vessel Name': 'MV Euro Bridge', 'Gross Weight': '800,000 KG',
      'GI Date': '03 Mar 2026', 'ETD Date': '03 Mar 2026', 'Manual Billing Date': '03 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T03', { 'PROFORMA INVOICE NO.': 'PFI-2026-003', 'Invoice no.': 'CI-2026-003', "Buyer's order No.": 'BO-30003', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Hamburg, Germany', 'product (line item)': 'Styrene Monomer', 'quantity (line item)': '800 MT', 'Quantity (Total)': '800 MT' }),
      // No Draft Insurance, Draft B/L, or Original B/L (all pending upload)
    ],
  },

  // ─── T04 ─ CF: All Matches | Ins: Needs Attention | BL: All Matches | BL Date: Pending (no OBL)
  // Overall: Needs Attention
  {
    id: '2026030004',
    shipmentRef: 'SHP-2026-004',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'LG Chem Ltd',
    submittedDate: '2026-03-04',
    assignedTo: 'james.tan@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'Needs Attention', draftBL: 'All Matches', blDate: 'Pending Verification' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-004', 'Invoice no.': 'CI-2026-004', "Buyer's order No.": 'BO-30004',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Ulsan, South Korea',
      'product (line item)': 'Ethylene Oxide', 'quantity (line item)': '200 MT', 'Quantity (Total)': '200 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 180,000.00', 'Commodity': 'Ethylene Oxide',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Ulsan, South Korea',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'LG Chem Ltd', 'Vessel Name': 'MV Korea Star', 'Gross Weight': '200,000 KG',
      'GI Date': '04 Mar 2026', 'ETD Date': '04 Mar 2026', 'Manual Billing Date': '04 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T04', { 'PROFORMA INVOICE NO.': 'PFI-2026-004', 'Invoice no.': 'CI-2026-004', "Buyer's order No.": 'BO-30004', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Ulsan, South Korea', 'product (line item)': 'Ethylene Oxide', 'quantity (line item)': '200 MT', 'Quantity (Total)': '200 MT' }),
      ...insDocs('doc-T04',
        { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 180,000.00', 'Commodity': 'Ethylene Oxide', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Ulsan, South Korea' },
        { 'Insured': 'PTT GC International PCL' }  // ← mismatch
      ),
      ...dblDocs('doc-T04', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'LG Chem Ltd', 'Vessel Name': 'MV Korea Star', 'Gross Weight': '200,000 KG' }),
      // No Original B/L
    ],
  },

  // ─── T05 ─ CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: Pending (no OBL)
  // Overall: Pending Document
  {
    id: '2026030005',
    shipmentRef: 'SHP-2026-005',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Shell Eastern Petroleum',
    submittedDate: '2026-03-05',
    assignedTo: 'sarah.lim@pttgcgroup.com',
    status: 'Pending',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'Pending Verification' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-005', 'Invoice no.': 'CI-2026-005', "Buyer's order No.": 'BO-30005',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Pulau Bukom, Singapore',
      'product (line item)': 'Paraxylene', 'quantity (line item)': '700 MT', 'Quantity (Total)': '700 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 490,000.00', 'Commodity': 'Paraxylene',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Pulau Bukom, Singapore',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Shell Eastern Petroleum', 'Vessel Name': 'MV Shell Trader', 'Gross Weight': '700,000 KG',
      'GI Date': '05 Mar 2026', 'ETD Date': '05 Mar 2026', 'Manual Billing Date': '05 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T05', { 'PROFORMA INVOICE NO.': 'PFI-2026-005', 'Invoice no.': 'CI-2026-005', "Buyer's order No.": 'BO-30005', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Pulau Bukom, Singapore', 'product (line item)': 'Paraxylene', 'quantity (line item)': '700 MT', 'Quantity (Total)': '700 MT' }),
      ...insDocs('doc-T05', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 490,000.00', 'Commodity': 'Paraxylene', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Pulau Bukom, Singapore' }),
      ...dblDocs('doc-T05', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Shell Eastern Petroleum', 'Vessel Name': 'MV Shell Trader', 'Gross Weight': '700,000 KG' }),
      // No Original B/L
    ],
  },

  // ─── T06 ─ CF: All Matches | Ins: All Matches | BL: Needs Attention | BL Date: All Matches
  // Overall: Needs Attention
  {
    id: '2026030006',
    shipmentRef: 'SHP-2026-006',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Mitsui Chemicals Inc',
    submittedDate: '2026-03-06',
    assignedTo: 'alice.tan@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'Needs Attention', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-006', 'Invoice no.': 'CI-2026-006', "Buyer's order No.": 'BO-30006',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Nagoya, Japan',
      'product (line item)': 'Polyvinyl Chloride', 'quantity (line item)': '600 MT', 'Quantity (Total)': '600 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 420,000.00', 'Commodity': 'Polyvinyl Chloride',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Nagoya, Japan',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Mitsui Chemicals Inc', 'Vessel Name': 'MV Japan Arrow', 'Gross Weight': '600,000 KG',
      'GI Date': '06 Mar 2026', 'ETD Date': '06 Mar 2026', 'Manual Billing Date': '06 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T06', { 'PROFORMA INVOICE NO.': 'PFI-2026-006', 'Invoice no.': 'CI-2026-006', "Buyer's order No.": 'BO-30006', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Nagoya, Japan', 'product (line item)': 'Polyvinyl Chloride', 'quantity (line item)': '600 MT', 'Quantity (Total)': '600 MT' }),
      ...insDocs('doc-T06', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 420,000.00', 'Commodity': 'Polyvinyl Chloride', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Nagoya, Japan' }),
      ...dblDocs('doc-T06',
        { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Mitsui Chemicals Inc', 'Vessel Name': 'MV Japan Arrow', 'Gross Weight': '600,000 KG' },
        { 'Gross Weight': '550,000 KG' }  // ← mismatch
      ),
      oblDoc('doc-T06', '06 Mar 2026'),
    ],
  },

  // ─── T07 ─ CF: Needs Attention | Ins: Pending | BL: Pending | BL Date: Pending (no OBL)
  // Overall: Needs Attention
  {
    id: '2026030007',
    shipmentRef: 'SHP-2026-007',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Toray Industries Inc',
    submittedDate: '2026-03-07',
    assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-007', 'Invoice no.': 'CI-2026-007', "Buyer's order No.": 'BO-30007',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Osaka, Japan',
      'product (line item)': 'Acrylonitrile', 'quantity (line item)': '450 MT', 'Quantity (Total)': '450 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 315,000.00', 'Commodity': 'Acrylonitrile',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Osaka, Japan',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Toray Industries Inc', 'Vessel Name': 'MV Toray Maru', 'Gross Weight': '450,000 KG',
      'GI Date': '07 Mar 2026', 'ETD Date': '07 Mar 2026', 'Manual Billing Date': '07 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T07',
        { 'PROFORMA INVOICE NO.': 'PFI-2026-007', 'Invoice no.': 'CI-2026-007', "Buyer's order No.": 'BO-30007', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Osaka, Japan', 'product (line item)': 'Acrylonitrile', 'quantity (line item)': '450 MT', 'Quantity (Total)': '450 MT' },
        { 'quantity (line item)': '350 MT', 'Quantity (Total)': '350 MT' }  // ← mismatch
      ),
      // No Draft Insurance, Draft B/L, or Original B/L
    ],
  },

  // ─── T08 ─ CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  // Overall: All Match
  {
    id: '2026030008',
    shipmentRef: 'SHP-2026-008',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Ineos Group Holdings',
    submittedDate: '2026-03-08',
    assignedTo: 'james.tan@pttgcgroup.com',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-008', 'Invoice no.': 'CI-2026-008', "Buyer's order No.": 'BO-30008',
      'etd <port>': 'Laem Chabang, Thailand', 'eta <port>': 'Rotterdam, Netherlands',
      'product (line item)': 'Ethylene', 'quantity (line item)': '900 MT', 'Quantity (Total)': '900 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 630,000.00', 'Commodity': 'Ethylene',
      'Port of Loading': 'Laem Chabang, Thailand', 'Port of Discharge': 'Rotterdam, Netherlands',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Ineos Group Holdings', 'Vessel Name': 'MV Euro Runner', 'Gross Weight': '900,000 KG',
      'GI Date': '08 Mar 2026', 'ETD Date': '08 Mar 2026', 'Manual Billing Date': '08 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T08', { 'PROFORMA INVOICE NO.': 'PFI-2026-008', 'Invoice no.': 'CI-2026-008', "Buyer's order No.": 'BO-30008', 'etd <port>': 'Laem Chabang, Thailand', 'eta <port>': 'Rotterdam, Netherlands', 'product (line item)': 'Ethylene', 'quantity (line item)': '900 MT', 'Quantity (Total)': '900 MT' }),
      ...insDocs('doc-T08', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 630,000.00', 'Commodity': 'Ethylene', 'Port of Loading': 'Laem Chabang, Thailand', 'Port of Discharge': 'Rotterdam, Netherlands' }),
      ...dblDocs('doc-T08', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Ineos Group Holdings', 'Vessel Name': 'MV Euro Runner', 'Gross Weight': '900,000 KG' }),
      oblDoc('doc-T08', '08 Mar 2026'),
    ],
  },

  // ─── T09 ─ CF: All Matches | Ins: Pending | BL: All Matches | BL Date: Pending (no OBL)
  // Overall: Pending Document
  {
    id: '2026030009',
    shipmentRef: 'SHP-2026-009',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Chevron Phillips Chemical',
    submittedDate: '2026-03-09',
    assignedTo: 'jane.doe@pttgcgroup.com',
    status: 'Pending',
    verifications: { customFormality: 'All Matches', insurance: 'Pending Verification', draftBL: 'All Matches', blDate: 'Pending Verification' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-009', 'Invoice no.': 'CI-2026-009', "Buyer's order No.": 'BO-30009',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Houston, USA',
      'product (line item)': 'Normal Butanol', 'quantity (line item)': '550 MT', 'Quantity (Total)': '550 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 385,000.00', 'Commodity': 'Normal Butanol',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Houston, USA',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Chevron Phillips Chemical', 'Vessel Name': 'MV Gulf Wind', 'Gross Weight': '550,000 KG',
      'GI Date': '09 Mar 2026', 'ETD Date': '09 Mar 2026', 'Manual Billing Date': '09 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T09', { 'PROFORMA INVOICE NO.': 'PFI-2026-009', 'Invoice no.': 'CI-2026-009', "Buyer's order No.": 'BO-30009', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Houston, USA', 'product (line item)': 'Normal Butanol', 'quantity (line item)': '550 MT', 'Quantity (Total)': '550 MT' }),
      ...dblDocs('doc-T09', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Chevron Phillips Chemical', 'Vessel Name': 'MV Gulf Wind', 'Gross Weight': '550,000 KG' }),
      // No Draft Insurance or Original B/L
    ],
  },

  // ─── T10 ─ CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  // Overall: All Match
  {
    id: '2026030010',
    shipmentRef: 'SHP-2026-010',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Hanwha Solutions Corp',
    submittedDate: '2026-03-10',
    assignedTo: 'john.smith@pttgcgroup.com',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-010', 'Invoice no.': 'CI-2026-010', "Buyer's order No.": 'BO-30010',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Incheon, South Korea',
      'product (line item)': 'Vinyl Acetate Monomer', 'quantity (line item)': '350 MT', 'Quantity (Total)': '350 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 245,000.00', 'Commodity': 'Vinyl Acetate Monomer',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Incheon, South Korea',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Hanwha Solutions Corp', 'Vessel Name': 'MV Hanwha Pioneer', 'Gross Weight': '350,000 KG',
      'GI Date': '10 Mar 2026', 'ETD Date': '10 Mar 2026', 'Manual Billing Date': '10 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T10', { 'PROFORMA INVOICE NO.': 'PFI-2026-010', 'Invoice no.': 'CI-2026-010', "Buyer's order No.": 'BO-30010', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Incheon, South Korea', 'product (line item)': 'Vinyl Acetate Monomer', 'quantity (line item)': '350 MT', 'Quantity (Total)': '350 MT' }),
      ...insDocs('doc-T10', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 245,000.00', 'Commodity': 'Vinyl Acetate Monomer', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Incheon, South Korea' }),
      ...dblDocs('doc-T10', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Hanwha Solutions Corp', 'Vessel Name': 'MV Hanwha Pioneer', 'Gross Weight': '350,000 KG' }),
      oblDoc('doc-T10', '10 Mar 2026'),
    ],
  },

  // ─── T11 ─ CF: Needs Attention | Ins: All Matches | BL: Needs Attention | BL Date: All Matches
  // Overall: Needs Attention
  {
    id: '2026030011',
    shipmentRef: 'SHP-2026-011',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Mitsubishi Chemical Corp',
    submittedDate: '2026-03-11',
    assignedTo: 'jane.doe@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'All Matches', draftBL: 'Needs Attention', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-011', 'Invoice no.': 'CI-2026-011', "Buyer's order No.": 'BO-30011',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Yokohama, Japan',
      'product (line item)': 'Acetic Acid', 'quantity (line item)': '520 MT', 'Quantity (Total)': '520 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 364,000.00', 'Commodity': 'Acetic Acid',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Yokohama, Japan',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Mitsubishi Chemical Corp', 'Vessel Name': 'MV Mitsubishi Voyager', 'Gross Weight': '520,000 KG',
      'GI Date': '11 Mar 2026', 'ETD Date': '11 Mar 2026', 'Manual Billing Date': '11 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T11',
        { 'PROFORMA INVOICE NO.': 'PFI-2026-011', 'Invoice no.': 'CI-2026-011', "Buyer's order No.": 'BO-30011', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Yokohama, Japan', 'product (line item)': 'Acetic Acid', 'quantity (line item)': '520 MT', 'Quantity (Total)': '520 MT' },
        { 'Invoice no.': 'CI-2026-011-X' }  // ← mismatch
      ),
      ...insDocs('doc-T11', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 364,000.00', 'Commodity': 'Acetic Acid', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Yokohama, Japan' }),
      ...dblDocs('doc-T11',
        { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Mitsubishi Chemical Corp', 'Vessel Name': 'MV Mitsubishi Voyager', 'Gross Weight': '520,000 KG' },
        { 'Consignee': 'Mitsubishi Chemical Corporation' }  // ← mismatch
      ),
      oblDoc('doc-T11', '11 Mar 2026'),
    ],
  },

  // ─── T12 ─ CF: All Matches | Ins: Pending | BL: Pending | BL Date: All Matches
  // Overall: Pending Document
  {
    id: '2026030012',
    shipmentRef: 'SHP-2026-012',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Huntsman Corporation',
    submittedDate: '2026-03-12',
    assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'Pending',
    verifications: { customFormality: 'All Matches', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-012', 'Invoice no.': 'CI-2026-012', "Buyer's order No.": 'BO-30012',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Port Arthur, USA',
      'product (line item)': 'Propylene Oxide', 'quantity (line item)': '320 MT', 'Quantity (Total)': '320 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 224,000.00', 'Commodity': 'Propylene Oxide',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Port Arthur, USA',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Huntsman Corporation', 'Vessel Name': 'MV Gulf Breeze', 'Gross Weight': '320,000 KG',
      'GI Date': '12 Mar 2026', 'ETD Date': '12 Mar 2026', 'Manual Billing Date': '12 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T12', { 'PROFORMA INVOICE NO.': 'PFI-2026-012', 'Invoice no.': 'CI-2026-012', "Buyer's order No.": 'BO-30012', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Port Arthur, USA', 'product (line item)': 'Propylene Oxide', 'quantity (line item)': '320 MT', 'Quantity (Total)': '320 MT' }),
      oblDoc('doc-T12', '12 Mar 2026'),
      // No Draft Insurance or Draft B/L
    ],
  },

  // ─── T13 ─ CF: All Matches | Ins: Needs Attention | BL: Needs Attention | BL Date: Pending (no OBL)
  // Overall: Needs Attention
  {
    id: '2026030013',
    shipmentRef: 'SHP-2026-013',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Wanhua Chemical Group',
    submittedDate: '2026-03-13',
    assignedTo: 'james.tan@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'Needs Attention', draftBL: 'Needs Attention', blDate: 'Pending Verification' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-013', 'Invoice no.': 'CI-2026-013', "Buyer's order No.": 'BO-30013',
      'etd <port>': 'Laem Chabang, Thailand', 'eta <port>': 'Yantai, China',
      'product (line item)': 'MDI', 'quantity (line item)': '480 MT', 'Quantity (Total)': '480 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 336,000.00', 'Commodity': 'MDI',
      'Port of Loading': 'Laem Chabang, Thailand', 'Port of Discharge': 'Yantai, China',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Wanhua Chemical Group', 'Vessel Name': 'MV Yellow Sea', 'Gross Weight': '480,000 KG',
      'GI Date': '13 Mar 2026', 'ETD Date': '13 Mar 2026', 'Manual Billing Date': '13 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T13', { 'PROFORMA INVOICE NO.': 'PFI-2026-013', 'Invoice no.': 'CI-2026-013', "Buyer's order No.": 'BO-30013', 'etd <port>': 'Laem Chabang, Thailand', 'eta <port>': 'Yantai, China', 'product (line item)': 'MDI', 'quantity (line item)': '480 MT', 'Quantity (Total)': '480 MT' }),
      ...insDocs('doc-T13',
        { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 336,000.00', 'Commodity': 'MDI', 'Port of Loading': 'Laem Chabang, Thailand', 'Port of Discharge': 'Yantai, China' },
        { 'Sum Insured': 'USD 300,000.00' }  // ← mismatch
      ),
      ...dblDocs('doc-T13',
        { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Wanhua Chemical Group', 'Vessel Name': 'MV Yellow Sea', 'Gross Weight': '480,000 KG' },
        { 'Consignee': 'Wanhua Chemical Group Co Ltd' }  // ← mismatch
      ),
      // No Original B/L
    ],
  },

  // ─── T14 ─ CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  // Overall: All Match
  {
    id: '2026030014',
    shipmentRef: 'SHP-2026-014',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Celanese Corporation',
    submittedDate: '2026-03-14',
    assignedTo: 'sarah.lim@pttgcgroup.com',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-014', 'Invoice no.': 'CI-2026-014', "Buyer's order No.": 'BO-30014',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Frankfurt, Germany',
      'product (line item)': 'Methanol', 'quantity (line item)': '1,200 MT', 'Quantity (Total)': '1,200 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 840,000.00', 'Commodity': 'Methanol',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Frankfurt, Germany',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Celanese Corporation', 'Vessel Name': 'MV Rhine Express', 'Gross Weight': '1,200,000 KG',
      'GI Date': '14 Mar 2026', 'ETD Date': '14 Mar 2026', 'Manual Billing Date': '14 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T14', { 'PROFORMA INVOICE NO.': 'PFI-2026-014', 'Invoice no.': 'CI-2026-014', "Buyer's order No.": 'BO-30014', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Frankfurt, Germany', 'product (line item)': 'Methanol', 'quantity (line item)': '1,200 MT', 'Quantity (Total)': '1,200 MT' }),
      ...insDocs('doc-T14', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 840,000.00', 'Commodity': 'Methanol', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Frankfurt, Germany' }),
      ...dblDocs('doc-T14', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Celanese Corporation', 'Vessel Name': 'MV Rhine Express', 'Gross Weight': '1,200,000 KG' }),
      oblDoc('doc-T14', '14 Mar 2026'),
    ],
  },

  // ─── T15 ─ CF: Needs Attention | Ins: All Matches | BL: All Matches | BL Date: Pending (no OBL)
  // Overall: Needs Attention
  {
    id: '2026030015',
    shipmentRef: 'SHP-2026-015',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Formosa Plastics Corp',
    submittedDate: '2026-03-15',
    assignedTo: 'alice.tan@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'Pending Verification' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-015', 'Invoice no.': 'CI-2026-015', "Buyer's order No.": 'BO-30015',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Kaohsiung, Taiwan',
      'product (line item)': 'High Density Polyethylene', 'quantity (line item)': '650 MT', 'Quantity (Total)': '650 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 455,000.00', 'Commodity': 'High Density Polyethylene',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Kaohsiung, Taiwan',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Formosa Plastics Corp', 'Vessel Name': 'MV Taiwan Spirit', 'Gross Weight': '650,000 KG',
      'GI Date': '15 Mar 2026', 'ETD Date': '15 Mar 2026', 'Manual Billing Date': '15 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T15',
        { 'PROFORMA INVOICE NO.': 'PFI-2026-015', 'Invoice no.': 'CI-2026-015', "Buyer's order No.": 'BO-30015', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Kaohsiung, Taiwan', 'product (line item)': 'High Density Polyethylene', 'quantity (line item)': '650 MT', 'Quantity (Total)': '650 MT' },
        { 'etd <port>': 'Bangkok, Thailand' }  // ← mismatch
      ),
      ...insDocs('doc-T15', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 455,000.00', 'Commodity': 'High Density Polyethylene', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Kaohsiung, Taiwan' }),
      ...dblDocs('doc-T15', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Formosa Plastics Corp', 'Vessel Name': 'MV Taiwan Spirit', 'Gross Weight': '650,000 KG' }),
      // No Original B/L
    ],
  },

  // ─── T16 ─ CF: All Matches | Ins: All Matches | BL: Pending | BL Date: Pending (no OBL)
  // Overall: Pending Document
  {
    id: '2026030016',
    shipmentRef: 'SHP-2026-016',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Sabic Europe BV',
    submittedDate: '2026-03-16',
    assignedTo: 'john.smith@pttgcgroup.com',
    status: 'Pending',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-016', 'Invoice no.': 'CI-2026-016', "Buyer's order No.": 'BO-30016',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Amsterdam, Netherlands',
      'product (line item)': 'Propylene', 'quantity (line item)': '750 MT', 'Quantity (Total)': '750 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 525,000.00', 'Commodity': 'Propylene',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Amsterdam, Netherlands',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Sabic Europe BV', 'Vessel Name': 'MV North Sea', 'Gross Weight': '750,000 KG',
      'GI Date': '16 Mar 2026', 'ETD Date': '16 Mar 2026', 'Manual Billing Date': '16 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T16', { 'PROFORMA INVOICE NO.': 'PFI-2026-016', 'Invoice no.': 'CI-2026-016', "Buyer's order No.": 'BO-30016', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Amsterdam, Netherlands', 'product (line item)': 'Propylene', 'quantity (line item)': '750 MT', 'Quantity (Total)': '750 MT' }),
      ...insDocs('doc-T16', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 525,000.00', 'Commodity': 'Propylene', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Amsterdam, Netherlands' }),
      // No Draft B/L or Original B/L
    ],
  },

  // ─── T17 ─ CF: All Matches | Ins: All Matches | BL: All Matches | BL Date: All Matches
  // Overall: All Match
  {
    id: '2026030017',
    shipmentRef: 'SHP-2026-017',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Kumho Petrochemical',
    submittedDate: '2026-03-17',
    assignedTo: 'aisha.patel@pttgcgroup.com',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-017', 'Invoice no.': 'CI-2026-017', "Buyer's order No.": 'BO-30017',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Busan, South Korea',
      'product (line item)': 'Butadiene', 'quantity (line item)': '280 MT', 'Quantity (Total)': '280 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 196,000.00', 'Commodity': 'Butadiene',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Busan, South Korea',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Kumho Petrochemical', 'Vessel Name': 'MV Kumho Star', 'Gross Weight': '280,000 KG',
      'GI Date': '17 Mar 2026', 'ETD Date': '17 Mar 2026', 'Manual Billing Date': '17 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T17', { 'PROFORMA INVOICE NO.': 'PFI-2026-017', 'Invoice no.': 'CI-2026-017', "Buyer's order No.": 'BO-30017', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Busan, South Korea', 'product (line item)': 'Butadiene', 'quantity (line item)': '280 MT', 'Quantity (Total)': '280 MT' }),
      ...insDocs('doc-T17', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 196,000.00', 'Commodity': 'Butadiene', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Busan, South Korea' }),
      ...dblDocs('doc-T17', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Kumho Petrochemical', 'Vessel Name': 'MV Kumho Star', 'Gross Weight': '280,000 KG' }),
      oblDoc('doc-T17', '17 Mar 2026'),
    ],
  },

  // ─── T18 ─ CF: All Matches | Ins: Needs Attention | BL: All Matches | BL Date: All Matches
  // Overall: Needs Attention
  {
    id: '2026030018',
    shipmentRef: 'SHP-2026-018',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Eastman Chemical Company',
    submittedDate: '2026-03-18',
    assignedTo: 'alice.tan@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'Needs Attention', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-018', 'Invoice no.': 'CI-2026-018', "Buyer's order No.": 'BO-30018',
      'etd <port>': 'Laem Chabang, Thailand', 'eta <port>': 'Kingsport, USA',
      'product (line item)': 'Acetate Tow', 'quantity (line item)': '420 MT', 'Quantity (Total)': '420 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 294,000.00', 'Commodity': 'Acetate Tow',
      'Port of Loading': 'Laem Chabang, Thailand', 'Port of Discharge': 'Kingsport, USA',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Eastman Chemical Company', 'Vessel Name': 'MV Atlantic Voyager', 'Gross Weight': '420,000 KG',
      'GI Date': '18 Mar 2026', 'ETD Date': '18 Mar 2026', 'Manual Billing Date': '18 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T18', { 'PROFORMA INVOICE NO.': 'PFI-2026-018', 'Invoice no.': 'CI-2026-018', "Buyer's order No.": 'BO-30018', 'etd <port>': 'Laem Chabang, Thailand', 'eta <port>': 'Kingsport, USA', 'product (line item)': 'Acetate Tow', 'quantity (line item)': '420 MT', 'Quantity (Total)': '420 MT' }),
      ...insDocs('doc-T18',
        { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 294,000.00', 'Commodity': 'Acetate Tow', 'Port of Loading': 'Laem Chabang, Thailand', 'Port of Discharge': 'Kingsport, USA' },
        { 'Port of Discharge': 'New York, USA' }  // ← mismatch
      ),
      ...dblDocs('doc-T18', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Eastman Chemical Company', 'Vessel Name': 'MV Atlantic Voyager', 'Gross Weight': '420,000 KG' }),
      oblDoc('doc-T18', '18 Mar 2026'),
    ],
  },

  // ─── T19 ─ CF: All Matches | Ins: All Matches | BL: Needs Attention | BL Date: Pending (no OBL)
  // Overall: Needs Attention
  {
    id: '2026030019',
    shipmentRef: 'SHP-2026-019',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'ExxonMobil Chemical Asia',
    submittedDate: '2026-03-19',
    assignedTo: 'sarah.lim@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'Needs Attention', blDate: 'Pending Verification' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-019', 'Invoice no.': 'CI-2026-019', "Buyer's order No.": 'BO-30019',
      'etd <port>': 'Laem Chabang, Thailand', 'eta <port>': 'Jurong Island, Singapore',
      'product (line item)': 'Benzene', 'quantity (line item)': '400 MT', 'Quantity (Total)': '400 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 280,000.00', 'Commodity': 'Benzene',
      'Port of Loading': 'Laem Chabang, Thailand', 'Port of Discharge': 'Jurong Island, Singapore',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'ExxonMobil Chemical Asia', 'Vessel Name': 'MV Strait Star', 'Gross Weight': '400,000 KG',
      'GI Date': '19 Mar 2026', 'ETD Date': '19 Mar 2026', 'Manual Billing Date': '19 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T19', { 'PROFORMA INVOICE NO.': 'PFI-2026-019', 'Invoice no.': 'CI-2026-019', "Buyer's order No.": 'BO-30019', 'etd <port>': 'Laem Chabang, Thailand', 'eta <port>': 'Jurong Island, Singapore', 'product (line item)': 'Benzene', 'quantity (line item)': '400 MT', 'Quantity (Total)': '400 MT' }),
      ...insDocs('doc-T19', { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 280,000.00', 'Commodity': 'Benzene', 'Port of Loading': 'Laem Chabang, Thailand', 'Port of Discharge': 'Jurong Island, Singapore' }),
      ...dblDocs('doc-T19',
        { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'ExxonMobil Chemical Asia', 'Vessel Name': 'MV Strait Star', 'Gross Weight': '400,000 KG' },
        { 'Vessel Name': 'MV Strait Star II' }  // ← mismatch
      ),
      // No Original B/L
    ],
  },

  // ─── T20 ─ CF: Needs Attention | Ins: Needs Attention | BL: All Matches | BL Date: All Matches
  // Overall: Needs Attention
  {
    id: '2026030020',
    shipmentRef: 'SHP-2026-020',
    shipper: 'PTT Global Chemical PCL',
    consignee: 'Reliance Industries Ltd',
    submittedDate: '2026-03-20',
    assignedTo: 'james.tan@pttgcgroup.com',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'Needs Attention', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: ['PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>', 'product (line item)', 'quantity (line item)', 'Quantity (Total)', 'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge', 'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight', 'GI Date', 'ETD Date', 'Manual Billing Date'],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2026-020', 'Invoice no.': 'CI-2026-020', "Buyer's order No.": 'BO-30020',
      'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Mumbai, India',
      'product (line item)': 'Purified Terephthalic Acid', 'quantity (line item)': '1,000 MT', 'Quantity (Total)': '1,000 MT',
      'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 750,000.00', 'Commodity': 'Purified Terephthalic Acid',
      'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Mumbai, India',
      'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Reliance Industries Ltd', 'Vessel Name': 'MV India Express', 'Gross Weight': '1,000,000 KG',
      'GI Date': '20 Mar 2026', 'ETD Date': '20 Mar 2026', 'Manual Billing Date': '20 Mar 2026',
    },
    documents: [
      ...cfDocs('doc-T20',
        { 'PROFORMA INVOICE NO.': 'PFI-2026-020', 'Invoice no.': 'CI-2026-020', "Buyer's order No.": 'BO-30020', 'etd <port>': 'Map Ta Phut, Thailand', 'eta <port>': 'Mumbai, India', 'product (line item)': 'Purified Terephthalic Acid', 'quantity (line item)': '1,000 MT', 'Quantity (Total)': '1,000 MT' },
        { 'product (line item)': 'PTA' }  // ← mismatch (abbreviation)
      ),
      ...insDocs('doc-T20',
        { 'Insured': 'PTT Global Chemical PCL', 'Sum Insured': 'USD 750,000.00', 'Commodity': 'Purified Terephthalic Acid', 'Port of Loading': 'Map Ta Phut, Thailand', 'Port of Discharge': 'Mumbai, India' },
        { 'Commodity': 'PTA' }  // ← mismatch
      ),
      ...dblDocs('doc-T20', { 'Shipper': 'PTT Global Chemical PCL', 'Consignee': 'Reliance Industries Ltd', 'Vessel Name': 'MV India Express', 'Gross Weight': '1,000,000 KG' }),
      oblDoc('doc-T20', '20 Mar 2026'),
    ],
  },

];
