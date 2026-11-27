import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
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

import { ROLES } from '../constants/index.js';

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
      // {
      //   name: 'Amit Kumar',
      //   email: 'amit.kumar@docushield.com',
      //   password: demoPassword,
      //   role: ROLES.EMPLOYEE,
      //   department: 'Operations & R&D',
      //   employeeId: 'EMP-USR-006',
      //   designation: 'Manufacturing Associate',
      //   phone: '+91 98201 10006'
      // },
      // Convenience aliases for legacy credentials
      // {
      //   name: 'Anita Sharma (Admin Alias)',
      //   email: 'admin@docushield.com',
      //   password: demoPassword,
      //   role: ROLES.ADMIN,
      //   department: 'Executive Administration',
      //   employeeId: 'EMP-ADM-ALIAS',
      //   designation: 'System Administrator',
      //   phone: '+91 98201 10001'
      // },
      // {
      //   name: 'Dr. Meera Iyer (QA Alias)',
      //   email: 'qa@docushield.com',
      //   password: demoPassword,
      //   role: ROLES.QA_MANAGER,
      //   department: 'Quality Assurance',
      //   employeeId: 'EMP-QA-ALIAS',
      //   designation: 'Head of QA',
      //   phone: '+91 98201 10002'
      // },
      // {
      //   name: 'Suresh Patil (DC Alias)',
      //   email: 'doccontrol@docushield.com',
      //   password: demoPassword,
      //   role: ROLES.DOCUMENT_CONTROLLER,
      //   department: 'Document Control',
      //   employeeId: 'EMP-DC-ALIAS',
      //   designation: 'Document Controller',
      //   phone: '+91 98201 10003'
      // }
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

    console.log(`[Seed] Database seeded cleanly with ${users.length} users, ${departments.length} departments, ${docTypes.length} document types, and ${locations.length} storage locations (no sample documents).`);

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

