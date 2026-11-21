import { test, describe } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { extractPdfMetadata } from '../src/services/extractionService.js';
import { classifyDocument } from '../src/services/classificationService.js';
import { generateDocumentQR } from '../src/services/qrService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to generate perfectly valid PDF with accurate xref byte offsets
const generateValidPdfBuffer = (textLines) => {
  const chunks = [];
  chunks.push('%PDF-1.4\n');
  const offsets = [];

  const addObj = (objStr) => {
    offsets.push(Buffer.byteLength(chunks.join('')));
    chunks.push(objStr);
  };

  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');

  const streamContent = 'BT\n/F1 12 Tf\n50 720 Td\n' + textLines.map(line => `(${line.replace(/[()]/g, '')}) Tj\n0 -20 Td\n`).join('') + 'ET';
  const streamLen = Buffer.byteLength(streamContent);
  addObj(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj\n`);
  addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  const xrefOffset = Buffer.byteLength(chunks.join(''));
  chunks.push('xref\n0 6\n0000000000 65535 f \n');
  for (const off of offsets) {
    chunks.push(String(off).padStart(10, '0') + ' 00000 n \n');
  }
  chunks.push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return Buffer.from(chunks.join(''));
};

describe('Backend Services & Logic Test Suite', () => {

  test('Auto-Classification Engine: Classifies BMR accurately', () => {
    const result = classifyDocument({
      documentNumber: 'BMR-TB-1001',
      title: 'Batch Manufacturing Record for Ibuprofen Tablets 400mg',
      department: 'Production',
      text: 'Batch record master manufacturing operations for tablet press'
    });

    assert.strictEqual(result.documentType, 'Batch Manufacturing Record (BMR)');
    assert.strictEqual(result.category, 'Production Record');
    assert.ok(result.suggestedTags.includes('BMR'));
    assert.ok(result.confidenceScore >= 0.90);
  });

  test('Auto-Classification Engine: Classifies Cleaning Validation SOP accurately', () => {
    const result = classifyDocument({
      documentNumber: 'SOP-CL-0021',
      title: 'Cleaning Validation Procedure for Blenders',
      department: 'Quality Assurance',
      text: 'Cleaning validation protocol and CIP sanitization'
    });

    assert.strictEqual(result.category, 'Sanitization');
    assert.ok(result.suggestedTags.includes('CleaningValidation'));
  });

  test('QR Code Generation Service: Produces high-density GxP QR code dataUrl and payload', async () => {
    const docNum = 'SOP-QA-0042';
    const fakeId = '65b123456789abcdef012345';
    const qrResult = await generateDocumentQR(docNum, fakeId);

    assert.ok(qrResult.payload.includes(docNum));
    assert.ok(qrResult.payload.includes(fakeId));
    assert.ok(qrResult.dataUrl.startsWith('data:image/png;base64,'));
  });

  test('PDF Text & Header Extraction: Reads PDF and extracts fields with confidence', async () => {
    const testPdfPath = path.join(__dirname, 'test_extraction.pdf');
    const pdfBuf = generateValidPdfBuffer([
      'Document Number: SOP-QA-0042',
      'Document Title: Standard Procedure for Calibration of HPLC',
      'Version: 3.0',
      'Effective Date: 2026-01-15',
      'Department: Quality Control'
    ]);
    fs.writeFileSync(testPdfPath, pdfBuf);

    try {
      const result = await extractPdfMetadata(testPdfPath);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.rawValues.documentNumber, 'SOP-QA-0042');
      assert.strictEqual(result.confidenceScores.documentNumber.level, 'High');
      assert.strictEqual(result.rawValues.version, '3.0');
    } finally {
      if (fs.existsSync(testPdfPath)) fs.unlinkSync(testPdfPath);
    }
  });

});
