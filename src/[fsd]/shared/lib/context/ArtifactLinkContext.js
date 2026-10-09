import { createContext, useContext } from 'react';

/**
 * Overrides where chat links to generated artifact files point. The value is a function
 * `({ bucket, file }) => string | null`; `null` means the file can't be opened in the current context.
 * Without a provider, links open the Artifacts page of the selected project.
 */
export const ArtifactLinkContext = createContext(undefined);

export const useArtifactLinkResolver = () => useContext(ArtifactLinkContext);
