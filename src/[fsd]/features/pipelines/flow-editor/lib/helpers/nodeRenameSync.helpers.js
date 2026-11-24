import YAML from 'js-yaml';

import { dumpYaml } from '@/[fsd]/shared/lib/helpers/dumpYaml.helpers';

import { applyNodeRenamesToYaml, getRenamedNodePairs } from './nodeRename.helpers';
import { migerateLegacyNodes } from './parsePipeline.helpers';

/**
 * Parses the YAML text and makes the references follow the nodes renamed in it, compared with the baseline.
 * Both the switch from the YAML view to Flow and the save from the YAML view use it, so they can't drift.
 * Returns `{ yamlJson, renamedPairs }`, or null when the text can't be parsed.
 */
export const parseYamlCodeWithRenames = (yamlCode, baselineYamlJson) => {
  try {
    const { yamlJson } = migerateLegacyNodes(YAML.load(yamlCode || '') || {});
    if (!yamlJson) return null;
    const renamedPairs = getRenamedNodePairs(baselineYamlJson?.nodes, yamlJson.nodes);
    return { yamlJson: applyNodeRenamesToYaml(yamlJson, renamedPairs), renamedPairs };
  } catch {
    return null;
  }
};

// The YAML text with the references of the renamed nodes updated. Text without a rename is returned as it is.
export const syncYamlCodeRenames = (yamlCode, baselineYamlJson) => {
  const parsed = parseYamlCodeWithRenames(yamlCode, baselineYamlJson);
  return parsed?.renamedPairs.length ? dumpYaml(parsed.yamlJson) : yamlCode;
};
