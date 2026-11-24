import { sendSuccess, sendError } from '../utils/response.js';

// Comprehensive GxP Pharmaceutical Bilingual Dictionary (English <-> Hindi)
export const GXP_DICTIONARY = {
  // Navigation & Group Titles
  'WORKSPACE': 'कार्यक्षेत्र',
  'PHYSICAL': 'भौतिक संग्रह',
  'WORKFLOW': 'कार्यप्रवाह',
  'GOVERNANCE': 'शासन एवं अनुपालन',
  'Dashboard': 'डैशबोर्ड',
  'Search': 'खोजें',
  'Repository': 'दस्तावेज़ रिपॉजिटरी',
  'Upload': 'दस्तावेज़ अपलोड',
  'Bulk Upload': 'बल्क अपलोड',
  'Scan QR': 'स्कैन क्यूआर',
  'Storage Map': 'स्टोरेज मैप',
  'Custody & Handovers': 'कस्टडी एवं हैंडओवर',
  'Check-out Register': 'चेक-आउट रजिस्टर',
  'Physical Audit': 'भौतिक ऑडिट',
  'My Tasks': 'मेरे कार्य',
  'Requests': 'अनुरोध सूची',
  'Approvals': 'स्वीकृतियां (Approvals)',
  'Review & Retention': 'समीक्षा एवं अवधारण',
  'Reports': 'रिपोर्ट्स एवं विश्लेषण',
  'Master Data': 'मास्टर डेटा',
  'Audit Trail': 'ऑडिट ट्रेल',
  'Settings': 'सिस्टम सेटिंग्स',
  'Collapse': 'संक्षिप्त करें',
  'Expand': 'विस्तृत करें',
  'Pharma Vault': 'फार्मा वॉल्ट',

  // Top Header
  'Search repository by Doc #, title, or keywords...': 'दस्तावेज़ संख्या, शीर्षक या कीवर्ड द्वारा खोजें...',
  'Change Language': 'भाषा बदलें',
  'Select Language': 'अपनी पसंदीदा भाषा चुनें',
  'Select your preferred language': 'अपनी पसंदीदा भाषा चुनें',
  'Language': 'भाषा',
  'Switch to Light Mode': 'लाइट मोड में बदलें',
  'Switch to Dark Mode': 'डार्क मोड में बदलें',
  'Notifications': 'अधिसूचनाएं',
  'Mark all as read': 'सभी को पढ़ा हुआ चिह्नित करें',
  'Profile': 'प्रोफ़ाइल',
  'Sign Out': 'लॉग आउट',

  // Dashboard Greeting & Bar
  'Welcome back': 'पुनः स्वागत है',
  'Welcome back,': 'पुनः स्वागत है,',
  'Refresh': 'रिफ्रेश',
  'Syncing...': 'सिंक हो रहा है...',
  'GxP Document Repository Active': 'जीएक्सपी दस्तावेज़ रिपॉजिटरी सक्रिय',
  'Facility: Main Campus Vault': 'सुविधा: मुख्य परिसर वॉल्ट',
  'Quick Inquiries:': 'त्वरित पूछताछ:',
  'Search repository by document number, title, formulation, API, or department (e.g. \'HPLC SOP\', \'Paracetamol BMR\')...': 'दस्तावेज़ संख्या, शीर्षक, फ़ॉर्मूलेशन, एपीआई या विभाग द्वारा खोजें...',
  'No documents indexed in database yet': 'डेटाबेस में अभी तक कोई दस्तावेज़ अनुक्रमित नहीं है',
  'Documents Uploaded': 'दस्तावेज़ अपलोड किए गए',
  'No recent document ingestions found in database': 'डेटाबेस में कोई हालिया दस्तावेज़ संग्रह नहीं मिला',
  'View': 'देखें',
  'Total': 'कुल',
  'Browse': 'ब्राउज़ करें',
  'last 12 months': 'पिछले 12 महीने',
  'Doc #': 'दस्तावेज़ #',
  'Rev': 'संस्करण',

  // Dashboard KPI Stat Cards
  'Total Documents': 'कुल दस्तावेज़',
  'All active indexed records': 'सभी सक्रिय अनुक्रमित रिकॉर्ड',
  'Effective Documents': 'प्रभावी दस्तावेज़',
  'Released & verified': 'जारी एवं सत्यापित',
  'Pending Approvals': 'लंबित स्वीकृतियां',
  '21 CFR sign-off needed': '21 CFR हस्ताक्षर आवश्यक',
  'Pending Requests': 'लंबित अनुरोध',
  'Issuance & revision queues': 'जारी एवं संशोधन कतार',
  'Due for Review': 'समीक्षा हेतु देय',
  'Approaching review cycle': 'समीक्षा चक्र निकट',
  'Overdue Checkouts': 'विलंबित चेक-आउट',
  'Physical loans past return date': 'वापसी तिथि से अधिक भौतिक ऋण',
  'Pending Handovers': 'लंबित हैंडओवर',
  'Custody transfer confirmations': 'कस्टडी हस्तांतरण पुष्टि',
  'Uploaded Recently': 'हाल ही में अपलोड',
  'Past 30 days intake': 'पिछले 30 दिनों का संग्रह',

  // Quick Launch Actions
  'QUICK LAUNCH ACTIONS (CLICKABLE)': 'त्वरित कार्य (क्लिक करें)',
  'Quick Launch Actions': 'त्वरित कार्य',
  'Upload Document': 'दस्तावेज़ अपलोड करें',
  'Search Archive': 'अभिलेखागार खोजें',
  'Scan QR Label': 'क्यूआर लेबल स्कैन करें',
  'Bulk Ingestion': 'बल्क इन्जेशन',
  'New Request': 'नया अनुरोध',
  'Check Out Record': 'रिकॉर्ड चेक आउट करें',
  'Custody Handover': 'कस्टडी हस्तांतरण',

  // Chart Titles & Widgets
  'Documents by Type': 'दस्तावेज़ प्रकार अनुसार',
  'Uploads over time': 'समय के साथ अपलोड',
  'Physical Vault Utilization': 'भौतिक वॉल्ट उपयोग',
  'Recent Repository Ingestions': 'हाल के दस्तावेज़ संग्रह',
  'Recent Repository Ingestions (Live API Data)': 'हाल के दस्तावेज़ संग्रह (लाइव डेटा)',
  'View all': 'सभी देखें',
  'No storage facilities registered in database': 'डेटाबेस में कोई भंडारण सुविधा पंजीकृत नहीं है',
  'No recent documents ingested yet': 'अभी तक कोई हालिया दस्तावेज़ अपलोड नहीं हुआ',
  'Click to view vault coordinates': 'वॉल्ट निर्देशांक देखने के लिए क्लिक करें',

  // Common UI Terms
  'Status': 'स्थिति',
  'Action': 'कार्रवाई',
  'Actions': 'कार्रवाइयां',
  'Department': 'विभाग',
  'Custodian': 'कस्टोडियन',
  'Location': 'स्थान',
  'Title': 'शीर्षक',
  'Version': 'संस्करण',
  'Rev': 'संशोधन',
  'Type': 'प्रकार',
  'Cancel': 'रद्द करें',
  'Submit': 'जमा करें',
  'Save': 'सहेजें',
  'Save Changes': 'परिवर्तन सहेजें',
  'Approve': 'स्वीकृति दें',
  'Reject': 'अस्वीकार करें',
  'Open': 'खोलें',
  'Relocate': 'स्थानांतरित करें',
  'Download': 'डाउनलोड करें',
  'Print': 'प्रिंट करें',
  'Close': 'बंद करें',
  'Back': 'वापस',
  'Next': 'आगे',
  'Search...': 'खोजें...',
  'Filter': 'फ़िल्टर',
  'Reset': 'रीसेट करें',
  'All Statuses': 'सभी स्थितियां',
  'All Departments': 'सभी विभाग',
  'All Types': 'सभी प्रकार',
  'All Physical States': 'सभी भौतिक स्थितियां',

  // GxP Statuses & Physical States
  'Effective': 'प्रभावी (Effective)',
  'Draft': 'प्रारूप (Draft)',
  'In Review': 'समीक्षाधीन (In Review)',
  'Approved': 'स्वीकृत (Approved)',
  'Rejected': 'अस्वीकृत (Rejected)',
  'Pending': 'लंबित (Pending)',
  'Obsolete': 'अप्रचलित (Obsolete)',
  'Stored': 'संग्रहीत (Stored)',
  'Checked Out': 'चेक आउट (Checked Out)',
  'In Transit': 'पारगमन में (In Transit)',
  'Archived': 'अभिलेखागार में (Archived)',
  'Available': 'उपलब्ध (Available)',
  'Full': 'पूर्ण (Full)',
  'Near Full': 'लगभग पूर्ण (Near Full)'
};

