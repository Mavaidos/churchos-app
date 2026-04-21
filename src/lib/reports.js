// ─── src/lib/reports.js ──────────────────────────────────────────────────────
// All data import and export utilities for ChurchOS.
//
// EXPORTS (browser-side, click to download):
//   downloadMembersExcel        — full member list
//   downloadAttendanceExcel     — full attendance register
//   downloadGroupRosterExcel    — one group's roster
//   downloadBlueprintReport     — Blueprint progress per member
//   downloadImportTemplate      — blank Excel template for member import
//
// PDF (print-to-PDF via browser print dialog):
//   printGroupRoster
//   printMemberProfile
//   printAttendanceSession
//   printBlueprintReport
//
// IMPORT:
//   parseMemberImportFile       — parse uploaded Excel/CSV → raw rows
//   autoMapColumns              — detect column headings → schema keys
//   buildMembersFromImport      — convert mapped rows → member objects
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';

// ─── helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(wb, filename) {
  XLSX.writeFile(wb, filename);
}

function dateStr() {
  return new Date().toISOString().slice(0, 10);
}

function stageLabel(member, stages) {
  return stages[member.currentStageIndex ?? 0]?.name ?? '—';
}

function blueprintPercent(member, stages) {
  const s = stages[member.currentStageIndex ?? 0];
  if (!s) return 0;
  const tasks = member.tasks?.[s.id] ?? [];
  return s.requirements.length > 0
    ? Math.round((tasks.filter(Boolean).length / s.requirements.length) * 100)
    : 100;
}

// ─── header style helpers (opinionated: dark navy header, alternating rows) ──

function applyHeaderStyle(ws, headers, rowIdx = 1) {
  headers.forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: rowIdx - 1, c: ci });
    if (!ws[addr]) return;
    ws[addr].s = {
      font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill:      { fgColor: { rgb: '2D3B4E' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        bottom: { style: 'medium', color: { rgb: '515F74' } },
      },
    };
  });
}

function setColWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

// =============================================================================
// EXPORT — MEMBERS LIST
// =============================================================================

