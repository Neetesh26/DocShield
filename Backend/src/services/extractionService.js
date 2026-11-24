import fs from 'fs';
import pdfParse from 'pdf-parse';

// Helper: Normalize Cyrillic homoglyphs & special unicode quotes/dashes
export const normalizeText = (str) => {
  if (!str) return '';
  return str
    .replace(/\u0437/g, 's') // Cyrillic small letter ze (з) -> s
    .replace(/\u0417/g, 'S') // Cyrillic capital letter ze (З) -> S
    .replace(/\u043E/g, 'o') // Cyrillic small letter o (о) -> o
    .replace(/\u041E/g, 'O') // Cyrillic capital letter o (О) -> O
    .replace(/\u0441/g, 'c') // Cyrillic small letter es (с) -> c
    .replace(/\u0421/g, 'C') // Cyrillic capital letter es (С) -> C
    .replace(/\u0430/g, 'a') // Cyrillic small letter a (а) -> a
    .replace(/\u0410/g, 'A') // Cyrillic capital letter a (А) -> A
    .replace(/\u0435/g, 'e') // Cyrillic small letter ie (е) -> e
    .replace(/\u0415/g, 'E') // Cyrillic capital letter ie (Е) -> E
    .replace(/\u0440/g, 'p') // Cyrillic small letter er (р) -> p
    .replace(/\u0420/g, 'P') // Cyrillic capital letter er (Р) -> P
    .replace(/\u0456/g, 'i') // Cyrillic small letter byelorussian-ukrainian i (і) -> i
    .replace(/\u0406/g, 'I') // Cyrillic capital letter byelorussian-ukrainian i (І) -> I
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-') // en-dash, em-dash -> hyphen
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
};

