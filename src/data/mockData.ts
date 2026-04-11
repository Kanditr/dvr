export interface ShipDoc {
  id: string;
  type: 'Shipping Advice' | 'Custom Invoice' | 'Packing List' | 'Letter of Credit' | 'Shipping Instruction' | 'DocXPort' | 'Draft Insurance' | 'Detail for Insurance Purpose' | 'Draft B/L' | 'Shipping Particular' | 'Original B/L';
  fieldMapping: Record<string, string>; // canonical field → original field name in this doc
  values: Record<string, string>;       // original field name → actual value
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
  documents: ShipDoc[];       // variable: 2–5 documents
  canonicalFields: string[];  // fields to compare, specific to this task
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

export const mockTasks: Task[] = [
  // T001 — 1015030621 — CF: All Matches
  {
    id: '1015030621',
    shipmentRef: 'SHP-2025-001',
    shipper: 'Petronas Trading Sdn Bhd',
    consignee: 'China National Chemical Corp',
    submittedDate: '2025-11-03',
    assignedTo: 'Jane Doe',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: [
      // CF fields
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      // Insurance fields
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      // DraftBL fields
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      // BL Date fields
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      // CF fields
      'PROFORMA INVOICE NO.':  'PFI-2025-001',
      'Invoice no.':           'CI-2025-001',
      "Buyer's order No.":     'BO-55001',
      'etd <port>':            'Port Klang, Malaysia',
      'eta <port>':            'Huangpu, China',
      'product (line item)':   'Crude Palm Oil',
      'quantity (line item)':  '250 MT',
      'Quantity (Total)':      '250 MT',
      // Insurance fields
      'Insured':               'Petronas Trading Sdn Bhd',
      'Sum Insured':           'USD 50,000.00',
      'Commodity':             'Crude Palm Oil',
      'Port of Loading':       'Port Klang, Malaysia',
      'Port of Discharge':     'Huangpu, China',
      // DraftBL fields
      'Shipper':               'Petronas Trading Sdn Bhd',
      'Consignee':             'China National Chemical Corp',
      'Vessel Name':           'MV Pacific Glory',
      'Gross Weight':          '250,000 KG',
      // BL Date fields
      'GI Date':               '03 Nov 2025',
      'ETD Date':              '03 Nov 2025',
      'Manual Billing Date':   '03 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T001-1',
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
          'PROFORMA INVOICE NO.': 'PFI-2025-001',
          'Invoice no.':          'CI-2025-001',
          "Buyer's order No.":    'BO-55001',
          'etd <port>':           'Port Klang, Malaysia',
          'eta <port>':           'Huangpu, China',
          'product (line item)':  'Crude Palm Oil',
          'quantity (line item)': '250 MT',
          'Quantity (Total)':     '250 MT',
        },
      },
      {
        id: 'doc-T001-2',
        type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-001',
          'No.':                  'CI-2025-001',
          "Buyer's order No.":    'BO-55001',
          'from':                 'Port Klang, Malaysia',
          'to':                   'Huangpu, China',
          'description of goods': 'Crude Palm Oil',
          'quantity':             '250 MT',
          'Quantity (Total)':     '250 MT',
        },
      },
      {
        id: 'doc-T001-3',
        type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-001',
          'No.':                  'CI-2025-001',
          "Buyer's order No.":    'BO-55001',
          'from':                 'Port Klang, Malaysia',
          'to':                   'Huangpu, China',
          'description of goods': 'Crude Palm Oil',
          'quantity':             '250 MT',
          'Quantity (Total)':     '250 MT',
        },
      },
      {
        id: 'doc-T001-4',
        type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.',
          'Invoice no.':          'Invoice No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'Port of Loading',
          'eta <port>':           'Port of Discharge',
          'product (line item)':  'Description of Goods',
          'quantity (line item)': 'Quantity',
          'Quantity (Total)':     'Total Quantity',
        },
        values: {
          'Contract No.':        'PFI-2025-001',
          'Invoice No.':         'CI-2025-001',
          "Buyer's order No.":   'BO-55001',
          'Port of Loading':     'Port Klang, Malaysia',
          'Port of Discharge':   'Huangpu, China',
          'Description of Goods':'Crude Palm Oil',
          'Quantity':            '250 MT',
          'Total Quantity':      '250 MT',
        },
      },
      {
        id: 'doc-T001-ins1',
        type: 'Draft Insurance',
        fieldMapping: {
          'Insured':           'insured_name',
          'Sum Insured':       'sum_insured',
          'Commodity':         'commodity',
          'Port of Loading':   'pol',
          'Port of Discharge': 'pod',
        },
        values: {
          insured_name: 'Petronas Trading Sdn Bhd',
          sum_insured:  'USD 50,000.00',
          commodity:    'Crude Palm Oil',
          pol:          'Port Klang, Malaysia',
          pod:          'Huangpu, China',
        },
      },
      {
        id: 'doc-T001-ins2',
        type: 'Detail for Insurance Purpose',
        fieldMapping: {
          'Insured':           'insured',
          'Sum Insured':       'declared_value',
          'Commodity':         'goods_description',
          'Port of Loading':   'loading_port',
          'Port of Discharge': 'discharge_port',
        },
        values: {
          insured:           'Petronas Trading Sdn Bhd',
          declared_value:    'USD 50,000.00',
          goods_description: 'Crude Palm Oil',
          loading_port:      'Port Klang, Malaysia',
          discharge_port:    'Huangpu, China',
        },
      },
      {
        id: 'doc-T001-bl1',
        type: 'Draft B/L',
        fieldMapping: {
          'Shipper':     'shipper',
          'Consignee':   'consignee',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_weight',
        },
        values: {
          shipper:      'Petronas Trading Sdn Bhd',
          consignee:    'China National Chemical Corp',
          vessel_name:  'MV Pacific Glory',
          gross_weight: '250,000 KG',
        },
      },
      {
        id: 'doc-T001-bl2',
        type: 'Shipping Particular',
        fieldMapping: {
          'Shipper':     'exporter',
          'Consignee':   'importer',
          'Vessel Name': 'vessel',
          'Gross Weight':'gross_wt_kg',
        },
        values: {
          exporter:    'Petronas Trading Sdn Bhd',
          importer:    'China National Chemical Corp',
          vessel:      'MV Pacific Glory',
          gross_wt_kg: '250,000 KG',
        },
      },
      {
        id: 'doc-T001-obl',
        type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '03 Nov 2025' },
      },
    ],
  },

  // T002 — 1015030622 — CF: All Matches
  {
    id: '1015030622',
    shipmentRef: 'SHP-2025-002',
    shipper: 'Mayur Exports Pte Ltd',
    consignee: 'Al Fatah Trading LLC',
    submittedDate: '2025-11-05',
    assignedTo: 'John Smith',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'Needs Attention', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: [
      // CF fields
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      // Insurance fields
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      // DraftBL fields
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      // BL Date fields
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      // CF fields
      'PROFORMA INVOICE NO.':  'PFI-2025-002',
      'Invoice no.':           'CI-2025-002',
      "Buyer's order No.":     'BO-66002',
      'etd <port>':            'Port Klang, Malaysia',
      'eta <port>':            'Jebel Ali, UAE',
      'product (line item)':   'Natural Rubber (RSS3)',
      'quantity (line item)':  '125 MT',
      'Quantity (Total)':      '125 MT',
      // Insurance fields
      'Insured':               'Mayur Exports Pte Ltd',
      'Sum Insured':           'USD 125,000.00',
      'Commodity':             'Natural Rubber (RSS3)',
      'Port of Loading':       'Port Klang, Malaysia',
      'Port of Discharge':     'Jebel Ali, UAE',
      // DraftBL fields
      'Shipper':               'Mayur Exports Pte Ltd',
      'Consignee':             'Al Fatah Trading LLC',
      'Vessel Name':           'MV Gulf Trader',
      'Gross Weight':          '125,000 KG',
      // BL Date fields
      'GI Date':               '05 Nov 2025',
      'ETD Date':              '05 Nov 2025',
      'Manual Billing Date':   '05 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T002-0',
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
          'PROFORMA INVOICE NO.': 'PFI-2025-002',
          'Invoice no.':          'CI-2025-002',
          "Buyer's order No.":    'BO-66002',
          'etd <port>':           'Port Klang, Malaysia',
          'eta <port>':           'Jebel Ali, UAE',
          'product (line item)':  'Natural Rubber (RSS3)',
          'quantity (line item)': '125 MT',
          'Quantity (Total)':     '125 MT',
        },
      },
      {
        id: 'doc-T002-1',
        type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-002',
          'No.':                  'CI-2025-002',
          "Buyer's order No.":    'BO-66002',
          'from':                 'Port Klang, Malaysia',
          'to':                   'Jebel Ali, UAE',
          'description of goods': 'Natural Rubber (RSS3)',
          'quantity':             '125 MT',
          'Quantity (Total)':     '125 MT',
        },
      },
      {
        id: 'doc-T002-2',
        type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-002',
          'No.':                  'CI-2025-002',
          "Buyer's order No.":    'BO-66002',
          'from':                 'Port Klang, Malaysia',
          'to':                   'Jebel Ali, UAE',
          'description of goods': 'Natural Rubber (RSS3)',
          'quantity':             '125 MT',
          'Quantity (Total)':     '125 MT',
        },
      },
      {
        id: 'doc-T002-3',
        type: 'Letter of Credit',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.',
          'Invoice no.':          'Invoice No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'Port of Loading',
          'eta <port>':           'Port of Discharge',
          'product (line item)':  'Description of Goods',
          'quantity (line item)': 'Quantity',
          'Quantity (Total)':     'Total Quantity',
        },
        values: {
          'Contract No.':        'PFI-2025-002',
          'Invoice No.':         'CI-2025-002',
          "Buyer's order No.":   'BO-66002',
          'Port of Loading':     'Port Klang, Malaysia',
          'Port of Discharge':   'Jebel Ali, UAE',
          'Description of Goods':'Natural Rubber (RSS3)',
          'Quantity':            '125 MT',
          'Total Quantity':      '125 MT',
        },
      },
      {
        id: 'doc-T002-ins1',
        type: 'Draft Insurance',
        fieldMapping: {
          'Insured':           'insured_name',
          'Sum Insured':       'sum_insured',
          'Commodity':         'commodity',
          'Port of Loading':   'pol',
          'Port of Discharge': 'pod',
        },
        values: {
          insured_name: 'Mayur Exports Pte Ltd',
          sum_insured:  'USD 125,000.00',
          commodity:    'Natural Rubber (RSS3)',
          pol:          'Port Klang, Malaysia',
          pod:          'Jebel Ali, UAE',
        },
      },
      {
        id: 'doc-T002-ins2',
        type: 'Detail for Insurance Purpose',
        fieldMapping: {
          'Insured':           'insured',
          'Sum Insured':       'declared_value',
          'Commodity':         'cargo',
          'Port of Loading':   'loading_port',
          'Port of Discharge': 'discharge_port',
        },
        values: {
          insured:        'Mayur Exports Pte Ltd',
          declared_value: 'USD 130,000.00', // ← mismatch: overstated value
          cargo:          'Natural Rubber (RSS3)',
          loading_port:   'Port Klang, Malaysia',
          discharge_port: 'Jebel Ali, UAE',
        },
      },
      {
        id: 'doc-T002-bl1',
        type: 'Draft B/L',
        fieldMapping: {
          'Shipper':     'shipper',
          'Consignee':   'consignee',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_weight',
        },
        values: {
          shipper:      'Mayur Exports Pte Ltd',
          consignee:    'Al Fatah Trading LLC',
          vessel_name:  'MV Gulf Trader',
          gross_weight: '125,000 KG',
        },
      },
      {
        id: 'doc-T002-bl2',
        type: 'Shipping Particular',
        fieldMapping: {
          'Shipper':     'exporter',
          'Consignee':   'importer',
          'Vessel Name': 'vessel',
          'Gross Weight':'gross_wt',
        },
        values: {
          exporter: 'Mayur Exports Pte Ltd',
          importer: 'Al Fatah Trading LLC',
          vessel:   'MV Gulf Trader',
          gross_wt: '125,000 KG',
        },
      },
      {
        id: 'doc-T002-obl',
        type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '' },
      },
    ],
  },

  // T003 — 1015030623 — CF: Needs Attention (Port of Discharge mismatch in Shipping Instruction)
  {
    id: '1015030623',
    shipmentRef: 'SHP-2025-003',
    shipper: 'Genting Plantations Berhad',
    consignee: 'Wilmar International Ltd',
    submittedDate: '2025-11-07',
    assignedTo: 'Aisha Patel',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'All Matches', draftBL: 'Needs Attention', blDate: 'Pending Verification' },
    canonicalFields: [
      // CF fields
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      // Insurance fields
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      // DraftBL fields
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      // BL Date fields
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      // CF fields
      'PROFORMA INVOICE NO.':  'PFI-2025-003',
      'Invoice no.':           'CI-2025-003',
      "Buyer's order No.":     'BO-77003',
      'etd <port>':            'Port Klang, Malaysia',
      'eta <port>':            'Tanjung Priok, Indonesia',
      'product (line item)':   'RBD Palm Olein',
      'quantity (line item)':  '500 MT',
      'Quantity (Total)':      '500 MT',
      // Insurance fields
      'Insured':               'Genting Plantations Berhad',
      'Sum Insured':           'USD 280,000.00',
      'Commodity':             'RBD Palm Olein',
      'Port of Loading':       'Port Klang, Malaysia',
      'Port of Discharge':     'Tanjung Priok, Indonesia',
      // DraftBL fields
      'Shipper':               'Genting Plantations Berhad',
      'Consignee':             'Wilmar International Ltd',
      'Vessel Name':           'MV Pacific Star',
      'Gross Weight':          '500,000 KG',
      // BL Date fields
      'GI Date':               '07 Nov 2025',
      'ETD Date':              '07 Nov 2025',
      'Manual Billing Date':   '07 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T003-1',
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
          'PROFORMA INVOICE NO.': 'PFI-2025-003',
          'Invoice no.':          'CI-2025-003',
          "Buyer's order No.":    'BO-77003',
          'etd <port>':           'Port Klang, Malaysia',
          'eta <port>':           'Tanjung Priok, Indonesia',
          'product (line item)':  'RBD Palm Olein',
          'quantity (line item)': '500 MT',
          'Quantity (Total)':     '500 MT',
        },
      },
      {
        id: 'doc-T003-2',
        type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-003',
          'No.':                  'CI-2025-003',
          "Buyer's order No.":    'BO-77003',
          'from':                 'Port Klang, Malaysia',
          'to':                   'Tanjung Priok, Indonesia',
          'description of goods': 'RBD Palm Olein',
          'quantity':             '500 MT',
          'Quantity (Total)':     '500 MT',
        },
      },
      {
        id: 'doc-T003-3',
        type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-003',
          'No.':                  'CI-2025-003',
          "Buyer's order No.":    'BO-77003',
          'from':                 'Port Klang, Malaysia',
          'to':                   'Tanjung Priok, Indonesia',
          'description of goods': 'RBD Palm Olein',
          'quantity':             '500 MT',
          'Quantity (Total)':     '500 MT',
        },
      },
      {
        id: 'doc-T003-4',
        type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.',
          'Invoice no.':          'Invoice No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'Port of Loading',
          'eta <port>':           'Port of Discharge',
          'product (line item)':  'Description of Goods',
          'quantity (line item)': 'Quantity',
          'Quantity (Total)':     'Total Quantity',
        },
        values: {
          'Contract No.':        'PFI-2025-003',
          'Invoice No.':         'CI-2025-003',
          "Buyer's order No.":   'BO-77003',
          'Port of Loading':     'Port Klang, Malaysia',
          'Port of Discharge':   'Belawan, Indonesia', // ← wrong port (mismatch)
          'Description of Goods':'RBD Palm Olein',
          'Quantity':            '500 MT',
          'Total Quantity':      '500 MT',
        },
      },
      {
        id: 'doc-T003-ins1',
        type: 'Draft Insurance',
        fieldMapping: {
          'Insured':           'insured_name',
          'Sum Insured':       'sum_insured',
          'Commodity':         'commodity',
          'Port of Loading':   'pol',
          'Port of Discharge': 'pod',
        },
        values: {
          insured_name: 'Genting Plantations Berhad',
          sum_insured:  'USD 280,000.00',
          commodity:    'RBD Palm Olein',
          pol:          'Port Klang, Malaysia',
          pod:          'Tanjung Priok, Indonesia',
        },
      },
      {
        id: 'doc-T003-ins2',
        type: 'Detail for Insurance Purpose',
        fieldMapping: {
          'Insured':           'insured',
          'Sum Insured':       'declared_value',
          'Commodity':         'goods_description',
          'Port of Loading':   'loading_port',
          'Port of Discharge': 'discharge_port',
        },
        values: {
          insured:           'Genting Plantations Berhad',
          declared_value:    'USD 280,000.00',
          goods_description: 'RBD Palm Olein',
          loading_port:      'Port Klang, Malaysia',
          discharge_port:    'Tanjung Priok, Indonesia',
        },
      },
      {
        id: 'doc-T003-bl1',
        type: 'Draft B/L',
        fieldMapping: {
          'Shipper':     'shipper',
          'Consignee':   'consignee',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_weight',
        },
        values: {
          shipper:      'Genting Plantations Berhad',
          consignee:    'Wilmar International Ltd',
          vessel_name:  'MV Pacific Star',
          gross_weight: '500,000 KG',
        },
      },
      {
        id: 'doc-T003-bl2',
        type: 'Shipping Particular',
        fieldMapping: {
          'Shipper':     'exporter',
          'Consignee':   'importer',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_wt',
        },
        values: {
          exporter:    'Genting Plantations Berhad',
          importer:    'Wilmar International Ltd',
          vessel_name: 'MV Pacific Star',
          gross_wt:    '500,000 KG',
        },
      },
      {
        id: 'doc-T003-obl',
        type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '' },
      },
    ],
  },

  // T004 — 1015030624 — CF: Approved (all match)
  {
    id: '1015030624',
    shipmentRef: 'SHP-2025-004',
    shipper: 'IOI Corporation Berhad',
    consignee: 'Olam International Ltd',
    submittedDate: '2025-10-28',
    assignedTo: 'James Tan',
    status: 'Approved',
    verifications: { customFormality: 'Approved', insurance: 'Approved', draftBL: 'Approved', blDate: 'Approved' },
    canonicalFields: [
      // CF fields
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      // Insurance fields
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      // DraftBL fields
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      // BL Date fields
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      // CF fields
      'PROFORMA INVOICE NO.':  'PFI-2025-004',
      'Invoice no.':           'CI-2025-004',
      "Buyer's order No.":     'BO-88004',
      'etd <port>':            'Pasir Gudang, Malaysia',
      'eta <port>':            'Mumbai, India',
      'product (line item)':   'RBD Palm Olein',
      'quantity (line item)':  '480 MT',
      'Quantity (Total)':      '480 MT',
      // Insurance fields
      'Insured':               'IOI Corporation Berhad',
      'Sum Insured':           'USD 350,000.00',
      'Commodity':             'RBD Palm Olein',
      'Port of Loading':       'Pasir Gudang, Malaysia',
      'Port of Discharge':     'Mumbai, India',
      // DraftBL fields
      'Shipper':               'IOI Corporation Berhad',
      'Consignee':             'Olam International Ltd',
      'Vessel Name':           'MV Indian Star',
      'Gross Weight':          '480,000 KG',
      // BL Date fields
      'GI Date':               '28 Oct 2025',
      'ETD Date':              '28 Oct 2025',
      'Manual Billing Date':   '28 Oct 2025',
    },
    documents: [
      {
        id: 'doc-T004-0',
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
          'PROFORMA INVOICE NO.': 'PFI-2025-004',
          'Invoice no.':          'CI-2025-004',
          "Buyer's order No.":    'BO-88004',
          'etd <port>':           'Pasir Gudang, Malaysia',
          'eta <port>':           'Mumbai, India',
          'product (line item)':  'RBD Palm Olein',
          'quantity (line item)': '480 MT',
          'Quantity (Total)':     '480 MT',
        },
      },
      {
        id: 'doc-T004-1',
        type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-004',
          'No.':                  'CI-2025-004',
          "Buyer's order No.":    'BO-88004',
          'from':                 'Pasir Gudang, Malaysia',
          'to':                   'Mumbai, India',
          'description of goods': 'RBD Palm Olein',
          'quantity':             '480 MT',
          'Quantity (Total)':     '480 MT',
        },
      },
      {
        id: 'doc-T004-2',
        type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-004',
          'No.':                  'CI-2025-004',
          "Buyer's order No.":    'BO-88004',
          'from':                 'Pasir Gudang, Malaysia',
          'to':                   'Mumbai, India',
          'description of goods': 'RBD Palm Olein',
          'quantity':             '480 MT',
          'Quantity (Total)':     '480 MT',
        },
      },
      {
        id: 'doc-T004-3',
        type: 'Letter of Credit',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.',
          'Invoice no.':          'Invoice No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'Port of Loading',
          'eta <port>':           'Port of Discharge',
          'product (line item)':  'Description of Goods',
          'quantity (line item)': 'Quantity',
          'Quantity (Total)':     'Total Quantity',
        },
        values: {
          'Contract No.':        'PFI-2025-004',
          'Invoice No.':         'CI-2025-004',
          "Buyer's order No.":   'BO-88004',
          'Port of Loading':     'Pasir Gudang, Malaysia',
          'Port of Discharge':   'Mumbai, India',
          'Description of Goods':'RBD Palm Olein',
          'Quantity':            '480 MT',
          'Total Quantity':      '480 MT',
        },
      },
      {
        id: 'doc-T004-ins1',
        type: 'Draft Insurance',
        fieldMapping: {
          'Insured':           'insured_name',
          'Sum Insured':       'sum_insured',
          'Commodity':         'commodity',
          'Port of Loading':   'pol',
          'Port of Discharge': 'pod',
        },
        values: {
          insured_name: 'IOI Corporation Berhad',
          sum_insured:  'USD 350,000.00',
          commodity:    'RBD Palm Olein',
          pol:          'Pasir Gudang, Malaysia',
          pod:          'Mumbai, India',
        },
      },
      {
        id: 'doc-T004-ins2',
        type: 'Detail for Insurance Purpose',
        fieldMapping: {
          'Insured':           'insured',
          'Sum Insured':       'declared_value',
          'Commodity':         'goods_desc',
          'Port of Loading':   'loading_port',
          'Port of Discharge': 'discharge_port',
        },
        values: {
          insured:        'IOI Corporation Berhad',
          declared_value: 'USD 350,000.00',
          goods_desc:     'RBD Palm Olein',
          loading_port:   'Pasir Gudang, Malaysia',
          discharge_port: 'Mumbai, India',
        },
      },
      {
        id: 'doc-T004-bl1',
        type: 'Draft B/L',
        fieldMapping: {
          'Shipper':     'shipper',
          'Consignee':   'consignee',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_weight',
        },
        values: {
          shipper:      'IOI Corporation Berhad',
          consignee:    'Olam International Ltd',
          vessel_name:  'MV Indian Star',
          gross_weight: '480,000 KG',
        },
      },
      {
        id: 'doc-T004-bl2',
        type: 'Shipping Particular',
        fieldMapping: {
          'Shipper':     'exporter',
          'Consignee':   'importer',
          'Vessel Name': 'vessel',
          'Gross Weight':'gross_wt',
        },
        values: {
          exporter: 'IOI Corporation Berhad',
          importer: 'Olam International Ltd',
          vessel:   'MV Indian Star',
          gross_wt: '480,000 KG',
        },
      },
      {
        id: 'doc-T004-obl',
        type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '28 Oct 2025' },
      },
    ],
  },

  // T005 — 1015030625 — CF: All Matches
  {
    id: '1015030625',
    shipmentRef: 'SHP-2025-005',
    shipper: 'KL-Kepong Bhd',
    consignee: 'Louis Dreyfus Company Asia Pte Ltd',
    submittedDate: '2025-11-10',
    assignedTo: 'Sarah Lim',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'Needs Attention', draftBL: 'All Matches', blDate: 'Pending Verification' },
    canonicalFields: [
      // CF fields
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      // Insurance fields
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      // DraftBL fields
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      // BL Date fields
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      // CF fields
      'PROFORMA INVOICE NO.':  'PFI-2025-005',
      'Invoice no.':           'CI-2025-005',
      "Buyer's order No.":     'BO-99005',
      'etd <port>':            'Pasir Gudang, Malaysia',
      'eta <port>':            'Rotterdam, Netherlands',
      'product (line item)':   'Palm Kernel Oil',
      'quantity (line item)':  '300 MT',
      'Quantity (Total)':      '300 MT',
      // Insurance fields
      'Insured':               'KL-Kepong Bhd',
      'Sum Insured':           'USD 195,000.00',
      'Commodity':             'Palm Kernel Oil',
      'Port of Loading':       'Pasir Gudang, Malaysia',
      'Port of Discharge':     'Rotterdam, Netherlands',
      // DraftBL fields
      'Shipper':               'KL-Kepong Bhd',
      'Consignee':             'Louis Dreyfus Company Asia Pte Ltd',
      'Vessel Name':           'MV Maersk Rotterdam',
      'Gross Weight':          '300,000 KG',
      // BL Date fields
      'GI Date':               '10 Nov 2025',
      'ETD Date':              '10 Nov 2025',
      'Manual Billing Date':   '10 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T005-1',
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
          'PROFORMA INVOICE NO.': 'PFI-2025-005',
          'Invoice no.':          'CI-2025-005',
          "Buyer's order No.":    'BO-99005',
          'etd <port>':           'Pasir Gudang, Malaysia',
          'eta <port>':           'Rotterdam, Netherlands',
          'product (line item)':  'Palm Kernel Oil',
          'quantity (line item)': '300 MT',
          'Quantity (Total)':     '300 MT',
        },
      },
      {
        id: 'doc-T005-2',
        type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-005',
          'No.':                  'CI-2025-005',
          "Buyer's order No.":    'BO-99005',
          'from':                 'Pasir Gudang, Malaysia',
          'to':                   'Rotterdam, Netherlands',
          'description of goods': 'Palm Kernel Oil',
          'quantity':             '300 MT',
          'Quantity (Total)':     '300 MT',
        },
      },
      {
        id: 'doc-T005-3',
        type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-005',
          'No.':                  'CI-2025-005',
          "Buyer's order No.":    'BO-99005',
          'from':                 'Pasir Gudang, Malaysia',
          'to':                   'Rotterdam, Netherlands',
          'description of goods': 'Palm Kernel Oil',
          'quantity':             '300 MT',
          'Quantity (Total)':     '300 MT',
        },
      },
      {
        id: 'doc-T005-4',
        type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.',
          'Invoice no.':          'Invoice No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'Port of Loading',
          'eta <port>':           'Port of Discharge',
          'product (line item)':  'Description of Goods',
          'quantity (line item)': 'Quantity',
          'Quantity (Total)':     'Total Quantity',
        },
        values: {
          'Contract No.':        'PFI-2025-005',
          'Invoice No.':         'CI-2025-005',
          "Buyer's order No.":   'BO-99005',
          'Port of Loading':     'Pasir Gudang, Malaysia',
          'Port of Discharge':   'Rotterdam, Netherlands',
          'Description of Goods':'Palm Kernel Oil',
          'Quantity':            '300 MT',
          'Total Quantity':      '300 MT',
        },
      },
      {
        id: 'doc-T005-ins1',
        type: 'Draft Insurance',
        fieldMapping: {
          'Insured':           'insured_name',
          'Sum Insured':       'sum_insured',
          'Commodity':         'commodity',
          'Port of Loading':   'pol',
          'Port of Discharge': 'pod',
        },
        values: {
          insured_name: 'KL-Kepong Bhd',
          sum_insured:  'USD 195,000.00',
          commodity:    'Palm Kernel Oil',
          pol:          'Pasir Gudang, Malaysia',
          pod:          'Rotterdam, Netherlands',
        },
      },
      {
        id: 'doc-T005-ins2',
        type: 'Detail for Insurance Purpose',
        fieldMapping: {
          'Insured':           'insured',
          'Sum Insured':       'declared_value',
          'Commodity':         'cargo',
          'Port of Loading':   'loading_port',
          'Port of Discharge': 'discharge_port',
        },
        values: {
          insured:        'KL-Kepong Bhd',
          declared_value: 'USD 200,000.00', // ← mismatch: slightly higher
          cargo:          'Palm Kernel Oil',
          loading_port:   'Pasir Gudang, Malaysia',
          discharge_port: 'Rotterdam, Netherlands',
        },
      },
      {
        id: 'doc-T005-bl1',
        type: 'Draft B/L',
        fieldMapping: {
          'Shipper':     'shipper',
          'Consignee':   'consignee',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_weight',
        },
        values: {
          shipper:      'KL-Kepong Bhd',
          consignee:    'Louis Dreyfus Company Asia Pte Ltd',
          vessel_name:  'MV Maersk Rotterdam',
          gross_weight: '300,000 KG',
        },
      },
      {
        id: 'doc-T005-bl2',
        type: 'Shipping Particular',
        fieldMapping: {
          'Shipper':     'exporter',
          'Consignee':   'importer',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_wt',
        },
        values: {
          exporter:    'KL-Kepong Bhd',
          importer:    'Louis Dreyfus Company Asia Pte Ltd',
          vessel_name: 'MV Maersk Rotterdam',
          gross_wt:    '300,000 KG',
        },
      },
      {
        id: 'doc-T005-obl',
        type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '' },
      },
    ],
  },

  // T006 — 1015030630 — CF: Needs Attention
  {
    id: '1015030630',
    shipmentRef: 'SHP-2025-006',
    shipper: 'Sime Darby Plantation Sdn Bhd',
    consignee: 'Cargill Asia Pacific Ltd',
    submittedDate: '2025-10-30',
    assignedTo: 'Aisha Patel',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'Rejected', draftBL: 'Rejected', blDate: 'Needs Attention' },
    canonicalFields: [
      // CF fields
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      // Insurance fields
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      // DraftBL fields
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      // BL Date fields
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      // CF fields
      'PROFORMA INVOICE NO.':  'PFI-2025-006',
      'Invoice no.':           'CI-2025-006',
      "Buyer's order No.":     'BO-11006',
      'etd <port>':            'Lumut Port, Malaysia',
      'eta <port>':            'Karachi, Pakistan',
      'product (line item)':   'Palm Fatty Acid Distillate (PFAD)',
      'quantity (line item)':  '320 MT',
      'Quantity (Total)':      '320 MT',
      // Insurance fields
      'Insured':               'Sime Darby Plantation Sdn Bhd',
      'Sum Insured':           'USD 144,000.00',
      'Commodity':             'Palm Fatty Acid Distillate (PFAD)',
      'Port of Loading':       'Lumut Port, Malaysia',
      'Port of Discharge':     'Karachi, Pakistan',
      // DraftBL fields
      'Shipper':               'Sime Darby Plantation Sdn Bhd',
      'Consignee':             'Cargill Asia Pacific Ltd',
      'Vessel Name':           'MV Arabian Star',
      'Gross Weight':          '320,000 KG',
      // BL Date fields
      'GI Date':               '30 Oct 2025',
      'ETD Date':              '30 Oct 2025',
      'Manual Billing Date':   '30 Oct 2025',
    },
    documents: [
      {
        id: 'doc-T006-0',
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
          'PROFORMA INVOICE NO.': 'PFI-2025-006',
          'Invoice no.':          'CI-2025-006',
          "Buyer's order No.":    'BO-11006',
          'etd <port>':           'Lumut Port, Malaysia',
          'eta <port>':           'Karachi, Pakistan',
          'product (line item)':  'Palm Fatty Acid Distillate (PFAD)',
          'quantity (line item)': '320 MT',
          'Quantity (Total)':     '320 MT',
        },
      },
      {
        id: 'doc-T006-ci',
        type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-006',
          'No.':                  'CI-2025-006',
          "Buyer's order No.":    'BO-11006',
          'from':                 'Lumut Port, Malaysia',
          'to':                   'Karachi, Pakistan',
          'description of goods': 'Palm Fatty Acid Distillate (PFAD)',
          'quantity':             '320 MT',
          'Quantity (Total)':     '320 MT',
        },
      },
      {
        id: 'doc-T006-1',
        type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-006',
          'No.':                  'CI-2025-006',
          "Buyer's order No.":    'BO-11006',
          'from':                 'Lumut Port, Malaysia',
          'to':                   'Karachi, Pakistan',
          'description of goods': 'Palm Fatty Acid Distillate (PFAD)',
          'quantity':             '320 MT',
          'Quantity (Total)':     '320 MT',
        },
      },
      {
        id: 'doc-T006-2',
        type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.',
          'Invoice no.':          'Invoice No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'Port of Loading',
          'eta <port>':           'Port of Discharge',
          'product (line item)':  'Description of Goods',
          'quantity (line item)': 'Quantity',
          'Quantity (Total)':     'Total Quantity',
        },
        values: {
          'Contract No.':        'PFI-2025-006',
          'Invoice No.':         'CI-2025-006',
          "Buyer's order No.":   'BO-11006',
          'Port of Loading':     'Lumut Port, Malaysia',
          'Port of Discharge':   'Karachi, Pakistan',
          'Description of Goods':'PFAD (Palm Fatty Acid Distillate)', // ← description differs (mismatch)
          'Quantity':            '315 MT',    // ← quantity short (mismatch)
          'Total Quantity':      '315 MT',    // ← quantity short (mismatch)
        },
      },
      {
        id: 'doc-T006-ins1',
        type: 'Draft Insurance',
        fieldMapping: {
          'Insured':           'insured_name',
          'Sum Insured':       'sum_insured',
          'Commodity':         'commodity',
          'Port of Loading':   'pol',
          'Port of Discharge': 'pod',
        },
        values: {
          insured_name: 'Sime Darby Plantation Sdn Bhd',
          sum_insured:  'USD 144,000.00',
          commodity:    'Palm Fatty Acid Distillate (PFAD)',
          pol:          'Lumut Port, Malaysia',
          pod:          'Karachi, Pakistan',
        },
      },
      {
        id: 'doc-T006-ins2',
        type: 'Detail for Insurance Purpose',
        fieldMapping: {
          'Insured':           'insured',
          'Sum Insured':       'declared_value',
          'Commodity':         'goods_desc',
          'Port of Loading':   'loading_port',
          'Port of Discharge': 'discharge_port',
        },
        values: {
          insured:        'Sime Darby Plantations',       // ← name differs (mismatch)
          declared_value: 'USD 135,000.00',               // ← value differs (mismatch)
          goods_desc:     'PFAD (Palm Fatty Acid Distillate)', // ← description differs
          loading_port:   'Lumut Port, Malaysia',
          discharge_port: 'Karachi, Pakistan',
        },
      },
      {
        id: 'doc-T006-bl1',
        type: 'Draft B/L',
        fieldMapping: {
          'Shipper':     'shipper',
          'Consignee':   'consignee',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_weight',
        },
        values: {
          shipper:      'Sime Darby Plantation Sdn Bhd',
          consignee:    'Cargill Asia Pacific Ltd',
          vessel_name:  'MV Arabian Star',
          gross_weight: '320,000 KG',
        },
      },
      {
        id: 'doc-T006-bl2',
        type: 'Shipping Particular',
        fieldMapping: {
          'Shipper':     'exporter',
          'Consignee':   'importer',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_wt',
        },
        values: {
          exporter:    'Sime Darby Plantations Bhd',  // ← name differs (mismatch)
          importer:    'Cargill Asia Pacific Ltd',
          vessel_name: 'MV Arabian Star',
          gross_wt:    '315,000 KG',                  // ← weight wrong (mismatch)
        },
      },
      {
        id: 'doc-T006-obl',
        type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '01 Nov 2025' }, // ← B/L Date doesn't match any DocXPort date
      },
    ],
  },

  // T007 — 1015030631 — CF: All Matches
  {
    id: '1015030631',
    shipmentRef: 'SHP-2025-007',
    shipper: 'Felda Global Ventures Sdn Bhd',
    consignee: 'Bunge Asia Pte Ltd',
    submittedDate: '2025-11-12',
    assignedTo: 'John Smith',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: [
      // CF fields
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      // Insurance fields
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      // DraftBL fields
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      // BL Date fields
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      // CF fields
      'PROFORMA INVOICE NO.':  'PFI-2025-007',
      'Invoice no.':           'CI-2025-007',
      "Buyer's order No.":     'BO-22007',
      'etd <port>':            'Kemaman Supply Base, Malaysia',
      'eta <port>':            'Hamburg, Germany',
      'product (line item)':   'Crude Coconut Oil',
      'quantity (line item)':  '200 MT',
      'Quantity (Total)':      '200 MT',
      // Insurance fields
      'Insured':               'Felda Global Ventures Sdn Bhd',
      'Sum Insured':           'USD 85,500.00',
      'Commodity':             'Crude Coconut Oil',
      'Port of Loading':       'Kemaman Supply Base, Malaysia',
      'Port of Discharge':     'Hamburg, Germany',
      // DraftBL fields
      'Shipper':               'Felda Global Ventures Sdn Bhd',
      'Consignee':             'Bunge Asia Pte Ltd',
      'Vessel Name':           'MV Euro Bridge',
      'Gross Weight':          '200,000 KG',
      // BL Date fields
      'GI Date':               '12 Nov 2025',
      'ETD Date':              '12 Nov 2025',
      'Manual Billing Date':   '12 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T007-0',
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
          'PROFORMA INVOICE NO.': 'PFI-2025-007',
          'Invoice no.':          'CI-2025-007',
          "Buyer's order No.":    'BO-22007',
          'etd <port>':           'Kemaman Supply Base, Malaysia',
          'eta <port>':           'Hamburg, Germany',
          'product (line item)':  'Crude Coconut Oil',
          'quantity (line item)': '200 MT',
          'Quantity (Total)':     '200 MT',
        },
      },
      {
        id: 'doc-T007-1',
        type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-007',
          'No.':                  'CI-2025-007',
          "Buyer's order No.":    'BO-22007',
          'from':                 'Kemaman Supply Base, Malaysia',
          'to':                   'Hamburg, Germany',
          'description of goods': 'Crude Coconut Oil',
          'quantity':             '200 MT',
          'Quantity (Total)':     '200 MT',
        },
      },
      {
        id: 'doc-T007-2',
        type: 'Letter of Credit',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.',
          'Invoice no.':          'Invoice No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'Port of Loading',
          'eta <port>':           'Port of Discharge',
          'product (line item)':  'Description of Goods',
          'quantity (line item)': 'Quantity',
          'Quantity (Total)':     'Total Quantity',
        },
        values: {
          'Contract No.':        'PFI-2025-007',
          'Invoice No.':         'CI-2025-007',
          "Buyer's order No.":   'BO-22007',
          'Port of Loading':     'Kemaman Supply Base, Malaysia',
          'Port of Discharge':   'Hamburg, Germany',
          'Description of Goods':'Crude Coconut Oil',
          'Quantity':            '200 MT',
          'Total Quantity':      '200 MT',
        },
      },
      {
        id: 'doc-T007-3',
        type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-007',
          'No.':                  'CI-2025-007',
          "Buyer's order No.":    'BO-22007',
          'from':                 'Kemaman Supply Base, Malaysia',
          'to':                   'Hamburg, Germany',
          'description of goods': 'Crude Coconut Oil',
          'quantity':             '200 MT',
          'Quantity (Total)':     '200 MT',
        },
      },
      {
        id: 'doc-T007-ins1',
        type: 'Draft Insurance',
        fieldMapping: {
          'Insured':           'insured_name',
          'Sum Insured':       'sum_insured',
          'Commodity':         'commodity',
          'Port of Loading':   'pol',
          'Port of Discharge': 'pod',
        },
        values: {
          insured_name: 'Felda Global Ventures Sdn Bhd',
          sum_insured:  'USD 85,500.00',
          commodity:    'Crude Coconut Oil',
          pol:          'Kemaman Supply Base, Malaysia',
          pod:          'Hamburg, Germany',
        },
      },
      {
        id: 'doc-T007-ins2',
        type: 'Detail for Insurance Purpose',
        fieldMapping: {
          'Insured':           'insured',
          'Sum Insured':       'declared_value',
          'Commodity':         'goods_description',
          'Port of Loading':   'loading_port',
          'Port of Discharge': 'discharge_port',
        },
        values: {
          insured:           'Felda Global Ventures Sdn Bhd',
          declared_value:    'USD 85,500.00',
          goods_description: 'Crude Coconut Oil',
          loading_port:      'Kemaman Supply Base, Malaysia',
          discharge_port:    'Hamburg, Germany',
        },
      },
      {
        id: 'doc-T007-bl1',
        type: 'Draft B/L',
        fieldMapping: {
          'Shipper':     'shipper',
          'Consignee':   'consignee',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_weight',
        },
        values: {
          shipper:      'Felda Global Ventures Sdn Bhd',
          consignee:    'Bunge Asia Pte Ltd',
          vessel_name:  'MV Euro Bridge',
          gross_weight: '200,000 KG',
        },
      },
      {
        id: 'doc-T007-bl2',
        type: 'Shipping Particular',
        fieldMapping: {
          'Shipper':     'exporter',
          'Consignee':   'importer',
          'Vessel Name': 'vessel',
          'Gross Weight':'gross_wt',
        },
        values: {
          exporter: 'Felda Global Ventures Sdn Bhd',
          importer: 'Bunge Asia Pte Ltd',
          vessel:   'MV Euro Bridge',
          gross_wt: '200,000 KG',
        },
      },
      {
        id: 'doc-T007-obl',
        type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '12 Nov 2025' },
      },
    ],
  },

  // T008 — 1015045137 — CF: All Matches
  {
    id: '1015045137',
    shipmentRef: 'SHP-2025-008',
    shipper: 'TH Plantations Berhad',
    consignee: 'Musim Mas Holdings Pte Ltd',
    submittedDate: '2025-11-14',
    assignedTo: 'James Tan',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'Needs Attention', draftBL: 'All Matches', blDate: 'Needs Attention' },
    canonicalFields: [
      // CF fields
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      // Insurance fields
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      // DraftBL fields
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      // BL Date fields
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      // CF fields
      'PROFORMA INVOICE NO.':  'PFI-2025-008',
      'Invoice no.':           'CI-2025-008',
      "Buyer's order No.":     'BO-33008',
      'etd <port>':            'Kuantan Port, Malaysia',
      'eta <port>':            'Kandla Port, India',
      'product (line item)':   'RBD Palm Stearin',
      'quantity (line item)':  '420 MT',
      'Quantity (Total)':      '420 MT',
      // Insurance fields
      'Insured':               'TH Plantations Berhad',
      'Sum Insured':           'USD 210,000.00',
      'Commodity':             'RBD Palm Stearin',
      'Port of Loading':       'Kuantan Port, Malaysia',
      'Port of Discharge':     'Kandla Port, India',
      // DraftBL fields
      'Shipper':               'TH Plantations Berhad',
      'Consignee':             'Musim Mas Holdings Pte Ltd',
      'Vessel Name':           'MV Asian Emerald',
      'Gross Weight':          '420,000 KG',
      // BL Date fields
      'GI Date':               '14 Nov 2025',
      'ETD Date':              '14 Nov 2025',
      'Manual Billing Date':   '12 Nov 2025', // ← manual billing date differs
    },
    documents: [
      {
        id: 'doc-T008-1',
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
          'PROFORMA INVOICE NO.': 'PFI-2025-008',
          'Invoice no.':          'CI-2025-008',
          "Buyer's order No.":    'BO-33008',
          'etd <port>':           'Kuantan Port, Malaysia',
          'eta <port>':           'Kandla Port, India',
          'product (line item)':  'RBD Palm Stearin',
          'quantity (line item)': '420 MT',
          'Quantity (Total)':     '420 MT',
        },
      },
      {
        id: 'doc-T008-2',
        type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-008',
          'No.':                  'CI-2025-008',
          "Buyer's order No.":    'BO-33008',
          'from':                 'Kuantan Port, Malaysia',
          'to':                   'Kandla Port, India',
          'description of goods': 'RBD Palm Stearin',
          'quantity':             '420 MT',
          'Quantity (Total)':     '420 MT',
        },
      },
      {
        id: 'doc-T008-3',
        type: 'Letter of Credit',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.',
          'Invoice no.':          'Invoice No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'Port of Loading',
          'eta <port>':           'Port of Discharge',
          'product (line item)':  'Description of Goods',
          'quantity (line item)': 'Quantity',
          'Quantity (Total)':     'Total Quantity',
        },
        values: {
          'Contract No.':        'PFI-2025-008',
          'Invoice No.':         'CI-2025-008',
          "Buyer's order No.":   'BO-33008',
          'Port of Loading':     'Kuantan Port, Malaysia',
          'Port of Discharge':   'Kandla Port, India',
          'Description of Goods':'RBD Palm Stearin',
          'Quantity':            '420 MT',
          'Total Quantity':      '420 MT',
        },
      },
      {
        id: 'doc-T008-4',
        type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.',
          'Invoice no.':          'No.',
          "Buyer's order No.":    "Buyer's order No.",
          'etd <port>':           'from',
          'eta <port>':           'to',
          'product (line item)':  'description of goods',
          'quantity (line item)': 'quantity',
          'Quantity (Total)':     'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.':        'PFI-2025-008',
          'No.':                  'CI-2025-008',
          "Buyer's order No.":    'BO-33008',
          'from':                 'Kuantan Port, Malaysia',
          'to':                   'Kandla Port, India',
          'description of goods': 'RBD Palm Stearin',
          'quantity':             '420 MT',
          'Quantity (Total)':     '420 MT',
        },
      },
      {
        id: 'doc-T008-ins1',
        type: 'Draft Insurance',
        fieldMapping: {
          'Insured':           'insured_name',
          'Sum Insured':       'sum_insured',
          'Commodity':         'commodity',
          'Port of Loading':   'pol',
          'Port of Discharge': 'pod',
        },
        values: {
          insured_name: 'TH Plantations Berhad',
          sum_insured:  'USD 210,000.00',
          commodity:    'RBD Palm Stearin',
          pol:          'Kuantan Port, Malaysia',
          pod:          'Kandla Port, India',
        },
      },
      {
        id: 'doc-T008-ins2',
        type: 'Detail for Insurance Purpose',
        fieldMapping: {
          'Insured':           'insured',
          'Sum Insured':       'declared_value',
          'Commodity':         'goods_desc',
          'Port of Loading':   'loading_port',
          'Port of Discharge': 'discharge_port',
        },
        values: {
          insured:        'TH Plantations Berhad',
          declared_value: 'USD 210,000.00',
          goods_desc:     'RBD Palm Stearin',
          loading_port:   'Port Klang, Malaysia', // ← wrong port (mismatch)
          discharge_port: 'Kandla Port, India',
        },
      },
      {
        id: 'doc-T008-bl1',
        type: 'Draft B/L',
        fieldMapping: {
          'Shipper':     'shipper',
          'Consignee':   'consignee',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_weight',
        },
        values: {
          shipper:      'TH Plantations Berhad',
          consignee:    'Musim Mas Holdings Pte Ltd',
          vessel_name:  'MV Asian Emerald',
          gross_weight: '420,000 KG',
        },
      },
      {
        id: 'doc-T008-bl2',
        type: 'Shipping Particular',
        fieldMapping: {
          'Shipper':     'exporter',
          'Consignee':   'importer',
          'Vessel Name': 'vessel_name',
          'Gross Weight':'gross_wt',
        },
        values: {
          exporter:    'TH Plantations Berhad',
          importer:    'Musim Mas Holdings Pte Ltd',
          vessel_name: 'MV Asian Emerald',
          gross_wt:    '420,000 KG',
        },
      },
      {
        id: 'doc-T008-obl',
        type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '14 Nov 2025' },
      },
    ],
  },

  // T009 — Needs Attention (quantity mismatch in CF)
  {
    id: '1015030640',
    shipmentRef: 'SHP-2025-009',
    shipper: 'IOI Loders Croklaan BV',
    consignee: 'Unilever Supply Chain Company AG',
    submittedDate: '2025-11-10',
    assignedTo: 'Jane Doe',
    status: 'Needs Attention',
    verifications: { customFormality: 'Needs Attention', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: [
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2025-009', 'Invoice no.': 'CI-2025-009', "Buyer's order No.": 'BO-55009',
      'etd <port>': 'Port Klang, Malaysia', 'eta <port>': 'Rotterdam, Netherlands',
      'product (line item)': 'Refined Palm Oil', 'quantity (line item)': '500 MT', 'Quantity (Total)': '500 MT',
      'Insured': 'IOI Loders Croklaan BV', 'Sum Insured': 'USD 120,000.00', 'Commodity': 'Refined Palm Oil',
      'Port of Loading': 'Port Klang, Malaysia', 'Port of Discharge': 'Rotterdam, Netherlands',
      'Shipper': 'IOI Loders Croklaan BV', 'Consignee': 'Unilever Supply Chain Company AG',
      'Vessel Name': 'MV Ocean Star', 'Gross Weight': '500,000 KG',
      'GI Date': '10 Nov 2025', 'ETD Date': '10 Nov 2025', 'Manual Billing Date': '10 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T009-1', type: 'Shipping Advice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'PROFORMA INVOICE NO.', 'Invoice no.': 'Invoice no.',
          "Buyer's order No.": "Buyer's order No.", 'etd <port>': 'etd <port>', 'eta <port>': 'eta <port>',
          'product (line item)': 'product (line item)', 'quantity (line item)': 'quantity (line item)', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'PROFORMA INVOICE NO.': 'PFI-2025-009', 'Invoice no.': 'CI-2025-009', "Buyer's order No.": 'BO-55009',
          'etd <port>': 'Port Klang, Malaysia', 'eta <port>': 'Rotterdam, Netherlands',
          'product (line item)': 'Refined Palm Oil', 'quantity (line item)': '450 MT', 'Quantity (Total)': '450 MT',
        },
      },
      {
        id: 'doc-T009-2', type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-009', 'No.': 'CI-2025-009', "Buyer's order No.": 'BO-55009',
          'from': 'Port Klang, Malaysia', 'to': 'Rotterdam, Netherlands',
          'description of goods': 'Refined Palm Oil', 'quantity': '500 MT', 'Quantity (Total)': '500 MT',
        },
      },
      {
        id: 'doc-T009-3', type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-009', 'No.': 'CI-2025-009', "Buyer's order No.": 'BO-55009',
          'from': 'Port Klang, Malaysia', 'to': 'Rotterdam, Netherlands',
          'description of goods': 'Refined Palm Oil', 'quantity': '500 MT', 'Quantity (Total)': '500 MT',
        },
      },
      {
        id: 'doc-T009-4', type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.', 'Invoice no.': 'Invoice No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'Port of Loading', 'eta <port>': 'Port of Discharge',
          'product (line item)': 'Description of Goods', 'quantity (line item)': 'Quantity', 'Quantity (Total)': 'Total Quantity',
        },
        values: {
          'Contract No.': 'PFI-2025-009', 'Invoice No.': 'CI-2025-009', "Buyer's order No.": 'BO-55009',
          'Port of Loading': 'Port Klang, Malaysia', 'Port of Discharge': 'Rotterdam, Netherlands',
          'Description of Goods': 'Refined Palm Oil', 'Quantity': '500 MT', 'Total Quantity': '500 MT',
        },
      },
      {
        id: 'doc-T009-ins1', type: 'Draft Insurance',
        fieldMapping: { 'Insured': 'insured_name', 'Sum Insured': 'sum_insured', 'Commodity': 'commodity', 'Port of Loading': 'pol', 'Port of Discharge': 'pod' },
        values: { insured_name: 'IOI Loders Croklaan BV', sum_insured: 'USD 120,000.00', commodity: 'Refined Palm Oil', pol: 'Port Klang, Malaysia', pod: 'Rotterdam, Netherlands' },
      },
      {
        id: 'doc-T009-ins2', type: 'Detail for Insurance Purpose',
        fieldMapping: { 'Insured': 'insured', 'Sum Insured': 'declared_value', 'Commodity': 'goods_description', 'Port of Loading': 'loading_port', 'Port of Discharge': 'discharge_port' },
        values: { insured: 'IOI Loders Croklaan BV', declared_value: 'USD 120,000.00', goods_description: 'Refined Palm Oil', loading_port: 'Port Klang, Malaysia', discharge_port: 'Rotterdam, Netherlands' },
      },
      {
        id: 'doc-T009-bl1', type: 'Draft B/L',
        fieldMapping: { 'Shipper': 'shipper', 'Consignee': 'consignee', 'Vessel Name': 'vessel_name', 'Gross Weight': 'gross_weight' },
        values: { shipper: 'IOI Loders Croklaan BV', consignee: 'Unilever Supply Chain Company AG', vessel_name: 'MV Ocean Star', gross_weight: '500,000 KG' },
      },
      {
        id: 'doc-T009-bl2', type: 'Shipping Particular',
        fieldMapping: { 'Shipper': 'exporter', 'Consignee': 'importer', 'Vessel Name': 'vessel', 'Gross Weight': 'gross_wt_kg' },
        values: { exporter: 'IOI Loders Croklaan BV', importer: 'Unilever Supply Chain Company AG', vessel: 'MV Ocean Star', gross_wt_kg: '500,000 KG' },
      },
      {
        id: 'doc-T009-obl', type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '10 Nov 2025' },
      },
    ],
  },

  // T010 — All Match
  {
    id: '1015030641',
    shipmentRef: 'SHP-2025-010',
    shipper: 'Wilmar International Ltd',
    consignee: 'Cargill Deutschland GmbH',
    submittedDate: '2025-11-11',
    assignedTo: 'John Smith',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: [
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2025-010', 'Invoice no.': 'CI-2025-010', "Buyer's order No.": 'BO-55010',
      'etd <port>': 'Pasir Gudang, Malaysia', 'eta <port>': 'Hamburg, Germany',
      'product (line item)': 'Palm Kernel Oil', 'quantity (line item)': '800 MT', 'Quantity (Total)': '800 MT',
      'Insured': 'Wilmar International Ltd', 'Sum Insured': 'USD 200,000.00', 'Commodity': 'Palm Kernel Oil',
      'Port of Loading': 'Pasir Gudang, Malaysia', 'Port of Discharge': 'Hamburg, Germany',
      'Shipper': 'Wilmar International Ltd', 'Consignee': 'Cargill Deutschland GmbH',
      'Vessel Name': 'MV Baltic Breeze', 'Gross Weight': '800,000 KG',
      'GI Date': '11 Nov 2025', 'ETD Date': '11 Nov 2025', 'Manual Billing Date': '11 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T010-1', type: 'Shipping Advice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'PROFORMA INVOICE NO.', 'Invoice no.': 'Invoice no.',
          "Buyer's order No.": "Buyer's order No.", 'etd <port>': 'etd <port>', 'eta <port>': 'eta <port>',
          'product (line item)': 'product (line item)', 'quantity (line item)': 'quantity (line item)', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'PROFORMA INVOICE NO.': 'PFI-2025-010', 'Invoice no.': 'CI-2025-010', "Buyer's order No.": 'BO-55010',
          'etd <port>': 'Pasir Gudang, Malaysia', 'eta <port>': 'Hamburg, Germany',
          'product (line item)': 'Palm Kernel Oil', 'quantity (line item)': '800 MT', 'Quantity (Total)': '800 MT',
        },
      },
      {
        id: 'doc-T010-2', type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-010', 'No.': 'CI-2025-010', "Buyer's order No.": 'BO-55010',
          'from': 'Pasir Gudang, Malaysia', 'to': 'Hamburg, Germany',
          'description of goods': 'Palm Kernel Oil', 'quantity': '800 MT', 'Quantity (Total)': '800 MT',
        },
      },
      {
        id: 'doc-T010-3', type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-010', 'No.': 'CI-2025-010', "Buyer's order No.": 'BO-55010',
          'from': 'Pasir Gudang, Malaysia', 'to': 'Hamburg, Germany',
          'description of goods': 'Palm Kernel Oil', 'quantity': '800 MT', 'Quantity (Total)': '800 MT',
        },
      },
      {
        id: 'doc-T010-4', type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.', 'Invoice no.': 'Invoice No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'Port of Loading', 'eta <port>': 'Port of Discharge',
          'product (line item)': 'Description of Goods', 'quantity (line item)': 'Quantity', 'Quantity (Total)': 'Total Quantity',
        },
        values: {
          'Contract No.': 'PFI-2025-010', 'Invoice No.': 'CI-2025-010', "Buyer's order No.": 'BO-55010',
          'Port of Loading': 'Pasir Gudang, Malaysia', 'Port of Discharge': 'Hamburg, Germany',
          'Description of Goods': 'Palm Kernel Oil', 'Quantity': '800 MT', 'Total Quantity': '800 MT',
        },
      },
      {
        id: 'doc-T010-ins1', type: 'Draft Insurance',
        fieldMapping: { 'Insured': 'insured_name', 'Sum Insured': 'sum_insured', 'Commodity': 'commodity', 'Port of Loading': 'pol', 'Port of Discharge': 'pod' },
        values: { insured_name: 'Wilmar International Ltd', sum_insured: 'USD 200,000.00', commodity: 'Palm Kernel Oil', pol: 'Pasir Gudang, Malaysia', pod: 'Hamburg, Germany' },
      },
      {
        id: 'doc-T010-ins2', type: 'Detail for Insurance Purpose',
        fieldMapping: { 'Insured': 'insured', 'Sum Insured': 'declared_value', 'Commodity': 'goods_description', 'Port of Loading': 'loading_port', 'Port of Discharge': 'discharge_port' },
        values: { insured: 'Wilmar International Ltd', declared_value: 'USD 200,000.00', goods_description: 'Palm Kernel Oil', loading_port: 'Pasir Gudang, Malaysia', discharge_port: 'Hamburg, Germany' },
      },
      {
        id: 'doc-T010-bl1', type: 'Draft B/L',
        fieldMapping: { 'Shipper': 'shipper', 'Consignee': 'consignee', 'Vessel Name': 'vessel_name', 'Gross Weight': 'gross_weight' },
        values: { shipper: 'Wilmar International Ltd', consignee: 'Cargill Deutschland GmbH', vessel_name: 'MV Baltic Breeze', gross_weight: '800,000 KG' },
      },
      {
        id: 'doc-T010-bl2', type: 'Shipping Particular',
        fieldMapping: { 'Shipper': 'exporter', 'Consignee': 'importer', 'Vessel Name': 'vessel', 'Gross Weight': 'gross_wt_kg' },
        values: { exporter: 'Wilmar International Ltd', importer: 'Cargill Deutschland GmbH', vessel: 'MV Baltic Breeze', gross_wt_kg: '800,000 KG' },
      },
      {
        id: 'doc-T010-obl', type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '11 Nov 2025' },
      },
    ],
  },

  // T011 — Approved
  {
    id: '1015030642',
    shipmentRef: 'SHP-2025-011',
    shipper: 'Felda Global Ventures Holdings',
    consignee: 'Bunge Limited',
    submittedDate: '2025-11-12',
    assignedTo: 'Jane Doe',
    status: 'Approved',
    verifications: { customFormality: 'Approved', insurance: 'Approved', draftBL: 'Approved', blDate: 'Approved' },
    canonicalFields: [
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2025-011', 'Invoice no.': 'CI-2025-011', "Buyer's order No.": 'BO-55011',
      'etd <port>': 'Penang, Malaysia', 'eta <port>': 'Karachi, Pakistan',
      'product (line item)': 'Crude Palm Olein', 'quantity (line item)': '350 MT', 'Quantity (Total)': '350 MT',
      'Insured': 'Felda Global Ventures Holdings', 'Sum Insured': 'USD 75,000.00', 'Commodity': 'Crude Palm Olein',
      'Port of Loading': 'Penang, Malaysia', 'Port of Discharge': 'Karachi, Pakistan',
      'Shipper': 'Felda Global Ventures Holdings', 'Consignee': 'Bunge Limited',
      'Vessel Name': 'MV Malay Pride', 'Gross Weight': '350,000 KG',
      'GI Date': '12 Nov 2025', 'ETD Date': '12 Nov 2025', 'Manual Billing Date': '12 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T011-1', type: 'Shipping Advice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'PROFORMA INVOICE NO.', 'Invoice no.': 'Invoice no.',
          "Buyer's order No.": "Buyer's order No.", 'etd <port>': 'etd <port>', 'eta <port>': 'eta <port>',
          'product (line item)': 'product (line item)', 'quantity (line item)': 'quantity (line item)', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'PROFORMA INVOICE NO.': 'PFI-2025-011', 'Invoice no.': 'CI-2025-011', "Buyer's order No.": 'BO-55011',
          'etd <port>': 'Penang, Malaysia', 'eta <port>': 'Karachi, Pakistan',
          'product (line item)': 'Crude Palm Olein', 'quantity (line item)': '350 MT', 'Quantity (Total)': '350 MT',
        },
      },
      {
        id: 'doc-T011-2', type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-011', 'No.': 'CI-2025-011', "Buyer's order No.": 'BO-55011',
          'from': 'Penang, Malaysia', 'to': 'Karachi, Pakistan',
          'description of goods': 'Crude Palm Olein', 'quantity': '350 MT', 'Quantity (Total)': '350 MT',
        },
      },
      {
        id: 'doc-T011-3', type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-011', 'No.': 'CI-2025-011', "Buyer's order No.": 'BO-55011',
          'from': 'Penang, Malaysia', 'to': 'Karachi, Pakistan',
          'description of goods': 'Crude Palm Olein', 'quantity': '350 MT', 'Quantity (Total)': '350 MT',
        },
      },
      {
        id: 'doc-T011-4', type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.', 'Invoice no.': 'Invoice No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'Port of Loading', 'eta <port>': 'Port of Discharge',
          'product (line item)': 'Description of Goods', 'quantity (line item)': 'Quantity', 'Quantity (Total)': 'Total Quantity',
        },
        values: {
          'Contract No.': 'PFI-2025-011', 'Invoice No.': 'CI-2025-011', "Buyer's order No.": 'BO-55011',
          'Port of Loading': 'Penang, Malaysia', 'Port of Discharge': 'Karachi, Pakistan',
          'Description of Goods': 'Crude Palm Olein', 'Quantity': '350 MT', 'Total Quantity': '350 MT',
        },
      },
      {
        id: 'doc-T011-ins1', type: 'Draft Insurance',
        fieldMapping: { 'Insured': 'insured_name', 'Sum Insured': 'sum_insured', 'Commodity': 'commodity', 'Port of Loading': 'pol', 'Port of Discharge': 'pod' },
        values: { insured_name: 'Felda Global Ventures Holdings', sum_insured: 'USD 75,000.00', commodity: 'Crude Palm Olein', pol: 'Penang, Malaysia', pod: 'Karachi, Pakistan' },
      },
      {
        id: 'doc-T011-ins2', type: 'Detail for Insurance Purpose',
        fieldMapping: { 'Insured': 'insured', 'Sum Insured': 'declared_value', 'Commodity': 'goods_description', 'Port of Loading': 'loading_port', 'Port of Discharge': 'discharge_port' },
        values: { insured: 'Felda Global Ventures Holdings', declared_value: 'USD 75,000.00', goods_description: 'Crude Palm Olein', loading_port: 'Penang, Malaysia', discharge_port: 'Karachi, Pakistan' },
      },
      {
        id: 'doc-T011-bl1', type: 'Draft B/L',
        fieldMapping: { 'Shipper': 'shipper', 'Consignee': 'consignee', 'Vessel Name': 'vessel_name', 'Gross Weight': 'gross_weight' },
        values: { shipper: 'Felda Global Ventures Holdings', consignee: 'Bunge Limited', vessel_name: 'MV Malay Pride', gross_weight: '350,000 KG' },
      },
      {
        id: 'doc-T011-bl2', type: 'Shipping Particular',
        fieldMapping: { 'Shipper': 'exporter', 'Consignee': 'importer', 'Vessel Name': 'vessel', 'Gross Weight': 'gross_wt_kg' },
        values: { exporter: 'Felda Global Ventures Holdings', importer: 'Bunge Limited', vessel: 'MV Malay Pride', gross_wt_kg: '350,000 KG' },
      },
      {
        id: 'doc-T011-obl', type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '12 Nov 2025' },
      },
    ],
  },

  // T012 — Pending (CF docs only, insurance/BL pending upload)
  {
    id: '1015030643',
    shipmentRef: 'SHP-2025-012',
    shipper: 'Sime Darby Plantation Bhd',
    consignee: 'Louis Dreyfus Company',
    submittedDate: '2025-11-13',
    assignedTo: 'John Smith',
    status: 'Pending',
    verifications: { customFormality: 'Pending Verification', insurance: 'Pending Verification', draftBL: 'Pending Verification', blDate: 'Pending Verification' },
    canonicalFields: [
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2025-012', 'Invoice no.': 'CI-2025-012', "Buyer's order No.": 'BO-55012',
      'etd <port>': 'Port Klang, Malaysia', 'eta <port>': 'Mumbai, India',
      'product (line item)': 'RBD Palm Olein', 'quantity (line item)': '600 MT', 'Quantity (Total)': '600 MT',
      'Insured': 'Sime Darby Plantation Bhd', 'Sum Insured': 'USD 150,000.00', 'Commodity': 'RBD Palm Olein',
      'Port of Loading': 'Port Klang, Malaysia', 'Port of Discharge': 'Mumbai, India',
      'Shipper': 'Sime Darby Plantation Bhd', 'Consignee': 'Louis Dreyfus Company',
      'Vessel Name': 'MV Darby Spirit', 'Gross Weight': '600,000 KG',
      'GI Date': '13 Nov 2025', 'ETD Date': '13 Nov 2025', 'Manual Billing Date': '13 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T012-1', type: 'Shipping Advice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'PROFORMA INVOICE NO.', 'Invoice no.': 'Invoice no.',
          "Buyer's order No.": "Buyer's order No.", 'etd <port>': 'etd <port>', 'eta <port>': 'eta <port>',
          'product (line item)': 'product (line item)', 'quantity (line item)': 'quantity (line item)', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'PROFORMA INVOICE NO.': 'PFI-2025-012', 'Invoice no.': 'CI-2025-012', "Buyer's order No.": 'BO-55012',
          'etd <port>': 'Port Klang, Malaysia', 'eta <port>': 'Mumbai, India',
          'product (line item)': 'RBD Palm Olein', 'quantity (line item)': '600 MT', 'Quantity (Total)': '600 MT',
        },
      },
      {
        id: 'doc-T012-2', type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-012', 'No.': 'CI-2025-012', "Buyer's order No.": 'BO-55012',
          'from': 'Port Klang, Malaysia', 'to': 'Mumbai, India',
          'description of goods': 'RBD Palm Olein', 'quantity': '600 MT', 'Quantity (Total)': '600 MT',
        },
      },
      {
        id: 'doc-T012-3', type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-012', 'No.': 'CI-2025-012', "Buyer's order No.": 'BO-55012',
          'from': 'Port Klang, Malaysia', 'to': 'Mumbai, India',
          'description of goods': 'RBD Palm Olein', 'quantity': '600 MT', 'Quantity (Total)': '600 MT',
        },
      },
      {
        id: 'doc-T012-4', type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.', 'Invoice no.': 'Invoice No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'Port of Loading', 'eta <port>': 'Port of Discharge',
          'product (line item)': 'Description of Goods', 'quantity (line item)': 'Quantity', 'Quantity (Total)': 'Total Quantity',
        },
        values: {
          'Contract No.': 'PFI-2025-012', 'Invoice No.': 'CI-2025-012', "Buyer's order No.": 'BO-55012',
          'Port of Loading': 'Port Klang, Malaysia', 'Port of Discharge': 'Mumbai, India',
          'Description of Goods': 'RBD Palm Olein', 'Quantity': '600 MT', 'Total Quantity': '600 MT',
        },
      },
    ],
  },

  // T013 — Needs Attention (vessel name mismatch in Draft B/L)
  {
    id: '1015030644',
    shipmentRef: 'SHP-2025-013',
    shipper: 'Golden Agri-Resources Ltd',
    consignee: 'Musim Mas Holdings Pte Ltd',
    submittedDate: '2025-11-14',
    assignedTo: 'Alice Tan',
    status: 'Needs Attention',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'Needs Attention', blDate: 'All Matches' },
    canonicalFields: [
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2025-013', 'Invoice no.': 'CI-2025-013', "Buyer's order No.": 'BO-55013',
      'etd <port>': 'Belawan, Indonesia', 'eta <port>': 'Shanghai, China',
      'product (line item)': 'Crude Palm Oil', 'quantity (line item)': '700 MT', 'Quantity (Total)': '700 MT',
      'Insured': 'Golden Agri-Resources Ltd', 'Sum Insured': 'USD 175,000.00', 'Commodity': 'Crude Palm Oil',
      'Port of Loading': 'Belawan, Indonesia', 'Port of Discharge': 'Shanghai, China',
      'Shipper': 'Golden Agri-Resources Ltd', 'Consignee': 'Musim Mas Holdings Pte Ltd',
      'Vessel Name': 'MV Golden Harvest', 'Gross Weight': '700,000 KG',
      'GI Date': '14 Nov 2025', 'ETD Date': '14 Nov 2025', 'Manual Billing Date': '14 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T013-1', type: 'Shipping Advice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'PROFORMA INVOICE NO.', 'Invoice no.': 'Invoice no.',
          "Buyer's order No.": "Buyer's order No.", 'etd <port>': 'etd <port>', 'eta <port>': 'eta <port>',
          'product (line item)': 'product (line item)', 'quantity (line item)': 'quantity (line item)', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'PROFORMA INVOICE NO.': 'PFI-2025-013', 'Invoice no.': 'CI-2025-013', "Buyer's order No.": 'BO-55013',
          'etd <port>': 'Belawan, Indonesia', 'eta <port>': 'Shanghai, China',
          'product (line item)': 'Crude Palm Oil', 'quantity (line item)': '700 MT', 'Quantity (Total)': '700 MT',
        },
      },
      {
        id: 'doc-T013-2', type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-013', 'No.': 'CI-2025-013', "Buyer's order No.": 'BO-55013',
          'from': 'Belawan, Indonesia', 'to': 'Shanghai, China',
          'description of goods': 'Crude Palm Oil', 'quantity': '700 MT', 'Quantity (Total)': '700 MT',
        },
      },
      {
        id: 'doc-T013-3', type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-013', 'No.': 'CI-2025-013', "Buyer's order No.": 'BO-55013',
          'from': 'Belawan, Indonesia', 'to': 'Shanghai, China',
          'description of goods': 'Crude Palm Oil', 'quantity': '700 MT', 'Quantity (Total)': '700 MT',
        },
      },
      {
        id: 'doc-T013-4', type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.', 'Invoice no.': 'Invoice No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'Port of Loading', 'eta <port>': 'Port of Discharge',
          'product (line item)': 'Description of Goods', 'quantity (line item)': 'Quantity', 'Quantity (Total)': 'Total Quantity',
        },
        values: {
          'Contract No.': 'PFI-2025-013', 'Invoice No.': 'CI-2025-013', "Buyer's order No.": 'BO-55013',
          'Port of Loading': 'Belawan, Indonesia', 'Port of Discharge': 'Shanghai, China',
          'Description of Goods': 'Crude Palm Oil', 'Quantity': '700 MT', 'Total Quantity': '700 MT',
        },
      },
      {
        id: 'doc-T013-ins1', type: 'Draft Insurance',
        fieldMapping: { 'Insured': 'insured_name', 'Sum Insured': 'sum_insured', 'Commodity': 'commodity', 'Port of Loading': 'pol', 'Port of Discharge': 'pod' },
        values: { insured_name: 'Golden Agri-Resources Ltd', sum_insured: 'USD 175,000.00', commodity: 'Crude Palm Oil', pol: 'Belawan, Indonesia', pod: 'Shanghai, China' },
      },
      {
        id: 'doc-T013-ins2', type: 'Detail for Insurance Purpose',
        fieldMapping: { 'Insured': 'insured', 'Sum Insured': 'declared_value', 'Commodity': 'goods_description', 'Port of Loading': 'loading_port', 'Port of Discharge': 'discharge_port' },
        values: { insured: 'Golden Agri-Resources Ltd', declared_value: 'USD 175,000.00', goods_description: 'Crude Palm Oil', loading_port: 'Belawan, Indonesia', discharge_port: 'Shanghai, China' },
      },
      {
        id: 'doc-T013-bl1', type: 'Draft B/L',
        fieldMapping: { 'Shipper': 'shipper', 'Consignee': 'consignee', 'Vessel Name': 'vessel_name', 'Gross Weight': 'gross_weight' },
        values: { shipper: 'Golden Agri-Resources Ltd', consignee: 'Musim Mas Holdings Pte Ltd', vessel_name: 'MV Golden Eagle', gross_weight: '700,000 KG' },
      },
      {
        id: 'doc-T013-bl2', type: 'Shipping Particular',
        fieldMapping: { 'Shipper': 'exporter', 'Consignee': 'importer', 'Vessel Name': 'vessel', 'Gross Weight': 'gross_wt_kg' },
        values: { exporter: 'Golden Agri-Resources Ltd', importer: 'Musim Mas Holdings Pte Ltd', vessel: 'MV Golden Harvest', gross_wt_kg: '700,000 KG' },
      },
      {
        id: 'doc-T013-obl', type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '14 Nov 2025' },
      },
    ],
  },

  // T014 — Rejected (CF rejected)
  {
    id: '1015030645',
    shipmentRef: 'SHP-2025-014',
    shipper: 'Kuala Lumpur Kepong Bhd',
    consignee: 'ADM Hamburg AG',
    submittedDate: '2025-11-15',
    assignedTo: 'Alice Tan',
    status: 'Rejected',
    verifications: { customFormality: 'Rejected', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: [
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2025-014', 'Invoice no.': 'CI-2025-014', "Buyer's order No.": 'BO-55014',
      'etd <port>': 'Port Klang, Malaysia', 'eta <port>': 'Jeddah, Saudi Arabia',
      'product (line item)': 'Palm Stearin', 'quantity (line item)': '900 MT', 'Quantity (Total)': '900 MT',
      'Insured': 'Kuala Lumpur Kepong Bhd', 'Sum Insured': 'USD 220,000.00', 'Commodity': 'Palm Stearin',
      'Port of Loading': 'Port Klang, Malaysia', 'Port of Discharge': 'Jeddah, Saudi Arabia',
      'Shipper': 'Kuala Lumpur Kepong Bhd', 'Consignee': 'ADM Hamburg AG',
      'Vessel Name': 'MV KL Express', 'Gross Weight': '900,000 KG',
      'GI Date': '15 Nov 2025', 'ETD Date': '15 Nov 2025', 'Manual Billing Date': '15 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T014-1', type: 'Shipping Advice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'PROFORMA INVOICE NO.', 'Invoice no.': 'Invoice no.',
          "Buyer's order No.": "Buyer's order No.", 'etd <port>': 'etd <port>', 'eta <port>': 'eta <port>',
          'product (line item)': 'product (line item)', 'quantity (line item)': 'quantity (line item)', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'PROFORMA INVOICE NO.': 'PFI-2025-014', 'Invoice no.': 'CI-2025-014', "Buyer's order No.": 'BO-55014',
          'etd <port>': 'Port Klang, Malaysia', 'eta <port>': 'Jeddah, Saudi Arabia',
          'product (line item)': 'Palm Stearin', 'quantity (line item)': '900 MT', 'Quantity (Total)': '900 MT',
        },
      },
      {
        id: 'doc-T014-2', type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-014', 'No.': 'CI-2025-014', "Buyer's order No.": 'BO-55014',
          'from': 'Port Klang, Malaysia', 'to': 'Jeddah, Saudi Arabia',
          'description of goods': 'Palm Stearin', 'quantity': '900 MT', 'Quantity (Total)': '900 MT',
        },
      },
      {
        id: 'doc-T014-3', type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-014', 'No.': 'CI-2025-014', "Buyer's order No.": 'BO-55014',
          'from': 'Port Klang, Malaysia', 'to': 'Jeddah, Saudi Arabia',
          'description of goods': 'Palm Stearin', 'quantity': '900 MT', 'Quantity (Total)': '900 MT',
        },
      },
      {
        id: 'doc-T014-4', type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.', 'Invoice no.': 'Invoice No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'Port of Loading', 'eta <port>': 'Port of Discharge',
          'product (line item)': 'Description of Goods', 'quantity (line item)': 'Quantity', 'Quantity (Total)': 'Total Quantity',
        },
        values: {
          'Contract No.': 'PFI-2025-014', 'Invoice No.': 'CI-2025-014', "Buyer's order No.": 'BO-55014',
          'Port of Loading': 'Port Klang, Malaysia', 'Port of Discharge': 'Jeddah, Saudi Arabia',
          'Description of Goods': 'Palm Stearin', 'Quantity': '900 MT', 'Total Quantity': '900 MT',
        },
      },
      {
        id: 'doc-T014-ins1', type: 'Draft Insurance',
        fieldMapping: { 'Insured': 'insured_name', 'Sum Insured': 'sum_insured', 'Commodity': 'commodity', 'Port of Loading': 'pol', 'Port of Discharge': 'pod' },
        values: { insured_name: 'Kuala Lumpur Kepong Bhd', sum_insured: 'USD 220,000.00', commodity: 'Palm Stearin', pol: 'Port Klang, Malaysia', pod: 'Jeddah, Saudi Arabia' },
      },
      {
        id: 'doc-T014-ins2', type: 'Detail for Insurance Purpose',
        fieldMapping: { 'Insured': 'insured', 'Sum Insured': 'declared_value', 'Commodity': 'goods_description', 'Port of Loading': 'loading_port', 'Port of Discharge': 'discharge_port' },
        values: { insured: 'Kuala Lumpur Kepong Bhd', declared_value: 'USD 220,000.00', goods_description: 'Palm Stearin', loading_port: 'Port Klang, Malaysia', discharge_port: 'Jeddah, Saudi Arabia' },
      },
      {
        id: 'doc-T014-bl1', type: 'Draft B/L',
        fieldMapping: { 'Shipper': 'shipper', 'Consignee': 'consignee', 'Vessel Name': 'vessel_name', 'Gross Weight': 'gross_weight' },
        values: { shipper: 'Kuala Lumpur Kepong Bhd', consignee: 'ADM Hamburg AG', vessel_name: 'MV KL Express', gross_weight: '900,000 KG' },
      },
      {
        id: 'doc-T014-bl2', type: 'Shipping Particular',
        fieldMapping: { 'Shipper': 'exporter', 'Consignee': 'importer', 'Vessel Name': 'vessel', 'Gross Weight': 'gross_wt_kg' },
        values: { exporter: 'Kuala Lumpur Kepong Bhd', importer: 'ADM Hamburg AG', vessel: 'MV KL Express', gross_wt_kg: '900,000 KG' },
      },
      {
        id: 'doc-T014-obl', type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '15 Nov 2025' },
      },
    ],
  },

  // T015 — All Match
  {
    id: '1015030646',
    shipmentRef: 'SHP-2025-015',
    shipper: 'Genting Plantations Berhad',
    consignee: 'Fuji Oil Co Ltd',
    submittedDate: '2025-11-16',
    assignedTo: 'John Smith',
    status: 'All Match',
    verifications: { customFormality: 'All Matches', insurance: 'All Matches', draftBL: 'All Matches', blDate: 'All Matches' },
    canonicalFields: [
      'PROFORMA INVOICE NO.', 'Invoice no.', "Buyer's order No.", 'etd <port>', 'eta <port>',
      'product (line item)', 'quantity (line item)', 'Quantity (Total)',
      'Insured', 'Sum Insured', 'Commodity', 'Port of Loading', 'Port of Discharge',
      'Shipper', 'Consignee', 'Vessel Name', 'Gross Weight',
      'GI Date', 'ETD Date', 'Manual Billing Date',
    ],
    correctValues: {
      'PROFORMA INVOICE NO.': 'PFI-2025-015', 'Invoice no.': 'CI-2025-015', "Buyer's order No.": 'BO-55015',
      'etd <port>': 'Dumai, Indonesia', 'eta <port>': 'Osaka, Japan',
      'product (line item)': 'RBD Palm Kernel Olein', 'quantity (line item)': '1,000 MT', 'Quantity (Total)': '1,000 MT',
      'Insured': 'Genting Plantations Berhad', 'Sum Insured': 'USD 250,000.00', 'Commodity': 'RBD Palm Kernel Olein',
      'Port of Loading': 'Dumai, Indonesia', 'Port of Discharge': 'Osaka, Japan',
      'Shipper': 'Genting Plantations Berhad', 'Consignee': 'Fuji Oil Co Ltd',
      'Vessel Name': 'MV Genting Star', 'Gross Weight': '1,000,000 KG',
      'GI Date': '16 Nov 2025', 'ETD Date': '16 Nov 2025', 'Manual Billing Date': '16 Nov 2025',
    },
    documents: [
      {
        id: 'doc-T015-1', type: 'Shipping Advice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'PROFORMA INVOICE NO.', 'Invoice no.': 'Invoice no.',
          "Buyer's order No.": "Buyer's order No.", 'etd <port>': 'etd <port>', 'eta <port>': 'eta <port>',
          'product (line item)': 'product (line item)', 'quantity (line item)': 'quantity (line item)', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'PROFORMA INVOICE NO.': 'PFI-2025-015', 'Invoice no.': 'CI-2025-015', "Buyer's order No.": 'BO-55015',
          'etd <port>': 'Dumai, Indonesia', 'eta <port>': 'Osaka, Japan',
          'product (line item)': 'RBD Palm Kernel Olein', 'quantity (line item)': '1,000 MT', 'Quantity (Total)': '1,000 MT',
        },
      },
      {
        id: 'doc-T015-2', type: 'Custom Invoice',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-015', 'No.': 'CI-2025-015', "Buyer's order No.": 'BO-55015',
          'from': 'Dumai, Indonesia', 'to': 'Osaka, Japan',
          'description of goods': 'RBD Palm Kernel Olein', 'quantity': '1,000 MT', 'Quantity (Total)': '1,000 MT',
        },
      },
      {
        id: 'doc-T015-3', type: 'Packing List',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'REFERENCE NO.', 'Invoice no.': 'No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'from', 'eta <port>': 'to',
          'product (line item)': 'description of goods', 'quantity (line item)': 'quantity', 'Quantity (Total)': 'Quantity (Total)',
        },
        values: {
          'REFERENCE NO.': 'PFI-2025-015', 'No.': 'CI-2025-015', "Buyer's order No.": 'BO-55015',
          'from': 'Dumai, Indonesia', 'to': 'Osaka, Japan',
          'description of goods': 'RBD Palm Kernel Olein', 'quantity': '1,000 MT', 'Quantity (Total)': '1,000 MT',
        },
      },
      {
        id: 'doc-T015-4', type: 'Shipping Instruction',
        fieldMapping: {
          'PROFORMA INVOICE NO.': 'Contract No.', 'Invoice no.': 'Invoice No.', "Buyer's order No.": "Buyer's order No.",
          'etd <port>': 'Port of Loading', 'eta <port>': 'Port of Discharge',
          'product (line item)': 'Description of Goods', 'quantity (line item)': 'Quantity', 'Quantity (Total)': 'Total Quantity',
        },
        values: {
          'Contract No.': 'PFI-2025-015', 'Invoice No.': 'CI-2025-015', "Buyer's order No.": 'BO-55015',
          'Port of Loading': 'Dumai, Indonesia', 'Port of Discharge': 'Osaka, Japan',
          'Description of Goods': 'RBD Palm Kernel Olein', 'Quantity': '1,000 MT', 'Total Quantity': '1,000 MT',
        },
      },
      {
        id: 'doc-T015-ins1', type: 'Draft Insurance',
        fieldMapping: { 'Insured': 'insured_name', 'Sum Insured': 'sum_insured', 'Commodity': 'commodity', 'Port of Loading': 'pol', 'Port of Discharge': 'pod' },
        values: { insured_name: 'Genting Plantations Berhad', sum_insured: 'USD 250,000.00', commodity: 'RBD Palm Kernel Olein', pol: 'Dumai, Indonesia', pod: 'Osaka, Japan' },
      },
      {
        id: 'doc-T015-ins2', type: 'Detail for Insurance Purpose',
        fieldMapping: { 'Insured': 'insured', 'Sum Insured': 'declared_value', 'Commodity': 'goods_description', 'Port of Loading': 'loading_port', 'Port of Discharge': 'discharge_port' },
        values: { insured: 'Genting Plantations Berhad', declared_value: 'USD 250,000.00', goods_description: 'RBD Palm Kernel Olein', loading_port: 'Dumai, Indonesia', discharge_port: 'Osaka, Japan' },
      },
      {
        id: 'doc-T015-bl1', type: 'Draft B/L',
        fieldMapping: { 'Shipper': 'shipper', 'Consignee': 'consignee', 'Vessel Name': 'vessel_name', 'Gross Weight': 'gross_weight' },
        values: { shipper: 'Genting Plantations Berhad', consignee: 'Fuji Oil Co Ltd', vessel_name: 'MV Genting Star', gross_weight: '1,000,000 KG' },
      },
      {
        id: 'doc-T015-bl2', type: 'Shipping Particular',
        fieldMapping: { 'Shipper': 'exporter', 'Consignee': 'importer', 'Vessel Name': 'vessel', 'Gross Weight': 'gross_wt_kg' },
        values: { exporter: 'Genting Plantations Berhad', importer: 'Fuji Oil Co Ltd', vessel: 'MV Genting Star', gross_wt_kg: '1,000,000 KG' },
      },
      {
        id: 'doc-T015-obl', type: 'Original B/L',
        fieldMapping: { 'B/L Date': 'bl_date' },
        values: { bl_date: '16 Nov 2025' },
      },
    ],
  },
];
