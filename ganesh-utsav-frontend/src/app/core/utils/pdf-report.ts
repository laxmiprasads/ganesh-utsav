/**
 * Small dependency-free PDF writer behind the downloadable reports (the contributions report for
 * now). It lays out a styled table with the standard Helvetica fonts, so the browser saves a real
 * PDF without the app shipping a PDF library.
 *
 * The built-in PDF fonts only cover the WinAnsi characters, so anything outside that set (the
 * rupee sign, for example) is printed in its plain-text form such as "Rs.".
 */

export interface PdfReportColumn {
  header: string;
  /** Relative width of the column compared with the other columns. */
  weight: number;
  align?: 'left' | 'right';
  /** Draws the cell as a rounded pill, the way payment methods look in the app. */
  badge?: boolean;
}

export interface PdfReportRow {
  cells: string[];
  /** Optional URL per cell; when set, the cell text becomes a clickable link. */
  links?: (string | undefined)[];
}

/** One number that stands out at the top of the report, such as the total that was collected. */
export interface PdfReportHighlight {
  label: string;
  value: string;
}

export interface PdfReport {
  title: string;
  subtitle?: string;
  meta?: string[];
  highlights?: PdfReportHighlight[];
  columns: PdfReportColumn[];
  rows: PdfReportRow[];
  /** Optional bold summary line under the table, holding one cell per column. */
  footer?: string[];
}

const PAGE_WIDTH = 595.28; // A4 portrait, in PDF points
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const HEADING_INDENT = 14;
const ACCENT_WIDTH = 3.5;
const HIGHLIGHT_HEIGHT = 46;
const HIGHLIGHT_GAP = 10;
const CELL_PADDING = 6;
const HEADER_HEIGHT = 26;
const ROW_HEIGHT = 26;
const BADGE_HEIGHT = 16;
const BOTTOM_LIMIT = 76;
const BODY_SIZE = 9;
const BADGE_SIZE = 8;
const HEADER_SIZE = 8.5;
const HIGHLIGHT_LABEL_SIZE = 8;
const HIGHLIGHT_VALUE_SIZE = 14;
const COLOR_TEXT = '0.118 0.157 0.200';
const COLOR_PRIMARY = '0.624 0.247 0.149';
const COLOR_HEADER_TEXT = '0.373 0.420 0.471';
const COLOR_MUTED = '0.533 0.576 0.627';
const COLOR_LINE = '0.890 0.878 0.847';
const COLOR_HEADER_BG = '0.980 0.980 0.969';
const COLOR_HIGHLIGHT_BG = '0.984 0.980 0.973';
const COLOR_ROW_STRIPE = '0.980 0.976 0.969';
const COLOR_TOTAL_BG = '0.965 0.957 0.941';
const COLOR_BADGE_BG = '0.941 0.949 0.961';

/** Money as printed in the PDF reports, for example 2000 -> "Rs.2,000". */
export function reportAmount(value: number): string {
  const amount = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value || 0);
  return `Rs.${amount}`;
}

