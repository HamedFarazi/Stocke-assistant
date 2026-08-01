// ── Export utilities ──────────────────────────────────────────────────────────

export function exportCSV(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const v = String(row[h] ?? '');
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(',')
    ),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Simple HTML-to-print PDF via browser print dialog
export function printAsPDF(title: string, htmlContent: string, isRTL = false) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'fa' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: ${isRTL ? "'Vazirmatn', " : ""}'Inter', system-ui, sans-serif;
          font-size: 12px; color: #1e293b; margin: 24px;
          direction: ${isRTL ? 'rtl' : 'ltr'};
        }
        h1 { font-size: 18px; margin-bottom: 16px; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f1f5f9; padding: 8px 10px; text-align: ${isRTL ? 'right' : 'left'}; font-size: 11px; border: 1px solid #e2e8f0; }
        td { padding: 7px 10px; border: 1px solid #e2e8f0; font-size: 11px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .footer { margin-top: 16px; font-size: 10px; color: #94a3b8; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      ${htmlContent}
      <div class="footer">FreshFlow · Generated ${new Date().toLocaleDateString()}</div>
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}
