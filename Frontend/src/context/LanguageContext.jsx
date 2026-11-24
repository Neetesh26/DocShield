import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
];

// Enterprise GxP Instant Dictionary
const TRANSLATIONS = {
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

    // Top Header & Common
    'Search repository by Doc #, title, or keywords...': 'दस्तावेज़ संख्या, शीर्षक या कीवर्ड द्वारा खोजें...',
    'Change Language': 'भाषा बदलें',
    'Select Language': 'अपनी पसंदीदा भाषा चुनें',
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
    'Requester': 'अनुरोधकर्ता',
    'Submitted': 'जमा किया गया',
    'Decisions': 'निर्णय',
    'Pharma Vault': 'फार्मा वॉल्ट',
    'Authorized Signer': 'अधिकृत हस्ताक्षरकर्ता',
    'Security Password': 'सुरक्षा पासवर्ड',

    // Dashboard & Metrics
    'Welcome back': 'पुनः स्वागत है',
    'Total Documents': 'कुल दस्तावेज़',
    'Approved Documents': 'स्वीकृत दस्तावेज़',
    'Active Checkouts': 'सक्रिय चेक-आउट',
    'Overdue Documents': 'विलंबित दस्तावेज़',
    'Physical Archives': 'भौतिक अभिलेखागार',
    'In Custody': 'कस्टडी में',
    'Uploaded Recently': 'हाल ही में अपलोड',
    'Quick Launch Actions (Clickable)': 'त्वरित कार्य (क्लिक करें)',
    'Upload Document': 'दस्तावेज़ अपलोड करें',
    'Search Archive': 'अभिलेखागार खोजें',
    'Scan QR Label': 'क्यूआर लेबल स्कैन करें',
    'Bulk Ingestion': 'बल्क इन्जेशन',
    'New Request': 'नया अनुरोध',
    'Check Out Record': 'रिकॉर्ड चेक आउट करें',
    'Custody Handover': 'कस्टडी हस्तांतरण',
    'Recent Ingestions': 'हाल के दस्तावेज़',
    'Storage Utilization': 'भंडारण उपयोग',
    'Quick Inquiries:': 'त्वरित पूछताछ:',
    'Refresh': 'रिफ्रेश',
    'Syncing...': 'सिंक हो रहा है...',
    'Past 30 days intake': 'पिछले 30 दिनों का इनटेक',
    'Active GxP Repository': 'सक्रिय जीएक्सपी रिपॉजिटरी',
    'Custody transfer confirmations': 'कस्टडी हस्तांतरण पुष्टि',
    'Overdue return alerts': 'विलंबित वापसी अलर्ट',
    'Physical secure location count': 'भौतिक सुरक्षित स्थान संख्या',
    'Action required': 'कार्रवाई आवश्यक',
    'Currently borrowed': 'वर्तमान में उधार लिया गया'
  }
};

// MyMemory Translation API Service
export const translateText = async (text, target = "hi") => {
  if (!text || target === "en") return text;

  // In-session caching to avoid repeated API requests
  const cacheKey = `trans_${target}_${text}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch (_) {}

  const params = new URLSearchParams({
    q: text,
    langpair: `en|${target}`
  });

  const response = await fetch(
    `https://api.mymemory.translated.net/get?${params}`
  );

  if (!response.ok) {
    throw new Error("Translation request failed");
  }

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || "Translation failed");
  }

  const result = data.responseData?.translatedText || text;
  try {
    sessionStorage.setItem(cacheKey, result);
  } catch (_) {}

  return result;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('app-language');
      // Guarantee English as the default language
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  const changeLanguage = (langCode) => {
    setLanguageState(langCode);
    try {
      localStorage.setItem('app-language', langCode);
    } catch (e) {
      console.warn(e);
    }
  };

  // Automated Full-Project Real-Time DOM Translation Engine
  useEffect(() => {
    let isCancelled = false;
    const textCache = new Map();
    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG', 'PATH']);

    const translateNode = async (node) => {
      if (isCancelled || !node || node.nodeType !== Node.TEXT_NODE) return;
      const parent = node.parentNode;
      if (!parent || ignoredTags.has(parent.nodeName) || parent.isContentEditable || parent.classList?.contains('notranslate')) {
        return;
      }

      const text = (node.__originalText || node.textContent || '').trim();
      if (!text || text.length <= 1 || /^[0-9\s.,/\\:\-–—%()#$@*+]+$/.test(text)) {
        return;
      }

      if (!node.__originalText) {
        node.__originalText = node.textContent;
      }

      if (language === 'en') {
        if (node.textContent !== node.__originalText) {
          node.textContent = node.__originalText;
        }
        return;
      }

      // 1. Instant GxP Dictionary Match
      if (TRANSLATIONS.hi[text]) {
        node.textContent = node.__originalText.replace(text, TRANSLATIONS.hi[text]);
        return;
      }

      // Check partial match for phrases
      for (const [enKey, hiVal] of Object.entries(TRANSLATIONS.hi)) {
        if (text.includes(enKey)) {
          node.textContent = node.__originalText.replace(enKey, hiVal);
          return;
        }
      }

      // 2. In-Memory & Session Storage Cache Match
      const cacheKey = `trans_hi_${text}`;
      if (textCache.has(cacheKey)) {
        node.textContent = node.__originalText.replace(text, textCache.get(cacheKey));
        return;
      }
      try {
        const stored = sessionStorage.getItem(cacheKey);
        if (stored) {
          textCache.set(cacheKey, stored);
          node.textContent = node.__originalText.replace(text, stored);
          return;
        }
      } catch (_) {}

      // 3. Dynamic MyMemory API Call
      try {
        const translated = await translateText(text, 'hi');
        if (!isCancelled && translated && translated !== text && node.parentNode) {
          textCache.set(cacheKey, translated);
          node.textContent = node.__originalText.replace(text, translated);
        }
      } catch (_) {}
    };

    const walk = (root) => {
      if (!root) return;
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (n) => {
            const p = n.parentNode;
            if (!p || ignoredTags.has(p.nodeName) || p.classList?.contains('notranslate')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const nodes = [];
      while (walker.nextNode()) {
        nodes.push(walker.currentNode);
      }
      nodes.forEach(translateNode);
    };

    // Initial DOM walk
    const rootEl = document.getElementById('root');
    if (rootEl) {
      walk(rootEl);
    }

    // Dynamic Mutation Observer for live route changes & API rendering
    const observer = new MutationObserver((mutations) => {
      if (language === 'en') return;
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (addedNode.nodeType === Node.TEXT_NODE) {
            translateNode(addedNode);
          } else if (addedNode.nodeType === Node.ELEMENT_NODE) {
            walk(addedNode);
          }
        }
      }
    });

    if (rootEl) {
      observer.observe(rootEl, { childList: true, subtree: true });
    }

    return () => {
      isCancelled = true;
      observer.disconnect();
    };
  }, [language]);

  // Translate helper function for direct component usage
  const t = useCallback((text, fallback) => {
    if (!text) return '';
    if (language === 'en') return text;
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[text]) {
      return langDict[text];
    }
    // Check sessionStorage cache for API translations
    try {
      const cached = sessionStorage.getItem(`trans_${language}_${text}`);
      if (cached) return cached;
    } catch (_) {}

    return fallback !== undefined ? fallback : text;
  }, [language]);

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