/** Saves the report as a PDF file the browser downloads right away. */
export function downloadPdfReport(fileName: string, report: PdfReport): void {
  const blob = new Blob([buildPdfReport(report)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

interface PdfAnnotation {
  url: string;
  rect: [number, number, number, number];
}

interface PdfPage {
  ops: string[];
  annots: PdfAnnotation[];
}

/** Left edge and width of every column, in PDF points. */
interface PdfLayout {
  starts: number[];
  widths: number[];
}

/** How one row of cells is painted. */
interface PdfCellStyle {
  bold?: boolean;
}

/** Builds the PDF document as raw bytes, so the output can be checked without a browser download. */
export function buildPdfReport(report: PdfReport): Uint8Array<ArrayBuffer> {
  const layout = layoutColumns(report.columns);
  const pages: PdfPage[] = [];
  let page = openPage();
  pages.push(page);
  let rowTop = drawTableHeader(page, report, layout, drawHeading(page, report, false));

  const breakPage = () => {
    page = openPage();
    pages.push(page);
    rowTop = drawTableHeader(page, report, layout, drawHeading(page, report, true));
  };

  if (!report.rows.length) {
    text(page, MARGIN + CELL_PADDING, rowTop - ROW_HEIGHT / 2 - 3.5, BODY_SIZE, false, COLOR_MUTED, 'No contributions found.');
    rowTop -= ROW_HEIGHT;
  }

  report.rows.forEach((row, index) => {
    if (rowTop - ROW_HEIGHT < BOTTOM_LIMIT) breakPage();
    paintRow(page, rowTop, index % 2 === 1 ? COLOR_ROW_STRIPE : undefined);
    drawCells(page, report, row.cells, row.links ?? [], layout, rowTop, {});
    rowTop = closeRow(page, rowTop);
  });

  if (report.footer) {
    if (rowTop - ROW_HEIGHT < BOTTOM_LIMIT) breakPage();
    paintRow(page, rowTop, COLOR_TOTAL_BG);
    drawCells(page, report, report.footer, [], layout, rowTop, { bold: true });
    closeRow(page, rowTop);
  }

  pages.forEach((rendered, index) => drawPageFooter(rendered, index + 1, pages.length));
  return assemble(pages);
}

function layoutColumns(columns: PdfReportColumn[]): PdfLayout {
  const totalWeight = columns.reduce((sum, column) => sum + column.weight, 0) || 1;
  const widths = columns.map(column => (column.weight / totalWeight) * CONTENT_WIDTH);
  const starts: number[] = [];
  let cursor = MARGIN;
  widths.forEach(width => {
    starts.push(cursor);
    cursor += width;
  });
  return { starts, widths };
}

function openPage(): PdfPage {
  return { ops: [], annots: [] };
}

/**
 * Title, subtitle, meta lines and the highlight boxes, returning the top of the table area. The
 * brand coloured bar next to the heading keeps the report recognisable at a glance.
 */
function drawHeading(page: PdfPage, report: PdfReport, continued: boolean): number {
  const x = MARGIN + HEADING_INDENT;
  const titleBaseline = PAGE_HEIGHT - MARGIN - 9;
  text(page, x, titleBaseline, 18, true, COLOR_TEXT, continued ? `${report.title} - continued` : report.title);

  let baseline = titleBaseline - 16;
  let lastBaseline = titleBaseline;
  if (!continued && report.subtitle) {
    text(page, x, baseline, 11, true, COLOR_PRIMARY, report.subtitle);
    lastBaseline = baseline;
    baseline -= 14;
  }
  if (!continued) {
    (report.meta ?? []).forEach(line => {
      text(page, x, baseline, 9, false, COLOR_MUTED, line);
      lastBaseline = baseline;
      baseline -= 13;
    });
  }

  const barBottom = lastBaseline - 5;
  const barHeight = titleBaseline + 14 - barBottom;
  page.ops.push(`${COLOR_PRIMARY} rg ${roundedRect(MARGIN, barBottom, ACCENT_WIDTH, barHeight, ACCENT_WIDTH / 2)} f`);

  let below = barBottom;
  if (!continued && report.highlights?.length) {
    below = drawHighlights(page, report.highlights, below - 18);
  }
  return below - 18;
}

/** A row of rounded boxes carrying the numbers the committee looks for first. */
function drawHighlights(page: PdfPage, highlights: PdfReportHighlight[], top: number): number {
  const width = (CONTENT_WIDTH - HIGHLIGHT_GAP * (highlights.length - 1)) / highlights.length;
  highlights.forEach((highlight, index) => {
    const x = MARGIN + index * (width + HIGHLIGHT_GAP);
    const y = top - HIGHLIGHT_HEIGHT;
    page.ops.push(`${COLOR_HIGHLIGHT_BG} rg ${roundedRect(x, y, width, HIGHLIGHT_HEIGHT, 10)} f`);
    text(page, x + 12, y + HIGHLIGHT_HEIGHT - 15, HIGHLIGHT_LABEL_SIZE, true, COLOR_MUTED, highlight.label.toUpperCase(), 0.4);
    text(page, x + 12, y + 15, HIGHLIGHT_VALUE_SIZE, true, COLOR_TEXT, truncate(highlight.value, width - 24, HIGHLIGHT_VALUE_SIZE, true));
  });
  return top - HIGHLIGHT_HEIGHT;
}

/** The grey table header row, returning the top of the first data row. */
function drawTableHeader(page: PdfPage, report: PdfReport, layout: PdfLayout, top: number): number {
  page.ops.push(`${COLOR_HEADER_BG} rg ${round(MARGIN)} ${round(top - HEADER_HEIGHT)} ${round(CONTENT_WIDTH)} ${HEADER_HEIGHT} re f`);
  const baseline = top - HEADER_HEIGHT / 2 - 3;
  report.columns.forEach((column, index) => {
    const label = column.header.toUpperCase();
    const x = column.align === 'right'
      ? layout.starts[index] + layout.widths[index] - CELL_PADDING - textWidth(label, HEADER_SIZE, true, HEADER_SPACING)
      : layout.starts[index] + CELL_PADDING;
    text(page, x, baseline, HEADER_SIZE, true, COLOR_HEADER_TEXT, label, HEADER_SPACING);
  });
  // The brand coloured rule under the header separates the captions from the money.
  page.ops.push(`1.2 w ${COLOR_PRIMARY} RG ${round(MARGIN)} ${round(top - HEADER_HEIGHT)} m ${round(MARGIN + CONTENT_WIDTH)} ${round(top - HEADER_HEIGHT)} l S`);
  return top - HEADER_HEIGHT;
}

/** Fills the band behind a row, used for the zebra stripes and the total row. */
function paintRow(page: PdfPage, top: number, color?: string): void {
  if (!color) return;
  page.ops.push(`${color} rg ${round(MARGIN)} ${round(top - ROW_HEIGHT)} ${round(CONTENT_WIDTH)} ${ROW_HEIGHT} re f`);
}

/** One row of cells, laid out inside the row starting at `top`. */
function drawCells(page: PdfPage, report: PdfReport, cells: string[], links: (string | undefined)[], layout: PdfLayout, top: number, style: PdfCellStyle): void {
  const baseline = top - ROW_HEIGHT / 2 - 3.5;
  const bold = style.bold ?? false;
  report.columns.forEach((column, index) => {
    const x = layout.starts[index] + CELL_PADDING;
    const available = layout.widths[index] - CELL_PADDING * 2;
    const value = cells[index] ?? '';
    if (column.badge) {
      // An empty cell draws no pill, so the total row stays clean.
      if (value) drawBadge(page, x, top - (ROW_HEIGHT + BADGE_HEIGHT) / 2, available, value);
      return;
    }
    const printed = truncate(value, available, BODY_SIZE, bold);
    const width = textWidth(printed, BODY_SIZE, bold);
    const textX = column.align === 'right' ? x + available - width : x;
    text(page, textX, baseline, BODY_SIZE, bold, COLOR_TEXT, printed);
    const link = links[index];
    if (link) page.annots.push({ url: link, rect: [textX, baseline - 3, textX + width, baseline + 9] });
  });
}

function badgeColors(value: string): { bg: string; text: string } {
  const upper = (value ?? '').toUpperCase().replace(/[\s_-]+/g, '');
  if (upper === 'PAID' || upper === 'CASH') {
    return { bg: '0.902 0.969 0.925', text: '0.051 0.408 0.196' };
  }
  if (upper === 'PARTIAL') {
    return { bg: '0.996 0.957 0.890', text: '0.604 0.325 0.086' };
  }
  if (upper === 'PENDING') {
    return { bg: '0.996 0.925 0.925', text: '0.776 0.157 0.157' };
  }
  if (upper === 'UPI') {
    return { bg: '0.953 0.910 1.000', text: '0.420 0.129 0.659' };
  }
  if (upper === 'BANKTRANSFER') {
    return { bg: '0.878 0.949 0.996', text: '0.012 0.412 0.631' };
  }
  return { bg: COLOR_BADGE_BG, text: COLOR_HEADER_TEXT };
}

/** The payment method or status pill drawn the way the app shows it. */
function drawBadge(page: PdfPage, x: number, y: number, available: number, value: string): void {
  let label = value;
  let width = textWidth(label, BADGE_SIZE, true) + 16;
  if (width > available) {
    label = truncate(label, available - 16, BADGE_SIZE, true);
    width = available;
  }
  const colors = badgeColors(value);
  page.ops.push(`${colors.bg} rg ${roundedRect(x, y, width, BADGE_HEIGHT, BADGE_HEIGHT / 2)} f`);
  text(page, x + (width - textWidth(label, BADGE_SIZE, true)) / 2, y + BADGE_HEIGHT / 2 - 3.2, BADGE_SIZE, true, colors.text, label);
}

/** Closes a row with its bottom border and returns the top of the next row. */
function closeRow(page: PdfPage, top: number): number {
  page.ops.push(`0.6 w ${COLOR_LINE} RG ${round(MARGIN)} ${round(top - ROW_HEIGHT)} m ${round(MARGIN + CONTENT_WIDTH)} ${round(top - ROW_HEIGHT)} l S`);
  return top - ROW_HEIGHT;
}

/** Draws the page number at the bottom of the page. */
function drawPageFooter(page: PdfPage, pageNumber: number, totalPages: number): void {
  const footerText = `Page ${pageNumber} of ${totalPages}`;
  const width = textWidth(footerText, 8, false);
  text(page, MARGIN + CONTENT_WIDTH - width, 26, 8, false, COLOR_MUTED, footerText);
}

/** Wraps the rendered pages in the PDF file structure (objects, xref table and trailer). */
function assemble(pages: PdfPage[]): Uint8Array<ArrayBuffer> {
  const objects: string[] = [];
  const add = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  add('<< /Type /Catalog /Pages 2 0 R >>');
  add(''); // 2 - the page tree, filled in once every page object number is known
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  const kids = pages.map(page => {
    const content = page.ops.join('\n');
    const contentNumber = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const annots = page.annots.map(annotation => add(
      `<< /Type /Annot /Subtype /Link /Border [0 0 0] /Rect [${annotation.rect.map(round).join(' ')}] ` +
      `/A << /Type /Action /S /URI /URI (${escapePdfText(annotation.url)}) >> >>`
    ));
    const annotsEntry = annots.length ? ` /Annots [${annots.map(number => `${number} 0 R`).join(' ')}]` : '';
    return add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNumber} 0 R${annotsEntry} >>`
    );
  });
  objects[1] = `<< /Type /Pages /Kids [${kids.map(number => `${number} 0 R`).join(' ')}] /Count ${kids.length} >>`;

  const pieces: string[] = [];
  let size = 0;
  const push = (chunk: string) => {
    pieces.push(chunk);
    size += chunk.length;
  };
  const offsets: number[] = [];

  push('%PDF-1.4\n');
  objects.forEach((body, index) => {
    offsets[index] = size;
    push(`${index + 1} 0 obj\n${body}\nendobj\n`);
  });
  const xrefOffset = size;
  push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.forEach(offset => push(`${String(offset).padStart(10, '0')} 00000 n \n`));
  push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const document = pieces.join('');
  const bytes = new Uint8Array(document.length);
  for (let index = 0; index < document.length; index++) bytes[index] = document.charCodeAt(index) & 0xff;
  return bytes;
}

/** One text run in the given font, colour and size. */
function text(page: PdfPage, x: number, y: number, size: number, bold: boolean, color: string, value: string, spacing = 0): void {
  const font = bold ? 'F2' : 'F1';
  page.ops.push(`BT ${color} rg ${spacing} Tc /${font} ${size} Tf ${round(x)} ${round(y)} Td (${escapePdfText(value)}) Tj ET`);
}

const HEADER_SPACING = 0.4;

const HELVETICA_WIDTHS: Record<string, number> = {
  ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191, '(': 333, ')': 333,
  '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278, '0': 556, '1': 556, '2': 556, '3': 556,
  '4': 556, '5': 556, '6': 556, '7': 556, '8': 556, '9': 556, ':': 278, ';': 278, '<': 584, '=': 584,
  '>': 584, '?': 556, '@': 1015, 'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778,
  'H': 722, 'I': 278, 'J': 500, 'K': 667, 'L': 556, 'M': 833, 'N': 722, 'O': 778, 'P': 667, 'Q': 778,
  'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944, 'X': 667, 'Y': 667, 'Z': 611, '[': 278,
  '\\': 278, ']': 278, '^': 469, '_': 556, '`': 222, 'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556,
  'f': 278, 'g': 556, 'h': 556, 'i': 222, 'j': 222, 'k': 500, 'l': 222, 'm': 833, 'n': 556, 'o': 556,
  'p': 556, 'q': 556, 'r': 333, 's': 500, 't': 278, 'u': 556, 'v': 500, 'w': 722, 'x': 500, 'y': 500,
  'z': 500, '{': 334, '|': 260, '}': 334, '~': 584
};

const HELVETICA_BOLD_WIDTHS: Record<string, number> = {
  ' ': 278, '!': 333, '"': 474, '#': 556, '$': 556, '%': 889, '&': 722, "'": 278, '(': 333, ')': 333,
  '*': 500, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278, '0': 556, '1': 556, '2': 556, '3': 556,
  '4': 556, '5': 556, '6': 556, '7': 556, '8': 556, '9': 556, ':': 333, ';': 333, '<': 584, '=': 584,
  '>': 584, '?': 611, '@': 975, 'A': 722, 'B': 722, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778,
  'H': 778, 'I': 278, 'J': 556, 'K': 722, 'L': 611, 'M': 833, 'N': 722, 'O': 778, 'P': 667, 'Q': 778,
  'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944, 'X': 667, 'Y': 667, 'Z': 611, '[': 333,
  '\\': 278, ']': 333, '^': 584, '_': 556, '`': 333, 'a': 556, 'b': 611, 'c': 556, 'd': 611, 'e': 556,
  'f': 333, 'g': 611, 'h': 611, 'i': 278, 'j': 278, 'k': 556, 'l': 278, 'm': 889, 'n': 611, 'o': 611,
  'p': 611, 'q': 611, 'r': 389, 's': 556, 't': 333, 'u': 611, 'v': 556, 'w': 778, 'x': 556, 'y': 556,
  'z': 500, '{': 389, '|': 280, '}': 389, '~': 584
};

/**
 * Width of a text run in PDF points using standard Helvetica font metrics.
 */
function textWidth(value: string, size: number, bold: boolean, spacing = 0): number {
  if (!value) return 0;
  const metrics = bold ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS;
  const fallback = bold ? 600 : 556;
  let totalUnits = 0;
  let charCount = 0;

  for (const character of value) {
    const replacement = TEXT_REPLACEMENTS[character];
    const segment = replacement !== undefined ? replacement : character;
    for (const char of segment) {
      totalUnits += metrics[char] ?? fallback;
      charCount++;
    }
  }

  return (totalUnits / 1000) * size + charCount * spacing;
}

function truncate(value: string, maxWidth: number, size: number, bold: boolean): string {
  if (!value || textWidth(value, size, bold) <= maxWidth) return value;
  let cut = value;
  while (cut.length > 1 && textWidth(`${cut}...`, size, bold) > maxWidth) cut = cut.slice(0, -1);
  return `${cut}...`;
}

function roundedRect(x: number, y: number, width: number, height: number, radius: number): string {
  const corner = radius * 0.5523;
  const right = x + width;
  const top = y + height;
  return [
    `${round(x + radius)} ${round(y)} m`,
    `${round(right - radius)} ${round(y)} l`,
    `${round(right - radius + corner)} ${round(y)} ${round(right)} ${round(y + radius - corner)} ${round(right)} ${round(y + radius)} c`,
    `${round(right)} ${round(top - radius)} l`,
    `${round(right)} ${round(top - radius + corner)} ${round(right - radius + corner)} ${round(top)} ${round(right - radius)} ${round(top)} c`,
    `${round(x + radius)} ${round(top)} l`,
    `${round(x + radius - corner)} ${round(top)} ${round(x)} ${round(top - radius + corner)} ${round(x)} ${round(top - radius)} c`,
    `${round(x)} ${round(y + radius)} l`,
    `${round(x)} ${round(y + radius - corner)} ${round(x + radius - corner)} ${round(y)} ${round(x + radius)} ${round(y)} c`
  ].join(' ');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Characters the built-in PDF fonts cannot print, written out the way they are read. */
const TEXT_REPLACEMENTS: Record<string, string> = {
  '\u20b9': 'Rs.', // the rupee sign is missing from the standard fonts
  '\u2013': '-',
  '\u2014': '-',
  '\u2018': "'",
  '\u2019': "'",
  '\u201c': '"',
  '\u201d': '"',
  '\u2026': '...',
  '\u00a0': ' ',
  '\u2022': '-'
};

/** Keeps only the characters the PDF fonts cover and escapes the ones that end a PDF string. */
function escapePdfText(value: string): string {
  let printable = '';
  for (const character of value ?? '') {
    const replacement = TEXT_REPLACEMENTS[character];
    if (replacement !== undefined) {
      printable += replacement;
      continue;
    }
    const code = character.codePointAt(0) ?? 0;
    printable += (code >= 32 && code <= 126) || (code >= 160 && code <= 255) ? character : '?';
  }
  return printable.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
