// Utility functions for simple bucket sorting based on file activity and creation/update dates

/**
 * Simple bucket sorting by updated_at or created_at timestamp (most recent first)
 * This is a lightweight alternative to sortBucketsByActivity when file data is not needed
 */
export const sortBucketsByRecent = buckets => {
  return [...buckets].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at).getTime();
    const bTime = new Date(b.updated_at || b.created_at).getTime();
    return bTime - aTime; // Most recent first
  });
};

/**
 * Get the most recent file activity date in a bucket
 * Only considers file modification/creation times
 */
export const getMostRecentFileActivity = (bucketFiles = []) => {
  if (!bucketFiles || bucketFiles.length === 0) {
    return null;
  }

  let mostRecentTime = 0;
  let mostRecentDate = null;

  bucketFiles.forEach(file => {
    // Check file modification/creation date fields
    const fileDates = [file.modified, file.last_modified, file.updated_at, file.created_at];

    fileDates.forEach(dateStr => {
      if (dateStr && dateStr !== '') {
        const dateTime = new Date(dateStr).getTime();
        if (!isNaN(dateTime) && dateTime > mostRecentTime) {
          mostRecentTime = dateTime;
          mostRecentDate = dateStr;
        }
      }
    });
  });

  return mostRecentDate;
};

/**
 * Get the most recent activity date for a bucket, including both file activity and bucket timestamps
 * Falls back to bucket creation/modification time if no file activity is found
 */
export const getBucketMostRecentActivity = (bucket, bucketFiles = []) => {
  // First try to get file activity
  const fileActivity = getMostRecentFileActivity(bucketFiles);
  if (fileActivity) {
    return fileActivity;
  }

  // If no file activity, fall back to bucket timestamps
  const bucketDates = [bucket.updated_at, bucket.created_at, bucket.modification_time, bucket.creation_time];

  let mostRecentTime = 0;
  let mostRecentDate = null;

  bucketDates.forEach(dateStr => {
    if (dateStr && dateStr !== '') {
      const dateTime = new Date(dateStr).getTime();
      if (!isNaN(dateTime) && dateTime > mostRecentTime) {
        mostRecentTime = dateTime;
        mostRecentDate = dateStr;
      }
    }
  });

  // If no valid timestamps found for empty bucket, assume it's newly created
  if (!mostRecentDate && bucketFiles.length === 0) {
    // For empty buckets without timestamps, use current time to put them at the top
    mostRecentDate = new Date().toISOString();
  }

  return mostRecentDate;
};

/**
 * Sort buckets by most recent activity (file activity or bucket timestamps)
 * @param {Array} buckets - Array of bucket objects
 * @param {Object} bucketFilesMap - Map of bucket name to files array
 * @param {string} lastActiveBucketName - Name of the most recently active bucket (gets priority)
 * @returns {Array} Sorted array of buckets with most recent activity first
 */
export const sortBucketsByActivity = (buckets, bucketFilesMap = {}, lastActiveBucketName = null) => {
  if (!buckets || buckets.length === 0) {
    return [];
  }

  // Add activity data to each bucket
  const bucketsWithActivity = buckets.map(bucket => {
    const files = bucketFilesMap[bucket.name] || [];
    let mostRecentActivity = getBucketMostRecentActivity(bucket, files);

    // If this bucket was recently active, give it current timestamp to ensure it's at the very top
    if (lastActiveBucketName === bucket.name) {
      mostRecentActivity = new Date().toISOString();
    }

    return {
      ...bucket,
      mostRecentActivity,
      isLastActive: lastActiveBucketName === bucket.name,
    };
  });

  // Sort by most recent activity (most recent first)
  bucketsWithActivity.sort((a, b) => {
    // Give absolute priority to the last active bucket
    if (a.isLastActive && !b.isLastActive) return -1;
    if (!a.isLastActive && b.isLastActive) return 1;

    // For all other buckets, sort by most recent activity
    const dateA = a.mostRecentActivity || '2020-01-01T00:00:00.000Z';
    const dateB = b.mostRecentActivity || '2020-01-01T00:00:00.000Z';

    return new Date(dateB).getTime() - new Date(dateA).getTime(); // Most recent first
  });

  return bucketsWithActivity;
};

/**
 * Get the first bucket from a sorted list (most recently active)
 * @param {Array} buckets - Array of bucket objects
 * @param {Object} bucketFilesMap - Map of bucket name to files array
 * @param {string} lastActiveBucketName - Name of the most recently active bucket
 * @returns {Object|null} The most recently active bucket or null if no buckets
 */
export const getMostRecentlyActiveBucket = (buckets, bucketFilesMap = {}, lastActiveBucketName = null) => {
  const sortedBuckets = sortBucketsByActivity(buckets, bucketFilesMap, lastActiveBucketName);
  return sortedBuckets.length > 0 ? sortedBuckets[0] : null;
};

/**
 * Get the next bucket in the sorted list after a given bucket
 * Used for auto-selection when a bucket is deleted
 * @param {Array} buckets - Array of bucket objects
 * @param {Object} bucketFilesMap - Map of bucket name to files array
 * @param {string} deletedBucketName - Name of the bucket being deleted
 * @param {string} lastActiveBucketName - Name of the most recently active bucket
 * @returns {Object|null} The next bucket to select or null if no more buckets
 */
export const getNextBucketAfterDeletion = (
  buckets,
  bucketFilesMap = {},
  deletedBucketName,
  lastActiveBucketName = null,
) => {
  // Filter out the deleted bucket
  const remainingBuckets = buckets.filter(bucket => bucket.name !== deletedBucketName);

  if (remainingBuckets.length === 0) {
    return null;
  }

  // Get the most recently active bucket from the remaining buckets
  return getMostRecentlyActiveBucket(remainingBuckets, bucketFilesMap, lastActiveBucketName);
};
