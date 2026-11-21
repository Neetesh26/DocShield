import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Box, MapPin, Search, ArrowRightLeft, CheckCircle, AlertTriangle, FileText, ChevronRight, Layers } from 'lucide-react';
import { storageService, documentService } from '../../services';

export const StorageMap = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [hierarchy, setHierarchy] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [storedDocs, setStoredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Move document modal
  const [moveDoc, setMoveDoc] = useState(null);
  const [targetLocationId, setTargetLocationId] = useState('');
  const [moveRemarks, setMoveRemarks] = useState('');

  const fetchStorageData = async () => {
    try {
      setLoading(true);
      const [locRes, hierRes] = await Promise.all([
        storageService.getLocations(),
        storageService.getHierarchy()
      ]);
      if (locRes.success) {
        setLocations(locRes.data || []);
        if (locRes.data && locRes.data.length > 0) {
          handleSelectLocation(locRes.data[0]);
        }
      }
      if (hierRes.success) setHierarchy(hierRes.data || {});
    } catch (err) {
      console.error('Storage map error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  const handleSelectLocation = async (loc) => {
    setSelectedLocation(loc);
    try {
      const res = await storageService.getLocationById(loc._id);
      if (res.success && res.data) {
        setStoredDocs(res.data.storedDocuments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteMove = async (e) => {
    e.preventDefault();
    if (!moveDoc || !targetLocationId) return;

    try {
      const res = await storageService.moveDocument(moveDoc._id, targetLocationId, moveRemarks);
      if (res.success) {
        setMoveDoc(null);
        setMoveRemarks('');
        fetchStorageData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to move document');
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc.code.toLowerCase().includes(search.toLowerCase()) ||
    loc.building.toLowerCase().includes(search.toLowerCase()) ||
    loc.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Physical Storage Vault Map</h1>
          <p className="text-xs text-slate-500">
            Hierarchical physical archival management down to Building, Area, Room, Rack, Shelf, and Bin.
          </p>
        </div>
        <div className="text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 shadow-xs">
          Total Vault Coordinates: <strong className="text-slate-900 font-bold">{locations.length}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Coordinates List & Search */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vault or rack coordinates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredLocations.map((loc) => {
              const occPercent = Math.round((loc.currentOccupancy / loc.capacity) * 100);
              const isSelected = selectedLocation?._id === loc._id;
              return (
                <div
                  key={loc._id}
                  onClick={() => handleSelectLocation(loc)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-teal-800">{loc.code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      loc.status === 'Full'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : loc.status === 'Near Full'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {loc.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {loc.building} • {loc.area} (Room {loc.room})
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Occupancy: {loc.currentOccupancy} / {loc.capacity}</span>
                      <span>{occPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${occPercent > 80 ? 'bg-amber-500' : 'bg-teal-500'}`}
                        style={{ width: `${Math.min(100, occPercent)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Selected Location Details & Stored Documents */}
        <div className="lg:col-span-2 space-y-6">
          {selectedLocation ? (
            <>
              {/* Location Metric Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-teal-600" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900 font-mono">{selectedLocation.code}</h2>
                      <p className="text-xs text-slate-500">
                        Designated for: {selectedLocation.department} • Building {selectedLocation.building}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 border border-slate-200">
                    Capacity: {selectedLocation.capacity} Slots
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Area</span>
                    <span className="font-medium text-slate-800">{selectedLocation.area}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Room</span>
                    <span className="font-mono text-slate-800">{selectedLocation.room}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rack & Shelf</span>
                    <span className="font-mono font-bold text-teal-800">Rack {selectedLocation.rack} / Shelf {selectedLocation.shelf}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bin & Box</span>
                    <span className="font-mono font-bold text-slate-800">Bin {selectedLocation.bin} ({selectedLocation.box})</span>
                  </div>
                </div>

                {selectedLocation.remarks && (
                  <p className="text-xs text-slate-600 italic">
                    Note: {selectedLocation.remarks}
                  </p>
                )}
              </div>

              {/* Stored Documents Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Documents Currently Stored in this Location ({storedDocs.length})
                  </h3>
                </div>

                {storedDocs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No physical documents currently placed in this coordinate bin.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                          <th className="pb-2">Doc #</th>
                          <th className="pb-2">Title</th>
                          <th className="pb-2">Rev</th>
                          <th className="pb-2">File Tag</th>
                          <th className="pb-2">Custodian</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {storedDocs.map((doc) => (
                          <tr key={doc._id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 font-mono font-bold text-teal-700">{doc.documentNumber}</td>
                            <td className="py-2.5 font-medium text-slate-900 truncate max-w-xs">{doc.title}</td>
                            <td className="py-2.5 font-mono">{doc.version}</td>
                            <td className="py-2.5 font-mono text-slate-500">{doc.fileNumber || 'F1'}</td>
                            <td className="py-2.5 text-slate-700">{doc.currentCustodian?.name}</td>
                            <td className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setMoveDoc(doc)}
                                  className="px-2 py-1 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded text-[11px] font-semibold border border-slate-200"
                                >
                                  Relocate
                                </button>
                                <button
                                  onClick={() => navigate(`/documents/${doc._id}`)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                                >
                                  Open
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Select a location coordinate from the left panel to inspect stored records.
            </div>
          )}
        </div>
      </div>

      {/* Relocate Document Modal */}
      {moveDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Relocate Physical Document</h3>
              <button onClick={() => setMoveDoc(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-lg space-y-1">
              <div><strong className="text-slate-700">Document:</strong> <span className="font-mono font-bold text-teal-700">{moveDoc.documentNumber}</span></div>
              <div className="truncate"><strong className="text-slate-700">Title:</strong> {moveDoc.title}</div>
              <div><strong className="text-slate-700">Current Location:</strong> <span className="font-mono">{selectedLocation?.code}</span></div>
            </div>

            <form onSubmit={handleExecuteMove} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Storage Coordinate *</label>
                <select
                  required
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
                >
                  <option value="">-- Choose destination vault --</option>
                  {locations
                    .filter(l => l._id !== selectedLocation?._id && l.status !== 'Full')
                    .map(l => (
                      <option key={l._id} value={l._id}>
                        {l.code} ({l.building} - {l.department})
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
                  placeholder="e.g. Transferred to High-Security Solid Dosage Archive"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMoveDoc(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetLocationId}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  Confirm Relocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

