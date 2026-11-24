import mongoose from 'mongoose';
import StorageLocation from '../models/StorageLocation.js';
import Document from '../models/Document.js';
import User from '../models/User.js';

export const seedFullStorage = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/docushield';
    console.log(`[StorageSync] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const adminUser = await User.findOne({ email: 'admin@docushield.com' }) || await User.findOne();
    const qaUser = await User.findOne({ email: 'qa@docushield.com' }) || adminUser;
    const deptHeadUser = await User.findOne({ email: 'depthead@docushield.com' }) || adminUser;

    console.log('[StorageSync] Ensuring all 40 physical storage location bins exist in MongoDB...');

    // Facility Definition for 100% Dynamic Synchronization:
    const gridLayout = [
      // Plant-1 -> Production Document Room
      {
        building: 'Plant-1',
        area: 'Production Document Room',
        room: '101',
        rack: 'R-01',
        department: 'Production',
        prefix: 'PLT-1/PRD/R101/RK-R01',
        capacity: 25,
        bins: [
          { bin: 'B01', targetDocs: 14 },
          { bin: 'B02', targetDocs: 23, isRebalance: true },
          { bin: 'B03', targetDocs: 9 },
          { bin: 'B04', targetDocs: 13 },
          { bin: 'B05', targetDocs: 10 },
          { bin: 'B06', targetDocs: 13 },
          { bin: 'B07', targetDocs: 5 },
          { bin: 'B08', targetDocs: 6 }
        ]
      },
      {
        building: 'Plant-1',
        area: 'Production Document Room',
        room: '102',
        rack: 'R-02',
        department: 'Engineering',
        prefix: 'PLT-1/ENG/R102/RK-R02',
        capacity: 25,
        bins: [
          { bin: 'B01', targetDocs: 11 },
          { bin: 'B02', targetDocs: 13 },
          { bin: 'B03', targetDocs: 6 },
          { bin: 'B04', targetDocs: 13 },
          { bin: 'B05', targetDocs: 11 },
          { bin: 'B06', targetDocs: 5 },
          { bin: 'B07', targetDocs: 9 },
          { bin: 'B08', targetDocs: 10 }
        ]
      },
      // Plant-1 -> QC Lab Records (Restricted)
      {
        building: 'Plant-1',
        area: 'QC Lab Records',
        room: '201',
        rack: 'R-01',
        department: 'Quality Control',
        prefix: 'PLT-1/QC/R201/RK-R01',
        capacity: 25,
        bins: [
          { bin: 'B01', targetDocs: 11 },
          { bin: 'B02', targetDocs: 9 },
          { bin: 'B03', targetDocs: 15 },
          { bin: 'B04', targetDocs: 7 },
          { bin: 'B05', targetDocs: 7 },
          { bin: 'B06', targetDocs: 10 },
          { bin: 'B07', targetDocs: 15 },
          { bin: 'B08', targetDocs: 0 }
        ]
      },
      // Plant-2 -> Archive Room
      {
        building: 'Plant-2',
        area: 'Archive Room',
        room: '301',
        rack: 'R-01',
        department: 'Quality Assurance',
        prefix: 'PLT-2/QA/R301/RK-R01',
        capacity: 25,
        bins: [
          { bin: 'B01', targetDocs: 12 },
          { bin: 'B02', targetDocs: 12 },
          { bin: 'B03', targetDocs: 5 },
          { bin: 'B04', targetDocs: 4 },
          { bin: 'B05', targetDocs: 7 },
          { bin: 'B06', targetDocs: 0 },
          { bin: 'B07', targetDocs: 0 },
          { bin: 'B08', targetDocs: 0 }
        ]
      },
      {
        building: 'Plant-2',
        area: 'Archive Room',
        room: '302',
        rack: 'R-03',
        department: 'Production Archive',
        prefix: 'PLT-2/PRD/R302/RK-R03',
        capacity: 40,
        bins: [
          { bin: 'B01', targetDocs: 39, isRebalance: true },
          { bin: 'B02', targetDocs: 13 },
          { bin: 'B03', targetDocs: 8 },
          { bin: 'B04', targetDocs: 7 },
          { bin: 'B05', targetDocs: 4 },
          { bin: 'B06', targetDocs: 0 },
          { bin: 'B07', targetDocs: 0 },
          { bin: 'B08', targetDocs: 7 }
        ]
      }
    ];

    const createdLocations = {};

    for (const group of gridLayout) {
      for (const b of group.bins) {
        const code = `${group.prefix}/SH-01/BIN-${b.bin}`;
        let loc = await StorageLocation.findOne({ code });
        if (!loc) {
          loc = await StorageLocation.create({
            building: group.building,
            area: group.area,
            room: group.room,
            rack: group.rack,
            shelf: '01',
            bin: b.bin,
            box: 'BX-01',
            code,
            capacity: group.capacity,
            currentOccupancy: 0,
            department: group.department,
            status: 'Available',
            remarks: `${group.area} - Rack ${group.rack} Bin ${b.bin}`
          });
        }
        createdLocations[code] = loc;
      }
    }

    console.log(`[StorageSync] Storage locations in collection: ${await StorageLocation.countDocuments()}`);

    // Map existing documents to their primary locations
    const existingDocs = await Document.find();
    console.log(`[StorageSync] Re-mapping ${existingDocs.length} existing documents to active plant coordinates...`);

    const p1PrdBin1 = createdLocations['PLT-1/PRD/R101/RK-R01/SH-01/BIN-B01'];
    const p1PrdBin2 = createdLocations['PLT-1/PRD/R101/RK-R01/SH-01/BIN-B02'];
    const p1QcBin1 = createdLocations['PLT-1/QC/R201/RK-R01/SH-01/BIN-B01'];
    const p2QaBin1 = createdLocations['PLT-2/QA/R301/RK-R01/SH-01/BIN-B01'];
    const p2QaBin2 = createdLocations['PLT-2/QA/R301/RK-R01/SH-01/BIN-B02'];
    const p2PrdBin1 = createdLocations['PLT-2/PRD/R302/RK-R03/SH-01/BIN-B01'];

    for (const doc of existingDocs) {
      if (doc.documentNumber === 'SOP-QA-0042') doc.storageLocation = p1QcBin1?._id || doc.storageLocation;
      else if (doc.documentNumber === 'BMR-TB-2024') doc.storageLocation = p1PrdBin1?._id || doc.storageLocation;
      else if (doc.documentNumber === 'SOP-PR-0105') doc.storageLocation = p2QaBin1?._id || doc.storageLocation;
      else if (doc.documentNumber === 'VAL-PR-0012') doc.storageLocation = p1PrdBin2?._id || doc.storageLocation;
      else if (doc.documentNumber === 'SPEC-QC-0089') doc.storageLocation = p1QcBin1?._id || doc.storageLocation;
      else if (doc.documentNumber === 'SOP-QA-1862') doc.storageLocation = p2QaBin2?._id || doc.storageLocation;
      else if (doc.documentNumber === 'SOP-CLN-402') doc.storageLocation = p1PrdBin2?._id || doc.storageLocation;
      await doc.save();
    }

    // Populate additional realistic documents for high-occupancy rebalance demonstration in MongoDB
    // 1. Plant-1 Bin B02 (23 documents = 92% occupancy)
    const b02Current = await Document.countDocuments({ storageLocation: p1PrdBin2?._id });
    if (b02Current < 23 && p1PrdBin2) {
      console.log(`[StorageSync] Adding documents to Bin B02 in MongoDB to reach 23 docs (current: ${b02Current})...`);
      const needed = 23 - b02Current;
      for (let i = 1; i <= needed; i++) {
        const num = `SOP-PRD-${String(100 + i).padStart(3, '0')}`;
        const exists = await Document.findOne({ documentNumber: num });
        if (!exists) {
          await Document.create({
            documentNumber: num,
            title: `Standard Operating Procedure for Production Processing Module ${i}`,
            version: '1.0',
            documentType: 'Standard Operating Procedure (SOP)',
            department: 'Production',
            product: 'Multi-Product Formulation',
            batchNumber: `BTH-PRD-${202600 + i}`,
            storageLocation: p1PrdBin2._id,
            uploadedBy: adminUser._id,
            currentCustodian: deptHeadUser._id,
            status: 'Effective',
            physicalStatus: 'Stored',
            fileUrl: '/uploads/sample_sop_pr_0105.pdf',
            fileName: 'sample_sop_pr_0105.pdf',
            fileSize: 15420,
            fileHash: `hash_prd_${i}_sample`,
            boxNumber: 'BX-01',
            fileNumber: `F${i}`,
            qrCodeData: JSON.stringify({ documentNumber: num, hash: `hash_prd_${i}_sample` }),
            effectiveDate: new Date('2026-01-15'),
            reviewDate: new Date('2027-01-15'),
            expiryDate: new Date('2029-01-15')
          });
        }
      }
    }

    // 2. Plant-2 Rack R-03 Bin B01 (39 documents = 98% occupancy)
    const p2B01Current = await Document.countDocuments({ storageLocation: p2PrdBin1?._id });
    if (p2B01Current < 39 && p2PrdBin1) {
      console.log(`[StorageSync] Adding documents to Plant-2 Bin B01 in MongoDB to reach 39 docs (current: ${p2B01Current})...`);
      const needed = 39 - p2B01Current;
      for (let i = 1; i <= needed; i++) {
        const num = `BMR-PRD500-${String(200 + i).padStart(3, '0')}`;
        const exists = await Document.findOne({ documentNumber: num });
        if (!exists) {
          await Document.create({
            documentNumber: num,
            title: `Batch Manufacturing Record for Solid Dosage Product Run #${i}`,
            version: '1.0',
            documentType: 'Batch Manufacturing Record (BMR)',
            department: 'Production',
            product: 'Paracetamol 500mg Batch Archive',
            batchNumber: `BTH-ARC-${202600 + i}`,
            storageLocation: p2PrdBin1._id,
            uploadedBy: adminUser._id,
            currentCustodian: deptHeadUser._id,
            status: 'Effective',
            physicalStatus: 'Stored',
            fileUrl: '/uploads/sample_bmr_tb_2024.pdf',
            fileName: 'sample_bmr_tb_2024.pdf',
            fileSize: 18230,
            fileHash: `hash_bmr_arc_${i}`,
            boxNumber: 'BX-02',
            fileNumber: `F${i}`,
            qrCodeData: JSON.stringify({ documentNumber: num, hash: `hash_bmr_arc_${i}` }),
            effectiveDate: new Date('2026-01-15'),
            reviewDate: new Date('2027-01-15'),
            expiryDate: new Date('2029-01-15')
          });
        }
      }
    }

    // Synchronize all storage locations with real-time Document counts
    const counts = await Document.aggregate([
      { $group: { _id: '$storageLocation', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => {
      if (c._id) countMap[String(c._id)] = c.count;
    });

    const allLocations = await StorageLocation.find();
    for (const loc of allLocations) {
      const realCount = countMap[String(loc._id)] || 0;
      loc.currentOccupancy = realCount;
      if (realCount >= loc.capacity) loc.status = 'Full';
      else if (realCount >= loc.capacity * 0.8) loc.status = 'Near Full';
      else loc.status = 'Available';
      await loc.save();
    }

    console.log('[StorageSync] All storage location occupancies successfully synchronized with MongoDB documents.');
    const totalDocs = await Document.countDocuments();
    console.log(`[StorageSync] Final MongoDB state: ${allLocations.length} locations, ${totalDocs} documents.`);
    process.exit(0);
  } catch (error) {
    console.error('[StorageSync] Error:', error);
    process.exit(1);
  }
};

seedFullStorage();
