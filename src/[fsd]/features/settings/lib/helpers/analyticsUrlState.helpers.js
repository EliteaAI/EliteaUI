import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';

import { getPresetRange, isValidDate, toValidISOString } from './analyticsCommon.helpers.js';

const { ANALYTICS_SEARCH_PARAMS: KEYS } = AnalyticsCommonConstants;

const ENTITY_KEYS = [KEYS.agentId, KEYS.skillId, KEYS.skillProjectId];

const parseDate = value => {
  if (!value) return null;
  const date = new Date(value);
  return isValidDate(date) ? date : null;
};

const readPreset = (rawRange, presetValues) =>
  presetValues.find(value => String(value) === rawRange) ?? presetValues[0];

export const readAnalyticsTab = (searchParams, defaultTab) => searchParams.get(KEYS.tab) || defaultTab;

export const readAnalyticsView = (searchParams, { presetValues, customPreset, defaultTab }) => {
  const tab = readAnalyticsTab(searchParams, defaultTab);
  const rawRange = searchParams.get(KEYS.range);

  if (rawRange === customPreset) {
    return {
      tab,
      preset: customPreset,
      from: parseDate(searchParams.get(KEYS.from)),
      to: parseDate(searchParams.get(KEYS.to)),
    };
  }

  const preset = readPreset(rawRange, presetValues);
  return { tab, preset, ...getPresetRange(preset) };
};

const setOrDelete = (params, key, value) => {
  if (value === undefined || value === null || value === '') params.delete(key);
  else params.set(key, String(value));
};

export const updateAnalyticsSearchParams = (searchParams, updates) => {
  const next = new URLSearchParams(searchParams);
  Object.entries(updates).forEach(([key, value]) => setOrDelete(next, key, value));
  return next;
};

export const writeAnalyticsView = (searchParams, { tab, preset, from, to, customPreset }) => {
  const isCustom = preset === customPreset;
  return updateAnalyticsSearchParams(searchParams, {
    [KEYS.tab]: tab,
    [KEYS.range]: preset,
    [KEYS.from]: isCustom ? toValidISOString(from) : null,
    [KEYS.to]: isCustom ? toValidISOString(to) : null,
  });
};

export const clearAnalyticsEntity = searchParams =>
  updateAnalyticsSearchParams(searchParams, Object.fromEntries(ENTITY_KEYS.map(key => [key, null])));

export const switchAnalyticsTab = (searchParams, tab) =>
  updateAnalyticsSearchParams(clearAnalyticsEntity(searchParams), { [KEYS.tab]: tab });
