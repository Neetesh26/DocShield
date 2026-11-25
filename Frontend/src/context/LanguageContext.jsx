import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
];

// Comprehensive GxP Bilingual Translation Map (English -> Hindi)
export const GXP_BASE_DICTIONARY = {
  // Navigation Groups & Sidebar
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
  'VidyaGxP': 'विद्या जीएक्सपी',

  // Top Header & User Menu
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
  'Signed in as': 'लॉगिन किया गया:',
  'Employee ID': 'कर्मचारी आईडी',
  'Account & Credentials': 'खाता एवं क्रेडेंशियल',
  'Audit Log Activity': 'ऑडिट लॉग गतिविधि',

  // Master Data & Governance Page
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
  'Add Storage Coordinate': 'भंडारण निर्देशांक जोड़ें',
  'Add Personnel': 'कर्मी जोड़ें',
  'Add Authorized Personnel': 'अधिकृत कर्मी जोड़ें',
  'ADD DEPARTMENT': 'विभाग जोड़ें',
  'ADD DOCUMENT TYPE': 'दस्तावेज़ प्रकार जोड़ें',
  'ADD STORAGE LOCATION': 'स्थान जोड़ें',
  'ADD PERSONNEL': 'कर्मी जोड़ें',
  'Configure Functional Department': 'कार्यात्मक विभाग कॉन्फ़िगर करें',
  'Register Controlled Document Taxonomy': 'नियंत्रित दस्तावेज़ वर्गीकरण पंजीकृत करें',
  'Register Physical Archive Location': 'भौतिक संग्रह स्थान पंजीकृत करें',
  'Create Department': 'विभाग बनाएं',
  'CREATE DEPARTMENT': 'विभाग बनाएं',
  'Create Document Type': 'दस्तावेज़ प्रकार बनाएं',
  'CREATE DOCUMENT TYPE': 'दस्तावेज़ प्रकार बनाएं',
  'Create Location': 'स्थान बनाएं',
  'CREATE LOCATION': 'स्थान बनाएं',
  'Create Personnel': 'कर्मी बनाएं',
  'CREATE PERSONNEL': 'कर्मी बनाएं',
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
  'Head:': 'प्रमुख:',
  'Prefix:': 'उपसर्ग:',
  'Retention:': 'अवधारण:',
  'Cycle:': 'चक्र:',
  'Occupancy': 'उपयोगिता',
  'slots free': 'स्थान रिक्त',
  'Max Capacity': 'अधिकतम क्षमता',
  'Active Custodian': 'सक्रिय कस्टोडियन',
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
  'Start Extraction Batch': 'बैच निष्कर्षण प्रारंभ करें',
  'Processing Batch...': 'बैच प्रोसेसिंग हो रहा है...',
  'File': 'फ़ाइल',
  'FILE': 'फ़ाइल',
  'Detected Type': 'पहचाना गया प्रकार',
  'DETECTED TYPE': 'पहचाना गया प्रकार',
  'Doc No.': 'दस्तावेज़ सं.',
  'DOC NO.': 'दस्तावेज़ सं.',
  'Folder': 'फ़ोल्डर',
  'FOLDER': 'फ़ोल्डर',
  'Conf.': 'विश्वास स्तर',
  'CONF.': 'विश्वास स्तर',
  'Location': 'स्थान',
  'LOCATION': 'स्थान',
  'Custodian': 'कस्टोडियन',
  'CUSTODIAN': 'कस्टोडियन',
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
  'Target Capacity': 'लक्षित क्षमता',
  'Current Occupancy': 'वर्तमान उपयोग',
  'Approved Rate': 'स्वीकृति दर',
  'Rejection Rate': 'अस्वीकृति दर',
  'Verified Ratio': 'सत्यापित अनुपात',
  'Pending Ratio': 'लंबित अनुपात',
  'Active & Archived': 'सक्रिय एवं संग्रहित',

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
  'Try adjusting your search criteria': 'अपने खोज मानदंडों को बदलकर पुनः प्रयास करें',
  'Document Details': 'दस्तावेज़ विवरण',
  'View Document': 'दस्तावेज़ देखें',
  'Download PDF': 'पीडीएफ डाउनलोड करें',
  'Generate QR': 'क्यूआर उत्पन्न करें',

  // Repository & Upload Wizard
  'Document Repository': 'दस्तावेज़ रिपॉजिटरी',
  'Physical and Electronic Document Archive': 'भौतिक एवं इलेक्ट्रॉनिक दस्तावेज़ संग्रह',
  'Upload New Document': 'नया दस्तावेज़ अपलोड करें',
  'Document Metadata Extraction': 'दस्तावेज़ मेटाडेटा निष्कर्षण',
  'Step 1: Upload File': 'चरण 1: फ़ाइल अपलोड करें',
  'Step 2: Metadata Verification': 'चरण 2: मेटाडेटा सत्यापन',
  'Step 3: Storage Allocation': 'चरण 3: भंडारण आवंटन',
  'Step 4: Review & Sign': 'चरण 4: समीक्षा एवं हस्ताक्षर',
  'Upload Document File': 'दस्तावेज़ फ़ाइल अपलोड करें',
  'Select PDF Document': 'पीडीएफ दस्तावेज़ चुनें',
  'Drag and drop PDF here': 'पीडीएफ यहां खींचें और छोड़ें',
  'Document Version': 'दस्तावेज़ संस्करण',
  'Product / API': 'उत्पाद / एपीआई',
  'Batch Number': 'बैच संख्या',
  'Review Date': 'समीक्षा तिथि',
  'Expiry Date': 'समाप्ति तिथि',
  'Prepared By': 'द्वारा तैयार',
  'Reviewed By': 'द्वारा समीक्षित',
  'Approved By': 'द्वारा स्वीकृत',
  'Storage Location': 'भंडारण स्थान',
  'Box Number': 'बॉक्स संख्या',
  'File Number': 'फ़ाइल संख्या',
  'Physical Copies Count': 'भौतिक प्रतियों की संख्या',
  'Tags': 'टैग',
  'Description': 'विवरण',
  'Finalize Document Archive': 'दस्तावेज़ संग्रह को अंतिम रूप दें',

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
  'QUICK LAUNCH ACTIONS (CLICKABLE)': 'त्वरित कार्य (क्लिक करें)',
  'Quick Launch Actions': 'त्वरित कार्य',
  'Upload Document': 'दस्तावेज़ अपलोड करें',
  'Search Archive': 'अभिलेखागार खोजें',
  'Scan QR Label': 'क्यूआर लेबल स्कैन करें',
  'Bulk Ingestion': 'बल्क इन्जेशन',
  'New Request': 'नया अनुरोध',
  'Check Out Record': 'रिकॉर्ड चेक आउट करें',
  'Custody Handover': 'कस्टडी हस्तांतरण',
  'Documents by Type': 'दस्तावेज़ प्रकार अनुसार',
  'Uploads over time': 'समय के साथ अपलोड',
  'Physical Vault Utilization': 'भौतिक वॉल्ट उपयोग',
  'Recent Repository Ingestions': 'हाल के दस्तावेज़ संग्रह',
  'Recent Repository Ingestions (Live API Data)': 'हाल के दस्तावेज़ संग्रह (लाइव डेटा)',
  'View all': 'सभी देखें',
  'GxP Document Repository Active': 'जीएक्सपी दस्तावेज़ रिपॉजिटरी सक्रिय',
  'Facility: Main Campus Vault': 'सुविधा: मुख्य परिसर वॉल्ट',
  'No storage facilities registered in database': 'डेटाबेस में कोई भंडारण सुविधा पंजीकृत नहीं है',
  'No recent documents ingested yet': 'अभी तक कोई हालिया दस्तावेज़ अपलोड नहीं हुआ',
  'Click to view vault coordinates': 'वॉल्ट निर्देशांक देखने के लिए क्लिक करें',
  'Quick Inquiries:': 'त्वरित पूछताछ:',
  'No documents indexed in database yet': 'डेटाबेस में अभी तक कोई दस्तावेज़ अनुक्रमित नहीं है',
  'Documents Uploaded': 'दस्तावेज़ अपलोड किए गए',
  'No recent document ingestions found in database': 'डेटाबेस में कोई हालिया दस्तावेज़ संग्रह नहीं मिला',
  'View': 'देखें',
  'Total': 'कुल',
  'Browse': 'ब्राउज़ करें',
  'last 12 months': 'पिछले 12 महीने',
  'Doc #': 'दस्तावेज़ #',
  'Rev': 'संस्करण',

  // Physical Storage Map & Audit
  'Physical Vault Architecture & Coordinate Map': 'भौतिक वॉल्ट वास्तुकला एवं निर्देशांक मानचित्र',
  'Storage Capacity': 'भंडारण क्षमता',
  'Occupied Slots': 'भरे हुए स्थान',
  'Available Slots': 'उपलब्ध स्थान',
  'Vault Utilization Rate': 'वॉल्ट उपयोगिता दर',
  'Physical Audit Register': 'भौतिक ऑडिट रजिस्टर',
  'Initiate Audit': 'ऑडिट प्रारंभ करें',
  'Audit Scope': 'ऑडिट दायरा',
  'Audit Type': 'ऑडिट प्रकार',
  'Auditor Name': 'ऑडिटर का नाम',
  'Items Verified': 'सत्यापित वस्तुएं',
  'Discrepancies': 'विसंगतियां',
  'Audit Findings': 'ऑडिट निष्कर्ष',
  'Corrective Actions': 'सुधारात्मक कार्रवाइयां',
  'Complete Audit': 'ऑडिट पूर्ण करें',
  'Verify Item': 'वस्तु सत्यापित करें',
  'Mark Verified': 'सत्यापित चिह्नित करें',
  'Flag Missing': 'लापता चिह्नित करें',

  // Custody & Checkout
  'Physical Document Custody & Handovers': 'भौतिक दस्तावेज़ कस्टडी एवं हस्तांतरण',
  'Active Document Check-outs': 'सक्रिय दस्तावेज़ चेक-आउट',
  'Check Out Document': 'दस्तावेज़ चेक आउट करें',
  'Return Document': 'दस्तावेज़ वापस करें',
  'Borrower': 'उधारकर्ता',
  'Reason for Check-out': 'चेक-आउट का कारण',
  'Expected Return Date': 'अपेक्षित वापसी तिथि',
  'Condition on Return': 'वापसी पर स्थिति',
  'Transfer Custody': 'कस्टडी हस्तांतरित करें',
  'Accept Handover': 'हस्तांतरण स्वीकार करें',
  'Reject Handover': 'हस्तांतरण अस्वीकार करें',
  'Handover Pending': 'हस्तांतरण लंबित',

  // Workflow (My Tasks, Requests, Approvals)
  'My Pending Tasks': 'मेरे लंबित कार्य',
  'Tasks assigned to you': 'आपको सौंपे गए कार्य',
  'Document Requests': 'दस्तावेज़ अनुरोध',
  'Submit Request': 'अनुरोध जमा करें',
  'Request Type': 'अनुरोध प्रकार',
  'Document Issuance': 'दस्तावेज़ जारी करना',
  'Document Revision': 'दस्तावेज़ संशोधन',
  'Document Retrieval': 'दस्तावेज़ पुनर्प्राप्ति',
  'Urgency': 'प्राथमिकता / तात्कालिकता',
  'Normal': 'सामान्य',
  'Urgent': 'अति आवश्यक',
  'Pending Reviews': 'लंबित समीक्षाएं',
  'Review & Retention Policy': 'समीक्षा एवं अवधारण नीति',
  'Scheduled for Obsoletion': 'अप्रचलन हेतु निर्धारित',
  'Legal Hold': 'कानूनी रोक',
  'Archival Due': 'संग्रहण देय',

  // Audit Trail & Settings
  'Audit Trail Logs': 'ऑडिट ट्रेल लॉग',
  'Immutable 21 CFR Part 11 Audit Trail': 'अपरिवर्तनीय 21 CFR Part 11 ऑडिट ट्रेल',
  'Filter Logs': 'लॉग फ़िल्टर करें',
  'Timestamp': 'समय मोहर',
  'User': 'उपयोगकर्ता',
  'Entity': 'इकाई',
  'IP Address': 'आईपी पता',
  'Details': 'विवरण',
  'System Settings': 'सिस्टम सेटिंग्स',
  'Organization Settings': 'संगठन सेटिंग्स',
  'Security & Compliance': 'सुरक्षा एवं अनुपालन',
  'Password Expiry Days': 'पासवर्ड समाप्ति दिन',
  'Session Timeout Minutes': 'सत्र समाप्ति मिनट',
  'Backup & Archival': 'बैकअप एवं संग्रहण',

  // Standard Actions, Verbs, Common Buttons
  'Actions': 'कार्रवाइयां',
  'Action': 'कार्रवाई',
  'ACTIONS': 'कार्रवाइयां',
  'Submit': 'जमा करें',
  'Cancel': 'रद्द करें',
  'CANCEL': 'रद्द करें',
  'Save': 'सहेजें',
  'Save Changes': 'परिवर्तन सहेजें',
  'Edit': 'संपादित करें',
  'Delete': 'हटाएं',
  'Add': 'जोड़ें',
  'Create': 'बनाएं',
  'Close': 'बंद करें',
  'Open': 'खोलें',
  'Back': 'वापस',
  'Next': 'आगे',
  'Previous': 'पिछला',
  'Apply': 'लागू करें',
  'Reset': 'रीसेट करें',
  'Clear': 'साफ़ करें',
  'Filter': 'फ़िल्टर',
  'Refresh': 'रिफ्रेश',
  'Export': 'निर्यात करें',
  'Print': 'प्रिंट करें',
  'Download': 'डाउनलोड करें',
  'Approve': 'स्वीकृति दें',
  'Reject': 'अस्वीकार करें',
  'Sign': 'हस्ताक्षर करें',
  'Sign & Approve': 'हस्ताक्षर एवं स्वीकृति दें',
  'Relocate': 'स्थानांतरित करें',
  'Confirm': 'पुष्टि करें',
  'Yes': 'हाँ',
  'No': 'नहीं',
  'Success': 'सफलता',
  'Error': 'त्रुटि',
  'Warning': 'चेतावनी',
  'Info': 'जानकारी',
  'Loading...': 'लोड हो रहा है...',
  'Processing...': 'प्रोसेसिंग हो रहा है...',
  'Syncing...': 'सिंक हो रहा है...',

  // GxP Statuses
  'Status': 'स्थिति',
  'STATUS': 'स्थिति',
  'Effective': 'प्रभावी',
  'Draft': 'प्रारूप',
  'In Review': 'समीक्षाधीन',
  'Approved': 'स्वीकृत',
  'Rejected': 'अस्वीकृत',
  'Pending': 'लंबित',
  'Obsolete': 'अप्रचलित',
  'Stored': 'संग्रहीत',
  'Checked Out': 'चेक आउट',
  'In Transit': 'पारगमन में',
  'Archived': 'अभिलेखागार में',
  'Available': 'उपलब्ध',
  'Full': 'पूर्ण',
  'Near Full': 'लगभग पूर्ण'
};

