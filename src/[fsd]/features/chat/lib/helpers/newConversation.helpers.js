export const extractHumanReadableName = email => {
  if (email) {
    // Step 1: Extract the username part before the '@'
    const username = email.split('@')[0];

    // Step 2: Replace special characters (., _, -) with spaces
    const cleanedUsername = username.replace(/[._-]/g, ' ');

    // Step 3: Capitalize the first letter of each word
    const humanReadableName = cleanedUsername
      .split(' ') // Split into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(' '); // Join the words back together

    return humanReadableName;
  }
  return '';
};

export const extractFirstName = fullName => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

export const getChatUserSettings = (conversation, userId) => {
  return conversation?.participants.find(p => p.entity_name === 'user' && p.entity_meta.id === userId)
    ?.entity_settings?.llm_settings;
};

export const setUserLLmSettings = (participants = [], userId, llm_settings) =>
  (participants || []).map(p => {
    if (p.entity_name === 'user' && p.entity_meta.id === userId) {
      return {
        ...p,
        entity_settings: {
          ...(p.entity_settings || {}),
          llm_settings: {
            ...(p.entity_settings?.llm_settings || {}),
            ...llm_settings,
          },
        },
      };
    }
    return p;
  });
