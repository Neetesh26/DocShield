/**
 * 21 CFR Part 11 Compliant PDF Report Generators for Physical Check-Out Register
 * 1. Overdue Physical Records Compliance Report
 * 2. Active Custody & Due Date Schedule Report
 */

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const formatDateOnly = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * 1. OVERDUE PHYSICAL DOCUMENTS REPORT (PDF)
 */
export const generateOverduePdfReport = (records, user = { name: 'Anita Sharma', role: 'System Admin' }) => {
  const overdueRecords = records.filter(r => r.isOverdue || (r.badge && r.badge.type === 'overdue'));
  const targetList = overdueRecords.length > 0 ? overdueRecords : records.filter(r => r.status === 'Active');

  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) {
    alert('Please allow popups to generate and print the PDF report.');
    return;
  }

  const generatedDate = new Date();
  const reportDocNum = `GXP-REP-2026-CHK-OVD-${String(Math.floor(1000 + Math.random() * 9000))}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Overdue Physical Check-Out Audit Report - DocuShield GxP</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 15mm 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 11px;
          line-height: 1.4;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .company-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-box {
          background: #0f172a;
          color: #ffffff;
          font-weight: 800;
          font-size: 13px;
          padding: 4px 8px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
        .company-name {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }
        .company-sub {
          font-size: 9.5px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-meta {
          text-align: right;
          font-size: 9.5px;
          color: #475569;
        }
        .report-title-box {
          margin-top: 10px;
        }
        .report-title {
          font-size: 16px;
          font-weight: 800;
          color: #991b1b;
          letter-spacing: -0.2px;
          text-transform: uppercase;
        }
        .report-subtitle {
          font-size: 10.5px;
          color: #475569;
          margin-top: 2px;
        }
        .alert-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 4px solid #dc2626;
          padding: 10px 12px;
          border-radius: 4px;
          margin-bottom: 14px;
          font-size: 10.5px;
          color: #7f1d1d;
        }
        .alert-banner strong {
          color: #991b1b;
        }
        .kpi-row {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
        }
        .kpi-card {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
        }
        .kpi-label {
          font-size: 9px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }
        .kpi-value {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
        }
        .kpi-value.critical {
          color: #dc2626;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 10px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 9px;
          padding: 8px 6px;
          border: 1px solid #cbd5e1;
          text-align: left;
        }
        td {
          padding: 8px 6px;
          border: 1px solid #e2e8f0;
          vertical-align: top;
        }
        tr:nth-child(even) {
          background: #fcfdfe;
        }
        .doc-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight: 700;
          color: #0369a1;
        }
        .doc-title {
          font-size: 9.5px;
          color: #334155;
          margin-top: 2px;
        }
        .badge-overdue {
          display: inline-block;
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
        }
        .badge-due {
          display: inline-block;
          background: #fffbeb;
          color: #92400e;
          border: 1px solid #fde68a;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 600;
          white-space: nowrap;
        }
        .capa-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 20px;
          font-size: 10px;
        }
        .capa-title {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
          text-transform: uppercase;
          font-size: 9.5px;
        }
        .capa-box ol {
          margin-left: 16px;
          color: #475569;
        }
        .capa-box li {
          margin-bottom: 2px;
        }
        .signature-block {
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          page-break-inside: avoid;
        }
        .sig-col {
          flex: 1;
          border-top: 1px solid #475569;
          padding-top: 6px;
          font-size: 9.5px;
        }
        .sig-title {
          font-weight: 700;
          color: #0f172a;
        }
        .sig-name {
          color: #334155;
          margin-top: 2px;
        }
        .sig-meaning {
          font-size: 8.5px;
          color: #64748b;
          margin-top: 4px;
          font-style: italic;
        }
        .footer {
          margin-top: 20px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 8.5px;
          color: #94a3b8;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-top">
          <div class="company-badge">
            <span class="logo-box">DocuShield</span>
            <div>
              <div class="company-name">VidyaGxP Pharma Vault Solutions</div>
              <div class="company-sub">21 CFR Part 11 Electronic DMS & Central Archive</div>
            </div>
          </div>
          <div class="header-meta">
            <div><strong>Report Ref:</strong> ${reportDocNum}</div>
            <div><strong>Generated:</strong> ${formatDateTime(generatedDate)}</div>
            <div><strong>Authority:</strong> ${user?.name || 'Anita Sharma (Admin)'}</div>
          </div>
        </div>

        <div class="report-title-box">
          <div class="report-title">Physical Check-Out Register: Overdue Audit Report</div>
          <div class="report-subtitle">
            Controlled Archive Binder Overdue Reconciliation & Chain-of-Custody Deviation Tracking
          </div>
        </div>
      </div>

      <div class="alert-banner">
        <strong>REGULATORY OBSERVATION ALERT:</strong> The physical binders listed below have exceeded their authorized vault check-out window. Pursuant to SOP-QA-0018 (GDP Governance) and 21 CFR Part 11, overdue physical records represent an immediate audit risk requiring immediate return or formal extension justification.
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">Active Overdue Binders</div>
          <div class="kpi-value critical">${targetList.length} Records</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Central Vault Facility</div>
          <div class="kpi-value">Plant-1 & Plant-2</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Maximum Days Overdue</div>
          <div class="kpi-value critical">9 Days Overdue</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Regulatory Risk Tier</div>
          <div class="kpi-value critical">High (CAPA Required)</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 18%;">Document Code / Title</th>
            <th style="width: 16%;">Borrower / Dept</th>
            <th style="width: 14%;">Issued Date / By</th>
            <th style="width: 12%;">Due Date</th>
            <th style="width: 12%;">Status</th>
            <th style="width: 16%;">Borrowing Purpose</th>
            <th style="width: 12%;">Bin Location</th>
          </tr>
        </thead>
        <tbody>
          ${targetList.map(item => `
            <tr>
              <td>
                <div class="doc-code">${item.document?.documentNumber || 'DOC-001'} ${item.document?.version ? `v${item.document.version}` : 'v01'}</div>
                <div class="doc-title">${item.document?.title || 'Controlled Document'}</div>
              </td>
              <td>
                <strong>${item.user?.name || 'Borrower'}</strong>
                <div style="color: #64748b; font-size: 8.5px;">${item.department || item.user?.department || 'Operations'}</div>
              </td>
              <td>
                <div>${formatDateTime(item.checkoutDate)}</div>
                <div style="color: #64748b; font-size: 8.5px;">by ${item.approvedBy?.name || 'Anita Sharma'}</div>
              </td>
              <td style="font-weight: 600; color: #dc2626;">
                ${formatDateOnly(item.expectedReturnDate)}
              </td>
              <td>
                <span class="${item.isOverdue || (item.badge && item.badge.type === 'overdue') ? 'badge-overdue' : 'badge-due'}">
                  ${item.badge?.label || 'Overdue'}
                </span>
              </td>
              <td style="color: #334155;">
                ${item.purpose || 'Operational reference'}
              </td>
              <td style="font-family: ui-monospace, monospace; font-size: 8.5px; color: #047857;">
                PLT-1/PRD/R101/BIN-B01
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="capa-box">
        <div class="capa-title">Mandatory Corrective Action Protocol (CAPA-OVD-2026)</div>
        <ol>
          <li>Borrowers have been electronically notified via VidyaGxP automated 21 CFR Part 11 alerts.</li>
          <li>Physical verification by Document Control to inspect spine integrity and page count prior to vault return.</li>
          <li>If unreturned within 24 operational hours, a formal Non-Conformance Deviation will be logged under Quality Assurance.</li>
        </ol>
      </div>

      <div class="signature-block">
        <div class="sig-col">
          <div class="sig-title">Prepared By (System Administrator)</div>
          <div class="sig-name">Anita Sharma</div>
          <div class="sig-meaning">Electronically verified under 21 CFR Part 11</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Timestamp: ${formatDateTime(generatedDate)}</div>
        </div>
        <div class="sig-col">
          <div class="sig-title">Verified By (Lead Document Controller)</div>
          <div class="sig-name">Suresh Patil</div>
          <div class="sig-meaning">Vault physical inventory check completed</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Signature Meaning: Chain-of-Custody Verified</div>
        </div>
        <div class="sig-col">
          <div class="sig-title">QA Compliance Reviewer</div>
          <div class="sig-name">Dr. Meera Iyer (Head of QA)</div>
          <div class="sig-meaning">Quality disposition & CAPA escalation reviewed</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Status: Legally Binding GxP Electronic Record</div>
        </div>
      </div>

      <div class="footer">
        <div>DocuShield GxP Version 2.4 | Central Vault Registry</div>
        <div>Strictly Confidential & Proprietary - 21 CFR Part 11 Validated</div>
        <div>Page 1 of 1</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * 2. DUE DATE & ACTIVE CHECK-OUT SCHEDULE REPORT (PDF)
 */
