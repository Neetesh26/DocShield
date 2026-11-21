export const ROLES = {
  ADMIN: 'Admin',
  QA: 'QA',
  DOCUMENT_CONTROLLER: 'Document Controller',
  DEPARTMENT_HEAD: 'Department Head',
  EMPLOYEE: 'Employee'
};

export const DOCUMENT_STATUSES = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In Review',
  PENDING_APPROVAL: 'Pending Approval',
  EFFECTIVE: 'Effective',
  SUPERSEDED: 'Superseded',
  ARCHIVED: 'Archived',
  OBSOLETE: 'Obsolete'
};

export const PHYSICAL_STATUSES = {
  STORED: 'Stored',
  CHECKED_OUT: 'Checked Out',
  IN_TRANSIT: 'In Transit',
  MISSING: 'Missing',
  TRANSFERRED: 'Transferred'
};

export const REQUEST_TYPES = {
  PRINT: 'Print',
  DOWNLOAD: 'Download',
  CONTROLLED_COPY: 'Controlled-Copy',
  CHECKOUT: 'Checkout',
  RETURN: 'Return',
  CUSTODY_CHANGE: 'Custody Change',
  DOCUMENT_CHANGE: 'Document Change'
};

export const REQUEST_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled'
};

export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  UPLOAD: 'UPLOAD',
  METADATA_EDIT: 'METADATA_EDIT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  CHECKOUT: 'CHECKOUT',
  RETURN: 'RETURN',
  HANDOVER: 'HANDOVER',
  PHYSICAL_AUDIT: 'PHYSICAL_AUDIT',
  MASTER_DATA_CHANGE: 'MASTER_DATA_CHANGE',
  SETTINGS_CHANGE: 'SETTINGS_CHANGE',
  VERSION_CREATE: 'VERSION_CREATE',
  DOCUMENT_VIEW: 'DOCUMENT_VIEW'
};

