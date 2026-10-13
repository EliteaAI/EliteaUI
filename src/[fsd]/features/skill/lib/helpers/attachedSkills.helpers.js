export const filterAttachedSkills = (skills, query) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return skills;
  return skills.filter(skill =>
    [skill.name, skill.description].some(text => (text || '').toLowerCase().includes(needle)),
  );
};
