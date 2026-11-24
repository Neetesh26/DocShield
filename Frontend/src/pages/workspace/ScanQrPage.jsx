import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, Camera, AlertCircle, ArrowRight, CheckCircle2, Video, VideoOff, RefreshCw, Sparkles } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { documentService } from '../../services';
import { toast } from '../../context/ToastContext';

export const ScanQrPage = () => {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);
  const scannerRef = useRef(null);
  const containerId = 'qr-reader-live';

  // Fetch available cameras and start scanner
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        setCameraLoading(true);
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCam = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
          setSelectedCameraId(backCam.id);
          startCamera(backCam.id);
        } else {
          setError('No camera detected on this device. You can look up by document number below.');
        }
      } catch (err) {
        console.warn('Camera access issue:', err);
        setError('Camera permission denied or camera not available. Please allow camera access in browser.');
      } finally {
        if (mounted) setCameraLoading(false);
      }
    };

    initCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, []);

  const startCamera = async (cameraId) => {
    try {
      setCameraLoading(true);
      setError('');

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (_) {}
      }

      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      const cameraConfig = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          toast.success(`QR Detected: ${decodedText}`);
          handleScannedData(decodedText);
          stopCamera();
        },
        () => {
          // Frame parse error ignored
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError('Unable to start live camera feed. Please check permissions or select another camera.');
      setIsScanning(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleCameraChange = (e) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    startCamera(newId);
  };

  const handleScannedData = async (rawString) => {
    setError('');

    try {
      setSearching(true);
      let docNumberOrId = rawString.trim();

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
      } else if (rawString.startsWith('VIDYAGXP:')) {
        docNumberOrId = rawString.replace('VIDYAGXP:', '').trim();
      } else if (rawString.startsWith('DOCUSHIELD:')) {
        docNumberOrId = rawString.replace('DOCUSHIELD:', '').trim();
      }

      // Lookup document by number or token
      const res = await documentService.getDocuments({ search: docNumberOrId });
      if (res.success && res.data && res.data.length > 0) {
        toast.success(`Found document: ${res.data[0].documentNumber || docNumberOrId}`);
        navigate(`/documents/${res.data[0]._id}`);
      } else {
        const msg = `No active document found matching QR token: "${docNumberOrId}"`;
        setError(msg);
        toast.warning(msg);
      }
    } catch (err) {
      const msg = 'Failed to resolve document from QR token';
      setError(msg);
      toast.error(msg);
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
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
          <Camera className="w-6 h-6 text-orange-600" />
          Physical Record QR Camera Scanner
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scan QR barcode on physical binder spine to verify custody, storage location, or open official digital dossier.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Optical Camera Viewport */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isScanning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isScanning ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            </span>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {isScanning ? 'Camera Active — Scanning in Real Time' : 'Optical Camera Scanner'}
            </h2>
          </div>

          {/* Camera Controls */}
          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="text-xs px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.substring(0, 5)}`}
                  </option>
                ))}
              </select>
            )}

            {isScanning ? (
              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <VideoOff className="w-3.5 h-3.5 text-rose-500" />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startCamera(selectedCameraId)}
                disabled={cameraLoading}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Video className="w-3.5 h-3.5" />
                {cameraLoading ? 'Starting...' : 'Open Camera'}
              </button>
            )}
          </div>
        </div>

        {/* Camera Render Target Container */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[300px]">
          <div id={containerId} className="w-full h-full flex items-center justify-center"></div>

          {/* Holographic targeting overlay when scanning */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-64 border-2 border-orange-500/80 rounded-2xl relative shadow-[0_0_20px_rgba(234,88,12,0.3)]">
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-orange-500 rounded-tl-lg"></span>
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-orange-500 rounded-tr-lg"></span>
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-orange-500 rounded-bl-lg"></span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-orange-500 rounded-br-lg"></span>

                {/* Animated Laser Scan Bar */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_8px_#f97316] animate-pulse top-1/2 -translate-y-1/2"></div>
              </div>
              <p className="text-[11px] text-white/90 font-medium tracking-wide mt-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/10">
                Align physical QR code inside the orange frame
              </p>
            </div>
          )}

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-500 shadow-md">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">Camera is currently paused or inactive</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click 'Open Camera' to start scanning physical binders</p>
              </div>
              <button
                type="button"
                onClick={() => startCamera(selectedCameraId)}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Open Camera
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Token / Identifier Fallback */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <QrCode className="w-4 h-4 text-orange-600" />
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Direct Document Number / QR Token Lookup
          </h2>
        </div>

        <form onSubmit={handleManualLookup} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter Document Number (e.g. SOP-QA-0042) or QR Token..."
            className="flex-1 px-3.5 py-2 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
          />
          <button
            type="submit"
            disabled={searching || !manualCode.trim()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
          >
            {searching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Looking up...</span>
              </>
            ) : (
              <>
                <span>Lookup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
