import StorageLocation from '../models/StorageLocation.js';

export const recommendStorageLocation = async ({ department = '', documentType = '', product = '' }) => {
  try {
    // 1. Search for available location matching department
    let query = {
      status: { $in: ['Available', 'Near Full'] }
    };

    if (department) {
      query.department = new RegExp(department, 'i');
    }

    let candidates = await StorageLocation.find(query).sort({ currentOccupancy: 1 });

    // Fallback to any available location if none found for specific department
    if (!candidates || candidates.length === 0) {
      candidates = await StorageLocation.find({
        status: { $in: ['Available', 'Near Full'] }
      }).sort({ currentOccupancy: 1 });
    }

    if (!candidates || candidates.length === 0) {
      return null;
    }

    // Pick top candidate with lowest occupancy percentage
    const best = candidates[0];
    const occupancyPercent = Math.round((best.currentOccupancy / best.capacity) * 100);

    let reason = `Recommended because Building ${best.building} (${best.area}) is designated for ${best.department || 'GxP Records'} with ${best.capacity - best.currentOccupancy} available slots (${occupancyPercent}% utilized).`;

    if (documentType.includes('BMR') || documentType.includes('Batch')) {
      reason += ' Optimized for high-security Batch Production record archiving.';
    } else if (documentType.includes('SOP')) {
      reason += ' Ideal for active Controlled Copy SOP binders with immediate retrieval access.';
    }

    return {
      locationId: best._id,
      building: best.building,
      area: best.area,
      room: best.room,
      rack: best.rack,
      shelf: best.shelf,
      bin: best.bin,
      box: best.box || 'BX-01',
      code: best.code,
      capacity: best.capacity,
      currentOccupancy: best.currentOccupancy,
      occupancyPercentage: occupancyPercent,
      department: best.department,
      reason
    };
  } catch (error) {
    console.error('[Storage Recommendation Error]', error.message);
    return null;
  }
};