// Build Reverse Dictionary for perfect Hindi -> English restoration
const REVERSE_GXP_DICTIONARY = {};
for (const [enKey, hiVal] of Object.entries(GXP_BASE_DICTIONARY)) {
  if (hiVal && !REVERSE_GXP_DICTIONARY[hiVal]) {
    REVERSE_GXP_DICTIONARY[hiVal] = enKey;
  }
}

// Pre-sorted translation phrases for fast multi-word matching
const SORTED_EN_PHRASES = Object.keys(GXP_BASE_DICTIONARY)
  .filter((k) => k.length > 2)
  .sort((a, b) => b.length - a.length);

const SORTED_HI_PHRASES = Object.keys(REVERSE_GXP_DICTIONARY)
  .filter((k) => k.length > 1)
  .sort((a, b) => b.length - a.length);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const LanguageProvider = ({ children }) => {
  // Always default strictly to English ('en') unless explicitly changed in this session/store
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('app-language');
      if (saved === 'hi') {
        return 'hi';
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  const [dictionary, setDictionary] = useState(GXP_BASE_DICTIONARY);
  const isTranslatingRef = useRef(false);
  const observerRef = useRef(null);

  // Sync dictionary from backend translation API on load
  useEffect(() => {
    const fetchDictionary = async () => {
      try {
        const res = await fetch('/api/translate/dictionary?target=hi');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setDictionary((prev) => ({
              ...prev,
              ...json.data
            }));
          }
        }
      } catch (e) {
        // use offline fallback
      }
    };
    fetchDictionary();
  }, []);

  // Translate string English -> Hindi with smart punctuation/prefix stripping
  const translateToHindi = useCallback((raw) => {
    if (!raw) return '';
    const trimmed = String(raw).trim();
    if (!trimmed) return raw;

    // Do not translate technical identifiers, timestamps, emails, or pure numbers
    if (/^[0-9\s:,\-./%]+$/.test(trimmed)) return raw;
    if (trimmed.includes('@') && trimmed.includes('.')) return raw;
    if (/^(EMP|DOC|LOC|BX|VAL|SOP|BMR|BPR)-[A-Z0-9\-/]+$/i.test(trimmed)) return raw;

    // 1. Exact match in dictionary
    if (dictionary[trimmed]) {
      return raw.replace(trimmed, dictionary[trimmed]);
    }

    // 2. Case-insensitive match
    const lower = trimmed.toLowerCase();
    for (const [k, v] of Object.entries(dictionary)) {
      if (k.toLowerCase() === lower) {
        return raw.replace(trimmed, v);
      }
    }

    // 3. Handle trailing asterisks (e.g., 'Full Name *' -> 'पूरा नाम *')
    const asteriskMatch = trimmed.match(/^(.+?)\s*([*:]+)$/);
    if (asteriskMatch) {
      const base = asteriskMatch[1].trim();
      const punc = asteriskMatch[2];
      const baseTrans = dictionary[base] || dictionary[base.toLowerCase()];
      if (baseTrans) {
        return raw.replace(trimmed, `${baseTrans} ${punc}`);
      }
    }

    // 4. Handle leading '+' or '•' symbols (e.g. '+ Add Personnel' -> '+ कर्मी जोड़ें')
    const prefixMatch = trimmed.match(/^([+•\s]+)(.+)$/);
    if (prefixMatch) {
      const pfx = prefixMatch[1];
      const base = prefixMatch[2].trim();
      const baseTrans = dictionary[base] || dictionary[base.toUpperCase()] || dictionary[base.toLowerCase()];
      if (baseTrans) {
        return raw.replace(trimmed, `${pfx}${baseTrans}`);
      }
    }

    // 5. Multi-phrase replacement within sentences
    let modified = trimmed;
    let replaced = false;

    for (const phrase of SORTED_EN_PHRASES) {
      if (phrase.length > 3 && modified.toLowerCase().includes(phrase.toLowerCase())) {
        const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi');
        if (regex.test(modified)) {
          modified = modified.replace(regex, dictionary[phrase]);
          replaced = true;
        }
      }
    }

    if (replaced) {
      return raw.replace(trimmed, modified);
    }

    return raw;
  }, [dictionary]);

  // Translate string Hindi -> English (Restoration)
  const translateToEnglish = useCallback((raw) => {
    if (!raw) return '';
    const trimmed = String(raw).trim();
    if (!trimmed) return raw;

    // 1. Exact match in reverse dictionary
    if (REVERSE_GXP_DICTIONARY[trimmed]) {
      return raw.replace(trimmed, REVERSE_GXP_DICTIONARY[trimmed]);
    }

    // 2. Trailing punctuation
    const puncMatch = trimmed.match(/^(.+?)\s*([*:]+)$/);
    if (puncMatch) {
      const base = puncMatch[1].trim();
      const punc = puncMatch[2];
      if (REVERSE_GXP_DICTIONARY[base]) {
        return raw.replace(trimmed, `${REVERSE_GXP_DICTIONARY[base]} ${punc}`);
      }
    }

    // 3. Leading symbols
    const prefixMatch = trimmed.match(/^([+•\s]+)(.+)$/);
    if (prefixMatch) {
      const pfx = prefixMatch[1];
      const base = prefixMatch[2].trim();
      if (REVERSE_GXP_DICTIONARY[base]) {
        return raw.replace(trimmed, `${pfx}${REVERSE_GXP_DICTIONARY[base]}`);
      }
    }

    // 4. Multi-phrase replacement
    let modified = trimmed;
    let replaced = false;

    for (const phrase of SORTED_HI_PHRASES) {
      if (phrase.length > 2 && modified.includes(phrase)) {
        const regex = new RegExp(escapeRegExp(phrase), 'g');
        if (regex.test(modified)) {
          modified = modified.replace(regex, REVERSE_GXP_DICTIONARY[phrase]);
          replaced = true;
        }
      }
    }

    if (replaced) {
      return raw.replace(trimmed, modified);
    }

    return raw;
  }, []);

  // Process a DOM node based on current target language
  const processNode = useCallback((node, targetLang) => {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (!parent) return;

    // Skip technical elements
    const tag = parent.tagName.toLowerCase();
    if (
      tag === 'script' ||
      tag === 'style' ||
      tag === 'code' ||
      tag === 'pre' ||
      tag === 'svg' ||
      tag === 'path' ||
      parent.classList?.contains('no-translate') ||
      parent.getAttribute('contenteditable') === 'true'
    ) {
      return;
    }

    const currentText = node.nodeValue;
    if (!currentText || !currentText.trim()) return;

    if (targetLang === 'hi') {
      const translated = translateToHindi(currentText);
      if (translated && translated !== currentText) {
        node.nodeValue = translated;
      }
    } else {
      const restored = translateToEnglish(currentText);
      if (restored && restored !== currentText) {
        node.nodeValue = restored;
      }
    }
  }, [translateToHindi, translateToEnglish]);

  // Process attributes (placeholder & title)
  const processAttributes = useCallback((element, targetLang) => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

    if (element.placeholder) {
      if (targetLang === 'hi') {
        const trans = translateToHindi(element.placeholder);
        if (trans && trans !== element.placeholder) element.placeholder = trans;
      } else {
        const rest = translateToEnglish(element.placeholder);
        if (rest && rest !== element.placeholder) element.placeholder = rest;
      }
    }

    if (element.title) {
      if (targetLang === 'hi') {
        const trans = translateToHindi(element.title);
        if (trans && trans !== element.title) element.title = trans;
      } else {
        const rest = translateToEnglish(element.title);
        if (rest && rest !== element.title) element.title = rest;
      }
    }
  }, [translateToHindi, translateToEnglish]);

  // Full DOM Walk
  const sweepDOM = useCallback((root, targetLang) => {
    if (!root) return;
    isTranslatingRef.current = true;

    try {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (n) => {
            if (n.nodeType === Node.TEXT_NODE) {
              const tag = n.parentElement?.tagName.toLowerCase();
              if (
                tag === 'script' ||
                tag === 'style' ||
                tag === 'code' ||
                tag === 'pre' ||
                tag === 'svg'
              ) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
            if (n.nodeType === Node.ELEMENT_NODE) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let curr = walker.nextNode();
      while (curr) {
        if (curr.nodeType === Node.TEXT_NODE) {
          processNode(curr, targetLang);
        } else if (curr.nodeType === Node.ELEMENT_NODE) {
          processAttributes(curr, targetLang);
        }
        curr = walker.nextNode();
      }
    } finally {
      isTranslatingRef.current = false;
    }
  }, [processNode, processAttributes]);

  // Language state effect & live DOM observer
  useEffect(() => {
    // 1. Sweep current document tree
    sweepDOM(document.body, language);

    // 2. Live MutationObserver to catch route changes, modals, and dynamic data renders
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    let rafId = null;
    observerRef.current = new MutationObserver((mutations) => {
      if (isTranslatingRef.current) return;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        for (const m of mutations) {
          if (m.type === 'childList') {
            m.addedNodes.forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                processNode(node, language);
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                sweepDOM(node, language);
              }
            });
          } else if (m.type === 'characterData') {
            processNode(m.target, language);
          }
        }
      });
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [language, sweepDOM, processNode]);

  // Language switcher function
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

  // Declarative t() helper for explicit JSX usage
  const t = useCallback((text, fallback) => {
    if (!text) return '';
    if (language === 'en') {
      return translateToEnglish(text);
    }
    const res = translateToHindi(text);
    return res !== text ? res : (fallback !== undefined ? fallback : text);
  }, [language, translateToHindi, translateToEnglish]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
        translateText: language === 'hi' ? translateToHindi : translateToEnglish,
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
