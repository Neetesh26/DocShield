import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Layers, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { documentService } from '../../services';
import { toast } from '../../context/ToastContext';

export const BulkUpload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    setFiles(selected.map(f => ({ file: f, status: 'Ready', name: f.name, size: f.size })));
  };

  const handleStartBatch = async () => {
    if (files.length === 0 || processing) return;
    setProcessing(true);

    const processedResults = [];
    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      try {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'Extracting...' } : f));
        const res = await documentService.extractMetadata(item.file);
        if (res.success) {
          processedResults.push({ name: item.name, success: true, data: res.data });
          setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'Extracted' } : f));
        }
      } catch (err) {
        processedResults.push({ name: item.name, success: false, error: err.message });
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'Failed' } : f));
      }
    }

    setResults(processedResults);
    setProcessing(false);

    const successCount = processedResults.filter(r => r.success).length;
    if (successCount > 0) {
      toast.success(`Batch extraction complete! ${successCount} of ${files.length} documents uploaded successfully.`);
    } else {
      toast.error('Batch upload failed. Check the error list below.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bulk Document Ingestion Queue</h1>
        <p className="text-xs text-slate-500">
          Batch upload multiple pharmaceutical PDF records for high-throughput automated OCR extraction and indexing.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div
          onClick={() => document.getElementById('bulk-input').click()}
          className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-orange-50/20 transition cursor-pointer"
        >
          <input
            id="bulk-input"
            type="file"
            multiple
            accept="application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <div className="text-xs font-semibold text-slate-800">
            Click to select multiple PDF files for batch processing
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Batch size up to 20 files
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Selected Batch ({files.length} documents)</span>
              <button
                disabled={processing}
                onClick={handleStartBatch}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {processing ? 'Processing Batch...' : 'Start Extraction Batch'}
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              {files.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 truncate max-w-sm">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400">({(item.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                    item.status === 'Extracted' ? 'bg-orange-50 text-orange-800 border border-orange-200' : item.status === 'Extracting...' ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

