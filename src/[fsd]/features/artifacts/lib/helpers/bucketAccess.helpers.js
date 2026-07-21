export const getAccessValue = (bucketPermissions, bucket) => {
  if (!bucketPermissions || Object.keys(bucketPermissions).length === 0) return '';
  if (!(bucket in bucketPermissions)) return '';
  const perms = bucketPermissions[bucket];
  if (!perms || perms.length === 0) return 'no_access';
  if (perms.includes('write')) return 'read_write';
  return 'read';
};

export const getAccessLabel = accessValue => {
  if (accessValue === 'read_write') return 'Read/write';
  if (accessValue === 'read') return 'Read-only';
  if (accessValue === 'no_access') return 'No access';
  return '-';
};

export const buildBucketPermissions = (accessValue, bucket, existingPerms) => {
  const updated = { ...(existingPerms || {}) };
  if (!accessValue) {
    delete updated[bucket];
  } else if (accessValue === 'no_access') {
    updated[bucket] = [];
  } else if (accessValue === 'read_write') {
    updated[bucket] = ['read', 'write'];
  } else {
    updated[bucket] = ['read'];
  }
  return updated;
};