// In-memory cache for dynamic translations
const dynamicTranslationCache = new Map();

/**
 * GET /api/translate?text=...&target=hi
 */
export const getTranslation = async (req, res, next) => {
  try {
    const { text, target = 'hi' } = req.query;

    if (!text) {
      return sendError(res, 'Text parameter is required', 400);
    }

    if (target !== 'hi' && target !== 'en') {
      return sendError(res, 'Only English (en) and Hindi (hi) languages are supported', 400);
    }

    if (target === 'en') {
      // If English requested, find inverse match if Hindi text was supplied, or return text
      for (const [enKey, hiVal] of Object.entries(GXP_DICTIONARY)) {
        if (hiVal.toLowerCase() === text.trim().toLowerCase()) {
          return sendSuccess(res, 'Translation retrieved', { original: text, translated: enKey, target });
        }
      }
      return sendSuccess(res, 'Translation retrieved', { original: text, translated: text, target });
    }

    // 1. Instant GxP Dictionary Match (Exact)
    const trimmed = text.trim();
    if (GXP_DICTIONARY[trimmed]) {
      return sendSuccess(res, 'Translation retrieved', {
        original: text,
        translated: GXP_DICTIONARY[trimmed],
        target,
        source: 'gxp_dictionary'
      });
    }

    // 2. Case-insensitive dictionary search
    const lowerKey = trimmed.toLowerCase();
    for (const [enKey, hiVal] of Object.entries(GXP_DICTIONARY)) {
      if (enKey.toLowerCase() === lowerKey) {
        return sendSuccess(res, 'Translation retrieved', {
          original: text,
          translated: hiVal,
          target,
          source: 'gxp_dictionary_ci'
        });
      }
    }

    // 3. Cache Match
    const cacheKey = `trans_hi_${trimmed}`;
    if (dynamicTranslationCache.has(cacheKey)) {
      return sendSuccess(res, 'Translation retrieved from cache', {
        original: text,
        translated: dynamicTranslationCache.get(cacheKey),
        target,
        source: 'memory_cache'
      });
    }

    // 4. Fallback online translation via MyMemory API
    try {
      const params = new URLSearchParams({ q: trimmed, langpair: 'en|hi' });
      const apiRes = await fetch(`https://api.mymemory.translated.net/get?${params}`);
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          const transResult = data.responseData.translatedText;
          dynamicTranslationCache.set(cacheKey, transResult);
          return sendSuccess(res, 'Translation retrieved from service', {
            original: text,
            translated: transResult,
            target,
            source: 'online_service'
          });
        }
      }
    } catch (e) {
      // ignore network errors, fallback to text
    }

    return sendSuccess(res, 'Translation retrieved', {
      original: text,
      translated: text,
      target,
      source: 'fallback'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/translate/batch
 * Body: { texts: ["Dashboard", "Total Documents"], target: "hi" }
 */
export const getBatchTranslations = async (req, res, next) => {
  try {
    const { texts = [], target = 'hi' } = req.body;

    if (!Array.isArray(texts)) {
      return sendError(res, 'texts must be an array of strings', 400);
    }

    if (target !== 'hi' && target !== 'en') {
      return sendError(res, 'Only English (en) and Hindi (hi) languages are supported', 400);
    }

    const results = {};

    for (const item of texts) {
      if (typeof item !== 'string' || !item.trim()) continue;
      const clean = item.trim();

      if (target === 'en') {
        results[clean] = clean;
        continue;
      }

      if (GXP_DICTIONARY[clean]) {
        results[clean] = GXP_DICTIONARY[clean];
        continue;
      }

      const lowerKey = clean.toLowerCase();
      let found = false;
      for (const [enKey, hiVal] of Object.entries(GXP_DICTIONARY)) {
        if (enKey.toLowerCase() === lowerKey) {
          results[clean] = hiVal;
          found = true;
          break;
        }
      }

      if (!found) {
        results[clean] = dynamicTranslationCache.get(`trans_hi_${clean}`) || clean;
      }
    }

    return sendSuccess(res, 'Batch translations retrieved', {
      translations: results,
      target
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/translate/dictionary?target=hi
 * Return the full instant dictionary for zero-latency client hydration
 */
export const getDictionary = async (req, res, next) => {
  try {
    const target = req.query.target || 'hi';
    if (target === 'hi') {
      return sendSuccess(res, 'GxP Hindi Dictionary retrieved', GXP_DICTIONARY);
    }
    return sendSuccess(res, 'Dictionary retrieved', {});
  } catch (error) {
    next(error);
  }
};
