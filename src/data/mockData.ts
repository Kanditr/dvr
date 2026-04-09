export interface ShipDoc {
  id: string;
  type: 'Shipping Advice' | 'Custom Invoice' | 'Packing List' | 'Letter of Credit' | 'Shipping Instruction';
  fieldMapping: Record<string, string>; // canonical field → original field name in this doc
  values: Record<string, string>;       // original field name → actual value
}

export type TaskStatus =
  | 'Pending'
  | 'Needs Attention'
  | 'All Match'
  | 'Approved'
  | 'Rejected';

export interface Task {
  id: string;
  shipmentRef: string;
  shipper: string;
  consignee: string;
  submittedDate: string;
  documents: ShipDoc[];       // variable: 2–5 documents
  canonicalFields: string[];  // fields to compare, specific to this task
  correctValues: Record<string, string>;
  status: TaskStatus;
}

export const mockTasks: Task[] = [
  // T001 — Shipping Advice + Custom Invoice + Packing List → All Match
  {
    id: '1015030621',
    shipmentRef: 'SHP-2025-001',
    shipper: 'Petronas Trading Sdn Bhd',
    consignee: 'China National Chemical Corp',
    submittedDate: '2025-11-03',
    status: 'All Match',
    canonicalFields: ['Shipper', 'Consignee', 'Description of Goods', 'Total Packages', 'Gross Weight (KG)'],
    correctValues: {
      'Shipper':              'Petronas Trading Sdn Bhd',
      'Consignee':            'China National Chemical Corp',
      'Description of Goods':'Crude Palm Oil',
      'Total Packages':      '250 Drums',
      'Gross Weight (KG)':   '50,000 KG',
    },
    documents: [
      {
        id: 'doc-T001-1',
        type: 'Shipping Advice',
        fieldMapping: {
          'Shipper':              'shipper',
          'Consignee':            'consignee',
          'Description of Goods':'commodity',
          'Total Packages':      'no_of_pkgs',
          'Gross Weight (KG)':   'gross_wt',
        },
        values: {
          shipper:    'Petronas Trading Sdn Bhd',
          consignee:  'China National Chemical Corp',
          commodity:  'Crude Palm Oil',
          no_of_pkgs: '250 Drums',
          gross_wt:   '50,000 KG',
        },
      },
      {
        id: 'doc-T001-2',
        type: 'Custom Invoice',
        fieldMapping: {
          'Shipper':              'seller',
          'Consignee':            'buyer',
          'Description of Goods':'goods_description',
          'Total Packages':      'quantity_packs',
          'Gross Weight (KG)':   'total_gross_weight',
        },
        values: {
          seller:             'Petronas Trading Sdn Bhd',
          buyer:              'China National Chemical Corp',
          goods_description:  'Crude Palm Oil',
          quantity_packs:     '250 Drums',
          total_gross_weight: '50,000 KG',
        },
      },
      {
        id: 'doc-T001-3',
        type: 'Packing List',
        fieldMapping: {
          'Shipper':              'shipper_name',
          'Consignee':            'consignee_name',
          'Description of Goods':'description',
          'Total Packages':      'packages',
          'Gross Weight (KG)':   'gross_weight_kg',
        },
        values: {
          shipper_name:    'Petronas Trading Sdn Bhd',
          consignee_name:  'China National Chemical Corp',
          description:     'Crude Palm Oil',
          packages:        '250 Drums',
          gross_weight_kg: '50,000 KG',
        },
      },
    ],
  },

  // T002 — Custom Invoice + Packing List + Letter of Credit → Needs Attention (L/C amount mismatch)
  {
    id: '1015030622',
    shipmentRef: 'SHP-2025-002',
    shipper: 'Mayur Exports Pte Ltd',
    consignee: 'Al Fatah Trading LLC',
    submittedDate: '2025-11-05',
    status: 'Needs Attention',
    canonicalFields: ['Shipper', 'Consignee', 'Description of Goods', 'Invoice Value (USD)', 'Port of Loading', 'Port of Discharge'],
    correctValues: {
      'Shipper':             'Mayur Exports Pte Ltd',
      'Consignee':           'Al Fatah Trading LLC',
      'Description of Goods':'Natural Rubber (RSS3)',
      'Invoice Value (USD)': 'USD 125,000.00',
      'Port of Loading':     'Port Klang, Malaysia',
      'Port of Discharge':   'Jebel Ali, UAE',
    },
    documents: [
      {
        id: 'doc-T002-1',
        type: 'Custom Invoice',
        fieldMapping: {
          'Shipper':             'seller',
          'Consignee':           'buyer',
          'Description of Goods':'description_of_goods',
          'Invoice Value (USD)': 'invoice_value',
          'Port of Loading':     'port_of_loading',
          'Port of Discharge':   'port_of_discharge',
        },
        values: {
          seller:             'Mayur Exports Pte Ltd',
          buyer:              'Al Fatah Trading LLC',
          description_of_goods: 'Natural Rubber (RSS3)',
          invoice_value:      'USD 125,000.00',
          port_of_loading:    'Port Klang, Malaysia',
          port_of_discharge:  'Jebel Ali, UAE',
        },
      },
      {
        id: 'doc-T002-2',
        type: 'Packing List',
        fieldMapping: {
          'Shipper':             'exporter',
          'Consignee':           'importer',
          'Description of Goods':'cargo_desc',
          'Invoice Value (USD)': 'declared_value',
          'Port of Loading':     'loading_port',
          'Port of Discharge':   'discharge_port',
        },
        values: {
          exporter:       'Mayur Exports Pte Ltd',
          importer:       'Al Fatah Trading LLC',
          cargo_desc:     'Natural Rubber (RSS3)',
          declared_value: 'USD 125,000.00',
          loading_port:   'Port Klang, Malaysia',
          discharge_port: 'Jebel Ali, UAE',
        },
      },
      {
        id: 'doc-T002-3',
        type: 'Letter of Credit',
        fieldMapping: {
          'Shipper':             'beneficiary',
          'Consignee':           'applicant',
          'Description of Goods':'goods_description',
          'Invoice Value (USD)': 'lc_amount',
          'Port of Loading':     'pol',
          'Port of Discharge':   'pod',
        },
        values: {
          beneficiary:       'Mayur Exports Pte Ltd',
          applicant:         'Al Fatah Trading LLC',
          goods_description: 'Natural Rubber (RSS3)',
          lc_amount:         'USD 127,500.00', // ← mismatch: USD 2,500 higher than invoice
          pol:               'Port Klang, Malaysia',
          pod:               'Jebel Ali, UAE',
        },
      },
    ],
  },

  // T003 — Shipping Advice + Letter of Credit + Shipping Instruction → Needs Attention (Port of Discharge mismatch)
  {
    id: '1015030623',
    shipmentRef: 'SHP-2025-003',
    shipper: 'Genting Plantations Berhad',
    consignee: 'Wilmar International Ltd',
    submittedDate: '2025-11-07',
    status: 'Needs Attention',
    canonicalFields: ['Shipper', 'Consignee', 'Port of Loading', 'Port of Discharge', 'Vessel Name', 'Voyage No.'],
    correctValues: {
      'Shipper':          'Genting Plantations Berhad',
      'Consignee':        'Wilmar International Ltd',
      'Port of Loading':  'Port Klang, Malaysia',
      'Port of Discharge':'Tanjung Priok, Indonesia',
      'Vessel Name':      'MV Pacific Star',
      'Voyage No.':       'PS-1122W',
    },
    documents: [
      {
        id: 'doc-T003-1',
        type: 'Shipping Advice',
        fieldMapping: {
          'Shipper':          'shipper',
          'Consignee':        'consignee',
          'Port of Loading':  'loading_port',
          'Port of Discharge':'discharge_port',
          'Vessel Name':      'vessel_name',
          'Voyage No.':       'voyage_no',
        },
        values: {
          shipper:        'Genting Plantations Berhad',
          consignee:      'Wilmar International Ltd',
          loading_port:   'Port Klang, Malaysia',
          discharge_port: 'Tanjung Priok, Indonesia',
          vessel_name:    'MV Pacific Star',
          voyage_no:      'PS-1122W',
        },
      },
      {
        id: 'doc-T003-2',
        type: 'Letter of Credit',
        fieldMapping: {
          'Shipper':          'beneficiary',
          'Consignee':        'applicant',
          'Port of Loading':  'pol',
          'Port of Discharge':'pod',
          'Vessel Name':      'vessel',
          'Voyage No.':       'voyage',
        },
        values: {
          beneficiary: 'Genting Plantations Berhad',
          applicant:   'Wilmar International Ltd',
          pol:         'Port Klang, Malaysia',
          pod:         'Tanjung Priok, Indonesia',
          vessel:      'MV Pacific Star',
          voyage:      'PS-1122W',
        },
      },
      {
        id: 'doc-T003-3',
        type: 'Shipping Instruction',
        fieldMapping: {
          'Shipper':          'shipper_name',
          'Consignee':        'consignee_name',
          'Port of Loading':  'port_of_loading',
          'Port of Discharge':'port_of_discharge',
          'Vessel Name':      'vessel',
          'Voyage No.':       'voyage_no',
        },
        values: {
          shipper_name:      'Genting Plantations Berhad',
          consignee_name:    'Wilmar International Ltd',
          port_of_loading:   'Port Klang, Malaysia',
          port_of_discharge: 'Belawan, Indonesia', // ← wrong port
          vessel:            'MV Pacific Star',
          voyage_no:         'PS-1122W',
        },
      },
    ],
  },

  // T004 — Custom Invoice + Packing List (2 docs) → Approved
  {
    id: '1015030624',
    shipmentRef: 'SHP-2025-004',
    shipper: 'IOI Corporation Berhad',
    consignee: 'Olam International Ltd',
    submittedDate: '2025-10-28',
    status: 'Approved',
    canonicalFields: ['Shipper', 'Consignee', 'Description of Goods', 'Total Packages', 'Net Weight (KG)', 'Volume (CBM)'],
    correctValues: {
      'Shipper':              'IOI Corporation Berhad',
      'Consignee':            'Olam International Ltd',
      'Description of Goods':'RBD Palm Olein',
      'Total Packages':      '480 Flexibags',
      'Net Weight (KG)':     '96,000 KG',
      'Volume (CBM)':        '120 CBM',
    },
    documents: [
      {
        id: 'doc-T004-1',
        type: 'Custom Invoice',
        fieldMapping: {
          'Shipper':              'seller',
          'Consignee':            'buyer',
          'Description of Goods':'description',
          'Total Packages':      'total_pkgs',
          'Net Weight (KG)':     'net_weight',
          'Volume (CBM)':        'volume_cbm',
        },
        values: {
          seller:      'IOI Corporation Berhad',
          buyer:       'Olam International Ltd',
          description: 'RBD Palm Olein',
          total_pkgs:  '480 Flexibags',
          net_weight:  '96,000 KG',
          volume_cbm:  '120 CBM',
        },
      },
      {
        id: 'doc-T004-2',
        type: 'Packing List',
        fieldMapping: {
          'Shipper':              'shipper_name',
          'Consignee':            'consignee_name',
          'Description of Goods':'cargo_description',
          'Total Packages':      'packages',
          'Net Weight (KG)':     'net_wt_kg',
          'Volume (CBM)':        'total_volume',
        },
        values: {
          shipper_name:      'IOI Corporation Berhad',
          consignee_name:    'Olam International Ltd',
          cargo_description: 'RBD Palm Olein',
          packages:          '480 Flexibags',
          net_wt_kg:         '96,000 KG',
          total_volume:      '120 CBM',
        },
      },
    ],
  },

  // T005 — Shipping Advice + Custom Invoice + Packing List + Shipping Instruction (4 docs) → Needs Attention (consignee name abbreviated in CI)
  {
    id: '1015030625',
    shipmentRef: 'SHP-2025-005',
    shipper: 'KL-Kepong Bhd',
    consignee: 'Louis Dreyfus Company Asia Pte Ltd',
    submittedDate: '2025-11-10',
    status: 'Needs Attention',
    canonicalFields: ['Shipper', 'Consignee', 'Port of Loading', 'Port of Discharge', 'Vessel Name', 'Description of Goods'],
    correctValues: {
      'Shipper':              'KL-Kepong Bhd',
      'Consignee':            'Louis Dreyfus Company Asia Pte Ltd',
      'Port of Loading':      'Pasir Gudang, Malaysia',
      'Port of Discharge':    'Rotterdam, Netherlands',
      'Vessel Name':          'MV Maersk Rotterdam',
      'Description of Goods':'Palm Kernel Oil',
    },
    documents: [
      {
        id: 'doc-T005-1',
        type: 'Shipping Advice',
        fieldMapping: {
          'Shipper':              'shipper',
          'Consignee':            'consignee',
          'Port of Loading':      'port_of_loading',
          'Port of Discharge':    'port_of_discharge',
          'Vessel Name':          'vessel_name',
          'Description of Goods':'commodity',
        },
        values: {
          shipper:           'KL-Kepong Bhd',
          consignee:         'Louis Dreyfus Company Asia Pte Ltd',
          port_of_loading:   'Pasir Gudang, Malaysia',
          port_of_discharge: 'Rotterdam, Netherlands',
          vessel_name:       'MV Maersk Rotterdam',
          commodity:         'Palm Kernel Oil',
        },
      },
      {
        id: 'doc-T005-2',
        type: 'Custom Invoice',
        fieldMapping: {
          'Shipper':              'seller',
          'Consignee':            'buyer',
          'Port of Loading':      'pol',
          'Port of Discharge':    'pod',
          'Vessel Name':          'vessel',
          'Description of Goods':'goods_desc',
        },
        values: {
          seller:     'KL-Kepong Bhd',
          buyer:      'Louis Dreyfus Co. Asia', // ← abbreviated name
          pol:        'Pasir Gudang, Malaysia',
          pod:        'Rotterdam, Netherlands',
          vessel:     'MV Maersk Rotterdam',
          goods_desc: 'Palm Kernel Oil',
        },
      },
      {
        id: 'doc-T005-3',
        type: 'Packing List',
        fieldMapping: {
          'Shipper':              'shipper_name',
          'Consignee':            'consignee_name',
          'Port of Loading':      'loading_port',
          'Port of Discharge':    'discharge_port',
          'Vessel Name':          'vessel',
          'Description of Goods':'description',
        },
        values: {
          shipper_name:   'KL-Kepong Bhd',
          consignee_name: 'Louis Dreyfus Company Asia Pte Ltd',
          loading_port:   'Pasir Gudang, Malaysia',
          discharge_port: 'Rotterdam, Netherlands',
          vessel:         'MV Maersk Rotterdam',
          description:    'Palm Kernel Oil',
        },
      },
      {
        id: 'doc-T005-4',
        type: 'Shipping Instruction',
        fieldMapping: {
          'Shipper':              'shipper_name',
          'Consignee':            'consignee_name',
          'Port of Loading':      'port_of_loading',
          'Port of Discharge':    'port_of_discharge',
          'Vessel Name':          'vessel',
          'Description of Goods':'cargo_description',
        },
        values: {
          shipper_name:      'KL-Kepong Bhd',
          consignee_name:    'Louis Dreyfus Company Asia Pte Ltd',
          port_of_loading:   'Pasir Gudang, Malaysia',
          port_of_discharge: 'Rotterdam, Netherlands',
          vessel:            'MV Maersk Rotterdam',
          cargo_description: 'Palm Kernel Oil',
        },
      },
    ],
  },

  // T006 — Packing List + Shipping Instruction (2 docs) → Rejected (package count & weight mismatch)
  {
    id: '1015030626',
    shipmentRef: 'SHP-2025-006',
    shipper: 'Sime Darby Plantation Sdn Bhd',
    consignee: 'Cargill Asia Pacific Ltd',
    submittedDate: '2025-10-30',
    status: 'Rejected',
    canonicalFields: ['Shipper', 'Consignee', 'Description of Goods', 'Total Packages', 'Gross Weight (KG)'],
    correctValues: {
      'Shipper':              'Sime Darby Plantation Sdn Bhd',
      'Consignee':            'Cargill Asia Pacific Ltd',
      'Description of Goods':'Palm Fatty Acid Distillate (PFAD)',
      'Total Packages':      '320 Drums',
      'Gross Weight (KG)':   '72,000 KG',
    },
    documents: [
      {
        id: 'doc-T006-1',
        type: 'Packing List',
        fieldMapping: {
          'Shipper':              'shipper_name',
          'Consignee':            'consignee_name',
          'Description of Goods':'description',
          'Total Packages':      'packages',
          'Gross Weight (KG)':   'gross_weight_kg',
        },
        values: {
          shipper_name:    'Sime Darby Plantation Sdn Bhd',
          consignee_name:  'Cargill Asia Pacific Ltd',
          description:     'Palm Fatty Acid Distillate (PFAD)',
          packages:        '320 Drums',
          gross_weight_kg: '72,000 KG',
        },
      },
      {
        id: 'doc-T006-2',
        type: 'Shipping Instruction',
        fieldMapping: {
          'Shipper':              'shipper',
          'Consignee':            'consignee',
          'Description of Goods':'cargo_desc',
          'Total Packages':      'total_pkgs',
          'Gross Weight (KG)':   'gross_wt',
        },
        values: {
          shipper:     'Sime Darby Plantation Sdn Bhd',
          consignee:   'Cargill Asia Pacific Ltd',
          cargo_desc:  'Palm Fatty Acid Distillate (PFAD)',
          total_pkgs:  '315 Drums',  // ← 5 drums short
          gross_wt:    '71,100 KG',  // ← weight discrepancy
        },
      },
    ],
  },

  // T007 — Custom Invoice + Letter of Credit + Shipping Instruction (3 docs) → Pending (all match)
  {
    id: '1015030627',
    shipmentRef: 'SHP-2025-007',
    shipper: 'Felda Global Ventures Sdn Bhd',
    consignee: 'Bunge Asia Pte Ltd',
    submittedDate: '2025-11-12',
    status: 'Pending',
    canonicalFields: ['Shipper', 'Consignee', 'Description of Goods', 'Invoice Value (USD)', 'Currency', 'Port of Loading'],
    correctValues: {
      'Shipper':              'Felda Global Ventures Sdn Bhd',
      'Consignee':            'Bunge Asia Pte Ltd',
      'Description of Goods':'Crude Coconut Oil',
      'Invoice Value (USD)':  'USD 85,500.00',
      'Currency':             'USD',
      'Port of Loading':      'Kemaman Supply Base, Malaysia',
    },
    documents: [
      {
        id: 'doc-T007-1',
        type: 'Custom Invoice',
        fieldMapping: {
          'Shipper':              'seller',
          'Consignee':            'buyer',
          'Description of Goods':'goods_description',
          'Invoice Value (USD)':  'invoice_value',
          'Currency':             'currency',
          'Port of Loading':      'port_of_loading',
        },
        values: {
          seller:            'Felda Global Ventures Sdn Bhd',
          buyer:             'Bunge Asia Pte Ltd',
          goods_description: 'Crude Coconut Oil',
          invoice_value:     'USD 85,500.00',
          currency:          'USD',
          port_of_loading:   'Kemaman Supply Base, Malaysia',
        },
      },
      {
        id: 'doc-T007-2',
        type: 'Letter of Credit',
        fieldMapping: {
          'Shipper':              'beneficiary',
          'Consignee':            'applicant',
          'Description of Goods':'description_of_goods',
          'Invoice Value (USD)':  'lc_amount',
          'Currency':             'lc_currency',
          'Port of Loading':      'pol',
        },
        values: {
          beneficiary:         'Felda Global Ventures Sdn Bhd',
          applicant:           'Bunge Asia Pte Ltd',
          description_of_goods:'Crude Coconut Oil',
          lc_amount:           'USD 85,500.00',
          lc_currency:         'USD',
          pol:                 'Kemaman Supply Base, Malaysia',
        },
      },
      {
        id: 'doc-T007-3',
        type: 'Shipping Instruction',
        fieldMapping: {
          'Shipper':              'shipper_name',
          'Consignee':            'consignee_name',
          'Description of Goods':'cargo_description',
          'Invoice Value (USD)':  'declared_value',
          'Currency':             'ccy',
          'Port of Loading':      'port_of_loading',
        },
        values: {
          shipper_name:      'Felda Global Ventures Sdn Bhd',
          consignee_name:    'Bunge Asia Pte Ltd',
          cargo_description: 'Crude Coconut Oil',
          declared_value:    'USD 85,500.00',
          ccy:               'USD',
          port_of_loading:   'Kemaman Supply Base, Malaysia',
        },
      },
    ],
  },

  // T008 — Shipping Advice + Custom Invoice + Letter of Credit (3 docs) → Needs Attention (L/C Port of Loading mismatch)
  {
    id: '1015030628',
    shipmentRef: 'SHP-2025-008',
    shipper: 'TH Plantations Berhad',
    consignee: 'Musim Mas Holdings Pte Ltd',
    submittedDate: '2025-11-14',
    status: 'Needs Attention',
    canonicalFields: ['Shipper', 'Consignee', 'Port of Loading', 'Port of Discharge', 'Invoice Value (USD)', 'Vessel Name'],
    correctValues: {
      'Shipper':            'TH Plantations Berhad',
      'Consignee':          'Musim Mas Holdings Pte Ltd',
      'Port of Loading':    'Kuantan Port, Malaysia',
      'Port of Discharge':  'Kandla Port, India',
      'Invoice Value (USD)':'USD 210,000.00',
      'Vessel Name':        'MV Asian Emerald',
    },
    documents: [
      {
        id: 'doc-T008-1',
        type: 'Shipping Advice',
        fieldMapping: {
          'Shipper':            'shipper',
          'Consignee':          'consignee',
          'Port of Loading':    'loading_port',
          'Port of Discharge':  'discharge_port',
          'Invoice Value (USD)':'invoice_value',
          'Vessel Name':        'vessel_name',
        },
        values: {
          shipper:       'TH Plantations Berhad',
          consignee:     'Musim Mas Holdings Pte Ltd',
          loading_port:  'Kuantan Port, Malaysia',
          discharge_port:'Kandla Port, India',
          invoice_value: 'USD 210,000.00',
          vessel_name:   'MV Asian Emerald',
        },
      },
      {
        id: 'doc-T008-2',
        type: 'Custom Invoice',
        fieldMapping: {
          'Shipper':            'seller',
          'Consignee':          'buyer',
          'Port of Loading':    'port_of_loading',
          'Port of Discharge':  'port_of_discharge',
          'Invoice Value (USD)':'total_value',
          'Vessel Name':        'vessel',
        },
        values: {
          seller:            'TH Plantations Berhad',
          buyer:             'Musim Mas Holdings Pte Ltd',
          port_of_loading:   'Kuantan Port, Malaysia',
          port_of_discharge: 'Kandla Port, India',
          total_value:       'USD 210,000.00',
          vessel:            'MV Asian Emerald',
        },
      },
      {
        id: 'doc-T008-3',
        type: 'Letter of Credit',
        fieldMapping: {
          'Shipper':            'beneficiary',
          'Consignee':          'applicant',
          'Port of Loading':    'pol',
          'Port of Discharge':  'pod',
          'Invoice Value (USD)':'lc_amount',
          'Vessel Name':        'vessel_name',
        },
        values: {
          beneficiary: 'TH Plantations Berhad',
          applicant:   'Musim Mas Holdings Pte Ltd',
          pol:         'Port Klang, Malaysia', // ← wrong port
          pod:         'Kandla Port, India',
          lc_amount:   'USD 210,000.00',
          vessel_name: 'MV Asian Emerald',
        },
      },
    ],
  },
];
