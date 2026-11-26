import fs from 'fs';
import zlib from 'zlib';
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

  // Format: 21-Aug-2026 or 21/Aug/2026 or 21-August-2026 or 24-Nov-2026
  const dayMonYear = clean.match(/^(\d{1,2})[-/\s]+([A-Za-z]{3,9})[-/\s]+(\d{2,4})/);
  if (dayMonYear) {
    const day = dayMonYear[1].padStart(2, '0');
    const monStr = dayMonYear[2].toLowerCase().substring(0, 3);
    const month = monthNames[monStr] || '01';
    let year = dayMonYear[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // Format: August 21, 2026 or Nov 21 2026
  const monDayYear = clean.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})/);
  if (monDayYear) {
    const monStr = monDayYear[1].toLowerCase().substring(0, 3);
    const month = monthNames[monStr] || '01';
    const day = monDayYear[2].padStart(2, '0');
    let year = monDayYear[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // Format: DD-MM-YYYY or DD/MM/YYYY
  const dmy = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  // Format: YYYY-MM-DD
  const ymd = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  }

  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
};

// Robust PDF Text Extractor handling:
// 1. Standard text streams
// 2. FlateDecode compressed streams via zlib
// 3. Hexadecimal encoded text strings <48616E64...> Tj
// 4. Literal strings (Text) Tj
// 5. Array text operators [(T) 10 (e) ...] TJ
export const extractPdfRawText = (dataBuffer) => {
  const textPieces = [];

  // Pass 1: Try pdf-parse
  // (We do this in a try/catch, if it works we store its text)
  let parsedText = '';

  // Pass 2: Comprehensive stream extraction (uncompressed + zlib decompressed)
  let pos = 0;
  while (pos < dataBuffer.length) {
    const streamStart = dataBuffer.indexOf('stream', pos);
    if (streamStart === -1) break;

    const dictStart = dataBuffer.lastIndexOf('<<', streamStart);
    const dictStr = dictStart !== -1 ? dataBuffer.slice(dictStart, streamStart).toString('latin1') : '';
    const isFlate = dictStr.includes('FlateDecode');

    let contentStart = streamStart + 6;
    if (dataBuffer[contentStart] === 0x0d && dataBuffer[contentStart + 1] === 0x0a) contentStart += 2;
    else if (dataBuffer[contentStart] === 0x0a || dataBuffer[contentStart] === 0x0d) contentStart += 1;

    const streamEnd = dataBuffer.indexOf('endstream', contentStart);
    if (streamEnd === -1) break;

    const streamData = dataBuffer.slice(contentStart, streamEnd);
    let decodedText = '';

    if (isFlate) {
      try {
        const decompressed = zlib.inflateSync(streamData);
        decodedText = decompressed.toString('latin1');
      } catch (err) {
        try {
          const decompressed = zlib.inflateRawSync(streamData);
          decodedText = decompressed.toString('latin1');
        } catch (err2) {
          decodedText = streamData.toString('latin1');
        }
      }
    } else {
      decodedText = streamData.toString('latin1');
    }

    if (decodedText) {
      // Decode hex strings: <48616E646F766572...> Tj
      const hexMatches = decodedText.matchAll(/<([0-9a-fA-F]+)>\s*Tj/g);
      for (const m of hexMatches) {
        const hex = m[1];
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        textPieces.push(str);
      }

      // Decode parenthesized strings: (Hello World) Tj
      const parenMatches = decodedText.matchAll(/\(([^()]+)\)\s*Tj/g);
      for (const m of parenMatches) {
        textPieces.push(m[1]);
      }

      // Decode TJ array operators: [(Hello) 10 (World)] TJ or [<4865> 10 <6C6C>] TJ
      const tjMatches = decodedText.matchAll(/\[([\s\S]*?)\]\s*TJ/g);
      for (const m of tjMatches) {
        const inner = m[1];
        const innerParen = inner.matchAll(/\(([^()]+)\)/g);
        for (const p of innerParen) {
          textPieces.push(p[1]);
        }
        const innerHex = inner.matchAll(/<([0-9a-fA-F]+)>/g);
        for (const h of innerHex) {
          const hex = h[1];
          let str = '';
          for (let i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
          }
          textPieces.push(str);
        }
      }
    }

    pos = streamEnd + 9;
  }

  // Also extract uncompressed text outside streams if any
  const rawStr = dataBuffer.toString('latin1');
  const topText = rawStr.match(/\(([^()]{3,100})\)\s*Tj/g);
  if (topText) {
    topText.forEach(t => textPieces.push(t.replace(/^\(|\)\s*Tj$/g, '')));
  }

  return textPieces.join('\n');
};

