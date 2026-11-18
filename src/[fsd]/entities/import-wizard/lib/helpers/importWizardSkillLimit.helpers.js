import { filterSelected } from '@/[fsd]/entities/import-wizard/lib/helpers/importWizardParser.helpers';

/**
 * Drops, from every selected agent version, the references to skills the user deselected.
 * The backend reports a reference to a skill that is not part of the import as an error,
 * so a deselected skill has to disappear from the agents that point to it.
 *
 * @param {object[]} selectedItems items already passed through `filterSelected`
 */
export const pruneDeselectedSkillRefs = selectedItems => {
  const items = selectedItems ?? [];
  const selectedSkillUUIDs = new Set(
    items.filter(item => item.entity === 'skills').map(item => item.import_uuid),
  );

  return items.map(item => {
    if (item.entity !== 'agents' || !item.versions) return item;

    return {
      ...item,
      versions: item.versions.map(version =>
        version.skills
          ? { ...version, skills: version.skills.filter(ref => selectedSkillUUIDs.has(ref.import_uuid)) }
          : version,
      ),
    };
  });
};

/**
 * Finds the selected agents that would carry more skills than the target project allows.
 * Only references to skills that are still selected are counted: those are the ones the
 * backend attaches.
 *
 * @returns {Record<string, string[]>} error messages keyed by the agent's `import_uuid`
 */
export const getSkillLimitErrors = (importItems, maxSkillsPerAgent) => {
  if (!Number.isInteger(maxSkillsPerAgent) || maxSkillsPerAgent < 1) return {};

  const selectedItems = pruneDeselectedSkillRefs(filterSelected(importItems ?? []));
  const errors = {};

  selectedItems
    .filter(item => item.entity === 'agents')
    .forEach(agent => {
      (agent.versions ?? []).forEach(version => {
        const skillsCount = version.skills?.length ?? 0;

        if (skillsCount <= maxSkillsPerAgent) return;

        const message =
          `Too many skills selected: ${skillsCount} selected, but the target project allows at most ` +
          `${maxSkillsPerAgent} skills per agent (version '${version.name}'). ` +
          `Deselect at least ${skillsCount - maxSkillsPerAgent} skills in the Skills list below to continue.`;

        errors[agent.import_uuid] = [...(errors[agent.import_uuid] ?? []), message];
      });
    });

  return errors;
};
