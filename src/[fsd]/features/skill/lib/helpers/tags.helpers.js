/**
 * Normalize tags for a skill-version save payload.
 *
 * The shared tag input (`AutoCompleteDropDown`) builds a brand-new tag as
 * `{ name, id: <name string>, data }` — its `id` is the typed name, not a DB id.
 * The skill update/version endpoints validate tags as `PromptTagUpdateModel`
 * (`id: Optional[int]`), so a string `id` fails with "Input should be a valid
 * integer ... at tags, N, id" (400).
 *
 * Existing tags are addressed by their integer `id`; new tags are sent by
 * `name` only (with their `data`, e.g. color) so the backend creates them.
 */
export const normalizeTagsForSave = tags =>
  (tags ?? []).map(({ id, name, data }) => ({
    name,
    ...(Number.isInteger(id) ? { id } : data && { data }),
  }));