export function downloadMembersExcel(members, stages, groups) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Full Member List ──────────────────────────────────────────────
  const headers = [
    'Full Name', 'Email', 'Phone', 'Gender', 'Marital Status',
    'Faith Status', 'Group', 'Blueprint Stage', 'Stage Progress %',
    'Enrolment Status', 'Mentor', 'Join Date', 'Home Address',
  ];

  const faithLabel = f => ({
    born_again: 'Born Again', not_born_again: 'Not Born Again', visitor: 'Visitor',
  }[f] ?? (f || '—'));

  const enrollLabel = e => ({
    new_applicant: 'New Applicant', approved: 'Approved', in_discipleship: 'In Blueprint',
  }[e] ?? (e || '—'));

  const rows = members.map(m => [
    m.name,
    m.email || '',
    m.phone || '',
    m.gender || '',
    m.maritalStatus || '',
    faithLabel(m.faithStatus),
    m.group || '',
    stageLabel(m, stages),
    blueprintPercent(m, stages),
    enrollLabel(m.enrollmentStage),
    m.mentor || '',
    m.joinDate || '',
    m.homeAddress || '',
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  applyHeaderStyle(ws1, headers);
  setColWidths(ws1, [22, 28, 16, 10, 14, 14, 22, 18, 12, 14, 18, 12, 30]);
  ws1['!rows'] = [{ hpt: 20 }]; // header row height
  XLSX.utils.book_append_sheet(wb, ws1, 'Members');

  // ── Sheet 2: Stage Summary ─────────────────────────────────────────────────
  const stageHeaders = ['Stage', 'Members', '% of Total'];
  const total = members.length;
  const stageRows = stages.map((s, i) => {
    const count = members.filter(m => (m.currentStageIndex ?? 0) === i).length;
    return [s.name, count, total > 0 ? `${Math.round((count / total) * 100)}%` : '0%'];
  });
  stageRows.push(['TOTAL', `=SUM(B2:B${stages.length + 1})`, '100%']);

  const ws2 = XLSX.utils.aoa_to_sheet([stageHeaders, ...stageRows]);
  applyHeaderStyle(ws2, stageHeaders);
  setColWidths(ws2, [20, 12, 12]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Stage Summary');

  // ── Sheet 3: Group Breakdown ───────────────────────────────────────────────
  const groupHeaders = ['Group', 'Type', 'Leader', 'Members', 'Avg Stage Progress'];
  const groupRows = groups.map(g => {
    const gm = members.filter(m => g.memberIds?.includes(m.id));
    const avg = gm.length > 0
      ? Math.round(gm.reduce((s, m) => s + blueprintPercent(m, stages), 0) / gm.length)
      : 0;
    return [g.name, g.type?.replace('_', ' ') ?? '', g.leader ?? '—', gm.length, `${avg}%`];
  });

  const ws3 = XLSX.utils.aoa_to_sheet([groupHeaders, ...groupRows]);
  applyHeaderStyle(ws3, groupHeaders);
  setColWidths(ws3, [24, 14, 20, 10, 16]);
  XLSX.utils.book_append_sheet(wb, ws3, 'Groups');

  triggerDownload(wb, `ChurchOS_Members_${dateStr()}.xlsx`);
}

// =============================================================================
// EXPORT — ATTENDANCE REGISTER
// =============================================================================

export function downloadAttendanceExcel(attendanceRecords, members, groups) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Session Summary ───────────────────────────────────────────────
  const sumHeaders = ['Date', 'Group', 'Service', 'Total', 'Present', 'Absent', 'Rate %', 'Recorded By'];
  const sumRows = [...attendanceRecords]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(r => [
      r.date, r.groupName, r.service,
      r.total, r.presentCount, r.total - r.presentCount,
      r.attendanceRate,
      r.recordedBy || '—',
    ]);

  const ws1 = XLSX.utils.aoa_to_sheet([sumHeaders, ...sumRows]);
  applyHeaderStyle(ws1, sumHeaders);
  setColWidths(ws1, [12, 22, 20, 8, 8, 8, 8, 18]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Session Summary');

  // ── Per-group sheets ───────────────────────────────────────────────────────
  const uniqueGroups = [...new Set(attendanceRecords.map(r => r.groupId))];

  uniqueGroups.forEach(gId => {
    const group   = groups.find(g => g.id === gId);
    if (!group) return;
    const sessions = [...attendanceRecords.filter(r => r.groupId === gId)]
      .sort((a, b) => a.date.localeCompare(b.date));

    // Columns: Member Name | session dates...
    const sessionDates = sessions.map(s => `${s.date}\n${s.service.slice(0, 10)}`);
    const memberSet    = new Set(sessions.flatMap(s => [...s.present, ...s.absent]));
    const groupMembers = members.filter(m => memberSet.has(m.id));

    const headers = ['Member', ...sessionDates, 'Total Present', 'Total Sessions', 'Rate %'];
    const dataRows = groupMembers.map(m => {
      const row = [m.name];
      let presCount = 0;
      sessions.forEach(s => {
        const present = s.present.includes(m.id);
        row.push(present ? '✓' : '✗');
        if (present) presCount++;
      });
      const rate = sessions.length > 0 ? Math.round((presCount / sessions.length) * 100) : 0;
      row.push(presCount, sessions.length, `${rate}%`);
      return row;
    });

    const sheetName = group.name.slice(0, 28); // Sheet name max 31 chars
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    applyHeaderStyle(ws, headers);

    // Color-code attendance cells (✓ = light green, ✗ = light red)
    dataRows.forEach((row, ri) => {
      sessions.forEach((_, ci) => {
        const addr = XLSX.utils.encode_cell({ r: ri + 1, c: ci + 1 });
        if (ws[addr]) {
          const isPresent = ws[addr].v === '✓';
          ws[addr].s = {
            fill: { fgColor: { rgb: isPresent ? 'D4EDDA' : 'FFDDE1' } },
            alignment: { horizontal: 'center' },
            font: { color: { rgb: isPresent ? '155724' : '721C24' }, bold: true },
          };
        }
      });
    });

    const colWidths = [20, ...sessions.map(() => 10), 12, 14, 8];
    setColWidths(ws, colWidths);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  triggerDownload(wb, `ChurchOS_Attendance_${dateStr()}.xlsx`);
}

// =============================================================================
// EXPORT — GROUP ROSTER
// =============================================================================

export function downloadGroupRosterExcel(group, members, stages) {
  const wb = XLSX.utils.book_new();
  const gMembers = members.filter(m => group.memberIds?.includes(m.id));

  const headers = ['Name', 'Email', 'Phone', 'Blueprint Stage', 'Progress %', 'Mentor', 'Faith Status', 'Status'];
  const faithLabel = f => ({ born_again: 'Born Again', not_born_again: 'Not Born Again', visitor: 'Visitor' }[f] ?? f ?? '—');

  const rows = gMembers.map(m => [
    m.name, m.email || '', m.phone || '',
    stageLabel(m, stages), blueprintPercent(m, stages),
    m.mentor || '', faithLabel(m.faithStatus),
    m.id === group.leaderId ? 'Leader' : 'Member',
  ]);

  // Summary row
  rows.push([]);
  rows.push(['TOTAL MEMBERS', gMembers.length, '', `Leader: ${group.leader ?? '—'}`, '', '', '', '']);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  applyHeaderStyle(ws, headers);
  setColWidths(ws, [22, 26, 16, 18, 10, 18, 14, 10]);
  XLSX.utils.book_append_sheet(wb, ws, group.name.slice(0, 28));

  triggerDownload(wb, `Roster_${group.name.replace(/\s+/g, '_')}_${dateStr()}.xlsx`);
}

// =============================================================================
// EXPORT — BLUEPRINT PROGRESS REPORT
// =============================================================================

export function downloadBlueprintReport(members, stages, groups) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Name', 'Group', 'Current Stage', 'Stage Progress %', 'Overall Progress %',
    'Has Mentor', 'Has Home Cell', 'Faith Status',
  ];

  const rows = members.map(m => {
    const stageIdx   = m.currentStageIndex ?? 0;
    const s          = stages[stageIdx];
    const tasks      = m.tasks?.[s?.id] ?? [];
    const stagePct   = s?.requirements.length > 0
      ? Math.round((tasks.filter(Boolean).length / s.requirements.length) * 100)
      : 100;
    const overallPct = stages.length > 0
      ? Math.round(((stageIdx + stagePct / 100) / stages.length) * 100)
      : 0;
    const homeCell   = groups.find(g => g.type === 'home_cell' && g.memberIds?.includes(m.id));

    return [
      m.name,
      m.group || '—',
      s?.name ?? '—',
      stagePct,
      overallPct,
      m.mentor ? 'Yes' : 'No',
      homeCell ? homeCell.name : 'No',
      ({ born_again: 'Born Again', not_born_again: 'Not Born Again', visitor: 'Visitor' })[m.faithStatus] ?? m.faithStatus ?? '—',
    ];
  }).sort((a, b) => b[4] - a[4]); // sort by overall progress desc

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  applyHeaderStyle(ws, headers);
  setColWidths(ws, [22, 22, 18, 14, 14, 10, 18, 14]);
  XLSX.utils.book_append_sheet(wb, ws, 'Blueprint Progress');

  triggerDownload(wb, `ChurchOS_Blueprint_${dateStr()}.xlsx`);
}

// =============================================================================
// EXPORT — IMPORT TEMPLATE
// =============================================================================

export function downloadImportTemplate() {
  const wb = XLSX.utils.book_new();

  const headers = [
    'First Name *', 'Surname *', 'Email *', 'Phone *', 'Gender',
    'Marital Status', 'Home Address', 'Faith Status', 'Pastoral Comment',
  ];

  const examples = [
    ['John', 'Smith', 'john.smith@email.com', '+27 71 000 0001', 'Male', 'Married', '123 Main St, Johannesburg', 'born_again', 'Example record — delete this row'],
    ['Mary', 'Jones', 'mary.jones@email.com', '+27 82 000 0002', 'Female', 'Single', '45 Oak Ave, Sandton', 'visitor', ''],
  ];

  const notes = [
    [],
    ['NOTES:'],
    ['• Required fields are marked with *'],
    ['• Gender: Male | Female | Prefer not to say'],
    ['• Marital Status: single | married | divorced | widowed'],
    ['• Faith Status: born_again | not_born_again | visitor'],
    ['• Delete the example rows before importing'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples, ...notes]);
  applyHeaderStyle(ws, headers);
  setColWidths(ws, [14, 14, 28, 16, 14, 14, 30, 14, 28]);

  // Style note rows
  notes.forEach((_, i) => {
    const addr = XLSX.utils.encode_cell({ r: examples.length + 1 + i, c: 0 });
    if (ws[addr]) {
      ws[addr].s = { font: { italic: true, color: { rgb: '888888' } } };
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Member Import Template');
  triggerDownload(wb, 'ChurchOS_Import_Template.xlsx');
}

// =============================================================================
// IMPORT — PARSE UPLOADED FILE
// =============================================================================

/**
 * Reads an Excel or CSV file and returns an array of raw row objects.
 * Each row object has column headers as keys.
 */
export function parseMemberImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(new Error('Could not read file. Make sure it is a valid Excel (.xlsx) or CSV file.'));
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}

// Column name aliases → our schema field names
const COLUMN_ALIASES = {
  name:          ['name', 'full name', 'fullname'],
  firstName:     ['first name', 'firstname', 'given name', 'first'],
  surname:       ['surname', 'last name', 'lastname', 'family name', 'last'],
  email:         ['email', 'email address', 'e-mail', 'e mail'],
  phone:         ['phone', 'cell', 'mobile', 'telephone', 'phone number', 'cell number', 'contact number'],
  gender:        ['gender', 'sex'],
  maritalStatus: ['marital status', 'marital', 'married status'],
  homeAddress:   ['home address', 'address', 'street address', 'residential address'],
  faithStatus:   ['faith status', 'faith', 'spiritual status', 'born again', 'salvation'],
  comment:       ['comment', 'notes', 'pastoral notes', 'pastoral comment', 'remarks'],
};

/**
 * Auto-detect column mapping from raw row headers.
 * Returns { fieldName: detectedHeader } for each matched field.
 */
export function autoMapColumns(rows) {
  if (!rows.length) return {};
  const headers  = Object.keys(rows[0]).map(h => h.toString().toLowerCase().trim());
  const rawKeys  = Object.keys(rows[0]);
  const mapping  = {};

  Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
    for (const alias of aliases) {
      const idx = headers.findIndex(h => h.includes(alias) || alias.includes(h));
      if (idx !== -1) {
        mapping[field] = rawKeys[idx];
        break;
      }
    }
  });

  return mapping;
}

/**
 * Convert mapped rows into member objects ready for createMemberDefaults().
 * Returns array of { firstName, surname, email, phone, gender, maritalStatus,
 *                    homeAddress, faithStatus, comment }
 */
export function buildMembersFromImport(rows, mapping, stages) {
  const get = (row, field) => {
    const key = mapping[field];
    return key ? (row[key] ?? '').toString().trim() : '';
  };

  return rows
    .filter(row => {
      // Skip obviously empty rows
      const vals = Object.values(row).map(v => v.toString().trim()).filter(Boolean);
      return vals.length > 0;
    })
    .map(row => {
      // Handle "Name" field that might be combined
      let firstName = get(row, 'firstName');
      let surname   = get(row, 'surname');
      if (!firstName && !surname) {
        const combined = get(row, 'name');
        const parts    = combined.split(' ');
        firstName      = parts[0] ?? '';
        surname        = parts.slice(1).join(' ');
      }

      // Normalise faith status
      let faith = get(row, 'faithStatus').toLowerCase();
      if (faith.includes('born') || faith === 'yes' || faith === 'true') faith = 'born_again';
      else if (faith.includes('not') || faith.includes('seeking'))        faith = 'not_born_again';
      else                                                                  faith = 'visitor';

      // Normalise marital status
      let marital = get(row, 'maritalStatus').toLowerCase();
      if (!['single', 'married', 'divorced', 'widowed'].includes(marital)) marital = '';

      return {
        firstName: firstName.trim(),
        surname:   surname.trim(),
        email:     get(row, 'email'),
        phone:     get(row, 'phone'),
        gender:    get(row, 'gender'),
        maritalStatus: marital,
        homeAddress: get(row, 'homeAddress'),
        faithStatus: faith || 'visitor',
        comment:    get(row, 'comment'),
      };
    })
    .filter(m => m.firstName || m.surname); // must have at least a name
}

// =============================================================================
// PDF EXPORTS (print-to-PDF via browser print dialog)
// =============================================================================

function openPrintWindow(html, title) {
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; font-size: 11pt; color: #1a1a2e; padding: 20px; }
  .header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #2d3b4e; }
  .header-icon { width: 40px; height: 40px; background: #2d3b4e; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: bold; }
  .header-text h1 { font-size: 18pt; font-weight: bold; color: #2d3b4e; }
  .header-text p  { font-size: 9pt; color: #666; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #2d3b4e; color: white; padding: 8px 10px; text-align: left; font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 10pt; }
  tr:nth-child(even) td { background: #f8f9fa; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 8pt; font-weight: bold; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11pt; font-weight: bold; color: #2d3b4e; border-left: 3px solid #2d3b4e; padding-left: 8px; margin-bottom: 8px; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
  .stat-card { background: #f8f9fa; border: 1px solid #eee; border-radius: 8px; padding: 10px; text-align: center; }
  .stat-card .value { font-size: 20pt; font-weight: bold; color: #2d3b4e; }
  .stat-card .label { font-size: 8pt; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
  .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 8pt; color: #999; display: flex; justify-content: space-between; }
  .progress-bar { background: #e5e7eb; border-radius: 4px; height: 6px; width: 100%; margin-top: 2px; }
  .progress-fill { height: 100%; border-radius: 4px; background: #2d3b4e; }
  @media print {
    body { padding: 0; }
    button { display: none; }
  }
</style>
</head>
<body>
${html}
<div class="footer">
  <span>ChurchOS — Generated ${new Date().toLocaleDateString('en-ZA', { dateStyle: 'full' })}</span>
  <span>Confidential — Pastoral Use Only</span>
</div>
<script>setTimeout(() => { window.print(); }, 400 );<\/script>
</body>
</html>`);
  win.document.close();
}

export function printGroupRoster(group, members, stages) {
  const gMembers = members.filter(m => group.memberIds?.includes(m.id));
  const faithLabel = f => ({ born_again: 'Born Again', not_born_again: 'Not Born Again', visitor: 'Visitor' }[f] ?? f ?? '—');

  const rows = gMembers.map(m => `
    <tr>
      <td><strong>${m.name}</strong>${m.id === group.leaderId ? ' <span class="badge badge-blue">Leader</span>' : ''}</td>
      <td>${m.phone || '—'}</td>
      <td>${m.email || '—'}</td>
      <td>${stageLabel(m, stages)}</td>
      <td>
        <div>${blueprintPercent(m, stages)}%</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${blueprintPercent(m, stages)}%"></div></div>
      </td>
      <td>${m.mentor || '—'}</td>
    </tr>`).join('');

  const html = `
    <div class="header">
      <div class="header-icon">✦</div>
      <div class="header-text">
        <h1>${group.name} — Group Roster</h1>
        <p>${group.type?.replace('_', ' ')} · Leader: ${group.leader ?? 'Unassigned'} · ${gMembers.length} Members</p>
      </div>
    </div>
    <div class="stat-grid">
      ${[
        { label: 'Total Members', value: gMembers.length },
        { label: 'Avg Progress', value: gMembers.length > 0 ? Math.round(gMembers.reduce((s,m) => s + blueprintPercent(m, stages), 0) / gMembers.length) + '%' : '—' },
        { label: 'With Mentor', value: gMembers.filter(m => m.mentor).length },
        { label: 'Born Again', value: gMembers.filter(m => m.faithStatus === 'born_again').length },
      ].map(s => `<div class="stat-card"><div class="value">${s.value}</div><div class="label">${s.label}</div></div>`).join('')}
    </div>
    <table>
      <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Stage</th><th>Blueprint %</th><th>Mentor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  openPrintWindow(html, `Roster — ${group.name}`);
}

export function printMemberProfile(member, stages, groups) {
  const stageIdx = member.currentStageIndex ?? 0;
  const stage    = stages[stageIdx];
  const tasks    = member.tasks?.[stage?.id] ?? [];
  const pct      = blueprintPercent(member, stages);
  const homeCell = groups?.find(g => g.type === 'home_cell' && g.memberIds?.includes(member.id));
  const faithLabel = f => ({ born_again: 'Born Again', not_born_again: 'Not Born Again', visitor: 'Visitor' }[f] ?? f ?? '—');

  const taskRows = (stage?.requirements ?? []).map((task, i) => `
    <tr>
      <td>${task}</td>
      <td style="text-align:center">
        ${tasks[i] ? '<span class="badge badge-green">✓ Done</span>' : '<span class="badge badge-amber">Pending</span>'}
      </td>
    </tr>`).join('');

  const html = `
    <div class="header">
      <div class="header-icon">${(member.initials ?? member.name?.[0] ?? '?').slice(0,2)}</div>
      <div class="header-text">
        <h1>${member.name}</h1>
        <p>${faithLabel(member.faithStatus)} · Joined ${member.joinDate ?? '—'} · ${member.group || 'No group assigned'}</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Contact Details</div>
      <table>
        <tbody>
          ${[
            ['Phone', member.phone || '—'],
            ['Email', member.email || '—'],
            ['Address', member.homeAddress || '—'],
            ['Marital Status', member.maritalStatus || '—'],
            ['Mentor', member.mentor || 'Not assigned'],
            ['Home Cell', homeCell?.name ?? 'Not assigned'],
          ].map(([k,v]) => `<tr><td style="width:140px;color:#666;font-weight:bold">${k}</td><td>${v}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Blueprint Progress — ${stage?.name ?? '—'} (${pct}%)</div>
      <div class="progress-bar" style="height:10px;margin-bottom:12px">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <table>
        <thead><tr><th>Task</th><th style="width:100px;text-align:center">Status</th></tr></thead>
        <tbody>${taskRows}</tbody>
      </table>
    </div>

    ${member.comment ? `
    <div class="section">
      <div class="section-title">Pastoral Notes</div>
      <p style="background:#f8f9fa;padding:10px;border-radius:6px;font-style:italic">${member.comment}</p>
    </div>` : ''}`;

  openPrintWindow(html, `Profile — ${member.name}`);
}

export function printAttendanceSession(session, members) {
  const allIds = [...(session.present ?? []), ...(session.absent ?? [])];
  const mList  = members.filter(m => allIds.includes(m.id));

  const rows = mList.map(m => {
    const isPresent = (session.present ?? []).includes(m.id);
    return `<tr>
      <td>${m.name}</td>
      <td style="text-align:center">
        <span class="badge ${isPresent ? 'badge-green' : 'badge-amber'}">${isPresent ? '✓ Present' : '✗ Absent'}</span>
      </td>
    </tr>`;
  }).join('');

  const html = `
    <div class="header">
      <div class="header-icon">✓</div>
      <div class="header-text">
        <h1>Attendance Register</h1>
        <p>${session.groupName} · ${session.date} · ${session.service}</p>
      </div>
    </div>
    <div class="stat-grid">
      ${[
        { label: 'Total', value: session.total },
        { label: 'Present', value: session.presentCount },
        { label: 'Absent', value: session.total - session.presentCount },
        { label: 'Rate', value: session.attendanceRate + '%' },
      ].map(s => `<div class="stat-card"><div class="value">${s.value}</div><div class="label">${s.label}</div></div>`).join('')}
    </div>
    <table>
      <thead><tr><th>Member Name</th><th style="width:120px;text-align:center">Attendance</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:12px;font-size:9pt;color:#666">Recorded by ${session.recordedBy ?? '—'}</p>`;

  openPrintWindow(html, `Attendance — ${session.groupName} ${session.date}`);
}