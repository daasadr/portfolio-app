import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getTokenFromRequest } from '@/lib/auth-server';
import { safeFormatDate } from '@/lib/date';
import type { PortfolioPage, Category, PersonalGoal, Dream, DreamBoardItem } from '@/types';

const directusUrl = process.env.DIRECTUS_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL!;
const adminToken = process.env.DIRECTUS_ADMIN_TOKEN!;

function adminH() {
  return { Authorization: `Bearer ${adminToken}` };
}

interface ExportBody {
  format: 'html' | 'raw';
  sections: ('portfolio' | 'goals' | 'dreamboard')[];
  privacy: 'all' | 'shared';
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function safeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'soubor';
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  short_term: 'Krátkodobý',
  long_term: 'Dlouhodobý',
  lifelong: 'Celoživotní přání',
};

// ---------------------------------------------------------------------------
// HTML export
// ---------------------------------------------------------------------------

function generateHtml(opts: {
  student: { first_name: string; last_name: string };
  pages: PortfolioPage[];
  categories: Category[];
  goals: PersonalGoal[];
  dreams: Dream[];
  dreamItems: DreamBoardItem[];
  fileBuffers: Map<string, { name: string; type: string }>;
  sections: string[];
  exportDate: string;
}): string {
  const { student, pages, categories, goals, dreams, dreamItems, fileBuffers, sections, exportDate } = opts;
  const catMap = new Map(categories.map(c => [c.id, c.name]));

  const grouped = new Map<string, PortfolioPage[]>();
  for (const page of pages) {
    const key = page.category_id ? (catMap.get(page.category_id) ?? 'Ostatní') : 'Ostatní';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(page);
  }

  const pagesHtml = [...grouped.entries()].map(([catName, catPages]) => {
    const articlesHtml = catPages.map(page => {
      const atts = page.attachments;
      const arr: { id: string; name: string; type: string }[] = Array.isArray(atts)
        ? atts : typeof atts === 'string' ? JSON.parse(atts) : [];

      const attachmentsHtml = arr.map(att => {
        const file = fileBuffers.get(att.id);
        const src = file ? `assets/${encodeURIComponent(file.name)}` : '#';
        const t = att.type ?? '';
        if (t.startsWith('image/')) return `<img src="${src}" alt="${att.name}" class="att-img">`;
        if (t.startsWith('video/')) return `<video controls class="att-video"><source src="${src}" type="${t}"></video>`;
        if (t.startsWith('audio/')) return `<audio controls class="att-audio"><source src="${src}" type="${t}"></audio>`;
        return `<a href="${src}" class="att-file">📎 ${att.name}</a>`;
      }).join('\n');

      return `
      <article class="page">
        <h3>${page.title}</h3>
        <p class="meta">${page.visibility === 'shared' ? '🌐 Sdílená' : '🔒 Soukromá'}${safeFormatDate(page.updated_at) ? ` · Upraveno ${safeFormatDate(page.updated_at)}` : ''}</p>
        <div class="content">${page.content || '<em>Bez obsahu</em>'}</div>
        ${arr.length ? `<div class="attachments">${attachmentsHtml}</div>` : ''}
      </article>`;
    }).join('');

    return `
    <section class="category">
      <h2>${catName}</h2>
      ${articlesHtml}
    </section>`;
  }).join('');

  const goalsHtml = sections.includes('goals') && goals.length ? `
  <section class="category">
    <h2>Cíle a přání</h2>
    <div class="goals-list">
      ${goals.map(g => `
      <div class="goal ${g.completed ? 'completed' : ''}">
        <span class="goal-type">${GOAL_TYPE_LABELS[g.goal_type] ?? g.goal_type}</span>
        <strong>${g.title}</strong>
        ${g.description ? `<p>${g.description}</p>` : ''}
        ${g.target_date ? `<p class="meta">Termín: ${new Date(g.target_date).toLocaleDateString('cs-CZ')}</p>` : ''}
        ${g.completed ? '<span class="badge">✓ Splněno</span>' : ''}
      </div>`).join('')}
    </div>
  </section>` : '';

  const dreamHtml = sections.includes('dreamboard') && (dreams.length || dreamItems.length) ? `
  <section class="category">
    <h2>Dream Board</h2>
    ${dreams.map(d => `
    <article class="page">
      <h3>${d.title}</h3>
      ${d.description ? `<p>${d.description}</p>` : ''}
    </article>`).join('')}
    <div class="dreamboard-grid">
      ${dreamItems.map(item => {
        const file = fileBuffers.get(item.file_id);
        return file ? `<img src="assets/${encodeURIComponent(file.name)}" alt="dream" class="dream-img">` : '';
      }).join('')}
    </div>
  </section>` : '';

  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Portfolio – ${student.first_name} ${student.last_name}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; color: #1a1a1a; }
  .header { background: linear-gradient(135deg, #667EEA, #764BA2); color: white; padding: 2rem; text-align: center; }
  .header h1 { font-size: 2rem; margin-bottom: 0.25rem; }
  .header p { opacity: 0.75; font-size: 0.875rem; }
  .main { max-width: 860px; margin: 2rem auto; padding: 0 1rem; }
  .category { margin-bottom: 2.5rem; }
  .category > h2 { font-size: 1.1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
    color: #6366f1; border-bottom: 2px solid #e0e7ff; padding-bottom: 0.5rem; margin-bottom: 1rem; }
  .page { background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 1.5rem; margin-bottom: 1rem; }
  .page h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem; }
  .meta { font-size: 0.75rem; color: #6b7280; margin-bottom: 0.75rem; }
  .content { font-size: 0.9375rem; line-height: 1.65; color: #374151; }
  .content p { margin: 0.5rem 0; }
  .content ul, .content ol { margin: 0.5rem 0 0.5rem 1.5rem; }
  .attachments { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f3f4f6; display: flex; flex-wrap: wrap; gap: 0.75rem; }
  .att-img { max-width: 100%; max-height: 320px; border-radius: 8px; object-fit: contain; }
  .att-video, .att-audio { max-width: 100%; border-radius: 8px; }
  .att-file { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.375rem 0.75rem;
    background: #f3f4f6; border-radius: 6px; text-decoration: none; color: #374151; font-size: 0.875rem; }
  .goals-list { display: grid; gap: 0.75rem; }
  .goal { background: white; border-radius: 10px; border: 1px solid #e5e7eb; padding: 1rem 1.25rem; }
  .goal.completed { border-color: #d1fae5; background: #f0fdf4; }
  .goal-type { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; display: block; margin-bottom: 0.25rem; }
  .goal strong { font-size: 1rem; }
  .goal p { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
  .badge { display: inline-block; font-size: 0.75rem; background: #d1fae5; color: #065f46; padding: 0.125rem 0.5rem; border-radius: 99px; margin-top: 0.25rem; }
  .dreamboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
  .dream-img { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; }
  .footer { text-align: center; padding: 2rem; font-size: 0.75rem; color: #9ca3af; }
  @media print {
    body { background: white; }
    .page { break-inside: avoid; border: none; box-shadow: none; }
    .category { break-before: auto; }
  }
</style>
</head>
<body>
<header class="header">
  <h1>${student.first_name} ${student.last_name}</h1>
  <p>Portfolio Paradise · Exportováno ${exportDate}</p>
</header>
<main class="main">
  ${pagesHtml}
  ${goalsHtml}
  ${dreamHtml}
</main>
<footer class="footer">Portfolio Paradise · ${exportDate}</footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });

  const body = await request.json() as ExportBody;
  const { format, sections, privacy } = body;

  // Verify user
  const meRes = await fetch(`${directusUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!meRes.ok) return NextResponse.json({ message: 'Neautorizováno' }, { status: 401 });
  const { data: user } = await meRes.json() as { data: { id: string } };

  // Get student record
  const studentRes = await fetch(
    `${directusUrl}/items/students?filter[user_id][_eq]=${user.id}&limit=1`,
    { headers: adminH() }
  );
  const { data: students } = await studentRes.json() as { data: { id: string; first_name: string; last_name: string }[] };
  const student = students?.[0];
  if (!student) return NextResponse.json({ message: 'Student nenalezen' }, { status: 404 });

  // Load selected data
  let pages: PortfolioPage[] = [];
  let categories: Category[] = [];
  let goals: PersonalGoal[] = [];
  let dreams: Dream[] = [];
  let dreamItems: DreamBoardItem[] = [];

  await Promise.all([
    sections.includes('portfolio') && (async () => {
      const privacyFilter = privacy === 'shared' ? '&filter[visibility][_eq]=shared' : '';
      const [pr, cr] = await Promise.all([
        fetch(`${directusUrl}/items/portfolio_pages?filter[student_id][_eq]=${student.id}${privacyFilter}&sort[]=title&limit=500`, { headers: adminH() }),
        fetch(`${directusUrl}/items/categories?filter[student_id][_eq]=${student.id}&sort[]=name&limit=100`, { headers: adminH() }),
      ]);
      pages = ((await pr.json()) as { data: PortfolioPage[] }).data ?? [];
      categories = ((await cr.json()) as { data: Category[] }).data ?? [];
    })(),

    sections.includes('goals') && (async () => {
      const gr = await fetch(
        `${directusUrl}/items/personal_goals?filter[student_id][_eq]=${student.id}&sort[]=goal_type&sort[]=title&limit=500`,
        { headers: adminH() }
      );
      goals = ((await gr.json()) as { data: PersonalGoal[] }).data ?? [];
    })(),

    sections.includes('dreamboard') && (async () => {
      const [dr, ir] = await Promise.all([
        fetch(`${directusUrl}/items/dreams?filter[student_id][_eq]=${student.id}&limit=100`, { headers: adminH() }),
        fetch(`${directusUrl}/items/dream_board_items?filter[student_id][_eq]=${student.id}&limit=500`, { headers: adminH() }),
      ]);
      dreams = ((await dr.json()) as { data: Dream[] }).data ?? [];
      dreamItems = ((await ir.json()) as { data: DreamBoardItem[] }).data ?? [];
    })(),
  ].filter(Boolean));

  // Collect all file IDs
  const fileIds = new Set<string>();
  for (const page of pages) {
    const raw = page.attachments;
    const arr: { id: string }[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : [];
    arr.forEach(a => fileIds.add(a.id));
  }
  dreamItems.forEach(item => fileIds.add(item.file_id));

  // Download files — metadata + content in parallel
  const fileBuffers = new Map<string, { buffer: ArrayBuffer; name: string; type: string }>();
  await Promise.all([...fileIds].map(async (fileId) => {
    try {
      // Get original filename from Directus file metadata
      const metaRes = await fetch(`${directusUrl}/files/${fileId}?fields=filename_download,type`, { headers: adminH() });
      const meta = metaRes.ok ? ((await metaRes.json()) as { data: { filename_download: string; type: string } }).data : null;

      const assetRes = await fetch(`${directusUrl}/assets/${fileId}`, { headers: adminH() });
      if (!assetRes.ok) return;

      const buffer = await assetRes.arrayBuffer();
      const type = meta?.type ?? assetRes.headers.get('content-type') ?? 'application/octet-stream';
      const name = safeFilename(meta?.filename_download ?? fileId);
      fileBuffers.set(fileId, { buffer, name, type });
    } catch { /* skip */ }
  }));

  // Build ZIP
  const zip = new JSZip();
  const exportDate = new Date().toLocaleDateString('cs-CZ');

  if (format === 'html') {
    // Add assets folder
    const assetsFolder = zip.folder('assets')!;
    for (const { buffer, name } of fileBuffers.values()) {
      assetsFolder.file(name, buffer);
    }
    zip.file('index.html', generateHtml({ student, pages, categories, goals, dreams, dreamItems, fileBuffers, sections, exportDate }));

  } else {
    // Raw format
    if (sections.includes('portfolio')) {
      const catMap = new Map(categories.map(c => [c.id, c.name]));
      const pFolder = zip.folder('portfolio')!;

      for (const page of pages) {
        const catName = page.category_id ? (catMap.get(page.category_id) ?? 'Ostatni') : 'Ostatni';
        const safeTitle = safeFilename(page.title);
        const raw = page.attachments;
        const arr: { id: string; name: string }[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : [];

        const lines = [
          `Název: ${page.title}`,
          ...(safeFormatDate(page.updated_at) ? [`Datum: ${safeFormatDate(page.updated_at)}`] : []),
          `Kategorie: ${catName}`,
          `Viditelnost: ${page.visibility === 'shared' ? 'Sdílená' : 'Soukromá'}`,
          '',
          page.content ? stripHtml(page.content) : '(Bez obsahu)',
        ];
        if (arr.length) lines.push('', `Přílohy: ${arr.map(a => a.name).join(', ')}`);

        pFolder.file(`${safeFilename(catName)}/${safeTitle}.txt`, lines.join('\n'));
        for (const att of arr) {
          const file = fileBuffers.get(att.id);
          if (file) pFolder.file(`prilohy/${file.name}`, file.buffer);
        }
      }
    }

    if (sections.includes('goals') && goals.length) {
      const lines = [
        `CÍLE A PŘÁNÍ — ${student.first_name} ${student.last_name}`,
        `Exportováno: ${exportDate}`,
        '',
      ];
      for (const g of goals) {
        lines.push(
          `[${GOAL_TYPE_LABELS[g.goal_type] ?? g.goal_type}] ${g.title}${g.completed ? ' ✓' : ''}`,
          ...(g.description ? [`  ${g.description}`] : []),
          ...(g.target_date ? [`  Termín: ${new Date(g.target_date).toLocaleDateString('cs-CZ')}`] : []),
          '',
        );
      }
      zip.file('cile/cile.txt', lines.join('\n'));
    }

    if (sections.includes('dreamboard')) {
      const dbFolder = zip.folder('dreamboard')!;
      if (dreams.length) {
        const dreamLines = [`PŘÁNÍ\n`];
        for (const d of dreams) {
          dreamLines.push(`• ${d.title}`);
          if (d.description) dreamLines.push(`  ${d.description}`);
          dreamLines.push('');
        }
        dbFolder.file('prani.txt', dreamLines.join('\n'));
      }
      for (const item of dreamItems) {
        const file = fileBuffers.get(item.file_id);
        if (file) dbFolder.file(file.name, file.buffer);
      }
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const safeName = `${student.first_name}_${student.last_name}`.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `portfolio_${safeName}_${new Date().toISOString().slice(0, 10)}.zip`;

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
