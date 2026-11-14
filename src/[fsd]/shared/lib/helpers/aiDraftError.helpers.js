// Error text for the "Build/Edit with AI" draft modals.
//
// The draft endpoints answer every failure with a JSON envelope ({error} or {detail}), but only
// 4xx bodies reach the browser intact: the edge proxy replaces the body of a 5xx with its own
// HTML error page. That is exactly the set of failures worth reading -- a missing service prompt
// (500), a dead LLM (500), an exhausted budget (503) and the generation timeout (504) -- so every
// one of them used to collapse into the same "Please try again." line.
//
// When the body is not JSON, RTK Query's fetchBaseQuery reports
// { status: 'PARSING_ERROR', originalStatus: 504, data: '<html>...' }, so the real HTTP code lives
// in originalStatus; reading error.status alone never sees it.

export const AI_DRAFT_ERROR_FALLBACK = 'Failed to generate. Please try again.';

// The backend cancels the run on timeout, so an identical retry burns the same minute again.
const TIMEOUT_TEXT =
  'Generation did not finish in time. Retrying as is will take just as long - shorten the description or pick a faster model.';

const STATUS_TEXT = {
  408: TIMEOUT_TEXT,
  413: 'The request is too large - shorten the description.',
  502: 'The service is temporarily unavailable.',
  503: 'The service is temporarily unavailable.',
  504: TIMEOUT_TEXT,
  524: TIMEOUT_TEXT,
};

// Proxy error pages carry a support id; without it a 504 report is unactionable, and today the
// id is only visible in the browser's network tab.
const rayIdOf = body =>
  typeof body === 'string' ? (body.match(/Ray ID:\s*([0-9a-f]{8,})/i)?.[1] ?? null) : null;

const bodyMessageOf = body => {
  if (!body || typeof body !== 'object') return null;
  if (body.error) return body.error;
  if (body.detail) return body.detail;
  // Request validation is returned as the raw pydantic error list.
  if (Array.isArray(body)) {
    const text = body
      .map(entry => entry?.msg)
      .filter(Boolean)
      .join('; ');
    return text || null;
  }
  return null;
};

export const getAiDraftErrorMessage = (error, fallback = AI_DRAFT_ERROR_FALLBACK) => {
  if (!error) return null;

  const fromBody = bodyMessageOf(error.data);
  if (fromBody) return fromBody;

  if (error.status === 'FETCH_ERROR') return 'No connection to the server. Check your network and try again.';

  const status = error.originalStatus ?? error.status;
  if (typeof status !== 'number') return fallback;

  const rayId = rayIdOf(error.data);
  const detail = rayId ? `HTTP ${status}, Cloudflare Ray ID ${rayId}` : `HTTP ${status}`;
  return `${STATUS_TEXT[status] ?? 'Request failed.'} (${detail})`;
};
