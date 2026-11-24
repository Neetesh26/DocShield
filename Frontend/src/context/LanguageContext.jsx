import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
];

// Enterprise GxP Instant Bilingual Dictionary
const INITIAL_TRANSLATIONS = {
  hi: {
    // Nav Groups
    'WORKSPACE': 'कार्यक्षेत्र',
    'PHYSICAL': 'भौतिक संग्रह',
    'WORKFLOW': 'कार्यप्रवाह',
    'GOVERNANCE': 'शासन एवं अनुपालन',

    // Nav Items
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

    // Top Header & Common
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
    'Cancel': 'रद्द करें',
    'Approve': 'स्वीकृति दें',
    'Reject': 'अस्वीकार करें',
    'Submit': 'जमा करें',
    'Sign & Approve': 'हस्ताक्षर एवं स्वीकृति',
    'Status': 'स्थिति',
    'Pending': 'लंबित',
    'Approved': 'स्वीकृत',
    'Rejected': 'अस्वीकृत',
    'Document': 'दस्तावेज़',
    'Department': 'विभाग',
    'Action': 'कार्रवाई',
    'Actions': 'कार्रवाइयां',
    'Requester': 'अनुरोधकर्ता',
    'Submitted': 'जमा किया गया',
    'Decisions': 'निर्णय',
    'Authorized Signer': 'अधिकृत हस्ताक्षरकर्ता',
    'Security Password': 'सुरक्षा पासवर्ड',
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

    // Dashboard & Metrics
    'Welcome back': 'पुनः स्वागत है',
    'Welcome back,': 'पुनः स्वागत है,',
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
    'Refresh': 'रिफ्रेश',
    'Syncing...': 'सिंक हो रहा है...',
    'GxP Document Repository Active': 'जीएक्सपी दस्तावेज़ रिपॉजिटरी सक्रिय',
    'Facility: Main Campus Vault': 'सुविधा: मुख्य परिसर वॉल्ट',
    'No storage facilities registered in database': 'डेटाबेस में कोई भंडारण सुविधा पंजीकृत नहीं है',
    'No recent documents ingested yet': 'अभी तक कोई हालिया दस्तावेज़ अपलोड नहीं हुआ',
    'Click to view vault coordinates': 'वॉल्ट निर्देशांक देखने के लिए क्लिक करें',
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

    // GxP Statuses
    'Effective': 'प्रभावी (Effective)',
    'Draft': 'प्रारूप (Draft)',
    'In Review': 'समीक्षाधीन (In Review)',
    'Obsolete': 'अप्रचलित (Obsolete)',
    'Stored': 'संग्रहीत (Stored)',
    'Checked Out': 'चेक आउट (Checked Out)',
    'In Transit': 'पारगमन में (In Transit)',
    'Archived': 'अभिलेखागार में (Archived)',
    'Available': 'उपलब्ध (Available)',
    'Full': 'पूर्ण (Full)',
    'Near Full': 'लगभग पूर्ण (Near Full)'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('app-language');
      if (saved && (saved === 'en' || saved === 'hi')) {
        return saved;
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  const [dictionary, setDictionary] = useState(INITIAL_TRANSLATIONS.hi);

  // Sync dictionary from backend translation API on load
  useEffect(() => {
    const fetchDictionary = async () => {
      try {
        const res = await fetch('/api/translate/dictionary?target=hi');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setDictionary(prev => ({
              ...prev,
              ...json.data
            }));
          }
        }
      } catch (e) {
        // use local dictionary if offline
      }
    };
    fetchDictionary();
  }, []);

  const changeLanguage = (langCode) => {
    if (langCode !== 'en' && langCode !== 'hi') return;
    setLanguageState(langCode);
    try {
      localStorage.setItem('app-language', langCode);
      document.documentElement.lang = langCode;
    } catch (e) {
      console.warn(e);
    }
  };

  // Pure Translation API caller for real-time phrase resolution
  const translateText = useCallback(async (text, target = 'hi') => {
    if (!text || target === 'en') return text;

    const trimmed = text.trim();
    if (dictionary[trimmed]) {
      return dictionary[trimmed];
    }

    try {
      const res = await fetch(`/api/translate?text=${encodeURIComponent(trimmed)}&target=hi`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.translated) {
          setDictionary(prev => ({
            ...prev,
            [trimmed]: json.data.translated
          }));
          return json.data.translated;
        }
      }
    } catch (e) {
      // ignore
    }

    return trimmed;
  }, [dictionary]);

  // Instant declarative translate function for React components
  const t = useCallback((text, fallback) => {
    if (!text) return '';
    if (language === 'en') {
      return text;
    }

    const trimmed = String(text).trim();

    if (dictionary[trimmed]) {
      return dictionary[trimmed];
    }

    // Case-insensitive lookup
    const lower = trimmed.toLowerCase();
    for (const [k, v] of Object.entries(dictionary)) {
      if (k.toLowerCase() === lower) {
        return v;
      }
    }

    return fallback !== undefined ? fallback : text;
  }, [language, dictionary]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
        translateText,
        languages: SUPPORTED_LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
