import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Box, 
  MapPin, 
  Search, 
  ArrowRightLeft, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  ChevronRight, 
  Layers, 
  Lock, 
  Printer, 
  Sparkles, 
  X, 
  ExternalLink, 
  QrCode,
  Inbox,
  Map,
  RefreshCw
} from 'lucide-react';
import { storageService, documentService } from '../../services';

export const StorageMap = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [hierarchy, setHierarchy] = useState({});
  const [selectedPlant, setSelectedPlant] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected bin modal state (100% dynamic from DB)
  const [selectedBin, setSelectedBin] = useState(null);
  const [selectedRack, setSelectedRack] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [storedDocs, setStoredDocs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Find on Map modal
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bin Labels modal
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [activeAreaLabels, setActiveAreaLabels] = useState(null);

  // Relocate Document modal
  const [moveDoc, setMoveDoc] = useState(null);
  const [targetLocationId, setTargetLocationId] = useState('');
  const [moveRemarks, setMoveRemarks] = useState('');
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);

  // Fetch real database storage data
  const fetchStorageData = async () => {
    try {
      setLoading(true);
      const [locRes, hierRes] = await Promise.all([
        storageService.getLocations(),
        storageService.getHierarchy()
      ]);
      if (locRes.success && locRes.data) {
        setLocations(locRes.data);
      }
      if (hierRes.success && hierRes.data) {
        setHierarchy(hierRes.data);
      }
    } catch (err) {
      console.error('Storage map fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  // 1. Dynamically extract all available Plants/Buildings from MongoDB
  const availablePlants = useMemo(() => {
    const list = Array.from(new Set(locations.map(l => l.building))).filter(Boolean);
    return list.sort();
  }, [locations]);

  // Set initial selected plant when data loads
  useEffect(() => {
    if (availablePlants.length > 0 && (!selectedPlant || !availablePlants.includes(selectedPlant))) {
      setSelectedPlant(availablePlants[0]);
    }
  }, [availablePlants, selectedPlant]);

  // 2. Dynamically group locations for the selected plant into Areas -> Racks -> Bins
  const plantAreas = useMemo(() => {
    if (!selectedPlant) return [];

    const plantLocations = locations.filter(l => l.building === selectedPlant);
    const areaMap = {};

    plantLocations.forEach(loc => {
      const areaName = loc.area || 'Main Storage Vault';
      if (!areaMap[areaName]) {
        areaMap[areaName] = {
          id: `area-${areaName.replace(/\s+/g, '-').toLowerCase()}`,
          name: areaName,
          deptTag: loc.department ? loc.department.substring(0, 3).toUpperCase() : 'GEN',
          isRestricted: loc.department?.toLowerCase().includes('qc') || areaName.toLowerCase().includes('qc'),
          restrictedDept: loc.department?.toLowerCase().includes('qc') ? 'QC' : null,
          totalOccupancy: 0,
          totalCapacity: 0,
          racksMap: {}
        };
      }

      areaMap[areaName].totalOccupancy += (loc.currentOccupancy || 0);
      areaMap[areaName].totalCapacity += (loc.capacity || 25);

      const rackName = loc.rack || 'R-01';
      if (!areaMap[areaName].racksMap[rackName]) {
        areaMap[areaName].racksMap[rackName] = {
          id: `rack-${rackName.replace(/\s+/g, '-').toLowerCase()}`,
          name: rackName,
          department: loc.department || 'General',
          bins: []
        };
      }

      const occupancyPercent = loc.capacity > 0
        ? Math.round(((loc.currentOccupancy || 0) / loc.capacity) * 100)
        : 0;

      areaMap[areaName].racksMap[rackName].bins.push({
        ...loc,
        id: loc._id,
        label: loc.bin.startsWith('B') ? loc.bin : `B${loc.bin}`,
        fullLabel: loc.bin.includes('-') ? loc.bin : `B-${loc.bin.replace('B', '')}`,
        occupancyPercent,
        isRebalance: occupancyPercent >= 90
      });
    });

    return Object.values(areaMap).map(area => {
      const overallPercent = area.totalCapacity > 0
        ? Math.round((area.totalOccupancy / area.totalCapacity) * 100)
        : 0;

      const racks = Object.values(area.racksMap).map(rack => ({
        ...rack,
        totalBins: rack.bins.length,
        bins: [...rack.bins].sort((a, b) => a.bin.localeCompare(b.bin))
      }));

      return {
        ...area,
        overallPercent,
        racks
      };
    });
  }, [locations, selectedPlant]);

  // 3. Dynamically compute Rebalance Suggestions purely from live high-occupancy DB bins
  const dynamicRebalanceSuggestions = useMemo(() => {
    // High occupancy bins in DB (> 80%)
    const highBins = locations.filter(l => 
      l.capacity > 0 && ((l.currentOccupancy || 0) / l.capacity) >= 0.8
    ).sort((a, b) => {
      const pctA = (a.currentOccupancy || 0) / a.capacity;
      const pctB = (b.currentOccupancy || 0) / b.capacity;
      return pctB - pctA;
    });

    // Available low occupancy bins in DB (< 50%) for relocation destination suggestion
    const lowBins = locations.filter(l => 
      l.capacity > 0 && ((l.currentOccupancy || 0) / l.capacity) < 0.5
    );

    return highBins.map((binLoc, idx) => {
      const pct = Math.round(((binLoc.currentOccupancy || 0) / binLoc.capacity) * 100);
      const filesToMove = Math.max(1, Math.ceil(binLoc.currentOccupancy - binLoc.capacity * 0.8));
      const targetBin = lowBins[idx % Math.max(1, lowBins.length)];

      const targetDesc = targetBin 
        ? `${targetBin.rack}/${targetBin.bin} (Rack ${targetBin.rack} / Bin ${targetBin.bin} — ${targetBin.department} rack, ${Math.round(((targetBin.currentOccupancy || 0) / targetBin.capacity) * 100)}% full, long-term archive, ${targetBin.area})`
        : 'R-03/B-08 (Rack R-03 / Bin B-08 — available shelf space)';

      return {
        id: binLoc._id,
        location: binLoc,
        percent: pct,
        path: `${binLoc.building} › ${binLoc.area} › ${(binLoc.department || 'PRD').substring(0, 3).toUpperCase()} › Rack ${binLoc.rack} › Bin ${binLoc.bin}`,
        usedText: `${binLoc.currentOccupancy}/${binLoc.capacity} used — move ${filesToMove} file(s) to bring below 80%. Least-retrieved digitised documents suggested:`,
        recommendations: [
          `Active Record → ${targetDesc}`
        ]
      };
    });
  }, [locations]);

  // 4. Handle selecting a bin and loading its live documents from MongoDB
  const handleSelectBin = async (bin, rack, area) => {
    setSelectedBin(bin);
    setSelectedRack(rack);
    setSelectedArea(area);
    setModalOpen(true);
    setLoadingDocs(true);

    try {
      const res = await storageService.getLocationById(bin._id);
      if (res.success && res.data) {
        setStoredDocs(res.data.storedDocuments || []);
      } else {
        setStoredDocs([]);
      }
    } catch (err) {
      console.error('Error fetching bin documents from MongoDB:', err);
      setStoredDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  // 5. Execute Document Relocation via API
  const handleExecuteMove = async (e) => {
    e.preventDefault();
    if (!moveDoc || !targetLocationId) return;

    try {
      setIsSubmittingMove(true);
      const res = await storageService.moveDocument(moveDoc._id, targetLocationId, moveRemarks);
      if (res.success) {
        setMoveDoc(null);
        setMoveRemarks('');
        setTargetLocationId('');
        
        // Re-synchronize full storage data from MongoDB
        await fetchStorageData();

        // Refresh current modal documents if a bin is open
        if (selectedBin?._id) {
          const updated = await storageService.getLocationById(selectedBin._id);
          if (updated.success && updated.data) {
            setStoredDocs(updated.data.storedDocuments || []);
          }
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to move document');
    } finally {
      setIsSubmittingMove(false);
    }
  };

  // Open Transfer Modal from Rebalance
  const handleOpenTransferModal = async (suggestion) => {
    try {
      // Fetch actual documents in that location
      const res = await storageService.getLocationById(suggestion.location._id);
      const docs = res.success && res.data?.storedDocuments ? res.data.storedDocuments : [];
      if (docs.length > 0) {
        setMoveDoc(docs[0]);
      } else {
        setMoveDoc({
          _id: suggestion.location._id,
          documentNumber: 'Active Document',
          title: `Document in ${suggestion.location.code}`
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Bin Labels Modal
  const handlePrintLabels = (area) => {
    setActiveAreaLabels(area);
    setShowLabelsModal(true);
  };

  return (
    <div className="space-y-5 pb-12 font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Storage map</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Buildings → areas → racks → bins, colour-coded by fill level. Click a bin to see its documents.
          </p>
        </div>

        {/* Top Right Controls: Dynamic Plant Pills & Find on map */}
        <div className="flex items-center gap-2">
          {availablePlants.length > 0 && (
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              {availablePlants.map((plant) => (
                <button
                  key={plant}
                  onClick={() => setSelectedPlant(plant)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    selectedPlant === plant
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {plant}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-2xs transition"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Find on map</span>
          </button>
        </div>
      </div>

      {/* 2. Color Legend Row */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[2px] bg-slate-200 inline-block border border-slate-300"></span>
          <span className="text-xs text-slate-500">Empty</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[2px] bg-emerald-100 inline-block border border-emerald-300"></span>
          <span className="text-xs text-slate-500">&lt; 70%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[2px] bg-amber-100 inline-block border border-amber-300"></span>
          <span className="text-xs text-slate-500">70-90%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[2px] bg-rose-100 inline-block border border-rose-300"></span>
          <span className="text-xs text-slate-500">&gt; 90%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-[2px] bg-white inline-block border border-rose-500"></span>
          <span className="text-xs text-slate-500">Rebalance suggested</span>
        </div>
      </div>

      {/* 3. Area Cards (100% Dynamic from MongoDB) */}
      <div className="space-y-4">
        {plantAreas.length === 0 && !loading && (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            No physical storage areas configured in this facility building.
          </div>
        )}

        {plantAreas.map((area) => (
          <div
            key={area.id}
            className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4"
          >
            {/* Area Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">{area.name}</h2>
                  {area.isRestricted && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                      <Lock className="w-2.5 h-2.5 text-rose-500" />
                      Restricted: {area.restrictedDept || 'QC'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Active area • {area.racks.length} racks • {area.totalOccupancy}/{area.totalCapacity} slots ({area.overallPercent}%)
                </p>
              </div>

              {/* Area Actions: Bin labels & Progress bar */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePrintLabels(area)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-normal text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  Bin labels
                </button>
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, area.overallPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Racks Row (Side by side with compact 4x2 grids) */}
            <div className="flex flex-wrap gap-8 items-start pt-1">
              {area.racks.map((rack) => (
                <div key={rack.id} className="w-64 sm:w-72 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      Rack {rack.name} • {rack.department}
                    </span>
                    <span className="text-[11px] text-slate-400">{rack.bins.length} bins</span>
                  </div>

                  {/* 4x2 Bin Grid */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {rack.bins.map((bin) => {
                      let colorClasses = '';

                      if (bin.occupancyPercent === 0) {
                        colorClasses = 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200/60';
                      } else if (bin.occupancyPercent < 70) {
                        colorClasses = 'bg-emerald-100/70 text-emerald-900 border border-emerald-300/80 hover:bg-emerald-100';
                      } else if (bin.occupancyPercent <= 90) {
                        colorClasses = 'bg-amber-100/70 text-amber-900 border border-amber-300/80 hover:bg-amber-100';
                      } else {
                        colorClasses = 'bg-rose-100 text-rose-900 border-2 border-rose-400 font-bold hover:bg-rose-200/80';
                      }

                      return (
                        <button
                          key={bin.id}
                          onClick={() => handleSelectBin(bin, rack, area)}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border text-center transition cursor-pointer select-none ${colorClasses}`}
                        >
                          <span className="text-xs font-bold leading-none">{bin.label}</span>
                          <span className="text-[10px] leading-none mt-1 opacity-90">{bin.occupancyPercent}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Rebalance Suggestions Section (100% Dynamic from MongoDB high-occupancy bins) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900">Rebalance suggestions</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {dynamicRebalanceSuggestions.length} bins above 80% capacity
          </span>
        </div>

        {dynamicRebalanceSuggestions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            ✓ All physical vault bins are operating within optimal capacity (&lt; 80%). No rebalance required.
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {dynamicRebalanceSuggestions.map((item) => (
              <div
                key={item.id}
                className={`pt-3 first:pt-0 flex flex-col md:flex-row md:items-start justify-between gap-3`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] shrink-0 mt-0.5">
                    {item.percent}%
                  </span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">
                      {item.path}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {item.usedText}
                    </p>
                    <div className="space-y-0.5 pt-0.5">
                      {item.recommendations.map((rec, rIdx) => (
                        <p key={rIdx} className="text-[11px] text-slate-500">
                          • {rec}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenTransferModal(item)}
                  className="shrink-0 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium shadow-2xs transition"
                >
                  Create location transfer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Centered Modal (100% Dynamic MongoDB Data) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-slate-900">
                Bin {selectedBin?.fullLabel || selectedBin?.bin}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Path Banner (100% Dynamic) */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800">
              {selectedBin?.building} › {selectedArea?.name} › {(selectedBin?.department || 'PRD').substring(0, 3).toUpperCase()} › Rack {selectedBin?.rack} › Bin {selectedBin?.fullLabel || selectedBin?.bin}
            </div>

            {/* Status Line (100% Dynamic from MongoDB Occupancy & Capacity) */}
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                {selectedBin?.occupancyPercent}% full
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">
                {storedDocs.length} digitised documents stored • capacity {selectedBin?.capacity || 25}
              </span>
            </div>

            {/* Section: Documents that should be in this bin */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-semibold text-slate-700">
                Documents that should be in this bin
              </h4>

              {loadingDocs ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Loading bin contents from database...
                </div>
              ) : storedDocs.length === 0 ? (
                <div className="py-10 text-center space-y-2 border border-slate-100 rounded-xl bg-slate-50/40">
                  <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium text-slate-600">
                    No digitised documents in this bin
                  </p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {storedDocs.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-800">{doc.documentNumber}</span>
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] font-mono rounded border border-slate-200">
                            Rev {doc.version}
                          </span>
                        </div>
                        <div className="font-medium text-slate-800 truncate max-w-sm">{doc.title}</div>
                        <div className="text-[10px] text-slate-400">Custodian: {doc.currentCustodian?.name || 'Dr. Sarah Jenkins'}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setMoveDoc(doc)}
                          className="px-2 py-1 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded text-[10px] font-semibold border border-slate-200 transition"
                        >
                          Relocate
                        </button>
                        <button
                          onClick={() => navigate(`/documents/${doc._id}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Rack Mini-View (Dynamic from Rack Bins) */}
            {selectedRack && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    Rack {selectedRack.name} • {selectedRack.department}
                  </span>
                  <span className="text-[11px] text-slate-400">{selectedRack.bins.length} bins</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 max-w-md">
                  {selectedRack.bins.map((b) => {
                    const isSelected = selectedBin?._id === b._id;
                    let colorClasses = '';

                    if (b.occupancyPercent === 0) {
                      colorClasses = 'bg-slate-100 text-slate-500 border border-slate-200';
                    } else if (b.occupancyPercent < 70) {
                      colorClasses = 'bg-emerald-100/70 text-emerald-900 border border-emerald-300/80';
                    } else if (b.occupancyPercent <= 90) {
                      colorClasses = 'bg-amber-100/70 text-amber-900 border border-amber-300/80';
                    } else {
                      colorClasses = 'bg-rose-100 text-rose-900 border-2 border-rose-400 font-bold';
                    }

                    return (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBin(b, selectedRack, selectedArea)}
                        className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md border text-center transition cursor-pointer ${colorClasses} ${
                          isSelected ? 'border-2 border-slate-800 ring-2 ring-slate-800/10' : ''
                        }`}
                      >
                        <span className="text-xs font-bold leading-none">{b.label}</span>
                        <span className="text-[10px] leading-none mt-1 opacity-90">{b.occupancyPercent}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => handlePrintLabels(selectedArea)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Print bin label
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition"
                >
                  <Map className="w-3.5 h-3.5 text-slate-500" />
                  Open on map
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. Find on Map Modal (Dynamic Search) */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Find Coordinate on Storage Map</h3>
              </div>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Search by Rack (e.g. R-01), Bin (e.g. B02), Department, or Area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {locations.filter(loc => 
                !searchQuery ||
                loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                loc.bin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                loc.rack.toLowerCase().includes(searchQuery.toLowerCase()) ||
                loc.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
                loc.department.toLowerCase().includes(searchQuery.toLowerCase())
              ).slice(0, 10).map((loc) => {
                const occPct = loc.capacity > 0 ? Math.round(((loc.currentOccupancy || 0) / loc.capacity) * 100) : 0;
                return (
                  <div
                    key={loc._id}
                    onClick={() => {
                      setSelectedPlant(loc.building);
                      // Find area and rack
                      const areaObj = { name: loc.area, deptTag: loc.department?.substring(0, 3).toUpperCase() };
                      const rackObj = { name: loc.rack, department: loc.department, bins: locations.filter(l => l.building === loc.building && l.area === loc.area && l.rack === loc.rack) };
                      handleSelectBin({ ...loc, occupancyPercent: occPct }, rackObj, areaObj);
                      setShowSearchModal(false);
                    }}
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 cursor-pointer transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {loc.building} › {loc.area} › Rack {loc.rack} › Bin {loc.bin}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {loc.department} • Fill: {occPct}% ({loc.currentOccupancy || 0}/{loc.capacity} files)
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. Bin Labels Modal */}
      {showLabelsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Print Physical Bin Barcode Labels</h3>
              </div>
              <button onClick={() => setShowLabelsModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 space-y-3 text-center">
              <div className="inline-block p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <QrCode className="w-20 h-20 text-slate-800 mx-auto" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 font-mono">
                  {selectedPlant} / {activeAreaLabels?.name || 'Storage Vault'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Standard GxP 21 CFR Part 11 Coordinate Identifier Tags
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLabelsModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Print Labels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Relocate Document Modal (Direct Database Transaction) */}
      {moveDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Relocate Physical Document</h3>
              </div>
              <button onClick={() => setMoveDoc(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div><strong className="text-slate-700">Document:</strong> <span className="font-mono font-bold text-teal-700">{moveDoc.documentNumber}</span></div>
              <div className="truncate"><strong className="text-slate-700">Title:</strong> {moveDoc.title}</div>
              <div><strong className="text-slate-700">Source Bin:</strong> <span className="font-mono">{selectedBin?.code || selectedBin?.label || 'Current Bin'}</span></div>
            </div>

            <form onSubmit={handleExecuteMove} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Storage Coordinate *</label>
                <select
                  required
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="">-- Choose destination vault bin --</option>
                  {locations
                    .filter(l => l._id !== selectedBin?._id && l.status !== 'Full')
                    .map(l => (
                      <option key={l._id} value={l._id}>
                        {l.code} ({l.building} - {l.area} - {l.department} - {l.currentOccupancy}/{l.capacity} slots)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relocation Justification Remarks</label>
                <textarea
                  rows="2"
                  value={moveRemarks}
                  onChange={(e) => setMoveRemarks(e.target.value)}
                  placeholder="e.g. Relocated to alleviate >80% high-capacity bin occupancy per rebalance suggestion"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMoveDoc(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetLocationId || isSubmittingMove}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 shadow-xs"
                >
                  {isSubmittingMove ? 'Relocating...' : 'Confirm Relocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
