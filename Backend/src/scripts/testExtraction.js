const sampleOcr = `
Date: 08-Sep-2026 Request No: 080926-T020 Copy No.: 001
Document printed from master electronically & signature is not required. Issued By: Himanshu Patil
AGIO PHARMACEUTICALS LTD.
T - 81,82, M.I.D.C., Bhозari, Pune - 411 026
STANDARD OPERATING PROCEDURE
Department: Quality Aззuranсe Page No. 01 of 12
Title:
Finiзhed Prоduсt Speсifiсatiоn –
Preparatiоn, Review, Apprоval 
and Cоntrоl
SOP No.: SOP/QA/036-01
Effective Date: 21-Aug-2026
Area: Quality Aззuranсe
Next Review 
Date: 20-Aug-2029
Supersedes No.: SOP/QA/036-00
1. OBJECTIVE
The purpозe оf thiз Standard Operating Prосedure iз tо define the prосedure fоr 
preparatiоn, review, apprоval, iззuanсe, reviзiоn, diзtributiоn, periоdiс review and соntrоl оf 
Finiзhed Prоduсt Speсifiсatiоnз.
2. SCOPE
Thiз SOP iз appliсable tо all Finiзhed Prоduсt Speсifiсatiоnз prepared, reviewed, apprоved, 
reviзed and соntrоlled by the Quality Aззuranсe and Quality Cоntrоl departmentз at the 
manufaсturing faсility.
3. RESPONSIBILITY
3.1 Quality Cоntrоl
Prepared By Checked By Approved By
Sign Himanзhu Patil Himanзhu Patil Himanзhu Patil
Date 21-Aug-2026 21-Aug-2026 21-Aug-2026
Format No.: N/A
`;

// Helper: Normalize Cyrillic homoglyphs & special unicode quotes/dashes
function normalizeText(str) {
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
}

