// ═══════════════════════════════════════════════════════════════════════════
// PGMentor — Migrate knowledge_library.content → detail columns
// Splits the raw markdown in `content` into:
//   topic_title, definition, basic_concepts, detailed_essay, summary, key_takeaways
//
// Run once:  node migrate_content_to_columns.mjs
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL         = 'https://qnguxwmrqwcksspujmoa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ3V4d21ycXdja3NzcHVqbW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA1MjQyMCwiZXhwIjoyMDkwNjI4NDIwfQ.5bRAK4rX4kaWJVITvlQ7WdoVcHpNcmD6GrlnR9Taz8o';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Parser (same logic as server.ts parseKnowledgeSections) ─────────────────
function parseKnowledgeSections(content, fallbackTitle) {
  const sections = {
    topic_title:    fallbackTitle || '',
    definition:     '',
    basic_concepts: '',
    detailed_essay: '',
    summary:        '',
    key_takeaways:  '',
  };

  const headingMap = {
    'topic title':    'topic_title',
    'definition':     'definition',
    'basic concepts': 'basic_concepts',
    'detailed essay': 'detailed_essay',
    'summary':        'summary',
    'key takeaways':  'key_takeaways',
  };

  const lines = content.split('\n');
  let currentKey = null;
  const buffer = [];

  const flushBuffer = () => {
    if (currentKey && buffer.length > 0) {
      sections[currentKey] = buffer.join('\n').trim();
    }
    buffer.length = 0;
  };

  for (const line of lines) {
    const headingMatch =
      line.match(/^#{1,3}\s+(.+)$/) ||
      line.match(/^\*\*([^*]+)\*\*:?\s*$/);

    if (headingMatch) {
      flushBuffer();
      const headingText = headingMatch[1].replace(/[*:]/g, '').trim().toLowerCase();

      const matchedKey = Object.keys(headingMap).find(
        h => headingText === h ||
             headingText.startsWith(h + ' ') ||
             headingText.startsWith(h + ':')
      );

      currentKey = matchedKey ? headingMap[matchedKey] : null;

      if (currentKey === 'topic_title') {
        const inlineText = line
          .replace(/^#{1,3}\s+/, '')
          .replace(/\*\*/g, '')
          .replace(/^topic title[:\s]*/i, '')
          .trim();
        if (inlineText && inlineText.toLowerCase() !== 'topic title') {
          sections['topic_title'] = inlineText;
        }
        currentKey = null; // single-line field
      }
    } else if (currentKey) {
      buffer.push(line);
    }
  }

  flushBuffer();

  // If no sections were parsed, put everything in detailed_essay
  const hasAnySections = Object.entries(sections).some(
    ([k, v]) => k !== 'topic_title' && v.length > 0
  );
  if (!hasAnySections && content.trim().length > 0) {
    sections.detailed_essay = content.trim();
  }

  return sections;
}

// ── Main migration ───────────────────────────────────────────────────────────
async function run() {
  console.log('🔍 Fetching knowledge_library rows with content but missing detail columns...\n');

  // Fetch ALL rows that have content (re-parse everything for consistency)
  const { data: rows, error: fetchErr } = await supabase
    .from('knowledge_library')
    .select('id, title, content, topic_title, definition, basic_concepts, detailed_essay, summary, key_takeaways')
    .not('content', 'is', null)
    .neq('content', '');

  if (fetchErr) {
    console.error('❌ Failed to fetch rows:', fetchErr.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('✅ No rows with content found — nothing to migrate.');
    return;
  }

  // Filter to only rows that are missing at least one detail column
  const toMigrate = rows.filter(r =>
    !r.topic_title || !r.definition || !r.basic_concepts || !r.detailed_essay || !r.summary || !r.key_takeaways
  );

  console.log(`📋 Total rows with content: ${rows.length}`);
  console.log(`🔧 Rows needing migration (missing at least one detail column): ${toMigrate.length}\n`);

  if (toMigrate.length === 0) {
    console.log('✅ All rows already have detail columns populated. Nothing to do.');
    return;
  }

  let updated = 0;
  let failed  = 0;

  for (const row of toMigrate) {
    const fallbackTitle = row.title || row.topic_title || 'Unknown Topic';
    const parsed = parseKnowledgeSections(row.content, fallbackTitle);

    // Only update columns that are currently NULL/empty — preserve existing data
    const update = {};
    if (!row.topic_title    && parsed.topic_title)    update.topic_title    = parsed.topic_title;
    if (!row.definition     && parsed.definition)     update.definition     = parsed.definition;
    if (!row.basic_concepts && parsed.basic_concepts) update.basic_concepts = parsed.basic_concepts;
    if (!row.detailed_essay && parsed.detailed_essay) update.detailed_essay = parsed.detailed_essay;
    if (!row.summary        && parsed.summary)        update.summary        = parsed.summary;
    if (!row.key_takeaways  && parsed.key_takeaways)  update.key_takeaways  = parsed.key_takeaways;

    if (Object.keys(update).length === 0) {
      console.log(`  ⏭️  Skipping "${fallbackTitle}" — all detail columns already populated`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from('knowledge_library')
      .update(update)
      .eq('id', row.id);

    if (updateErr) {
      console.error(`  ❌ Failed to update "${fallbackTitle}" (id=${row.id}): ${updateErr.message}`);
      failed++;
    } else {
      const cols = Object.keys(update).join(', ');
      console.log(`  ✅ Updated "${fallbackTitle}" → populated: ${cols}`);
      updated++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Migration complete:`);
  console.log(`  ✅ Successfully updated: ${updated} row(s)`);
  if (failed > 0) {
    console.log(`  ❌ Failed:              ${failed} row(s)`);
  }
  console.log(`${'─'.repeat(60)}\n`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