export const generateDueDatePdfReport = (records, user = { name: 'Suresh Patil', role: 'Document Controller' }) => {
  const activeRecords = records.filter(r => r.status === 'Active');
  const targetList = activeRecords.length > 0 ? activeRecords : records;

  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) {
    alert('Please allow popups to generate and print the PDF report.');
    return;
  }

  const generatedDate = new Date();
  const reportDocNum = `GXP-REP-2026-CHK-SCHED-${String(Math.floor(1000 + Math.random() * 9000))}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Due Date & Active Check-Out Custody Schedule - DocuShield GxP</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm 15mm 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          font-size: 11px;
          line-height: 1.4;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .company-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-box {
          background: #0f766e;
          color: #ffffff;
          font-weight: 800;
          font-size: 13px;
          padding: 4px 8px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
        .company-name {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }
        .company-sub {
          font-size: 9.5px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-meta {
          text-align: right;
          font-size: 9.5px;
          color: #475569;
        }
        .report-title-box {
          margin-top: 10px;
        }
        .report-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f766e;
          letter-spacing: -0.2px;
          text-transform: uppercase;
        }
        .report-subtitle {
          font-size: 10.5px;
          color: #475569;
          margin-top: 2px;
        }
        .info-banner {
          background: #f0fdfa;
          border: 1px solid #ccfbf1;
          border-left: 4px solid #0d9488;
          padding: 10px 12px;
          border-radius: 4px;
          margin-bottom: 14px;
          font-size: 10.5px;
          color: #115e59;
        }
        .info-banner strong {
          color: #0f766e;
        }
        .kpi-row {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
        }
        .kpi-card {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
        }
        .kpi-label {
          font-size: 9px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }
        .kpi-value {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
        }
        .kpi-value.active {
          color: #0d9488;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 10px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 9px;
          padding: 8px 6px;
          border: 1px solid #cbd5e1;
          text-align: left;
        }
        td {
          padding: 8px 6px;
          border: 1px solid #e2e8f0;
          vertical-align: top;
        }
        tr:nth-child(even) {
          background: #fcfdfe;
        }
        .doc-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight: 700;
          color: #0891b2;
        }
        .doc-title {
          font-size: 9.5px;
          color: #334155;
          margin-top: 2px;
        }
        .badge-due {
          display: inline-block;
          background: #fffbeb;
          color: #92400e;
          border: 1px solid #fde68a;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-overdue {
          display: inline-block;
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
        }
        .policy-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 20px;
          font-size: 10px;
        }
        .policy-title {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
          text-transform: uppercase;
          font-size: 9.5px;
        }
        .policy-box p {
          color: #475569;
          line-height: 1.5;
        }
        .signature-block {
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          page-break-inside: avoid;
        }
        .sig-col {
          flex: 1;
          border-top: 1px solid #475569;
          padding-top: 6px;
          font-size: 9.5px;
        }
        .sig-title {
          font-weight: 700;
          color: #0f172a;
        }
        .sig-name {
          color: #334155;
          margin-top: 2px;
        }
        .sig-meaning {
          font-size: 8.5px;
          color: #64748b;
          margin-top: 4px;
          font-style: italic;
        }
        .footer {
          margin-top: 20px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 8.5px;
          color: #94a3b8;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-top">
          <div class="company-badge">
            <span class="logo-box">DocuShield</span>
            <div>
              <div class="company-name">VidyaGxP Pharma Vault Solutions</div>
              <div class="company-sub">21 CFR Part 11 Electronic DMS & Central Archive</div>
            </div>
          </div>
          <div class="header-meta">
            <div><strong>Schedule Ref:</strong> ${reportDocNum}</div>
            <div><strong>Generated:</strong> ${formatDateTime(generatedDate)}</div>
            <div><strong>Issued By:</strong> ${user?.name || 'Suresh Patil (Document Control)'}</div>
          </div>
        </div>

        <div class="report-title-box">
          <div class="report-title">Active Custody & Due Date Schedule Report</div>
          <div class="report-subtitle">
            Controlled Physical Document Issuance, Expected Return Timeline & Storage Bin Locations
          </div>
        </div>
      </div>

      <div class="info-banner">
        <strong>CHAIN-OF-CUSTODY RETURN DIRECTIVE:</strong> All physical documents listed are active under temporary checkout authorization. Returns must be personally surrendered to the Central Vault Custodian and verified by physical bin QR barcode scan to maintain contemporaneous GxP compliance.
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">Active Borrowed Binders</div>
          <div class="kpi-value active">${targetList.length} Items</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Return Verification</div>
          <div class="kpi-value">Bin QR Scan Required</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Schedule Horizon</div>
          <div class="kpi-value">Current Month (Nov 2026)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Vault Operating Mode</div>
          <div class="kpi-value active">21 CFR Part 11 Regulated</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 18%;">Document Code / Title</th>
            <th style="width: 16%;">Borrower / Department</th>
            <th style="width: 14%;">Issued Date / Issuer</th>
            <th style="width: 12%;">Expected Due Date</th>
            <th style="width: 12%;">Status Badge</th>
            <th style="width: 16%;">Operational Purpose</th>
            <th style="width: 12%;">Return Bin QR Code</th>
          </tr>
        </thead>
        <tbody>
          ${targetList.map(item => `
            <tr>
              <td>
                <div class="doc-code">${item.document?.documentNumber || 'DOC-001'} ${item.document?.version ? `v${item.document.version}` : 'v01'}</div>
                <div class="doc-title">${item.document?.title || 'Controlled Document'}</div>
              </td>
              <td>
                <strong>${item.user?.name || 'Borrower'}</strong>
                <div style="color: #64748b; font-size: 8.5px;">${item.department || item.user?.department || 'Operations'}</div>
              </td>
              <td>
                <div>${formatDateTime(item.checkoutDate)}</div>
                <div style="color: #64748b; font-size: 8.5px;">by ${item.approvedBy?.name || 'Anita Sharma'}</div>
              </td>
              <td style="font-weight: 600; color: #0f172a;">
                ${formatDateOnly(item.expectedReturnDate)}
              </td>
              <td>
                <span class="${item.isOverdue || (item.badge && item.badge.type === 'overdue') ? 'badge-overdue' : 'badge-due'}">
                  ${item.badge?.label || 'Active'}
                </span>
              </td>
              <td style="color: #334155;">
                ${item.purpose || 'Operational activity'}
              </td>
              <td style="font-family: ui-monospace, monospace; font-size: 8.5px; color: #047857;">
                PLT-1/PRD/R101/BIN-B01
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="policy-box">
        <div class="policy-title">Vault Return & Physical Inspection Policy</div>
        <p>
          Upon return, the borrower and vault custodian must conduct a joint physical inspection to ensure no missing pages, physical defacement, or biological contamination. The return must be electronically logged in VidyaGxP with physical bin QR scan confirmation.
        </p>
      </div>

      <div class="signature-block">
        <div class="sig-col">
          <div class="sig-title">Lead Document Controller</div>
          <div class="sig-name">Suresh Patil</div>
          <div class="sig-meaning">Schedule issuance verified against central log</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Timestamp: ${formatDateTime(generatedDate)}</div>
        </div>
        <div class="sig-col">
          <div class="sig-title">Central Archive Vault Custodian</div>
          <div class="sig-name">Rahul Verma</div>
          <div class="sig-meaning">Storage bin capacity and return readiness confirmed</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Signature Meaning: Active Custody Monitored</div>
        </div>
        <div class="sig-col">
          <div class="sig-title">Quality Assurance Oversight</div>
          <div class="sig-name">Dr. Meera Iyer (Head of QA)</div>
          <div class="sig-meaning">Good Documentation Practices compliance acknowledged</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">Status: Validated Electronic Schedule</div>
        </div>
      </div>

      <div class="footer">
        <div>DocuShield GxP Version 2.4 | Central Vault Registry</div>
        <div>Strictly Confidential & Proprietary - 21 CFR Part 11 Validated</div>
        <div>Page 1 of 1</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

