/**
 * Auto-Classification Engine for GxP Documents
 * Uses rule-based NLP classification with keyword & pattern matching
 */

export const classifyDocument = ({ documentNumber = '', title = '', text = '', department = '' }) => {
  const combined = `${documentNumber} ${title} ${text} ${department}`.toLowerCase();
  const docNoUpper = (documentNumber || '').toUpperCase();

  let documentType = 'Standard Operating Procedure (SOP)';
  let folder = 'Quality Procedures';
  let category = 'Procedure';
  let suggestedTags = ['GxP', 'Compliance'];
  let confidence = 0.85;

  if (docNoUpper.startsWith('HO') || docNoUpper.startsWith('HND') || combined.includes('handover note') || combined.includes('custody handover') || combined.includes('physical handover')) {
    documentType = 'Custody Handover Note';
    folder = 'Custody & Handovers';
    category = 'Physical Custody';
    suggestedTags.push('Handover', 'ChainOfCustody', 'VaultTransfer');
    confidence = 0.95;
  } else if (docNoUpper.startsWith('BMR') || (combined.includes('batch manufacturing') && !combined.includes('procedure for'))) {
    documentType = 'Batch Manufacturing Record (BMR)';
    folder = 'Manufacturing Execution';
    category = 'Production Record';
    suggestedTags.push('BMR', 'Manufacturing', 'BatchProduction');
    confidence = 0.95;
  } else if (docNoUpper.startsWith('BPR') || (combined.includes('batch packaging') && !combined.includes('procedure for'))) {
    documentType = 'Batch Packaging Record (BPR)';
    folder = 'Packaging Operations';
    category = 'Packaging Record';
    suggestedTags.push('BPR', 'Packaging');
    confidence = 0.95;
  } else if (docNoUpper.startsWith('SPEC') || (combined.includes('finished product specification') && !combined.includes('procedure') && !combined.includes('sop'))) {
    documentType = 'Specification (SPEC)';
    folder = 'Product Specifications';
    category = 'Quality Control';
    suggestedTags.push('Specification', 'ReleaseTesting', 'QC');
    confidence = 0.92;
  } else if (docNoUpper.startsWith('VAL') || combined.includes('cleaning validation protocol') || combined.includes('validation protocol')) {
    documentType = 'Validation Protocol / Report';
    folder = 'Validation & Engineering';
    category = 'Validation';
    suggestedTags.push('Validation', 'Qualification', 'AuditReady');
    confidence = 0.92;
  } else if (docNoUpper.startsWith('CAPA') || combined.includes('corrective and preventive action')) {
    documentType = 'Corrective and Preventive Action (CAPA)';
    folder = 'Quality Assurance';
    category = 'Quality Assurance';
    suggestedTags.push('CAPA', 'QualityManagement');
    confidence = 0.92;
  } else if (docNoUpper.startsWith('DEV') || combined.includes('deviation investigation') || combined.includes('non-conformance')) {
    documentType = 'Deviation Report';
    folder = 'Quality Assurance';
    category = 'Quality Assurance';
    suggestedTags.push('Deviation', 'Incident');
    confidence = 0.90;
  } else if (docNoUpper.startsWith('CC') || combined.includes('change control')) {
    documentType = 'Change Control';
    folder = 'Quality Assurance';
    category = 'Quality Assurance';
    suggestedTags.push('ChangeControl', 'QualityManagement');
    confidence = 0.90;
  } else if (combined.includes('cleaning validation') || combined.includes('cip') || combined.includes('sanitization')) {
    documentType = 'Standard Operating Procedure (SOP)';
    folder = 'Facility & Hygiene';
    category = 'Sanitization';
    suggestedTags.push('CleaningValidation', 'CIP', 'Hygiene');
    confidence = 0.90;
  } else if (docNoUpper.startsWith('SOP') || combined.includes('standard operating procedure')) {
    documentType = 'Standard Operating Procedure (SOP)';
    folder = 'Quality Procedures';
    category = 'Procedure';
    suggestedTags.push('SOP', 'QualityProcedure');
    confidence = 0.95;
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
