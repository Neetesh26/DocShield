import React, { createContext, useContext, useState, useEffect } from 'react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'hinglish', name: 'Hinglish', nativeName: 'Hinglish', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
];

const translations = {
  en: {
    // Nav Groups
    'WORKSPACE': 'WORKSPACE',
    'PHYSICAL': 'PHYSICAL',
    'WORKFLOW': 'WORKFLOW',
    'GOVERNANCE': 'GOVERNANCE',

    // Nav Items
    'Dashboard': 'Dashboard',
    'Search': 'Search',
    'Repository': 'Repository',
    'Upload': 'Upload',
    'Bulk Upload': 'Bulk Upload',
    'Scan QR': 'Scan QR',
    'Storage Map': 'Storage Map',
    'Custody & Handovers': 'Custody & Handovers',
    'Check-out Register': 'Check-out Register',
    'Physical Audit': 'Physical Audit',
    'My Tasks': 'My Tasks',
    'Requests': 'Requests',
    'Approvals': 'Approvals',
    'Review & Retention': 'Review & Retention',
    'Reports': 'Reports',
    'Master Data': 'Master Data',
    'Audit Trail': 'Audit Trail',
    'Settings': 'Settings',

    // Top Header
    'SearchPlaceholder': 'Search documents, batches, racks, custodians...',
    'ChangeLanguage': 'Change Language',
    'SelectLanguage': 'Select Language',
    'SwitchToLight': 'Switch to Light Mode',
    'SwitchToDark': 'Switch to Dark Mode',
    'Notifications': 'Notifications',
    'MarkAllRead': 'Mark all as read',
    'NoNotifications': 'No new notifications',
    'Profile': 'User Profile',
    'SignOut': 'Sign Out',
    'Role': 'Role',
    'Department': 'Department',
    'EmployeeId': 'Employee ID',

    // Common Actions
    'Save': 'Save',
    'Cancel': 'Cancel',
    'Close': 'Close',
    'Confirm': 'Confirm',
    'Edit': 'Edit',
    'Delete': 'Delete',
    'Review': 'Review',
    'Sign': 'Sign',
    'Download': 'Download',
    'Refresh': 'Refresh',
    'Filter': 'Filter',
    'Reset': 'Reset',
    'View': 'View',
    'Print': 'Print',
    'Password': 'Password',

    // Statuses
    'Active': 'Active',
    'Pending': 'Pending',
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Obsolete': 'Obsolete',
    'Archived': 'Archived',
    'Overdue': 'Overdue',
    'LegalHold': 'Legal Hold',
    'Compliant': 'Compliant',
    'Verified': 'Verified',

    // GxP Compliance
    'ElectronicSignature': '21 CFR Part 11 Electronic Signature',
    'AuditTrailLogged': 'Action cryptographically sealed and logged in Audit Trail',
    'AllRightsReserved': 'GxP Regulated Pharmaceutical Record Vault'
  },

  hi: {
    // Nav Groups
    'WORKSPACE': 'कार्यक्षेत्र (Workspace)',
    'PHYSICAL': 'भौतिक वॉल्ट (Physical)',
    'WORKFLOW': 'वर्कफ़्लो (Workflow)',
    'GOVERNANCE': 'अनुपालन व शासन (Governance)',

    // Nav Items
    'Dashboard': 'डैशबोर्ड',
    'Search': 'दस्तावेज़ खोजें',
    'Repository': 'दस्तावेज़ भंडार',
    'Upload': 'दस्तावेज़ अपलोड',
    'Bulk Upload': 'बल्क अपलोड',
    'Scan QR': 'क्यूआर स्कैन',
    'Storage Map': 'स्टोरेज नक्शा',
    'Custody & Handovers': 'कस्टडी व हैंडओवर',
    'Check-out Register': 'चेक-आउट रजिस्टर',
    'Physical Audit': 'भौतिक ऑडिट',
    'My Tasks': 'मेरे कार्य',
    'Requests': 'दस्तावेज़ अनुरोध',
    'Approvals': 'अनुमोदन व स्वीकृति',
    'Review & Retention': 'समीक्षा व प्रतिधारण',
    'Reports': 'अनुपालन रिपोर्ट',
    'Master Data': 'मास्टर डेटा',
    'Audit Trail': 'ऑडिट ट्रेल',
    'Settings': 'सेटिंग्स',

    // Top Header
    'SearchPlaceholder': 'दस्तावेज़, बैच, रैक या कस्टोडियन खोजें...',
    'ChangeLanguage': 'भाषा बदलें',
    'SelectLanguage': 'भाषा का चयन करें',
    'SwitchToLight': 'लाइट मोड चालू करें',
    'SwitchToDark': 'डार्क मोड चालू करें',
    'Notifications': 'सूचनाएं',
    'MarkAllRead': 'सभी को पढ़ा हुआ चिह्नित करें',
    'NoNotifications': 'कोई नई सूचना नहीं है',
    'Profile': 'उपयोगकर्ता प्रोफ़ाइल',
    'SignOut': 'साइन आउट (लॉगआउट)',
    'Role': 'पद / भूमिका',
    'Department': 'विभाग',
    'EmployeeId': 'कर्मचारी आईडी',

    // Common Actions
    'Save': 'सुरक्षित करें',
    'Cancel': 'रद्द करें',
    'Close': 'बंद करें',
    'Confirm': 'पुष्टि करें',
    'Edit': 'संपादित करें',
    'Delete': 'हटाएं / नष्ट करें',
    'Review': 'समीक्षा करें',
    'Sign': 'ई-हस्ताक्षर करें',
    'Download': 'डाउनलोड करें',
    'Refresh': 'ताज़ा करें',
    'Filter': 'फ़िल्टर',
    'Reset': 'रीसेट करें',
    'View': 'देखें',
    'Print': 'प्रिंट करें',
    'Password': 'पासवर्ड',

    // Statuses
    'Active': 'सक्रिय',
    'Pending': 'लंबित',
    'Approved': 'स्वीकृत',
    'Rejected': 'अस्वीकृत',
    'Obsolete': 'अप्रचलित',
    'Archived': 'अभिलेखागार',
    'Overdue': 'अतिदेय',
    'LegalHold': 'कानूनी रोक (Legal Hold)',
    'Compliant': 'अनुपालन प्रमाणित',
    'Verified': 'सत्यापित',

    // GxP Compliance
    'ElectronicSignature': '21 CFR Part 11 इलेक्ट्रॉनिक हस्ताक्षर',
    'AuditTrailLogged': 'कार्रवाई ऑडिट ट्रेल में सील और दर्ज की गई',
    'AllRightsReserved': 'GxP विनियमित फार्मास्युटिकल रिकॉर्ड वॉल्ट'
  },

  hinglish: {
    // Nav Groups
    'WORKSPACE': 'WORKSPACE',
    'PHYSICAL': 'PHYSICAL VAULT',
    'WORKFLOW': 'WORKFLOW',
    'GOVERNANCE': 'GOVERNANCE & AUDIT',

    // Nav Items
    'Dashboard': 'Dashboard',
    'Search': 'Search Documents',
    'Repository': 'Document Repository',
    'Upload': 'Upload Karein',
    'Bulk Upload': 'Bulk Upload',
    'Scan QR': 'Scan QR Code',
    'Storage Map': 'Storage Location Map',
    'Custody & Handovers': 'Custody & Handover',
    'Check-out Register': 'Check-out Register',
    'Physical Audit': 'Physical Audit',
    'My Tasks': 'Mere Tasks',
    'Requests': 'Requests',
    'Approvals': 'Approvals',
    'Review & Retention': 'Review & Retention',
    'Reports': 'Compliance Reports',
    'Master Data': 'Master Data',
    'Audit Trail': 'Audit Trail Logs',
    'Settings': 'Settings',

    // Top Header
    'SearchPlaceholder': 'Documents, batch no, rack ya custodian search karein...',
    'ChangeLanguage': 'Language Change Karein',
    'SelectLanguage': 'Language Select Karein',
    'SwitchToLight': 'Light Mode Par Switch Karein',
    'SwitchToDark': 'Dark Mode Par Switch Karein',
    'Notifications': 'Notifications',
    'MarkAllRead': 'Sabhi read mark karein',
    'NoNotifications': 'Koi new notification nahi hai',
    'Profile': 'User Profile',
    'SignOut': 'Logout Karein',
    'Role': 'Assigned Role',
    'Department': 'Department',
    'EmployeeId': 'Employee ID',

    // Common Actions
    'Save': 'Save Karein',
    'Cancel': 'Cancel Karein',
    'Close': 'Close Karein',
    'Confirm': 'Confirm Karein',
    'Edit': 'Edit Karein',
    'Delete': 'Delete / Disposal',
    'Review': 'Review Karein',
    'Sign': 'E-Sign Karein',
    'Download': 'Download Karein',
    'Refresh': 'Refresh Karein',
    'Filter': 'Filter Lagayein',
    'Reset': 'Reset Karein',
    'View': 'Dekhein',
    'Print': 'Print Karein',
    'Password': 'Password Dalein',

    // Statuses
    'Active': 'Active',
    'Pending': 'Pending Review',
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Obsolete': 'Obsolete',
    'Archived': 'Archived',
    'Overdue': 'Overdue (Date Nikli)',
    'LegalHold': 'Legal Hold (Locked)',
    'Compliant': '100% Compliant',
    'Verified': 'Verified',

    // GxP Compliance
    'ElectronicSignature': '21 CFR Part 11 Electronic Signature Box',
    'AuditTrailLogged': 'Action audit trail me seal aur log ho chuka hai',
    'AllRightsReserved': 'GxP Regulated Pharmaceutical Vault'
  },

  es: {
    // Nav Groups
    'WORKSPACE': 'ESPACIO DE TRABAJO',
    'PHYSICAL': 'BÓVEDA FÍSICA',
    'WORKFLOW': 'FLUJO DE TRABAJO',
    'GOVERNANCE': 'GOBERNANZA',

    // Nav Items
    'Dashboard': 'Panel de control',
    'Search': 'Buscar documentos',
    'Repository': 'Repositorio',
    'Upload': 'Cargar documento',
    'Bulk Upload': 'Carga masiva',
    'Scan QR': 'Escanear QR',
    'Storage Map': 'Mapa de almacenamiento',
    'Custody & Handovers': 'Custodia y traspasos',
    'Check-out Register': 'Registro de salidas',
    'Physical Audit': 'Auditoría física',
    'My Tasks': 'Mis tareas',
    'Requests': 'Solicitudes',
    'Approvals': 'Aprobaciones',
    'Review & Retention': 'Revisión y retención',
    'Reports': 'Informes',
    'Master Data': 'Datos maestros',
    'Audit Trail': 'Pista de auditoría',
    'Settings': 'Configuración',

    // Top Header
    'SearchPlaceholder': 'Buscar documentos, lotes, estantes, custodios...',
    'ChangeLanguage': 'Cambiar idioma',
    'SelectLanguage': 'Seleccionar idioma',
    'SwitchToLight': 'Cambiar a modo claro',
    'SwitchToDark': 'Cambiar a modo oscuro',
    'Notifications': 'Notificaciones',
    'MarkAllRead': 'Marcar todo como leído',
    'NoNotifications': 'No hay nuevas notificaciones',
    'Profile': 'Perfil de usuario',
    'SignOut': 'Cerrar sesión',
    'Role': 'Rol',
    'Department': 'Departamento',
    'EmployeeId': 'ID de empleado',

    // Common Actions
    'Save': 'Guardar',
    'Cancel': 'Cancelar',
    'Close': 'Cerrar',
    'Confirm': 'Confirmar',
    'Edit': 'Editar',
    'Delete': 'Eliminar',
    'Review': 'Revisar',
    'Sign': 'Firmar',
    'Download': 'Descargar',
    'Refresh': 'Actualizar',
    'Filter': 'Filtrar',
    'Reset': 'Restablecer',
    'View': 'Ver',
    'Print': 'Imprimir',
    'Password': 'Contraseña',

    // Statuses
    'Active': 'Activo',
    'Pending': 'Pendiente',
    'Approved': 'Aprobado',
    'Rejected': 'Rechazado',
    'Obsolete': 'Obsoleto',
    'Archived': 'Archivado',
    'Overdue': 'Atrasado',
    'LegalHold': 'Retención legal',
    'Compliant': 'Conforme',
    'Verified': 'Verificado',

    // GxP Compliance
    'ElectronicSignature': 'Firma electrónica 21 CFR Parte 11',
    'AuditTrailLogged': 'Acción sellada y registrada en el registro de auditoría',
    'AllRightsReserved': 'Bóveda farmacéutica regulada por GxP'
  },

  fr: {
    // Nav Groups
    'WORKSPACE': 'ESPACE DE TRAVAIL',
    'PHYSICAL': 'COFFRE PHYSIQUE',
    'WORKFLOW': 'FLUX DE TRAVAIL',
    'GOVERNANCE': 'GOUVERNANCE',

    // Nav Items
    'Dashboard': 'Tableau de bord',
    'Search': 'Recherche',
    'Repository': 'Référentiel',
    'Upload': 'Téléverser',
    'Bulk Upload': 'Téléversement groupé',
    'Scan QR': 'Scanner QR',
    'Storage Map': 'Plan de stockage',
    'Custody & Handovers': 'Garde et transferts',
    'Check-out Register': 'Registre des emprunts',
    'Physical Audit': 'Audit physique',
    'My Tasks': 'Mes tâches',
    'Requests': 'Demandes',
    'Approvals': 'Approbations',
    'Review & Retention': 'Examen et conservation',
    'Reports': 'Rapports',
    'Master Data': 'Données de référence',
    'Audit Trail': 'Piste d’audit',
    'Settings': 'Paramètres',

    // Top Header
    'SearchPlaceholder': 'Rechercher documents, lots, rayonnages, gardiens...',
    'ChangeLanguage': 'Changer de langue',
    'SelectLanguage': 'Choisir la langue',
    'SwitchToLight': 'Passer au mode clair',
    'SwitchToDark': 'Passer au mode sombre',
    'Notifications': 'Notifications',
    'MarkAllRead': 'Tout marquer comme lu',
    'NoNotifications': 'Aucune nouvelle notification',
    'Profile': 'Profil utilisateur',
    'SignOut': 'Déconnexion',
    'Role': 'Rôle',
    'Department': 'Département',
    'EmployeeId': 'Identifiant employé',

    // Common Actions
    'Save': 'Enregistrer',
    'Cancel': 'Annuler',
    'Close': 'Fermer',
    'Confirm': 'Confirmer',
    'Edit': 'Modifier',
    'Delete': 'Supprimer',
    'Review': 'Examiner',
    'Sign': 'Signer',
    'Download': 'Télécharger',
    'Refresh': 'Actualiser',
    'Filter': 'Filtrer',
    'Reset': 'Réinitialiser',
    'View': 'Afficher',
    'Print': 'Imprimer',
    'Password': 'Mot de passe',

    // Statuses
    'Active': 'Actif',
    'Pending': 'En attente',
    'Approved': 'Approuvé',
    'Rejected': 'Rejeté',
    'Obsolete': 'Obsolète',
    'Archived': 'Archivé',
    'Overdue': 'En retard',
    'LegalHold': 'Blocage juridique',
    'Compliant': 'Conforme',
    'Verified': 'Vérifié',

    // GxP Compliance
    'ElectronicSignature': 'Signature électronique 21 CFR Partie 11',
    'AuditTrailLogged': 'Action scellée et enregistrée dans la piste d’audit',
    'AllRightsReserved': 'Coffre pharmaceutique réglementé par les BPF (GxP)'
  },

  de: {
    // Nav Groups
    'WORKSPACE': 'ARBEITSBEREICH',
    'PHYSICAL': 'PHYSISCHES ARCHIV',
    'WORKFLOW': 'ARBEITSABLAUF',
    'GOVERNANCE': 'GOVERNANCE & AUDIT',

    // Nav Items
    'Dashboard': 'Übersicht',
    'Search': 'Dokumentensuche',
    'Repository': 'Dokumentenarchiv',
    'Upload': 'Hochladen',
    'Bulk Upload': 'Massen-Upload',
    'Scan QR': 'QR scannen',
    'Storage Map': 'Lagerplan',
    'Custody & Handovers': 'Verwahrung & Übergaben',
    'Check-out Register': 'Ausleihregister',
    'Physical Audit': 'Physisches Audit',
    'My Tasks': 'Meine Aufgaben',
    'Requests': 'Anfragen',
    'Approvals': 'Genehmigungen',
    'Review & Retention': 'Prüfung & Aufbewahrung',
    'Reports': 'Berichte',
    'Master Data': 'Stammdaten',
    'Audit Trail': 'Prüfpfad (Audit Trail)',
    'Settings': 'Einstellungen',

    // Top Header
    'SearchPlaceholder': 'Dokumente, Chargen, Regale, Verwalter suchen...',
    'ChangeLanguage': 'Sprache ändern',
    'SelectLanguage': 'Sprache auswählen',
    'SwitchToLight': 'Zum hellen Modus wechseln',
    'SwitchToDark': 'Zum dunklen Modus wechseln',
    'Notifications': 'Benachrichtigungen',
    'MarkAllRead': 'Alle als gelesen markieren',
    'NoNotifications': 'Keine neuen Benachrichtigungen',
    'Profile': 'Benutzerprofil',
    'SignOut': 'Abmelden',
    'Role': 'Rolle',
    'Department': 'Abteilung',
    'EmployeeId': 'Mitarbeiter-ID',

    // Common Actions
    'Save': 'Speichern',
    'Cancel': 'Abbrechen',
    'Close': 'Schließen',
    'Confirm': 'Bestätigen',
    'Edit': 'Bearbeiten',
    'Delete': 'Löschen',
    'Review': 'Prüfen',
    'Sign': 'Signieren',
    'Download': 'Herunterladen',
    'Refresh': 'Aktualisieren',
    'Filter': 'Filtern',
    'Reset': 'Zurücksetzen',
    'View': 'Ansehen',
    'Print': 'Drucken',
    'Password': 'Passwort',

    // Statuses
    'Active': 'Aktiv',
    'Pending': 'Ausstehend',
    'Approved': 'Genehmigt',
    'Rejected': 'Abgelehnt',
    'Obsolete': 'Veraltet',
    'Archived': 'Archiviert',
    'Overdue': 'Überfällig',
    'LegalHold': 'Rechtliche Sperre',
    'Compliant': 'Konform',
    'Verified': 'Verifiziert',

    // GxP Compliance
    'ElectronicSignature': 'Elektronische Signatur gemäß 21 CFR Part 11',
    'AuditTrailLogged': 'Vorgang versiegelt und im Audit Trail protokolliert',
    'AllRightsReserved': 'GxP-regulierter pharmazeutischer Dokumentensafe'
  }
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('docushield_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (newLang) => {
    if (!translations[newLang]) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem('docushield_language', newLang);
      document.documentElement.setAttribute('lang', newLang);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  /**
   * t(key, fallback): Look up translated string for the current language.
   * If key is found in dictionary, return it; otherwise return fallback or key.
   */
  const t = (key, fallback = '') => {
    if (!key) return '';
    const langDict = translations[language] || translations.en;
    if (langDict[key] !== undefined) {
      return langDict[key];
    }
    // Fallback to English dictionary if present
    if (translations.en[key] !== undefined) {
      return translations.en[key];
    }
    return fallback || key;
  };

  const currentLanguageMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        currentLanguageMeta
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
