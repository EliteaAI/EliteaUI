import { isSystemBucket } from '@/common/artifactConstants';
import { formatFileSize } from '@/utils/filePreview';

export const transformStorageResponse = bucketData => {
  if (!bucketData?.buckets) {
    return {
      totalSize: '0B',
      bucketCount: 0,
      localBuckets: [],
      availableSpace: 'Unknown',
    };
  }
  const allBuckets = bucketData.buckets;
  const localBuckets = allBuckets.filter(bucket => !isSystemBucket(bucket.name));

  // Calculate total size - size is already in bytes in the new API
  const totalLocalBytes = localBuckets.reduce((sum, bucket) => sum + (bucket.size || 0), 0);

  return {
    totalSize: formatFileSize(totalLocalBytes),
    bucketCount: localBuckets.length,
    localBuckets,
    owner: bucketData.owner,
    availableSpace: 'Unknown', // Will be updated when quota API is available
    storageQuota: null,
  };
};