export const extractPdfMetadata = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    let rawText = '';
    let numPages = 1;

    // Try standard pdfParse first
    try {
      const pdfData = await pdfParse(dataBuffer);
      if (pdfData && pdfData.text && pdfData.text.trim().length > 30) {
        rawText = pdfData.text;
        numPages = pdfData.numpages || 1;
      }
    } catch (pdfErr) {
      // pdfParse failed or stream compressed differently
    }

    // Always run robust stream & hex extraction to ensure nothing is missed
    const streamExtractedText = extractPdfRawText(dataBuffer);
    if (!rawText || rawText.trim().length < streamExtractedText.trim().length) {
      rawText = streamExtractedText + '\n' + rawText;
    } else {
      rawText = rawText + '\n' + streamExtractedText;
    }

    const text = normalizeText(rawText);

    const extracted = {};
    const confidence = {};

    // 1. Document Number
    // Matches:
    // a) Header with colon: SOP No: SOP/QA/036-01, Doc #: ..., Protocol No: ...
    // b) Handover Note HO-0001 or HO-0001 or HND-2026-0001
    // c) Table column: Doc No. followed by SOP/QA/019 or SOP-PR-0105
    // d) Standalone GxP codes: SOP/QA/..., SOP-QA-..., BMR/..., SPEC/..., VAL/...
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

    // Check for Handover Note HO-XXXX or HND-XXXX
    if (!extracted.documentNumber) {
      const handoverMatch = text.match(/(?:Handover\s*(?:Note|No|#)?\s*(?:No)?\.?\s*[:\s-]*\s*)(HO-[0-9]{3,6}|HND-[A-Za-z0-9-]+)/i);
      if (handoverMatch) {
        extracted.documentNumber = handoverMatch[1].trim();
        confidence.documentNumber = { score: 0.95, level: 'High', source: 'handover_pattern' };
      }
    }

    // Check for Change Control or Deviation: CC-QA-2026-009, DEV-2026-001
    if (!extracted.documentNumber) {
      const ccDevMatch = text.match(/\b(CC-[A-Za-z0-9-_/]{3,25}|DEV-[A-Za-z0-9-_/]{3,25}|CAPA-[A-Za-z0-9-_/]{3,25}|HND-[A-Za-z0-9-_/]{3,25})\b/i);
      if (ccDevMatch) {
        extracted.documentNumber = ccDevMatch[1].trim();
        confidence.documentNumber = { score: 0.92, level: 'High', source: 'gxp_prefix_match' };
      }
    }

    // Check for Table column Doc No. followed by document code
    if (!extracted.documentNumber) {
      const tableDocMatch = text.match(/Doc\s*No\.?\s*\n?(?:Ver|Rev)?\s*\n?(?:Title)?[\s\S]*?([A-Za-z]{2,5}[/-][A-Za-z0-9/_.-]{3,25})/i);
      if (tableDocMatch) {
        extracted.documentNumber = tableDocMatch[1].trim();
        confidence.documentNumber = { score: 0.88, level: 'High', source: 'table_column_match' };
      }
    }

    // Fallback: any standard GxP document number pattern in the text
    if (!extracted.documentNumber) {
      const fallbackCode = text.match(/\b(SOP[/-][A-Za-z0-9/_.-]{3,30}|BMR[/-][A-Za-z0-9/_.-]{3,30}|BPR[/-][A-Za-z0-9/_.-]{3,30}|SPEC[/-][A-Za-z0-9/_.-]{3,30}|VAL[/-][A-Za-z0-9/_.-]{3,30}|DOC[/-][A-Za-z0-9/_.-]{3,30}|HO-[0-9]{3,6})\b/i);
      if (fallbackCode) {
        extracted.documentNumber = fallbackCode[1].trim();
        confidence.documentNumber = { score: 0.85, level: 'High', source: 'code_fallback' };
      }
    }

    // 2. Version / Revision
    const verMatch = text.match(/(?:Version|Rev(?:ision)?|Ver)\s*(?:No)?\.?\s*[:\t\s]\s*([vV]?[0-9]{1,3}(?:\.[0-9]{1,3})?)/i);
    if (verMatch) {
      extracted.version = verMatch[1].replace(/^[vV]/, '').trim();
      confidence.version = { score: 0.95, level: 'High', source: 'version_pattern' };
    } else if (text.match(/\b(v[0-9]{2})\b/i)) {
      const vMatch = text.match(/\b(v[0-9]{2})\b/i);
      extracted.version = vMatch[1].replace(/^v/i, '').trim();
      confidence.version = { score: 0.90, level: 'High', source: 'v_token' };
    } else if (extracted.documentNumber) {
      const suffix = extracted.documentNumber.match(/[-/](?:Rev|v|R)?([0-9]{1,3})$/i);
      if (suffix) {
        extracted.version = suffix[1].trim();
        confidence.version = { score: 0.85, level: 'Medium', source: 'docno_suffix' };
      }
    }
    if (!extracted.version) {
      extracted.version = '1.0';
    }

    // 3. Document Title
    // a) Check for multi-line Title: block
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
    }

    // b) Check for Handover Note: Handover Note HO-0001
    if (!extracted.title) {
      const handoverTitleMatch = text.match(/(Handover\s*Note\s*(?:HO-[0-9]{3,6}|HND-[A-Za-z0-9-]+)?)/i);
      if (handoverTitleMatch) {
        extracted.title = handoverTitleMatch[1].trim();
        confidence.title = { score: 0.92, level: 'High', source: 'handover_title' };
      }
    }

    // c) Check single line Title: ...
    if (!extracted.title) {
      const singleTitleMatch = text.match(/(?:Document\s*Title|Standard\s*Operating\s*Procedure|Title)\s*[:\t]\s*([^\r\n]{4,100})/i);
      if (singleTitleMatch) {
        extracted.title = singleTitleMatch[1].trim();
        confidence.title = { score: 0.85, level: 'High', source: 'regex_single' };
      }
    }

    // d) Check table title column
    if (!extracted.title) {
      const tableTitleMatch = text.match(/(?:Cleaning\s*and\s*Sanitizati[^\n]*|Operation\s*and\s*Calibration[^\n]*|User\s*Access\s*Management[^\n]*|Aseptic\s*Media\s*Fill[^\n]*|Master\s*Batch\s*Manufacturing[^\n]*)/i);
      if (tableTitleMatch) {
        extracted.title = tableTitleMatch[0].trim();
        confidence.title = { score: 0.88, level: 'High', source: 'table_title_inference' };
      }
    }

    // 4. Department
    const deptMatch = text.match(/(?:Department|Dept)\s*[:\t]\s*([^\r\n]{2,40})/i);
    if (deptMatch) {
      const rawDept = deptMatch[1].trim().replace(/\s+(Page\s+No.*|SOP.*)$/i, '').trim();
      extracted.department = rawDept;
      confidence.department = { score: 0.92, level: 'High', source: 'header_pattern' };
    } else {
      const knownDepts = [
        'Quality Assurance', 
        'Quality Control', 
        'Production', 
        'Regulatory Affairs', 
        'Microbiology', 
        'Warehouse', 
        'R&D', 
        'Engineering', 
        'Document Control'
      ];
      for (const d of knownDepts) {
        if (new RegExp('\\b' + d + '\\b', 'i').test(text)) {
          extracted.department = d;
          confidence.department = { score: 0.85, level: 'High', source: 'keyword_fallback' };
          break;
        }
      }
      if (!extracted.department && /QA/i.test(text)) {
        extracted.department = 'Quality Assurance';
        confidence.department = { score: 0.80, level: 'Medium', source: 'qa_abbreviation' };
      }
    }

    // 5. Dates (Effective, Review, Expiry, or Generated/Initiated)
    const effMatch = text.match(/(?:Effective\s*Date|Date\s*Effective|Initiated|Generated|Date)\s*[:\t]\s*([^\r\n]{4,30})/i);
    if (effMatch) {
      const isoEff = parseToIsoDate(effMatch[1]);
      if (isoEff) {
        extracted.effectiveDate = isoEff;
        confidence.effectiveDate = { score: 0.95, level: 'High', source: 'date_parser' };
      }
    }

    const revMatch = text.match(/(?:Next\s*Review\s*(?:\r?\n)?Date|Review\s*Date)\s*[:\t]\s*([^\r\n]{4,30})/i);
    if (revMatch) {
      const isoRev = parseToIsoDate(revMatch[1]);
      if (isoRev) {
        extracted.reviewDate = isoRev;
        confidence.reviewDate = { score: 0.95, level: 'High', source: 'date_parser' };
      }
    }

    const expMatch = text.match(/(?:Expiry\s*Date|Expiration\s*Date|Valid\s*Through)\s*[:\t]\s*([^\r\n]{4,30})/i);
    if (expMatch) {
      const isoExp = parseToIsoDate(expMatch[1]);
      if (isoExp) {
        extracted.expiryDate = isoExp;
        confidence.expiryDate = { score: 0.95, level: 'High', source: 'date_parser' };
      }
    }

    // 6. Signers (Prepared By, Reviewed By, Approved By, Handed Over By)
    const prepMatch = text.match(/(?:Prepared\s*By|Author|Issued\s*By|From|Handed\s*over\s*by|Generated[^\n]*by)\s*[:\t\s-]\s*([A-Za-z\s.]{3,40})/i);
    if (prepMatch) {
      let name = prepMatch[1].split('\n')[0].trim();
      name = name.replace(/(?:To|Date|Handed|Status|Handover|Generated|Initiated).*$/i, '').trim();
      if (name.length >= 3) {
        extracted.preparedBy = name;
        confidence.preparedBy = { score: 0.90, level: 'High', source: 'signer_pattern' };
      }
    }

    const chkMatch = text.match(/(?:Checked\s*By|Reviewed\s*By|To|Received\s*By)\s*[:\t\s-]\s*([A-Za-z\s.]{3,40})/i);
    if (chkMatch) {
      let name = chkMatch[1].split('\n')[0].trim();
      name = name.replace(/(?:Date|Reason|Signatures|Handed|Status).*$/i, '').trim();
      if (name.length >= 3) {
        extracted.reviewedBy = name;
        confidence.reviewedBy = { score: 0.88, level: 'High', source: 'receiver_pattern' };
      }
    }

    const appMatch = text.match(/Approved\s*By\s*[:\t\s-]\s*([A-Za-z\s.]{3,30})/i);
    if (appMatch) {
      extracted.approvedBy = appMatch[1].trim();
      confidence.approvedBy = { score: 0.88, level: 'High', source: 'approver_pattern' };
    }

    // 7. Batch Number & Product
    const batchMatch = text.match(/(?:Batch\s*(?:No|Number|#)|Lot\s*(?:No|Number|#))\s*[:\t]\s*([A-Za-z0-9-_]{3,25})/i);
    if (batchMatch) {
      extracted.batchNumber = batchMatch[1].trim();
      confidence.batchNumber = { score: 0.92, level: 'High', source: 'header_pattern' };
    }

    const prodMatch = text.match(/(?:Product\s*(?:Name)?|Material)\s*[:\t]\s*([^\r\n]{3,45})/i);
    if (prodMatch) {
      extracted.product = prodMatch[1].trim();
      confidence.product = { score: 0.90, level: 'High', source: 'header_pattern' };
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
      extractionSource: 'pdf-stream-zlib-decompressor'
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
