import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, Camera, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { documentService } from '../../services';

export const ScanQrPage = () => {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let scanner = null;
    try {
      scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          handleScannedData(decodedText);
          scanner.clear();
        },
        (error) => {
          // ignore scan frame errors
        }
      );
    } catch (e) {
      console.warn('Camera scanner initialization skipped (non-critical in dev/desktop)', e);
    }

    return () => {
      if (scanner) {
        try { scanner.clear(); } catch (e) {}
      }
    };
  }, []);

  const handleScannedData = async (rawString) => {
    setScanResult(rawString);
    setError('');

    try {
      setSearching(true);
      let docNumberOrId = rawString;

      // Parse JSON payload if encoded as JSON
      if (rawString.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawString);
          if (parsed.id) {
            navigate(`/documents/${parsed.id}`);
            return;
          }
          if (parsed.docNum) docNumberOrId = parsed.docNum;
        } catch (e) {}
      } else if (rawString.startsWith('DOCUSHIELD:')) {
        docNumberOrId = rawString.replace('DOCUSHIELD:', '');
      }

      // Lookup document by number
      const res = await documentService.getDocuments({ search: docNumberOrId });
      if (res.success && res.data && res.data.length > 0) {
        navigate(`/documents/${res.data[0]._id}`);
      } else {
        setError(`No active document found matching QR token: "${docNumberOrId}"`);
      }
    } catch (err) {
      setError('Failed to resolve document from QR token');
    } finally {
      setSearching(false);
    }
  };

  const handleManualLookup = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScannedData(manualCode.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Physical Record QR Scanner</h1>
        <p className="text-xs text-slate-500 mt-1">
          Scan QR code on physical binder spine to verify custody, location, or retrieve the official digital dossier.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Camera Scanning Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Camera className="w-4 h-4 text-orange-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Optical Camera Scanner</h2>
        </div>

        <div id="qr-reader-container" className="w-full rounded-xl overflow-hidden min-h-[250px] bg-slate-50"></div>
      </div>

      {/* Manual Token / Identifier Fallback */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <QrCode className="w-4 h-4 text-slate-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Direct Document Number / QR Token Lookup
          </h2>
        </div>

        <form onSubmit={handleManualLookup} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter Document Number (e.g. SOP-QA-0042) or QR Token..."
            className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
          />
          <button
            type="submit"
            disabled={searching || !manualCode.trim()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {searching ? 'Looking up...' : 'Lookup'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

