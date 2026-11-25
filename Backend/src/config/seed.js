import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Department from '../models/Department.js';
import DocumentType from '../models/DocumentType.js';
import StorageLocation from '../models/StorageLocation.js';
import Document from '../models/Document.js';
import DocumentVersion from '../models/DocumentVersion.js';
import DocumentRequest from '../models/DocumentRequest.js';
import Approval from '../models/Approval.js';
import Handover from '../models/Handover.js';
import CheckoutRecord from '../models/CheckoutRecord.js';
import PhysicalAudit from '../models/PhysicalAudit.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

import { generateDocumentQR } from '../services/qrService.js';
import { ROLES, DOCUMENT_STATUSES, PHYSICAL_STATUSES, AUDIT_ACTIONS, REQUEST_TYPES, REQUEST_STATUSES } from '../constants/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate a valid minimal PDF file buffer for sample documents
const createSamplePdf = (filename, title, docNum) => {
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    // Standard minimal valid PDF header & structure containing readable text for pdf-parse
    const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 300 >> stream
BT
/F1 16 Tf
50 720 Td
(DocuShield GxP Regulated Document: ${docNum}) Tj
/F1 12 Tf
0 -30 Td
(Document Title: ${title}) Tj
0 -25 Td
(Department: Quality Assurance / GxP Operations) Tj
0 -25 Td
(Effective Date: 2026-01-15 | Next Review: 2027-01-15) Tj
0 -25 Td
(Document No: ${docNum}) Tj
0 -25 Td
(Version: 1.0) Tj
0 -25 Td
(Standard Operating Procedure - Compliance: 21 CFR Part 11) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000305 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
650
%%EOF`;
    fs.writeFileSync(filePath, content);
  }
  return filePath;
};

export const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/docushield';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      DocumentType.deleteMany({}),
      StorageLocation.deleteMany({}),
      Document.deleteMany({}),
      DocumentVersion.deleteMany({}),
      DocumentRequest.deleteMany({}),
      Approval.deleteMany({}),
      Handover.deleteMany({}),
      CheckoutRecord.deleteMany({}),
      PhysicalAudit.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('[Seed] Creating demo users...');
    const demoPassword = 'DocuShield@2026';

    const users = await User.create([
      {
        name: 'Anita Sharma',
        email: 'anita.sharma@docushield.com',
        password: demoPassword,
        role: ROLES.ADMIN,
        department: 'Executive Administration',
        employeeId: 'EMP-ADM-001',
        designation: 'System Administrator & Governance Lead',
        phone: '+91 98201 10001'
      },
      {
        name: 'Dr. Meera Iyer',
        email: 'meera.iyer@docushield.com',
        password: demoPassword,
        role: ROLES.QA_MANAGER,
        department: 'Quality Assurance',
        employeeId: 'EMP-QA-002',
        designation: 'Head of QA & Regulatory Compliance',
        phone: '+91 98201 10002'
      },
      {
        name: 'Suresh Patil',
        email: 'suresh.patil@docushield.com',
        password: demoPassword,
        role: ROLES.DOCUMENT_CONTROLLER,
        department: 'Document Control',
        employeeId: 'EMP-DC-003',
        designation: 'Lead Document Controller',
        phone: '+91 98201 10003'
      },
      {
        name: 'Rahul Verma',
        email: 'rahul.verma@docushield.com',
        password: demoPassword,
        role: ROLES.CUSTODIAN,
        department: 'Production',
        employeeId: 'EMP-CUST-004',
        designation: 'Production Record Custodian',
        phone: '+91 98201 10004'
      },
      {
        name: 'Priya Nair',
        email: 'priya.nair@docushield.com',
        password: demoPassword,
        role: ROLES.CUSTODIAN,
        department: 'Quality Control',
        employeeId: 'EMP-CUST-005',
        designation: 'QC Analytical Records Custodian',
        phone: '+91 98201 10005'
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@docushield.com',
        password: demoPassword,
        role: ROLES.VIEWER,
        department: 'Operations & R&D',
        employeeId: 'EMP-USR-006',
        designation: 'Manufacturing Associate / Viewer',
        phone: '+91 98201 10006'
      },
      // Convenience aliases for legacy credentials
      {
        name: 'Anita Sharma (Admin Alias)',
        email: 'admin@docushield.com',
        password: demoPassword,
        role: ROLES.ADMIN,
        department: 'Executive Administration',
        employeeId: 'EMP-ADM-ALIAS',
        designation: 'System Administrator',
        phone: '+91 98201 10001'
      },
      {
        name: 'Dr. Meera Iyer (QA Alias)',
        email: 'qa@docushield.com',
        password: demoPassword,
        role: ROLES.QA_MANAGER,
        department: 'Quality Assurance',
        employeeId: 'EMP-QA-ALIAS',
        designation: 'Head of QA',
        phone: '+91 98201 10002'
      },
      {
        name: 'Suresh Patil (DC Alias)',
        email: 'doccontrol@docushield.com',
        password: demoPassword,
        role: ROLES.DOCUMENT_CONTROLLER,
        department: 'Document Control',
        employeeId: 'EMP-DC-ALIAS',
        designation: 'Document Controller',
        phone: '+91 98201 10003'
      }
    ]);

    const [adminUser, qaUser, docCtrlUser, deptHeadUser, analystUser, viewerUser] = users;

    console.log('[Seed] Creating master departments...');
    const departments = await Department.create([
      { name: 'Quality Assurance', code: 'QA', description: 'Overall GxP compliance, validation, audit & document governance', headName: 'Dr. Sarah Jenkins' },
      { name: 'Quality Control', code: 'QC', description: 'Raw material, in-process, finished product analytical testing', headName: 'Emily Davis' },
      { name: 'Production', code: 'PROD', description: 'Solid oral dosage, sterile injectable formulation and packaging', headName: 'Dr. Rajesh Patel' },
      { name: 'Regulatory Affairs', code: 'RA', description: 'FDA/EMA submissions, dossiers, and compliance filings', headName: 'Victoria Price' },
      { name: 'Research & Development', code: 'RND', description: 'Pre-formulation, analytical method development', headName: 'Dr. Alan Vance' },
      { name: 'Warehouse & Logistics', code: 'WHS', description: 'Raw material dispensing and controlled cold chain storage', headName: 'Robert Vance' }
    ]);

    console.log('[Seed] Creating master document types...');
    const docTypes = await DocumentType.create([
      { name: 'Standard Operating Procedure (SOP)', code: 'SOP', prefix: 'SOP', retentionYears: 7, reviewIntervalMonths: 12, requiresPhysicalTracking: true },
      { name: 'Batch Manufacturing Record (BMR)', code: 'BMR', prefix: 'BMR', retentionYears: 10, reviewIntervalMonths: 24, requiresPhysicalTracking: true },
      { name: 'Batch Packaging Record (BPR)', code: 'BPR', prefix: 'BPR', retentionYears: 10, reviewIntervalMonths: 24, requiresPhysicalTracking: true },
      { name: 'Validation Protocol / Report', code: 'VAL', prefix: 'VAL', retentionYears: 10, reviewIntervalMonths: 24, requiresPhysicalTracking: true },
      { name: 'Specification (SPEC)', code: 'SPEC', prefix: 'SPEC', retentionYears: 7, reviewIntervalMonths: 12, requiresPhysicalTracking: true },
      { name: 'Analytical Method (ATM)', code: 'ATM', prefix: 'ATM', retentionYears: 7, reviewIntervalMonths: 12, requiresPhysicalTracking: true },
      { name: 'Custody Handover Note', code: 'HND', prefix: 'HND', retentionYears: 5, reviewIntervalMonths: 12, requiresPhysicalTracking: true }
    ]);

    console.log('[Seed] Creating hierarchical physical storage locations across Plant-1 and Plant-2...');
    const gridLayout = [
      {
        building: 'Plant-1',
        area: 'Production Document Room',
        room: '101',
        rack: 'R-01',
        department: 'Production',
        prefix: 'PLT-1/PRD/R101/RK-R01',
        capacity: 25,
        bins: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08']
      },
      {
        building: 'Plant-1',
        area: 'Production Document Room',
        room: '102',
        rack: 'R-02',
        department: 'Engineering',
        prefix: 'PLT-1/ENG/R102/RK-R02',
        capacity: 25,
        bins: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08']
      },
      {
        building: 'Plant-1',
        area: 'QC Lab Records',
        room: '201',
        rack: 'R-01',
        department: 'Quality Control',
        prefix: 'PLT-1/QC/R201/RK-R01',
        capacity: 25,
        bins: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08']
      },
      {
        building: 'Plant-2',
        area: 'Archive Room',
        room: '301',
        rack: 'R-01',
        department: 'Quality Assurance',
        prefix: 'PLT-2/QA/R301/RK-R01',
        capacity: 25,
        bins: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08']
      },
      {
        building: 'Plant-2',
        area: 'Archive Room',
        room: '302',
        rack: 'R-03',
        department: 'Production Archive',
        prefix: 'PLT-2/PRD/R302/RK-R03',
        capacity: 40,
        bins: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08']
      }
    ];

    const locDocsToCreate = [];
    for (const group of gridLayout) {
      for (const b of group.bins) {
        locDocsToCreate.push({
          building: group.building,
          area: group.area,
          room: group.room,
          rack: group.rack,
          shelf: '01',
          bin: b,
          box: 'BX-01',
          code: `${group.prefix}/SH-01/BIN-${b}`,
          capacity: group.capacity,
          currentOccupancy: 0,
          department: group.department,
          status: 'Available',
          remarks: `${group.area} - Rack ${group.rack} Bin ${b}`
        });
      }
    }

    const locations = await StorageLocation.create(locDocsToCreate);
    const locMap = {};
    locations.forEach(l => { locMap[l.code] = l; });

    const loc1 = locMap['PLT-2/QA/R301/RK-R01/SH-01/BIN-B01'] || locations[0];
    const loc2 = locMap['PLT-2/QA/R301/RK-R01/SH-01/BIN-B02'] || locations[1];
    const loc3 = locMap['PLT-1/PRD/R101/RK-R01/SH-01/BIN-B01'] || locations[2];
    const loc4 = locMap['PLT-1/PRD/R101/RK-R01/SH-01/BIN-B02'] || locations[3];
    const loc5 = locMap['PLT-1/QC/R201/RK-R01/SH-01/BIN-B01'] || locations[4];

    console.log('[Seed] Generating sample documents and PDF files...');
    const sampleFiles = [
      {
        filename: 'sample_sop_qa_0042.pdf',
        docNum: 'SOP-QA-0042',
        title: 'Operation, Calibration, and Maintenance of HPLC System (Shimadzu Prominence)',
        version: '3.0',
        type: 'Standard Operating Procedure (SOP)',
        dept: 'Quality Control',
        product: 'General Analytical Equipment',
        batch: 'N/A',
        loc: loc5,
        custodian: analystUser,
        description: 'Standard operating procedure for the startup, routine calibration, column maintenance, and shutdown of Shimadzu Prominence HPLC systems in QC analytical laboratory.'
      },
      {
        filename: 'sample_bmr_tb_2024.pdf',
        docNum: 'BMR-TB-2024',
        title: 'Master Batch Manufacturing Record for Paracetamol 500mg Film-Coated Tablets',
        version: '1.0',
        type: 'Batch Manufacturing Record (BMR)',
        dept: 'Production',
        product: 'Paracetamol 500mg Tablets',
        batch: 'BTH-2026-089',
        loc: loc3,
        custodian: deptHeadUser,
        description: 'Comprehensive batch production steps, dispensing verification, dry granulation, compression parameters, and yield reconciliation for Paracetamol 500mg tablets.'
      },
      {
        filename: 'sample_sop_pr_0105.pdf',
        docNum: 'SOP-PR-0105',
        title: 'Aseptic Media Fill Qualification and Environmental Monitoring Protocol',
        version: '2.1',
        type: 'Standard Operating Procedure (SOP)',
        dept: 'Quality Assurance',
        product: 'Sterile Injectable Line 1',
        batch: 'MF-2026-01',
        loc: loc1,
        custodian: qaUser,
        description: 'Mandatory standard testing procedure for aseptic media fill simulations, viable surface sampling, and non-viable particulate monitoring in ISO Class 5 cleanrooms.'
      },
      {
        filename: 'sample_val_pr_0012.pdf',
        docNum: 'VAL-PR-0012',
        title: 'Cleaning Validation Protocol for Fluid Bed Dryer (Glatt FBD-02)',
        version: '1.0',
        type: 'Validation Protocol / Report',
        dept: 'Production',
        product: 'Solid Oral Granulation Equipment',
        batch: 'VAL-CLN-2026',
        loc: loc4,
        custodian: deptHeadUser,
        description: 'Validation protocol evaluating clean-in-place rinse efficiency, swab recovery limits, and worst-case active residue limits for the Glatt Fluid Bed Dryer.'
      },
      {
        filename: 'sample_spec_qc_0089.pdf',
        docNum: 'SPEC-QC-0089',
        title: 'Finished Product Specification for Metformin Hydrochloride Tablets 850mg',
        version: '4.0',
        type: 'Specification (SPEC)',
        dept: 'Quality Control',
        product: 'Metformin Hydrochloride 850mg',
        batch: 'MET-FP-SPEC',
        loc: loc5,
        custodian: analystUser,
        description: 'Official monograph specifications covering assay, dissolution profiles, related substances, uniformity of dosage units, and microbial limits for Metformin 850mg.'
      },
      {
        filename: 'sample_sop_qa_0018.pdf',
        docNum: 'SOP-QA-0018',
        title: 'Good Documentation Practices (GDP) and Data Integrity Governance',
        version: '5.0',
        type: 'Standard Operating Procedure (SOP)',
        dept: 'Quality Assurance',
        product: 'Site-wide Compliance Governance',
        batch: 'N/A',
        loc: loc1,
        custodian: qaUser,
        description: 'Universal site guidelines covering real-time contemporaneous recording, ALCOA+ principles, audit trail reviews, and physical logbook issuance controls.'
      },
      {
        filename: 'sample_sop_qc_0033.pdf',
        docNum: 'SOP-QC-0033',
        title: 'Out-of-Specification (OOS) and Out-of-Trend (OOT) Investigation Procedure',
        version: '2.0',
        type: 'Standard Operating Procedure (SOP)',
        dept: 'Quality Control',
        product: 'Analytical Chemistry and Microbiology',
        batch: 'N/A',
        loc: loc5,
        custodian: analystUser,
        description: 'Step-by-step procedure for Phase 1 laboratory investigation, hypothesis testing, analyst interview, Phase 2 manufacturing investigation, and final QA disposition.'
      },
      {
        filename: 'sample_bmr_tb_3100.pdf',
        docNum: 'BMR-TB-3100',
        title: 'Batch Manufacturing Record for Amoxicillin 250mg Dispersible Tablets',
        version: '2.0',
        type: 'Batch Manufacturing Record (BMR)',
        dept: 'Production',
        product: 'Amoxicillin 250mg Dispersible Tablets',
        batch: 'BTH-AMX-2026-04',
        loc: loc3,
        custodian: deptHeadUser,
        description: 'Dedicated beta-lactam manufacturing facility batch execution document including double-check material dispensing, blending, compression, and in-process controls.'
      },
      {
        filename: 'sample_bpr_pkg_1022.pdf',
        docNum: 'BPR-PKG-1022',
        title: 'Master Packaging Record for Ibuprofen 400mg Blister Packaging Line 2',
        version: '1.2',
        type: 'Batch Production Record (BPR)',
        dept: 'Production',
        product: 'Ibuprofen 400mg Blister Packs',
        batch: 'BTH-IBU-PKG-09',
        loc: loc4,
        custodian: deptHeadUser,
        description: 'Secondary and tertiary packaging execution instructions: foil printing, barcode verification, cartoning, blister seal integrity testing, and serialization coding.'
      },
      {
        filename: 'sample_val_pr_0045.pdf',
        docNum: 'VAL-PR-0045',
        title: 'Purified Water System Generation and Loop Distribution Qualification Protocol',
        version: '3.0',
        type: 'Validation Protocol / Report',
        dept: 'Quality Assurance',
        product: 'Pharmaceutical Water Generation Plant',
        batch: 'VAL-WTR-2026',
        loc: loc2,
        custodian: adminUser,
        description: 'Phase 1, 2, and 3 water system performance qualification protocol evaluating microbial bioburden, total organic carbon (TOC), and conductivity at user points.'
      },
      {
        filename: 'sample_dev_qa_2026_04.pdf',
        docNum: 'DEV-QA-2026-04',
        title: 'Critical Deviation Investigation: HVAC Differential Pressure Excursion in Grade B Filling Suite',
        version: '1.0',
        type: 'Deviation',
        dept: 'Quality Assurance',
        product: 'Sterile Filling Area A',
        batch: 'DEV-HVAC-04',
        loc: loc1,
        custodian: qaUser,
        description: 'Root cause analysis, environmental impact assessment, product risk evaluation, and immediate containment for an unexpected 25-minute differential pressure drop.'
      },
      {
        filename: 'sample_capa_2026_0012.pdf',
        docNum: 'CAPA-2026-0012',
        title: 'Corrective and Preventive Action: Elimination of Particulate Contamination in Vials',
        version: '1.0',
        type: 'CAPA',
        dept: 'Quality Assurance',
        product: 'Sterile Injectable Line 1',
        batch: 'CAPA-VIAL-012',
        loc: loc2,
        custodian: qaUser,
        description: 'CAPA plan incorporating ultrasonic washing temperature upgrades, HEPA filter laminar flow re-balancing, and revised quarterly particulate inspection SOP.'
      },
      {
        filename: 'sample_cc_qa_2026_008.pdf',
        docNum: 'CC-QA-2026-008',
        title: 'Change Control: Replacement of Primary Packaging Optical Character Recognition (OCR) Cameras',
        version: '1.0',
        type: 'Change Control',
        dept: 'Quality Assurance',
        product: 'High-speed Blister Packaging Machine',
        batch: 'CC-OCR-2026',
        loc: loc2,
        custodian: adminUser,
        description: 'Technical evaluation, computerized system validation re-challenge, and operator training requirements for high-resolution 2D barcode and expiry date verification.'
      },
      {
        filename: 'sample_log_pr_2026_01.pdf',
        docNum: 'LOG-PR-2026-01',
        title: 'Autoclave Steam Sterilizer Operation & Biological Indicator Incubation Logbook',
        version: '1.0',
        type: 'Logbook',
        dept: 'Production',
        product: 'Terminal Sterilization Equipment AUT-01',
        batch: 'LOG-AUT-2026',
        loc: loc3,
        custodian: deptHeadUser,
        description: 'Daily operational run logs, vacuum leak rate testing, F0 lethality calculation sheets, and Geobacillus stearothermophilus biological indicator incubation records.'
      },
      {
        filename: 'sample_spec_rm_0042.pdf',
        docNum: 'SPEC-RM-0042',
        title: 'Raw Material Analytical Specification for Microcrystalline Cellulose (Avicel PH-101)',
        version: '3.0',
        type: 'Specification (SPEC)',
        dept: 'Quality Control',
        product: 'Direct Compression Excipients',
        batch: 'RM-MCC-SPEC',
        loc: loc5,
        custodian: analystUser,
        description: 'USP / Ph. Eur. compendial specification detailing loss on drying, particle size distribution, bulk and tapped density, heavy metals, and infrared identification test.'
      },
      {
        filename: 'sample_sop_it_0005.pdf',
        docNum: 'SOP-IT-0005',
        title: 'Computerized System Validation (CSV) and Electronic Records Compliance (21 CFR Part 11)',
        version: '4.0',
        type: 'Standard Operating Procedure (SOP)',
        dept: 'Quality Assurance',
        product: 'DocuShield GxP Electronic DMS Platform',
        batch: 'N/A',
        loc: loc1,
        custodian: adminUser,
        description: 'Policies on system life cycle, GAMP 5 risk assessment, automated backup integrity, time-stamped audit trails, user account deprovisioning, and disaster recovery.'
      }
    ];

    const createdDocs = [];
    const now = new Date();

    for (let i = 0; i < sampleFiles.length; i++) {
      const item = sampleFiles[i];
      createSamplePdf(item.filename, item.title, item.docNum);

      // Distribute creation dates realistically over the last 6 months
      const monthsAgo = (i % 6);
      const creationDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 10 + (i * 2));

      const newDoc = new Document({
        documentNumber: item.docNum,
        title: item.title,
        version: item.version,
        documentType: item.type,
        department: item.dept,
        product: item.product,
        batchNumber: item.batch,
        effectiveDate: new Date('2026-01-10'),
        reviewDate: new Date('2027-01-10'),
        expiryDate: new Date('2031-01-10'),
        createdAt: creationDate,
        updatedAt: creationDate,
        status: DOCUMENT_STATUSES.EFFECTIVE,
        physicalStatus: PHYSICAL_STATUSES.STORED,
        preparedBy: 'Dr. Rajesh Patel',
        reviewedBy: 'Michael Chang',
        approvedBy: 'Dr. Sarah Jenkins',
        uploadedBy: adminUser._id,
        currentCustodian: item.custodian._id,
        storageLocation: item.loc._id,
        boxNumber: 'BX-01',
        fileNumber: `${item.docNum}-F1`,
        physicalCopiesCount: 2,
        fileUrl: `/uploads/${item.filename}`,
        fileName: item.filename,
        fileSize: 12450,
        fileMimeType: 'application/pdf',
        fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        tags: ['GxP', 'Validated', item.dept.replace(/\s+/g, ''), 'Regulatory-Ready'],
        folder: 'Controlled Procedures',
        description: item.description || `Official approved document for ${item.title}. Governed under 21 CFR Part 11.`,
        qrCodeData: `DOCUSHIELD:${item.docNum}`,
        legalHold: false,
        retentionYears: 7
      });

      const qr = await generateDocumentQR(item.docNum, newDoc._id);
      newDoc.qrCodeData = qr.payload;
      newDoc.qrCodeImage = qr.dataUrl;

      await newDoc.save();
      createdDocs.push(newDoc);

      // Increment occupancy
      await StorageLocation.findByIdAndUpdate(item.loc._id, { $inc: { currentOccupancy: 1 } });

      // Create Version 1.0 record
      await DocumentVersion.create({
        document: newDoc._id,
        version: item.version,
        fileUrl: newDoc.fileUrl,
        fileName: newDoc.fileName,
        fileSize: newDoc.fileSize,
        changesDescription: 'Initial effective baseline version',
        status: DOCUMENT_STATUSES.EFFECTIVE,
        uploadedBy: adminUser._id
      });
    }

    console.log('[Seed] Creating sample requests and approvals...');
    const req1 = await DocumentRequest.create({
      requestNumber: 'REQ-2026-0001',
      requestType: REQUEST_TYPES.PRINT,
      document: createdDocs[0]._id,
      requester: analystUser._id,
      department: 'Quality Control',
      reason: 'Physical copy needed for routine HPLC line qualification run in QC Lab 3',
      purpose: 'Operational Testing',
      urgency: 'Normal',
      copiesRequested: 1,
      status: REQUEST_STATUSES.PENDING
    });

    await Approval.create({
      request: req1._id,
      document: createdDocs[0]._id,
      type: 'Print Request',
      approver: qaUser._id,
      status: 'Pending',
      comments: 'Pending QA verification of controlled copy distribution quota'
    });

    const req2 = await DocumentRequest.create({
      requestNumber: 'REQ-2026-0002',
      requestType: REQUEST_TYPES.CHECKOUT,
      document: createdDocs[1]._id,
      requester: deptHeadUser._id,
      department: 'Production',
      reason: 'Physical batch record binder required on production floor for batch release packaging',
      purpose: 'Production Execution',
      urgency: 'Urgent',
      expectedReturnDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: REQUEST_STATUSES.APPROVED,
      approvedBy: qaUser._id,
      approvalDate: new Date()
    });

    await Approval.create({
      request: req2._id,
      document: createdDocs[1]._id,
      type: 'Checkout Request',
      approver: qaUser._id,
      status: 'Approved',
      comments: 'Approved for production batch execution. Expected return in 5 days.',
      electronicSignature: {
        signedBy: 'Michael Chang (EMP-QA-002)',
        signedAt: new Date(),
        meaning: 'I approve this record in compliance with 21 CFR Part 11 requirements.'
      },
      actionDate: new Date()
    });

    console.log('[Seed] Creating sample checkout records matching register...');
    const dayMs = 24 * 60 * 60 * 1000;

    // 1. SOP/IT/002 - Priya Nair, Issued: 23 Nov 2026, 16:34 by Anita Sharma, Due: 30 Nov 2026 (Due in 5d)
    const docIT = await Document.create({
      documentNumber: 'SOP/IT/002',
      title: 'User Access Management for Computerised Systems',
      version: '02',
      documentType: 'Standard Operating Procedure (SOP)',
      department: 'Quality Assurance',
      status: DOCUMENT_STATUSES.EFFECTIVE,
      physicalStatus: PHYSICAL_STATUSES.CHECKED_OUT,
      uploadedBy: adminUser._id,
      currentCustodian: adminUser._id,
      storageLocation: loc1._id,
      fileUrl: '/uploads/sample_sop_it_0005.pdf',
      fileName: 'SOP_IT_002.pdf',
      fileSize: 15400,
      fileMimeType: 'application/pdf',
      tags: ['GxP', 'Validated']
    });

    const docQC = await Document.create({
      documentNumber: 'SOP/QC/004',
      title: 'Operation and Calibration of HPLC',
      version: '03',
      documentType: 'Standard Operating Procedure (SOP)',
      department: 'Quality Control',
      status: DOCUMENT_STATUSES.EFFECTIVE,
      physicalStatus: PHYSICAL_STATUSES.CHECKED_OUT,
      uploadedBy: adminUser._id,
      currentCustodian: analystUser._id,
      storageLocation: loc5._id,
      fileUrl: '/uploads/sample_sop_qa_0042.pdf',
      fileName: 'SOP_QC_004.pdf',
      fileSize: 16200,
      fileMimeType: 'application/pdf',
      tags: ['GxP', 'Validated']
    });

    const docPRD = await Document.create({
      documentNumber: 'SOP/PRD/014',
      title: 'Operation of Tablet Compression Machine',
      version: '01',
      documentType: 'Standard Operating Procedure (SOP)',
      department: 'Production',
      status: DOCUMENT_STATUSES.EFFECTIVE,
      physicalStatus: PHYSICAL_STATUSES.CHECKED_OUT,
      uploadedBy: adminUser._id,
      currentCustodian: deptHeadUser._id,
      storageLocation: loc3._id,
      fileUrl: '/uploads/sample_bmr_tb_2024.pdf',
      fileName: 'SOP_PRD_014.pdf',
      fileSize: 14200,
      fileMimeType: 'application/pdf',
      tags: ['GxP', 'Validated']
    });

    const docBMR = await Document.create({
      documentNumber: 'BMR/PRD/500/26A004',
      title: 'Batch Manufacturing Record - Paracetamol 500mg Tablets - Batch 26A004',
      version: '01',
      documentType: 'Batch Manufacturing Record (BMR)',
      department: 'Production',
      status: DOCUMENT_STATUSES.EFFECTIVE,
      physicalStatus: PHYSICAL_STATUSES.CHECKED_OUT,
      uploadedBy: adminUser._id,
      currentCustodian: deptHeadUser._id,
      storageLocation: loc3._id,
      fileUrl: '/uploads/sample_bmr_tb_2024.pdf',
      fileName: 'BMR_PRD_500_26A004.pdf',
      fileSize: 22100,
      fileMimeType: 'application/pdf',
      tags: ['GxP', 'Validated']
    });

    const docQA01 = await Document.create({
      documentNumber: 'SOP/QA/001',
      title: 'Document Lifecycle Management and SOP Archival',
      version: '04',
      documentType: 'Standard Operating Procedure (SOP)',
      department: 'Quality Assurance',
      status: DOCUMENT_STATUSES.EFFECTIVE,
      physicalStatus: PHYSICAL_STATUSES.STORED,
      uploadedBy: adminUser._id,
      currentCustodian: qaUser._id,
      storageLocation: loc1._id,
      fileUrl: '/uploads/sample_sop_qa_0018.pdf',
      fileName: 'SOP_QA_001.pdf',
      fileSize: 19500,
      fileMimeType: 'application/pdf',
      tags: ['GxP', 'Validated']
    });

    const docVAL01 = await Document.create({
      documentNumber: 'VAL/IT/2026/01',
      title: 'ERP Computer System Validation Master Plan',
      version: '01',
      documentType: 'Validation Protocol / Report',
      department: 'Quality Assurance',
      status: DOCUMENT_STATUSES.EFFECTIVE,
      physicalStatus: PHYSICAL_STATUSES.STORED,
      uploadedBy: adminUser._id,
      currentCustodian: adminUser._id,
      storageLocation: loc1._id,
      fileUrl: '/uploads/sample_val_pr_0045.pdf',
      fileName: 'VAL_IT_2026_01.pdf',
      fileSize: 24500,
      fileMimeType: 'application/pdf',
      tags: ['GxP', 'Validated']
    });

    await CheckoutRecord.create([
      {
        checkoutNumber: 'CHK-2026-0001',
        document: docIT._id,
        user: analystUser._id, // Priya Nair
        department: 'Quality Control',
        purpose: 'Handover HO-0006: na',
        checkoutDate: new Date('2026-11-23T16:34:00.000Z'),
        expectedReturnDate: new Date(now.getTime() + 5 * dayMs),
        status: 'Active',
        approvedBy: adminUser._id,
        conditionOnCheckout: 'Good'
      },
      {
        checkoutNumber: 'CHK-2026-0002',
        document: docQC._id,
        user: viewerUser._id, // Amit Kumar
        department: 'Operations & R&D',
        purpose: 'HPLC calibration activity',
        checkoutDate: new Date('2026-11-19T16:14:00.000Z'),
        expectedReturnDate: new Date(now.getTime() - 2 * dayMs),
        status: 'Active',
        approvedBy: docCtrlUser._id,
        conditionOnCheckout: 'Good'
      },
      {
        checkoutNumber: 'CHK-2026-0003',
        document: docPRD._id,
        user: deptHeadUser._id, // Rahul Verma
        department: 'Production',
        purpose: 'Shop-floor reference during compression training',
        checkoutDate: new Date('2026-11-18T16:14:00.000Z'),
        expectedReturnDate: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Today
        status: 'Active',
        approvedBy: docCtrlUser._id,
        conditionOnCheckout: 'Good'
      },
      {
        checkoutNumber: 'CHK-2026-0004',
        document: docBMR._id,
        user: deptHeadUser._id, // Rahul Verma
        department: 'Production',
        purpose: 'Batch record review for APQR',
        checkoutDate: new Date('2026-11-09T16:14:00.000Z'),
        expectedReturnDate: new Date(now.getTime() - 9 * dayMs),
        status: 'Active',
        approvedBy: docCtrlUser._id,
        conditionOnCheckout: 'Good'
      },
      {
        checkoutNumber: 'CHK-2026-0005',
        document: docQA01._id,
        user: analystUser._id, // Priya Nair
        department: 'Quality Control',
        purpose: 'Annual internal compliance audit verification',
        checkoutDate: new Date('2026-11-01T10:00:00.000Z'),
        expectedReturnDate: new Date('2026-11-08T18:00:00.000Z'),
        actualReturnDate: new Date('2026-11-07T15:30:00.000Z'),
        status: 'Returned',
        approvedBy: adminUser._id,
        returnVerifiedBy: docCtrlUser._id,
        conditionOnCheckout: 'Good',
        conditionOnReturn: 'Good',
        remarks: 'Verified bin QR return scan. Physical binder spine intact.'
      },
      {
        checkoutNumber: 'CHK-2026-0006',
        document: docVAL01._id,
        user: viewerUser._id, // Amit Kumar
        department: 'Operations & R&D',
        purpose: 'Software qualification protocol execution',
        checkoutDate: new Date('2026-11-05T11:20:00.000Z'),
        expectedReturnDate: new Date('2026-11-12T18:00:00.000Z'),
        actualReturnDate: new Date('2026-11-11T14:15:00.000Z'),
        status: 'Returned',
        approvedBy: docCtrlUser._id,
        returnVerifiedBy: docCtrlUser._id,
        conditionOnCheckout: 'Good',
        conditionOnReturn: 'Good',
        remarks: 'Returned to IT archival cabinet.'
      }
    ]);

    console.log('[Seed] Creating sample custody handover...');
    await Handover.create({
      handoverNumber: 'HND-2026-0001',
      documents: [createdDocs[2]._id],
      previousCustodian: qaUser._id,
      newCustodian: docCtrlUser._id,
      initiatedBy: qaUser._id,
      reason: 'Custody transfer for annual archiving and microfiche scanning',
      remarks: 'Binder inspected and intact',
      status: 'Pending Acceptance'
    });

    console.log('[Seed] Creating sample physical inventory audit...');
    await PhysicalAudit.create({
      auditNumber: 'AUD-2026-0001',
      title: 'Q1 2026 Central Archive Vault 1 Physical Inventory Reconciliation',
      scheduledDate: new Date(),
      conductedDate: null,
      auditor: qaUser._id,
      storageLocation: loc1._id,
      status: 'In Progress',
      summary: {
        expectedCount: 1,
        foundCount: 1,
        missingCount: 0,
        misplacedCount: 0
      },
      items: [
        {
          document: createdDocs[2]._id,
          expectedLocation: loc1.code,
          actualLocation: loc1.code,
          status: 'Found',
          qrVerified: true,
          condition: 'Good',
          notes: 'QR scanned and confirmed. Spine label intact.'
        }
      ],
      findings: 'Initial sample audit in progress. Rack 01 conforms with records.'
    });

    console.log('[Seed] Creating sample notifications...');
    await Notification.create([
      {
        recipient: qaUser._id,
        title: 'New Print Request REQ-2026-0001',
        message: 'Emily Davis requested 1 controlled print copy of SOP-QA-0042.',
        type: 'info',
        link: '/workflow/approvals'
      },
      {
        recipient: docCtrlUser._id,
        title: 'Pending Custody Handover HND-2026-0001',
        message: 'Michael Chang transferred custody of SOP-PR-0105 to you.',
        type: 'warning',
        link: '/physical/custody'
      },
      {
        recipient: adminUser._id,
        title: 'System Initialized in GxP Compliance Mode',
        message: 'DocuShield repository successfully initialized and seeded with 21 CFR Part 11 audit logging enabled.',
        type: 'success',
        link: '/workspace/dashboard'
      }
    ]);

    console.log('[Seed] Creating initial GxP Audit Logs...');
    await AuditLog.create([
      {
        userName: adminUser.name,
        userRole: adminUser.role,
        action: AUDIT_ACTIONS.LOGIN,
        entity: 'Authentication',
        entityId: String(adminUser._id),
        details: `User ${adminUser.name} logged in with Administrative privileges.`,
        ipAddress: '127.0.0.1',
        timestamp: new Date(Date.now() - 3600 * 1000)
      },
      {
        userName: adminUser.name,
        userRole: adminUser.role,
        action: AUDIT_ACTIONS.UPLOAD,
        entity: 'Document',
        entityId: String(createdDocs[0]._id),
        details: `Ingested GxP Document SOP-QA-0042 into repository at ${loc5.code}.`,
        ipAddress: '127.0.0.1',
        timestamp: new Date(Date.now() - 3000 * 1000)
      },
      {
        userName: qaUser.name,
        userRole: qaUser.role,
        action: AUDIT_ACTIONS.APPROVE,
        entity: 'Approval',
        entityId: String(createdDocs[1]._id),
        details: 'Approved physical checkout request CHK-2026-0001 under 21 CFR Part 11.',
        ipAddress: '127.0.0.1',
        timestamp: new Date(Date.now() - 1500 * 1000)
      }
    ]);

    console.log('[Seed] Database seeding successfully completed!');
    console.log('Demo Login Credentials (6 Quick Sign-In Users):');
    console.log('1. Anita Sharma (Admin): anita.sharma@docushield.com / DocuShield@2026');
    console.log('2. Dr. Meera Iyer (QA Manager): meera.iyer@docushield.com / DocuShield@2026');
    console.log('3. Suresh Patil (Document Controller): suresh.patil@docushield.com / DocuShield@2026');
    console.log('4. Rahul Verma (Custodian): rahul.verma@docushield.com / DocuShield@2026');
    console.log('5. Priya Nair (Custodian): priya.nair@docushield.com / DocuShield@2026');
    console.log('6. Amit Kumar (User / Viewer): amit.kumar@docushield.com / DocuShield@2026');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase();
}

