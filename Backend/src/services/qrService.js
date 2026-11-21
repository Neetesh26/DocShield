import QRCode from 'qrcode';

export const generateDocumentQR = async (documentNumber, documentId) => {
  try {
    // Generate secure lookup URL/payload
    const qrPayload = JSON.stringify({
      app: 'DocuShield-GxP',
      docNum: documentNumber,
      id: documentId,
      url: `/documents/${documentId}`
    });

    // Generate Base64 Data URL (PNG)
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 250,
      color: {
        dark: '#0F172A', // Dark navy
        light: '#FFFFFF'
      }
    });

    return {
      payload: qrPayload,
      dataUrl: qrDataUrl
    };
  } catch (error) {
    console.error('[QR Generation Error]', error.message);
    throw error;
  }
};

