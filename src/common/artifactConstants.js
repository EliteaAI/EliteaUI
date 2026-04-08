/**
 * SessionStorage key used to pass the target bucket name from CreateBucket back to Artifacts page.
 * Set after successful create/edit, consumed on mount to auto-select the bucket.
 */
export const PENDING_BUCKET_SESSION_KEY = 'artifacts-pending-bucket';

/**
 * System bucket names that are managed by the system and filtered from user buckets
 * Used in API transformation and UI filtering logic
 */
export const SYSTEM_BUCKET_NAMES = ['tasks', 'reports'];

export const isSystemBucket = bucketName => SYSTEM_BUCKET_NAMES.includes(bucketName);

export const getLocalBuckets = buckets => buckets?.filter(bucket => !isSystemBucket(bucket.name)) || [];
