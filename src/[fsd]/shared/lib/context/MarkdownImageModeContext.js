import { createContext, useContext } from 'react';

import { MARKDOWN_IMAGE_MODE } from '@/[fsd]/shared/lib/constants/markdown.constants';

export const MarkdownImageModeContext = createContext(MARKDOWN_IMAGE_MODE.RENDER);

export const useMarkdownImageMode = () => useContext(MarkdownImageModeContext);
