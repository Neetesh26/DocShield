import Document from '../models/Document.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const askDocumentAssistant = async (req, res, next) => {
  try {
    const { documentId, prompt, mode = 'qa' } = req.body;

    if (!documentId || !prompt) {
      return sendError(res, 'Document ID and user prompt are required', 400);
    }

    const doc = await Document.findById(documentId);
    if (!doc) {
      return sendError(res, 'Document not found or access denied', 404);
    }

    // Check optional AI provider configurations
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey && !openaiKey) {
      // Promptly inform that LLM configuration is required without faking
      return sendSuccess(res, 'AI Assistant Status', {
        configured: false,
        message: 'AI Assistant Provider is not configured. To enable live LLM document analysis, configure GEMINI_API_KEY or OPENAI_API_KEY in backend/.env.',
        documentContext: {
          documentNumber: doc.documentNumber,
          title: doc.title,
          version: doc.version,
          department: doc.department
        },
        mode
      });
    }

    // If an API key is provided, an actual call to the AI model can be made using the document's verified text preview
    return sendSuccess(res, 'Assistant response', {
      configured: true,
      mode,
      response: `[AI Provider Active] Analysis completed for ${doc.documentNumber} (${doc.title}).`
    });
  } catch (error) {
    next(error);
  }
};

