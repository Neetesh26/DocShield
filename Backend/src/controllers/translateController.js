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
  'Approvals': 'स्वीकृतियां',
  'Review & Retention': 'समीक्षा एवं अवधारण',
  'Reports': 'रिपोर्ट्स एवं विश्लेषण',
  'Master Data': 'मास्टर डेटा',
  'Audit Trail': 'ऑडिट ट्रेल',
  'Settings': 'सिस्टम सेटिंग्स',
  'Collapse': 'संक्षिप्त करें',
  'Expand': 'विस्तृत करें',
  'Pharma Vault': 'फार्मा वॉल्ट',

  // Master Data & Modals
  'Master Data & Organizational Governance': 'मास्टर डेटा एवं संगठनात्मक शासन',
  'Configure pharmaceutical organizational departments, document taxonomy, physical storage coordinates, and authorized personnel.': 'फार्मास्युटिकल संगठनात्मक विभागों, दस्तावेज़ वर्गीकरण, भौतिक भंडारण निर्देशांक एवं अधिकृत कर्मियों को कॉन्फ़िगर करें।',
  '21 CFR Part 11 Validated': '21 CFR Part 11 सत्यापित',
  'DEPARTMENTS': 'विभाग',
  'DOCUMENT TYPES': 'दस्तावेज़ प्रकार',
  'STORAGE COORDINATES': 'भंडारण निर्देशांक',
  'AUTHORIZED PERSONNEL': 'अधिकृत कर्मी',
  'PERSONNEL': 'अधिकृत कर्मी',
  'Operating Functional Units': 'सक्रिय कार्यात्मक इकाइयां',
  'Controlled GxP Categories': 'नियंत्रित जीएक्सपी श्रेणियां',
  'Archive Vault Coordinates': 'संग्रह वॉल्ट निर्देशांक',
  'Authorized Signers & Staff': 'अधिकृत हस्ताक्षरकर्ता एवं स्टाफ',
  'Departments': 'विभाग',
  'Document Types': 'दस्तावेज़ प्रकार',
  'Storage Coordinates': 'भंडारण निर्देशांक',
  'Users & Signers': 'उपयोगकर्ता एवं हस्ताक्षरकर्ता',
  'Add Department': 'विभाग जोड़ें',
  'Add Document Type': 'दस्तावेज़ प्रकार जोड़ें',
  'Add Location': 'स्थान जोड़ें',
  'Add Personnel': 'कर्मी जोड़ें',
  'Add Authorized Personnel': 'अधिकृत कर्मी जोड़ें',
  'Configure Functional Department': 'कार्यात्मक विभाग कॉन्फ़िगर करें',
  'Register Controlled Document Taxonomy': 'नियंत्रित दस्तावेज़ वर्गीकरण पंजीकृत करें',
  'Register Physical Archive Location': 'भौतिक संग्रह स्थान पंजीकृत करें',
  'Create Department': 'विभाग बनाएं',
  'Create Document Type': 'दस्तावेज़ प्रकार बनाएं',
  'Create Location': 'स्थान बनाएं',
  'Create Personnel': 'कर्मी बनाएं',
  'Department Name': 'विभाग का नाम',
  'Department Code': 'विभाग कोड',
  'Department Head': 'विभाग प्रमुख',
  'Type Name': 'प्रकार का नाम',
  'Type Code': 'प्रकार कोड',
  'Doc Number Prefix': 'दस्तावेज़ संख्या उपसर्ग',
  'Retention Period (Years)': 'अवधारण अवधि (वर्ष)',
  'Review Cycle (Months)': 'समीक्षा चक्र (महीने)',
  'Coordinate Code': 'निर्देशांक कोड',
  'Building / Facility': 'भवन / सुविधा',
  'Room / Vault': 'कक्ष / वॉल्ट',
  'Rack ID': 'रैक आईडी',
  'Shelf ID': 'शेल्फ आईडी',
  'Bin / Slot': 'बिन / स्लॉट',
  'Total Capacity': 'कुल क्षमता',
  'Designated Department': 'नामित विभाग',
  'Full Name': 'पूरा नाम',
  'Corporate Email': 'कॉर्पोरेट ईमेल',
  'Temporary Password': 'अस्थायी पासवर्ड',
  'GxP System Role': 'जीएक्सपी सिस्टम भूमिका',
  'Designation': 'पद / पदनाम',
  'Contact Phone': 'संपर्क फ़ोन',
  'Filter departments...': 'विभाग खोजें...',
  'Filter document types...': 'दस्तावेज़ प्रकार खोजें...',
  'Filter storage locations...': 'भंडारण स्थान खोजें...',
  'Filter users...': 'उपयोगकर्ता खोजें...',
  'Active Functional Unit': 'सक्रिय कार्यात्मक इकाई',
  'Employee ID': 'कर्मचारी आईडी',
  'Staff': 'स्टाफ',
  'Employee': 'कर्मचारी',
  'Document Controller': 'दस्तावेज़ नियंत्रक',
  'QA Manager': 'गुणवत्ता आश्वासन प्रबंधक',
  'System Admin': 'सिस्टम व्यवस्थापक',
  'Admin': 'व्यवस्थापक',

  // Bulk Upload Page
  'Bulk Document Ingestion Queue': 'बल्क दस्तावेज़ इन्जेशन कतार',
  'Batch upload multiple pharmaceutical PDF records for high-throughput automated OCR extraction and indexing.': 'उच्च-क्षमता स्वचालित ओसीआर निष्कर्षण एवं अनुक्रमण हेतु एकाधिक फार्मास्युटिकल पीडीएफ रिकॉर्ड बैच अपलोड करें।',
  'High-throughput intelligent OCR document ingestion with automated AI classification, vault coordinate recommendation, and custody assignment.': 'स्वचालित एआई वर्गीकरण, वॉल्ट निर्देशांक अनुशंसा एवं कस्टडी असाइनमेंट के साथ बुद्धिमान ओसीआर दस्तावेज़ इन्जेशन।',
  'Add More PDFs': 'और पीडीएफ जोड़ें',
  'Drag & Drop pharmaceutical PDF records here': 'फार्मास्युटिकल पीडीएफ रिकॉर्ड यहां खींचें और छोड़ें',
  'Browse Local Files': 'लोकल फाइलें ब्राउज़ करें',
  'Processing queue': 'प्रोसेसिंग कतार',
  'Needs review': 'समीक्षा आवश्यक',
  'Needs review only': 'केवल समीक्षा आवश्यक',
  'Auto-place all': 'सभी को स्वतः स्थान दें',
  'Apply location to selected': 'चयनित पर स्थान लागू करें',
  'Assign custodian': 'कस्टोडियन नियुक्त करें',
  'Remove': 'हटाएं',
  'Ingest Documents': 'दस्तावेज़ इन्जेस्ट करें',
  'File': 'फ़ाइल',
  'Detected Type': 'पहचाना गया प्रकार',
  'Doc No.': 'दस्तावेज़ सं.',
  'Folder': 'फ़ोल्डर',
  'Conf.': 'विश्वास स्तर',
  'Location': 'स्थान',
  'Custodian': 'कस्टोडियन',
  'Not placed': 'स्थान नहीं दिया गया',
  'Ready': 'तैयार',
  'Ingested': 'इन्जेस्ट किया गया',
  'Ingesting...': 'इन्जेस्ट हो रहा है...',
  'Duplicate': 'डुप्लिकेट',
  'Duplicate detected': 'डुप्लिकेट मिला',
  'Needs review / no location': 'समीक्षा आवश्यक / स्थान नहीं',
  'Extracted Document Inspection': 'निष्कर्षित दस्तावेज़ निरीक्षण',
  'Confirm Ingestion Scope': 'इन्जेशन कार्यक्षेत्र की पुष्टि करें',
  'Auto-place All With AI & Ingest Everything': 'एआई से सभी को स्थान दें एवं पूर्ण इन्जेस्ट करें',
  'Ingest Only Ready Documents': 'केवल तैयार दस्तावेज़ इन्जेस्ट करें',
  'Cancel and Review Queue': 'रद्द करें एवं कतार देखें',
  'Save & Close': 'सहेजें एवं बंद करें',

  // Reports & Analytics Page
  'Executive Analytics & GxP Compliance Reports': 'कार्यकारी विश्लेषण एवं जीएक्सपी अनुपालन रिपोर्ट्स',
  'Real-time audit metrics, archive utilization, and 21 CFR Part 11 compliance tracking': 'वास्तविक समय ऑडिट मेट्रिक्स, संग्रह उपयोग एवं 21 CFR Part 11 अनुपालन ट्रैकिंग',
  'Monthly Ingestion Growth': 'मासिक दस्तावेज़ इन्जेशन वृद्धि',
  'Document Distribution by Type': 'प्रकार अनुसार दस्तावेज़ वितरण',
  'Vault Capacity Utilization': 'वॉल्ट क्षमता उपयोग',
  'Workflow Requests vs Approvals': 'अनुरोध बनाम स्वीकृतियां कार्यप्रवाह',
  'Audit Verification Status': 'ऑडिट सत्यापन स्थिति',
  'Departmental Document Volume': 'विभागीय दस्तावेज़ संख्या',
  'Document Lifecycle Status': 'दस्तावेज़ जीवनचक्र स्थिति',
  'Daily Processing Volume': 'दैनिक प्रोसेसिंग संख्या',
  'Documents Ingested': 'इन्जेस्ट किए गए दस्तावेज़',

  // Search Page
  'Advanced Document Search & Vault Intelligence': 'उन्नत दस्तावेज़ खोज एवं वॉल्ट इंटेलिजेंस',
  'Search across all physical and electronic documents with metadata filters and instant QR code retrieval': 'मेटाडेटा फ़िल्टर एवं त्वरित क्यूआर कोड पुनर्प्राप्ति के साथ सभी भौतिक और इलेक्ट्रॉनिक दस्तावेज़ों में खोजें',
  'All Departments': 'सभी विभाग',
  'All Types': 'सभी प्रकार',
  'All Statuses': 'सभी स्थितियां',
  'All Storage Locations': 'सभी भंडारण स्थान',
  'List View': 'सूची दृश्य',
  'Table View': 'तालिका दृश्य',
  'Grid View': 'ग्रिड दृश्य',
  'Sort By': 'क्रमबद्ध करें',
  'Date Created': 'निर्माण तिथि',
  'Effective Date': 'प्रभावी तिथि',
  'Document Number': 'दस्तावेज़ संख्या',
  'Title': 'शीर्षक',
  'Ascending': 'आरोही',
  'Descending': 'अवरोही',
  'Page': 'पृष्ठ',
  'of': 'का',
  'Showing': 'दिखा रहा है',
  'records': 'रिकॉर्ड',
  'No documents found': 'कोई दस्तावेज़ नहीं मिला',
  'Document Details': 'दस्तावेज़ विवरण',
  'View Document': 'दस्तावेज़ देखें',
  'Download PDF': 'पीडीएफ डाउनलोड करें',
  'Generate QR': 'क्यूआर उत्पन्न करें',

  // Repository & Physical Storage
  'Document Repository': 'दस्तावेज़ रिपॉजिटरी',
  'Physical and Electronic Document Archive': 'भौतिक एवं इलेक्ट्रॉनिक दस्तावेज़ संग्रह',
  'Upload New Document': 'नया दस्तावेज़ अपलोड करें',
  'Physical Vault Architecture & Coordinate Map': 'भौतिक वॉल्ट वास्तुकला एवं निर्देशांक मानचित्र',
  'Physical Audit Register': 'भौतिक ऑडिट रजिस्टर',
  'Physical Document Custody & Handovers': 'भौतिक दस्तावेज़ कस्टडी एवं हस्तांतरण',
  'Check Out Document': 'दस्तावेज़ चेक आउट करें',
  'Return Document': 'दस्तावेज़ वापस करें',
  'Transfer Custody': 'कस्टडी हस्तांतरित करें',
  'Accept Handover': 'हस्तांतरण स्वीकार करें',
  'Reject Handover': 'हस्तांतरण अस्वीकार करें',
  'My Pending Tasks': 'मेरे लंबित कार्य',
  'Document Requests': 'दस्तावेज़ अनुरोध',
  'Submit Request': 'अनुरोध जमा करें',
  'Audit Trail Logs': 'ऑडिट ट्रेल लॉग',
  'Immutable 21 CFR Part 11 Audit Trail': 'अपरिवर्तनीय 21 CFR Part 11 ऑडिट ट्रेल',
  'System Settings': 'सिस्टम सेटिंग्स',

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
