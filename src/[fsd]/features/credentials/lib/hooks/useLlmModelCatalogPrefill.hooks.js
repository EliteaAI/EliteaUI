import { useLayoutEffect, useRef, useState } from 'react';

import {
  areSettingsAsPrefilled,
  buildPrefillFromCatalogEntry,
  pickPrefillableSettings,
} from '../helpers/llmModelCatalog.helpers.js';

export const useLlmModelCatalogPrefill = props => {
  const {
    catalogEntry,
    storedCatalogEntry,
    isCatalogPending,
    isEditing,
    isModelNameFocused,
    initialName,
    settings,
    settledName,
    editSetting,
  } = props;
  const [handledCatalogKey, setHandledCatalogKey] = useState(catalogEntry?.key ?? null);
  const prefilledNameRef = useRef(catalogEntry ? settledName : null);
  const lastPrefillRef = useRef(null);
  const nameSettledBeforeCatalogRef = useRef(null);
  const isSettledNameEdited = settledName !== initialName;
  const isStoredEntryLookedUp =
    isEditing && (!isSettledNameEdited || catalogEntry?.key === storedCatalogEntry?.key);
  useLayoutEffect(() => {
    if (isCatalogPending) {
      if (nameSettledBeforeCatalogRef.current?.name !== settledName) {
        nameSettledBeforeCatalogRef.current = {
          name: settledName,
          settings: pickPrefillableSettings(settings, !isEditing),
        };
      }
      return;
    }
    const nameSettledBeforeCatalog = nameSettledBeforeCatalogRef.current;
    const isEditedWhileCatalogLoaded =
      nameSettledBeforeCatalog?.name === settledName &&
      !areSettingsAsPrefilled(settings, nameSettledBeforeCatalog.settings);
    if (isModelNameFocused && !isEditedWhileCatalogLoaded) return;
    nameSettledBeforeCatalogRef.current = null;
    const catalogKey = catalogEntry?.key ?? null;
    if (catalogKey === handledCatalogKey) return;
    setHandledCatalogKey(catalogKey);
    if (prefilledNameRef.current !== settledName) prefilledNameRef.current = null;
    if (!catalogEntry || (isEditing && !isSettledNameEdited)) return;
    if (isEditedWhileCatalogLoaded) {
      prefilledNameRef.current = settledName;
      lastPrefillRef.current = nameSettledBeforeCatalog.settings;
      return;
    }
    const isRouteChangeOnly = prefilledNameRef.current === settledName;
    if (isRouteChangeOnly && !areSettingsAsPrefilled(settings, lastPrefillRef.current)) return;
    const prefill = buildPrefillFromCatalogEntry(catalogEntry, {
      isVisionIncluded: !isEditing,
      isUnreportedReasoningKept: isRouteChangeOnly,
    });
    prefilledNameRef.current = settledName;
    lastPrefillRef.current = { ...pickPrefillableSettings(settings, !isEditing), ...prefill };
    Object.entries(prefill).forEach(([field, value]) => editSetting(field, value));
  }, [
    catalogEntry,
    editSetting,
    handledCatalogKey,
    isCatalogPending,
    isEditing,
    isModelNameFocused,
    isSettledNameEdited,
    settings,
    settledName,
  ]);

  return {
    isStoredEntryLookedUp,
    isCatalogFillPending: !isStoredEntryLookedUp && (catalogEntry?.key ?? null) !== handledCatalogKey,
  };
};
