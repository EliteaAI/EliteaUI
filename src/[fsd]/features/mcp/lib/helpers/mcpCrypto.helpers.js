export const base64UrlEncode = buffer =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const randomString = (length = 32) => {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr);
};

export const generateSessionId = () => crypto.randomUUID();

export const sha256 = async message => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const encoded = base64UrlEncode(hashBuffer);

  if (encoded.length !== 43) {
    throw new Error(`code_challenge must be 43 characters, got ${encoded.length}`);
  }

  return encoded;
};

export const normalizeScope = (scope, isOIDC) => {
  if (!scope) return isOIDC ? 'openid' : '';
  const scopes = scope.split(' ').filter(Boolean);
  if (isOIDC && !scopes.includes('openid')) scopes.unshift('openid');
  return scopes.join(' ');
};

export const isOIDCFlow = metadata => {
  // Only treat as OIDC if server has issuer AND supports openid scope
  const hasIssuer = Boolean(metadata?.issuer || metadata?.userinfo_endpoint);
  const supportsOpenid = metadata?.scopes_supported?.includes('openid');
  return hasIssuer && supportsOpenid;
};