// Helper: Parse any date format to YYYY-MM-DD
function parseToIsoDate(dateStr) {
  if (!dateStr) return '';
  const clean = dateStr.trim();

  // Format: 21-Aug-2026 or 21/Aug/2026 or 21-August-2026
  const monthNames = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

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
    const p1 = parseInt(dmy[1], 10);
    const p2 = parseInt(dmy[2], 10);
    if (p1 > 12) {
      // DD-MM-YYYY
      return `${dmy[3]}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    } else {
      // Ambiguous or MM-DD-YYYY or DD-MM-YYYY, default to DD-MM-YYYY in pharma
      return `${dmy[3]}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
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
}

function extractGxPMetadata(rawText) {
  const text = normalizeText(rawText);
  const extracted = {};

  // 1. Document Number
  // Look for: SOP No.: SOP/QA/036-01, Doc No: ..., Document No: ..., Spec No: ..., etc.
  const docNoMatch = text.match(/(?:SOP|Document|Doc|Specification|Spec|Protocol|BMR|BPR|Format|Form)\s*(?:No|Number|#|ID)?\.?\s*[:\t]\s*([A-Za-z0-9/_.-]{3,35})/i);
  if (docNoMatch) {
    // Exclude if matched Supersedes No
    const prefix = text.substring(Math.max(0, docNoMatch.index - 15), docNoMatch.index).toLowerCase();
    if (!prefix.includes('supersedes')) {
      extracted.documentNumber = docNoMatch[1].trim();
    }
  }

  if (!extracted.documentNumber) {
    // Fallback: look for SOP/... or SOP-... or BMR-...
    const fallbackMatch = text.match(/\b(SOP[/-][A-Za-z0-9_/-]{3,30}|BMR[/-][A-Za-z0-9_/-]{3,30}|SPEC[/-][A-Za-z0-9_/-]{3,30}|VAL[/-][A-Za-z0-9_/-]{3,30})\b/i);
    if (fallbackMatch) {
      extracted.documentNumber = fallbackMatch[1].trim();
    }
  }

  // 2. Department
  const deptMatch = text.match(/(?:Department|Dept)\s*[:\t]\s*([^\r\n]{2,40})/i);
  if (deptMatch) {
    extracted.department = deptMatch[1].trim().replace(/\s+(Page\s+No.*|SOP.*)$/i, '').trim();
  } else {
    const depts = ['Quality Assurance', 'Quality Control', 'Production', 'Regulatory Affairs', 'Microbiology', 'Warehouse', 'R&D', 'Engineering'];
    for (const d of depts) {
      if (new RegExp('\\b' + d + '\\b', 'i').test(text)) {
        extracted.department = d;
        break;
      }
    }
  }

  // 3. Document Title
  // In table headers, Title: is followed by one or more lines until SOP No:, Effective Date:, Area:, etc.
  const titleBlockMatch = text.match(/Title\s*[:\t]\s*\n?([\s\S]*?)(?=(?:SOP\s*No|Effective\s*Date|Area|Department|Page\s*No|Supersedes|1\.\s*OBJECTIVE|OBJECTIVE|$))/i);
  if (titleBlockMatch && titleBlockMatch[1]) {
    const cleanTitle = titleBlockMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !/^(Page\s*\d|Department|Area)/i.test(l))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanTitle.length >= 3) {
      extracted.title = cleanTitle;
    }
  }

  // 4. Dates
  // Effective Date: 21-Aug-2026
  const effMatch = text.match(/Effective\s*Date\s*[:\t]\s*([^\r\n]{4,30})/i);
  if (effMatch) {
    extracted.effectiveDate = parseToIsoDate(effMatch[1]);
  }

  // Review Date / Next Review Date: 20-Aug-2029 (handle multiline: "Next Review \nDate: 20-Aug-2029")
  const revMatch = text.match(/(?:Next\s*Review\s*(?:\r?\n)?Date|Review\s*Date)\s*[:\t]\s*([^\r\n]{4,30})/i);
  if (revMatch) {
    extracted.reviewDate = parseToIsoDate(revMatch[1]);
  }

  // 5. Version / Revision
  // Check for: Rev No: 01, Version: 1.0, or from Document Number suffix e.g. SOP/QA/036-01 -> 01
  const verMatch = text.match(/(?:Version|Rev(?:ision)?|Ver)\s*(?:No)?\.?\s*[:\t]\s*([A-Za-z0-9.-]{1,10})/i);
  if (verMatch) {
    extracted.version = verMatch[1].trim();
  } else if (extracted.documentNumber) {
    const suffix = extracted.documentNumber.match(/[-/](?:Rev|v|R)?([0-9]{1,3})$/i);
    if (suffix) {
      extracted.version = suffix[1].trim();
    }
  }

  // 6. Prepared By, Checked By, Approved By
  // Handle table layout:
  // Prepared By Checked By Approved By
  // Sign Himanshu Patil Himanshu Patil Himanshu Patil
  const signRowMatch = text.match(/Prepared\s*By\s+Checked\s*By\s+Approved\s*By[\s\S]*?Sign\s+([^\r\n]+)/i);
  if (signRowMatch) {
    const names = signRowMatch[1].trim().split(/\s{2,}|\t/);
    if (names.length >= 1) extracted.preparedBy = names[0].trim();
    if (names.length >= 2) extracted.reviewedBy = names[1].trim();
    if (names.length >= 3) extracted.approvedBy = names[2].trim();
  } else {
    const prepMatch = text.match(/Prepared\s*By\s*[:\t]\s*([^\r\n]{2,35})/i);
    if (prepMatch) extracted.preparedBy = prepMatch[1].trim();
    const chkMatch = text.match(/(?:Checked|Reviewed)\s*By\s*[:\t]\s*([^\r\n]{2,35})/i);
    if (chkMatch) extracted.reviewedBy = chkMatch[1].trim();
    const appMatch = text.match(/Approved\s*By\s*[:\t]\s*([^\r\n]{2,35})/i);
    if (appMatch) extracted.approvedBy = appMatch[1].trim();
  }

  // Fallback for "Issued By: Himanshu Patil"
  if (!extracted.preparedBy) {
    const issuedMatch = text.match(/Issued\s*By\s*[:\t]\s*([^\r\n]{2,35})/i);
    if (issuedMatch) extracted.preparedBy = issuedMatch[1].trim();
  }

  // 7. Product / Material extraction from Title or Scope
  if (extracted.title) {
    const prodMatch = extracted.title.match(/(?:Specification\s+(?:for|of)|Record\s+for)\s+([A-Za-z0-9\s-]+?)(?:\s+–|\s+-|\s+Tablets|\s+Capsules|\s+Injection|\s+Solution|\s*$)/i);
    if (prodMatch) {
      extracted.product = prodMatch[1].trim();
    } else if (/Finished\s*Product/i.test(extracted.title)) {
      extracted.product = 'Finished Product';
    }
  }

  return extracted;
}

console.log('--- TEST EXTRACTION RESULT ---');
const result = extractGxPMetadata(sampleOcr);
console.log(JSON.stringify(result, null, 2));

