import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import Document from '../models/Document.js';
import '../models/User.js';
import '../models/StorageLocation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { extractPdfRawText, normalizeText } from '../services/extractionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.6-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.7-flash'
].filter(Boolean);

const extractDocumentTextForAI = async (doc) => {
  if (!doc?.fileUrl) return { text: '', pdfBase64: null };

  const safeFilename = path.basename(doc.fileUrl);
  const filePath = path.join(uploadsDir, safeFilename);
  if (!fs.existsSync(filePath)) {
    return { text: '', pdfBase64: null };
  }

  try {
    const buffer = fs.readFileSync(filePath);
    let parsedText = '';

    try {
      const pdfData = await Promise.race([
        pdfParse(buffer),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PDF parse timeout')), 3000))
      ]);
      if (pdfData?.text) {
        parsedText = normalizeText(pdfData.text).trim();
      }
    } catch {
      // Fallback to custom stream extractor below
    }

    const streamText = normalizeText(extractPdfRawText(buffer)).trim();
    const combinedText = parsedText.length >= streamText.length
      ? parsedText
      : `${streamText}\n${parsedText}`.trim();

    if (combinedText.length >= 60) {
      return { text: combinedText.slice(0, 18000), pdfBase64: null };
    }

    // Scanned/image-based PDF fallback (under 8MB)
    const pdfBase64 = buffer.length <= 8 * 1024 * 1024 ? buffer.toString('base64') : null;
    return { text: combinedText, pdfBase64 };
  } catch (err) {
    console.warn('[AI Assistant] Failed reading PDF file:', err.message);
    return { text: '', pdfBase64: null };
  }
};

const formatCleanStructuredText = (rawText) => {
  if (!rawText) return '';
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const callGeminiAssistant = async ({ apiKey, systemPrompt, userPrompt, pdfBase64 }) => {
  const parts = [{ text: `${systemPrompt}\n\nUser Question: ${userPrompt}` }];
  if (pdfBase64) {
    parts.push({
      inline_data: {
        mime_type: 'application/pdf',
        data: pdfBase64
      }
    });
  }

  let lastError = 'Gemini API request failed';

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048
          }
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const text = data?.candidates?.[0]?.content?.parts
          ?.filter((p) => !p.thought && p.text)
          .map((p) => p.text)
          .join('')
          .trim();
        if (text) return formatCleanStructuredText(text);
        lastError = 'Empty response received from Gemini model.';
        continue;
      }

      lastError = data?.error?.message || `HTTP ${res.status}`;
      // Try next fallback model on unsupported/not-found or transient capacity/rate errors
      if (res.status !== 404 && res.status !== 400 && res.status !== 429 && res.status < 500) {
        break;
      }
    } catch (err) {
      lastError = err.message || 'Gemini request failed';
    }
  }

  throw new Error(lastError);
};

export const askDocumentAssistant = async (req, res, next) => {
  try {
    const { documentId, prompt, mode = 'qa' } = req.body;

    if (!documentId || !prompt) {
      return sendError(res, 'Document ID and user prompt are required', 400);
    }

    const doc = await Document.findById(documentId)
      .populate('currentCustodian', 'name department')
      .populate('storageLocation', 'code building area');

    if (!doc) {
      return sendError(res, 'Document not found or access denied', 404);
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    if (!geminiKey) {
      return sendSuccess(res, 'AI Assistant Status', {
        configured: false,
        message: 'AI service is not configured. Please set GEMINI_API_KEY in backend environment.',
        documentContext: {
          documentNumber: doc.documentNumber,
          title: doc.title,
          version: doc.version,
          department: doc.department
        },
        mode
      });
    }

    const { text: pdfText, pdfBase64 } = await extractDocumentTextForAI(doc);

    const metadataBlock = [
      `Document Number: ${doc.documentNumber}`,
      `Title: ${doc.title}`,
      `Version: ${doc.version}`,
      `Document Type: ${doc.documentType}`,
      `Department: ${doc.department}`,
      `Product: ${doc.product || 'N/A'}`,
      `Batch Number: ${doc.batchNumber || 'N/A'}`,
      `Status: ${doc.status} | Physical Status: ${doc.physicalStatus}`,
      `Effective Date: ${doc.effectiveDate ? new Date(doc.effectiveDate).toLocaleDateString() : 'N/A'}`,
      `Next Review Date: ${doc.reviewDate ? new Date(doc.reviewDate).toLocaleDateString() : 'N/A'}`,
      `Prepared By: ${doc.preparedBy || 'N/A'} | Reviewed By: ${doc.reviewedBy || 'N/A'} | Approved By: ${doc.approvedBy || 'N/A'}`,
      `Custodian: ${doc.currentCustodian?.name || 'Unassigned'} | Vault Location: ${doc.storageLocation?.code || 'N/A'}`,
      doc.description ? `Description: ${doc.description}` : ''
    ].filter(Boolean).join('\n');

    const systemPrompt = [
      'You are DocuShield AI, a GxP pharmaceutical document compliance assistant.',
      'Answer strictly using ONLY the controlled document metadata and PDF text provided below.',
      'RESPONSE STYLE RULES (STRICT):',
      '- Keep every answer SHORT, direct, and under 90 words.',
      '- Always use a clean, ordered structure:',
      '  Summary: <1 crisp sentence>',
      '  Key Points:',
      '  1. <point 1>',
      '  2. <point 2>',
      '  3. <point 3> (max 4 numbered points)',
      '- For simple greetings (e.g., "hi", "hello"), reply in 1 short line plus 3 short numbered options for this document.',
      '- For compliance quiz requests, output exactly 3 short numbered questions with concise answers.',
      '- Do NOT use raw markdown syntax like **, ##, *, or backticks. Use plain text and numbered points only.',
      '- If a detail is missing from the document, state it in 1 short sentence without guessing.',
      '',
      '=== DOCUMENT METADATA ===',
      metadataBlock,
      '',
      '=== EXTRACTED DOCUMENT TEXT ===',
      pdfText || '(No selectable text extracted from PDF; refer to attached PDF or metadata above.)'
    ].join('\n');

    const aiResponse = await callGeminiAssistant({
      apiKey: geminiKey,
      systemPrompt,
      userPrompt: prompt.trim(),
      pdfBase64
    });
    console.log('Gemini response:', aiResponse);
    return sendSuccess(res, 'Assistant response', {
      configured: true,
      mode,
      response: aiResponse
    });
  } catch (error) {
    console.error('[AI Assistant Error]', error.message);
    return sendSuccess(res, 'AI Assistant Error Fallback', {
      configured: true,
      response: `Unable to generate AI response right now (${error.message}). Please verify your GEMINI_API_KEY and network access on the backend server.`
    });
  }
};

