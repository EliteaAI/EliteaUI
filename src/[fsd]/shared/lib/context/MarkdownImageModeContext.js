import { createContext, useContext } from 'react';

export const MARKDOWN_IMAGE_MODE = { RENDER: 'render', EXTERNAL_LINK: 'external' };

// EXTERNAL_LINK shows images as links to their real URL without loading them (untrusted web content).
export const MarkdownImageModeContext = createContext(MARKDOWN_IMAGE_MODE.RENDER);

export const useMarkdownImageMode = () => useContext(MarkdownImageModeContext);
