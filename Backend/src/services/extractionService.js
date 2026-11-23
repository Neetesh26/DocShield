import fs from 'fs';
import pdfParse from 'pdf-parse';

export const extractPdfMetadata = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    let text = '';
    let numPages = 1;

    try {
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text || '';
      numPages = pdfData.numpages || 1;
    } catch (pdfErr) {
      // Robust Fallback: Extract uncompressed text streams or strings
      const rawStr = dataBuffer.toString('latin1');
      const textMatches = rawStr.match(/\(([^()]+)\)\s*Tj/g);
      if (textMatches) {
        text = textMatches.map(m => m.replace(/^\(|\)\s*Tj$/g, '')).join('\n');
      } else {
        const streamMatches = rawStr.match(/stream([\s\S]*?)endstream/);
        if (streamMatches) text = streamMatches[1];
        else text = rawStr;
      }
    }

    // Pattern extractors (requires colon ':' or tabs to prevent word false positives)
    const patterns = {
      documentNumber: /(?:Document\s*(?:No|Number|#|ID)|Doc\s*#)\s*[:\t]\s*([A-Z0-9-_/]{4,25})/i,
      title: /(?:Document\s*Title|Standard\s*Operating\s*Procedure|Title)\s*[:\t]\s*([^\r\n]{4,80})/i,
      version: /(?:Version|Rev(?:ision)?|Ver)\s*[:\t]\s*([0-9]+(?:\.[0-9]+)?)/i,
      effectiveDate: /(?:Effective\s*Date|Date\s*Effective)\s*[:\t]\s*([0-9]{1,4}[-/][0-9]{1,2}[-/][0-9]{1,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i,
      reviewDate: /(?:Review\s*Date|Next\s*Review)\s*[:\t]\s*([0-9]{1,4}[-/][0-9]{1,2}[-/][0-9]{1,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i,
      expiryDate: /(?:Expiry\s*Date|Expiration\s*Date|Valid\s*Through)\s*[:\t]\s*([0-9]{1,4}[-/][0-9]{1,2}[-/][0-9]{1,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i,
      department: /(?:Department|Dept)\s*[:\t]\s*([^\r\n]{2,35})/i,
      product: /(?:Product\s*(?:Name)?|Material)\s*[:\t]\s*([^\r\n]{3,40})/i,
      batchNumber: /(?:Batch\s*(?:No|Number|#)|Lot\s*(?:No|Number|#))\s*[:\t]\s*([A-Z0-9-_]{3,20})/i,
      preparedBy: /(?:Prepared\s*By|Author)\s*[:\t]\s*([^\r\n]{3,35})/i,
      reviewedBy: /(?:Reviewed\s*By|Checker)\s*[:\t]\s*([^\r\n]{3,35})/i,
      approvedBy: /(?:Approved\s*By|Approver)\s*[:\t]\s*([^\r\n]{3,35})/i,
    };

    const extracted = {};
    const confidence = {};

    // Extract each field
    for (const [field, regex] of Object.entries(patterns)) {
      const match = text.match(regex);
      if (match && match[1] && match[1].trim()) {
        const val = match[1].trim();
        extracted[field] = val;
        confidence[field] = {
          score: 0.92,
          level: 'High',
          source: 'regex_header'
        };
      } else {
        extracted[field] = '';
        confidence[field] = {
          score: 0.0,
          level: 'Low',
          source: 'not_detected'
        };
      }
    }

    // Heuristics fallback if header labels weren't explicitly labeled
    if (!extracted.documentNumber) {
      const codeMatch = text.match(/\b(SOP-[A-Z]{2,4}-\d{3,4}|BMR-[A-Z]{2,4}-\d{3,4}|DOC-\d{4,6})\b/);
      if (codeMatch) {
        extracted.documentNumber = codeMatch[1];
        confidence.documentNumber = { score: 0.75, level: 'Medium', source: 'pattern_fallback' };
      }
    }

    if (!extracted.department) {
      const depts = ['Quality Assurance', 'Quality Control', 'Production', 'Regulatory Affairs', 'Microbiology', 'Warehouse', 'R&D'];
      for (const d of depts) {
        if (text.toLowerCase().includes(d.toLowerCase())) {
          extracted.department = d;
          confidence.department = { score: 0.70, level: 'Medium', source: 'keyword_fallback' };
          break;
        }
      }
    }

    if (!extracted.version && text.match(/\bv?(\d+\.\d+)\b/)) {
      const verMatch = text.match(/\bv?(\d+\.\d+)\b/);
      extracted.version = verMatch[1];
      confidence.version = { score: 0.65, level: 'Medium', source: 'heuristic' };
    }

    return {
      success: true,
      numPages,
      textPreview: text.substring(0, 1000),
      rawValues: extracted,
      confidenceScores: confidence,
      extractionSource: 'pdf-parse'
    };
  } catch (error) {
    console.error('[PDF Extraction Error]', error.message);
    return {
      success: false,
      error: error.message,
      numPages: 1,
      rawValues: {},
      confidenceScores: {},
      extractionSource: 'manual'
    };
  }
};
