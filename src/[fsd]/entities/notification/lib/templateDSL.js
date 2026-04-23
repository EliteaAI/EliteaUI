/**
 * Tiny DSL for declaring notification message templates.
 *
 * A template is written as a tagged template literal and produces a parsed
 * object of the shape { segments: Segment[] }. Each segment is either a
 * literal text run or a typed placeholder describing how to render and search
 * the value.
 *
 * Placeholder kinds:
 *   - var(metaKey)                   — plain interpolation of meta[metaKey].
 *   - link(metaKey, linkProps?)      — meta-backed link. linkProps string values
 *                                      are treated as meta keys; non-string values
 *                                      are literal.
 *   - linkText(label, linkProps?)    — link with a literal label (no meta key).
 *   - status(metaKey, cases)         — controlled vocabulary. cases is an object
 *                                      whose values are literal strings; one is
 *                                      picked by meta[metaKey]. All case values
 *                                      participate in the static search index.
 *
 * The same declaration drives both rendering and search-index derivation,
 * keeping a single source of truth per notification type.
 */

/**
 * Meta-backed interpolation placeholder. Renders meta[metaKey] as plain text.
 * Named `variable` rather than `var` (reserved word).
 */
export const variable = metaKey => ({ kind: 'var', metaKey });

export const link = (metaKey, linkProps = {}) => ({ kind: 'link', metaKey, linkProps });

export const linkText = (label, linkProps = {}) => ({ kind: 'linkText', label, linkProps });

export const status = (metaKey, cases) => ({ kind: 'status', metaKey, cases });

/**
 * Tagged template literal. Combines literal text chunks and placeholder
 * descriptors into a single { segments } structure.
 */
export const tpl = (strings, ...placeholders) => {
  const segments = [];
  strings.forEach((str, i) => {
    if (str) segments.push({ type: 'text', text: str });
    if (i < placeholders.length) {
      const ph = placeholders[i];
      segments.push({ type: ph.kind, ...ph });
    }
  });
  return { segments };
};

/**
 * All static text runs contributed by a template.
 *
 * Includes:
 *   - literal `text` segments,
 *   - all case values of `status` placeholders.
 *
 * Deliberately excludes `var`/`link`/`linkText` values — those are either
 * runtime-dynamic (meta) or carry link chrome that shouldn't match the text
 * index (e.g. the literal "Configuration" label).
 */
/**
 * All static text runs contributed by a template, each annotated with the
 * status-case context that produced it (when applicable).
 *
 * Return shape:
 *   Array<{ text: string, status?: { metaKey, caseKey } }>
 *
 * Plain text segments appear with no `status` — they're unconstrained within
 * the template's event_type. Each case of a `status(...)` placeholder yields
 * a separate entry tagged with the case key, enabling narrowing search to
 * specific branches (e.g. "is successfully" → only the success cases of
 * IndexDataChanged, not the failed case).
 */
export const textsOf = tplParsed => {
  const out = [];
  for (const seg of tplParsed.segments) {
    if (seg.type === 'text') {
      out.push({ text: seg.text });
    } else if (seg.type === 'status') {
      for (const [caseKey, caseText] of Object.entries(seg.cases)) {
        out.push({ text: caseText, status: { metaKey: seg.metaKey, caseKey } });
      }
    }
  }
  return out;
};

/**
 * All meta keys a template may read at render time. Used to derive the set of
 * JSONB keys the BE should scan for dynamic (value-level) search matches.
 */
export const varsOf = tplParsed =>
  tplParsed.segments.filter(seg => seg.type === 'var' || seg.type === 'link').map(seg => seg.metaKey);