// Helper: Parse any date format to standard ISO YYYY-MM-DD for HTML input[type="date"]
export const parseToIsoDate = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.trim();

  const monthNames = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  // Format: 21-Aug-2026 or 21/Aug/2026 or 21-August-2026
  const dayMonYear = clean.match(/^(\d{1,2})[-/\s]+([A-Za-z]{3,9})[-/\s]+(\d{2,4})$/);
  if (dayMonYear) {
    const day = dayMonYear[1].padStart(2, '0');
    const monStr = dayMonYear[2].toLowerCase().substring(0, 3);
    const month = monthNames[monStr] || '01';
    let year = dayMonYear[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // Format: August 21, 2026
  const monDayYear = clean.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})$/);
  if (monDayYear) {
    const monStr = monDayYear[1].toLowerCase().substring(0, 3);
    const month = monthNames[monStr] || '01';
    const day = monDayYear[2].padStart(2, '0');
    let year = monDayYear[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // Format: DD-MM-YYYY or DD/MM/YYYY
  const dmy = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  // Format: YYYY-MM-DD
  const ymd = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
};

export const extractPdfMetadata = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    let rawText = '';
    let numPages = 1;

    try {
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text || '';
      numPages = pdfData.numpages || 1;
    } catch (pdfErr) {
      // Robust Fallback: Extract uncompressed text streams or strings
      const rawStr = dataBuffer.toString('latin1');
      const textMatches = rawStr.match(/\(([^()]+)\)\s*Tj/g);
      if (textMatches) {
        rawText = textMatches.map(m => m.replace(/^\(|\)\s*Tj$/g, '')).join('\n');
      } else {
        const streamMatches = rawStr.match(/stream([\s\S]*?)endstream/);
        if (streamMatches) rawText = streamMatches[1];
        else rawText = rawStr;
      }
    }

    const text = normalizeText(rawText);

    const extracted = {};
    const confidence = {};

    // 1. Document Number
    // Matches: SOP No.: SOP/QA/036-01, Document No: ..., Doc #: ..., Specification No: ..., etc.
    const docNoRegex = /(?:SOP\s*(?:No|Number|#|ID)?|Document\s*(?:No|Number|#|ID)|Doc\s*(?:No|Number|#)|Specification\s*(?:No|Number|#)|Spec\s*(?:No|Number|#)|Protocol\s*(?:No|Number|#)|BMR\s*(?:No|Number|#)|BPR\s*(?:No|Number|#)|Format\s*(?:No|Number|#))\s*\.?\s*[:\t]\s*([A-Za-z0-9/_.-]{3,35})/i;
    const docNoMatch = text.match(docNoRegex);
    if (docNoMatch) {
      const matchIndex = docNoMatch.index || 0;
      const preceding = text.substring(Math.max(0, matchIndex - 20), matchIndex).toLowerCase();
      if (!preceding.includes('supersedes')) {
        extracted.documentNumber = docNoMatch[1].trim();
        confidence.documentNumber = { score: 0.95, level: 'High', source: 'header_pattern' };
      }
    }

    if (!extracted.documentNumber) {
      // Fallback code match with slashes or dashes
      const fallbackCode = text.match(/\b(SOP[/-][A-Za-z0-9/_.-]{3,30}|BMR[/-][A-Za-z0-9/_.-]{3,30}|BPR[/-][A-Za-z0-9/_.-]{3,30}|SPEC[/-][A-Za-z0-9/_.-]{3,30}|VAL[/-][A-Za-z0-9/_.-]{3,30}|DOC[/-][A-Za-z0-9/_.-]{3,30})\b/i);
      if (fallbackCode) {
        extracted.documentNumber = fallbackCode[1].trim();
        confidence.documentNumber = { score: 0.85, level: 'High', source: 'code_fallback' };
      }
    }

    // 2. Department
    const deptMatch = text.match(/(?:Department|Dept)\s*[:\t]\s*([^\r\n]{2,40})/i);
    if (deptMatch) {
      const rawDept = deptMatch[1].trim().replace(/\s+(Page\s+No.*|SOP.*)$/i, '').trim();
      extracted.department = rawDept;
      confidence.department = { score: 0.92, level: 'High', source: 'header_pattern' };
    } else {
      const knownDepts = ['Quality Assurance', 'Quality Control', 'Production', 'Regulatory Affairs', 'Microbiology', 'Warehouse', 'R&D', 'Engineering'];
      for (const d of knownDepts) {
        if (new RegExp('\\b' + d + '\\b', 'i').test(text)) {
          extracted.department = d;
          confidence.department = { score: 0.80, level: 'High', source: 'keyword_fallback' };
          break;
        }
      }
    }

    // 3. Document Title (Supports multi-line titles without getting cut off)
    const titleBlockMatch = text.match(/Title\s*[:\t]\s*\n?([\s\S]*?)(?=(?:SOP\s*No|Effective\s*Date|Next\s*Review|Area|Department|Page\s*No|Supersedes|1\.\s*OBJECTIVE|OBJECTIVE|$))/i);
    if (titleBlockMatch && titleBlockMatch[1]) {
      const cleanTitle = titleBlockMatch[1]
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !/^(Page\s*\d|Department|Area|Supersedes)/i.test(l))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanTitle.length >= 3) {
        extracted.title = cleanTitle;
        confidence.title = { score: 0.95, level: 'High', source: 'header_multiline' };
      }
    } else {
      const singleTitleMatch = text.match(/(?:Document\s*Title|Standard\s*Operating\s*Procedure|Title)\s*[:\t]\s*([^\r\n]{4,100})/i);
      if (singleTitleMatch) {
        extracted.title = singleTitleMatch[1].trim();
        confidence.title = { score: 0.85, level: 'High', source: 'regex_single' };
      }
    }

    // 4. Effective Date
    const effMatch = text.match(/(?:Effective\s*Date|Date\s*Effective)\s*[:\t]\s*([^\r\n]{4,30})/i);
    if (effMatch) {
      const isoEff = parseToIsoDate(effMatch[1]);
      if (isoEff) {
        extracted.effectiveDate = isoEff;
        confidence.effectiveDate = { score: 0.95, level: 'High', source: 'date_parser' };
      }
    }

    // 5. Review Date
    const revMatch = text.match(/(?:Next\s*Review\s*(?:\r?\n)?Date|Review\s*Date)\s*[:\t]\s*([^\r\n]{4,30})/i);
    if (revMatch) {
      const isoRev = parseToIsoDate(revMatch[1]);
      if (isoRev) {
        extracted.reviewDate = isoRev;
        confidence.reviewDate = { score: 0.95, level: 'High', source: 'date_parser' };
      }
    }

    // 6. Expiry Date
    const expMatch = text.match(/(?:Expiry\s*Date|Expiration\s*Date|Valid\s*Through)\s*[:\t]\s*([^\r\n]{4,30})/i);
    if (expMatch) {
      const isoExp = parseToIsoDate(expMatch[1]);
      if (isoExp) {
        extracted.expiryDate = isoExp;
        confidence.expiryDate = { score: 0.95, level: 'High', source: 'date_parser' };
      }
    }

    // 7. Version / Revision
    // Look for explicit Version: or Rev No:
    const verMatch = text.match(/(?:Version|Rev(?:ision)?|Ver)\s*(?:No)?\.?\s*[:\t]\s*([A-Za-z0-9.-]{1,10})/i);
    if (verMatch) {
      extracted.version = verMatch[1].trim();
      confidence.version = { score: 0.92, level: 'High', source: 'header_pattern' };
    } else if (extracted.documentNumber) {
      // Extract from document number suffix: e.g. SOP/QA/036-01 -> 01
      const suffix = extracted.documentNumber.match(/[-/](?:Rev|v|R)?([0-9]{1,3})$/i);
      if (suffix) {
        extracted.version = suffix[1].trim();
        confidence.version = { score: 0.88, level: 'High', source: 'docno_suffix' };
      }
    }

    // 8. Prepared By, Checked By, Approved By
    // Check table format:
    // Prepared By   Checked By   Approved By
    // Sign Himanshu Patil Himanshu Patil Himanshu Patil
    const signRowMatch = text.match(/Prepared\s*By\s+Checked\s*By\s+Approved\s*By[\s\S]*?Sign\s+([^\r\n]+)/i);
    if (signRowMatch) {
      const rawRow = signRowMatch[1].trim();
      const parts = rawRow.split(/\s{2,}|\t/).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 3) {
        extracted.preparedBy = parts[0];
        extracted.reviewedBy = parts[1];
        extracted.approvedBy = parts[2];
      } else {
        // If single space separated repeated names: e.g. "Himanshu Patil Himanshu Patil Himanshu Patil"
        const words = rawRow.split(' ').map(w => w.trim()).filter(Boolean);
        if (words.length === 6 && words[0] === words[2] && words[1] === words[3]) {
          const singleName = `${words[0]} ${words[1]}`;
          extracted.preparedBy = singleName;
          extracted.reviewedBy = singleName;
          extracted.approvedBy = singleName;
        } else if (words.length >= 2) {
          extracted.preparedBy = `${words[0]} ${words[1]}`;
        }
      }
      confidence.preparedBy = { score: 0.90, level: 'High', source: 'signoff_table' };
      confidence.reviewedBy = { score: 0.90, level: 'High', source: 'signoff_table' };
      confidence.approvedBy = { score: 0.90, level: 'High', source: 'signoff_table' };
    } else {
      const prepMatch = text.match(/(?:Prepared\s*By|Author|Issued\s*By)\s*[:\t]\s*([^\r\n]{2,35})/i);
      if (prepMatch) {
        extracted.preparedBy = prepMatch[1].trim();
        confidence.preparedBy = { score: 0.85, level: 'High', source: 'header_pattern' };
      }
      const chkMatch = text.match(/(?:Checked|Reviewed)\s*By\s*[:\t]\s*([^\r\n]{2,35})/i);
      if (chkMatch) {
        extracted.reviewedBy = chkMatch[1].trim();
        confidence.reviewedBy = { score: 0.85, level: 'High', source: 'header_pattern' };
      }
      const appMatch = text.match(/Approved\s*By\s*[:\t]\s*([^\r\n]{2,35})/i);
      if (appMatch) {
        extracted.approvedBy = appMatch[1].trim();
        confidence.approvedBy = { score: 0.85, level: 'High', source: 'header_pattern' };
      }
    }

    // 9. Batch Number & Product
    const batchMatch = text.match(/(?:Batch\s*(?:No|Number|#)|Lot\s*(?:No|Number|#))\s*[:\t]\s*([A-Za-z0-9-_]{3,25})/i);
    if (batchMatch) {
      extracted.batchNumber = batchMatch[1].trim();
      confidence.batchNumber = { score: 0.92, level: 'High', source: 'header_pattern' };
    }

    const prodMatch = text.match(/(?:Product\s*(?:Name)?|Material)\s*[:\t]\s*([^\r\n]{3,45})/i);
    if (prodMatch) {
      extracted.product = prodMatch[1].trim();
      confidence.product = { score: 0.90, level: 'High', source: 'header_pattern' };
    } else if (extracted.title) {
      if (/Finished\s*Product/i.test(extracted.title)) {
        extracted.product = 'Finished Product';
        confidence.product = { score: 0.80, level: 'High', source: 'title_inference' };
      }
    }

    // Fill defaults for fields not detected
    const allFields = ['documentNumber', 'title', 'version', 'department', 'product', 'batchNumber', 'effectiveDate', 'reviewDate', 'expiryDate', 'preparedBy', 'reviewedBy', 'approvedBy'];
    allFields.forEach(f => {
      if (!extracted[f]) {
        extracted[f] = '';
        confidence[f] = { score: 0.0, level: 'Low', source: 'not_detected' };
      }
    });

    return {
      success: true,
      numPages,
      textPreview: text.substring(0, 1500),
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
