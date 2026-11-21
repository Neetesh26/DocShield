/**
 * Auto-Classification Engine for GxP Documents
 * Uses rule-based NLP classification with keyword & pattern matching
 */

export const classifyDocument = ({ documentNumber = '', title = '', text = '', department = '' }) => {
  const combined = `${documentNumber} ${title} ${text} ${department}`.toLowerCase();

  let documentType = 'Standard Operating Procedure (SOP)';
  let folder = 'Quality Procedures';
  let category = 'Procedure';
  let suggestedTags = ['GxP', 'Compliance'];
  let confidence = 0.85;

  if (documentNumber.startsWith('BMR') || combined.includes('batch manufacturing') || combined.includes('batch record')) {
    documentType = 'Batch Manufacturing Record (BMR)';
    folder = 'Manufacturing Execution';
    category = 'Production Record';
    suggestedTags.push('BMR', 'Manufacturing', 'BatchProduction');
    confidence = 0.95;
  } else if (documentNumber.startsWith('BPR') || combined.includes('batch packaging') || combined.includes('packaging record')) {
    documentType = 'Batch Packaging Record (BPR)';
    folder = 'Packaging Operations';
    category = 'Packaging Record';
    suggestedTags.push('BPR', 'Packaging');
    confidence = 0.95;
  } else if (combined.includes('cleaning validation') || combined.includes('cip') || combined.includes('sanitization')) {
    documentType = 'Standard Operating Procedure (SOP)';
    folder = 'Facility & Hygiene';
    category = 'Sanitization';
    suggestedTags.push('CleaningValidation', 'CIP', 'Hygiene');
  } else if (combined.includes('validation') || combined.includes('qualification') || combined.includes('val-')) {
    documentType = 'Validation Protocol / Report';
    folder = 'Validation & Engineering';
    category = 'Validation';
    suggestedTags.push('Validation', 'Qualification', 'AuditReady');
    confidence = 0.90;
  } else if (combined.includes('stability') || combined.includes('accelerated testing')) {
    documentType = 'Stability Study Protocol';
    folder = 'Stability Programs';
    category = 'Quality Control';
    suggestedTags.push('StabilityTesting', 'ICH-Q1A', 'QC');
  }

  // Add department tag
  if (department) {
    suggestedTags.push(department.replace(/\s+/g, ''));
  }

  return {
    documentType,
    folder,
    category,
    suggestedTags: [...new Set(suggestedTags)],
    confidenceScore: confidence,
    engine: 'rule_based_classifier_v1'
  };
};
