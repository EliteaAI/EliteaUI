export const hasCredentialConfigChanged = (current, original) => {
  const currentSettings = current?.settings || {};
  const originalSettings = original?.settings || {};

  return Object.keys(currentSettings).some(key => {
    const curr = currentSettings[key];
    const orig = originalSettings[key];

    // Check if this is a credential object
    if (typeof curr === 'object' && curr != null && 'elitea_title' in curr) {
      // Check if private flag or credential selection changed
      return curr.private !== orig?.private || curr.elitea_title !== orig?.elitea_title;
    }

    return false;
  });
};

export const revertCredentialFields = (editToolDetail, originalDetails) => {
  if (!originalDetails || !editToolDetail) return editToolDetail;

  const originalSettings = originalDetails.settings || {};
  const currentSettings = editToolDetail.settings || {};
  const revertedSettings = { ...currentSettings };

  // Revert only credential fields that have changed
  Object.keys(currentSettings).forEach(key => {
    const curr = currentSettings[key];
    const orig = originalSettings[key];

    // Check if this is a credential object that has changed
    if (typeof curr === 'object' && 'elitea_title' in curr) {
      if (curr.private !== orig?.private || curr.elitea_title !== orig?.elitea_title) {
        revertedSettings[key] = orig;
      }
    }
  });

  return {
    ...editToolDetail,
    settings: revertedSettings,
  };
};
