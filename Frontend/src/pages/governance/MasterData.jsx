import React, { useState, useEffect } from 'react';
import { Database, Building, FolderKanban, Users, Plus, CheckCircle, ShieldCheck } from 'lucide-react';
import { masterDataService } from '../../services';

export const MasterData = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [data, setData] = useState({
    departments: [],
    documentTypes: [],
    locations: [],
    users: []
  });
  const [loading, setLoading] = useState(true);

  // New Department Form
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // New Document Type Form
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typePrefix, setTypePrefix] = useState('');
  const [retention, setRetention] = useState(5);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await masterDataService.getMasterData();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      const res = await masterDataService.createDepartment({
        name: deptName,
        code: deptCode,
        description: deptDesc
      });
      if (res.success) {
        setShowDeptModal(false);
        setDeptName('');
        setDeptCode('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      const res = await masterDataService.createDocumentType({
        name: typeName,
        code: typeCode,
        prefix: typePrefix,
        retentionYears: Number(retention)
      });
      if (res.success) {
        setShowTypeModal(false);
        setTypeName('');
        setTypeCode('');
        setTypePrefix('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create document type');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Data Management</h1>
          <p className="text-xs text-slate-500">
            Configure pharmaceutical organizational structures, document numbering schemes, and physical vault coordinates.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 bg-white px-4 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveTab('departments')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'departments' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Departments ({data.departments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('documentTypes')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'documentTypes' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Document Types ({data.documentTypes?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'locations' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Storage Coordinates ({data.locations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'users' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Personnel Directory ({data.users?.length || 0})
        </button>
      </div>

      {/* TAB 1: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Operating Departments
            </h2>
            <button
              onClick={() => setShowDeptModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Department
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Department Name</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Department Head</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.departments?.map(d => (
                  <tr key={d._id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono font-bold text-teal-700">{d.code}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{d.name}</td>
                    <td className="py-2.5 text-slate-600">{d.description || 'Core GxP Unit'}</td>
                    <td className="py-2.5 text-slate-700">{d.headName || 'Assigned Lead'}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENT TYPES */}
      {activeTab === 'documentTypes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Document Classification Rules & Prefixes
            </h2>
            <button
              onClick={() => setShowTypeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Document Type
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Prefix</th>
                  <th className="pb-2">Document Type Name</th>
                  <th className="pb-2">Retention Period</th>
                  <th className="pb-2">Physical Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.documentTypes?.map(t => (
                  <tr key={t._id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono font-bold text-teal-700">{t.code}</td>
                    <td className="py-2.5 font-mono font-bold text-slate-800">{t.prefix}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{t.name}</td>
                    <td className="py-2.5 font-mono text-slate-700">{t.retentionYears || 5} Years</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                        Enforced
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STORAGE COORDINATES */}
      {activeTab === 'locations' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Registered Physical Vault Coordinates
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                  <th className="pb-2">Coordinate Code</th>
                  <th className="pb-2">Facility Building</th>
                  <th className="pb-2">Vault Area</th>
                  <th className="pb-2">Rack / Shelf / Bin</th>
                  <th className="pb-2">Capacity</th>
                  <th className="pb-2">Current Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.locations?.map(l => (
                  <tr key={l._id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono font-bold text-teal-700">{l.code}</td>
                    <td className="py-2.5 font-medium text-slate-900">{l.building}</td>
                    <td className="py-2.5 text-slate-700">{l.area}</td>
                    <td className="py-2.5 font-mono text-slate-600">RK-{l.rack} / SH-{l.shelf} / BIN-{l.bin}</td>
                    <td className="py-2.5 font-mono">{l.capacity}</td>
                    <td className="py-2.5 font-mono font-semibold text-slate-800">{l.currentOccupancy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            GxP Authorized Personnel Directory
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                  <th className="pb-2">Employee ID</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Department</th>
                  <th className="pb-2">Designation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.users?.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono font-bold text-slate-800">{u.employeeId}</td>
                    <td className="py-2.5 font-semibold text-slate-900">{u.name}</td>
                    <td className="py-2.5 text-slate-600">{u.email}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700">{u.department}</td>
                    <td className="py-2.5 text-slate-600">{u.designation || 'Staff'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Department */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Department</h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Microbiology Quality Control"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MQC"
                  className="w-full px-3 py-1.5 font-mono uppercase border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Document Type */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Document Type</h3>
              <button onClick={() => setShowTypeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateType} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Type Name *</label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Deviation Investigation Report"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={typeCode}
                    onChange={(e) => setTypeCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DEV"
                    className="w-full px-3 py-1.5 font-mono uppercase border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prefix *</label>
                  <input
                    type="text"
                    required
                    value={typePrefix}
                    onChange={(e) => setTypePrefix(e.target.value.toUpperCase())}
                    placeholder="e.g. DEV"
                    className="w-full px-3 py-1.5 font-mono uppercase border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Retention (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={retention}
                  onChange={(e) => setRetention(e.target.value)}
                  className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
                >
                  Save Document Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

