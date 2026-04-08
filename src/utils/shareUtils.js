import { SearchParams } from '@/common/constants';

export const generateBucketShareUrl = (projectId, bucketName, basename) => {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  return `${baseUrl}${basename}/${projectId}/artifacts?${SearchParams.Bucket}=${bucketName}&${SearchParams.SharedBucket}=1`;
};
