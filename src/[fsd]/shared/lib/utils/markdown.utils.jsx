import { Typography } from '@mui/material';
import Link from '@mui/material/Link';

import { typographyVariants } from '@/MainTheme';

export const removeHTMLTags = htmlString => htmlString.replace(/<\/?[^>]+(>|$)/g, '');

export const MarkdownMapping = {
  h1: {
    component: Typography,
    props: {
      variant: 'headingMedium',
      component: 'h1',
      sx: theme => ({
        borderBottom: `1px solid ${theme.palette.border.lines}`,
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  h2: {
    component: Typography,
    props: {
      variant: 'headingSmall',
      component: 'h2',
      sx: theme => ({
        borderBottom: `1px solid ${theme.palette.border.lines}`,
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  h3: {
    component: Typography,
    props: {
      variant: 'labelMedium',
      component: 'h3',
      sx: () => ({
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  h4: {
    component: Typography,
    props: {
      variant: 'labelSmall',
      component: 'h4',
      sx: () => ({
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  h5: {
    component: Typography,
    props: {
      variant: 'bodyMedium',
      component: 'h5',
      sx: () => ({
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  h6: {
    component: Typography,
    props: {
      variant: 'bodyMedium',
      component: 'h6',
      sx: () => ({
        paddingBottom: '0.4em',
        marginTop: '1.2em',
      }),
    },
  },
  p: {
    component: 'p',
    props: {
      style: {
        marginBlockStart: '0px',
        marginBottom: '0.8em',
        whiteSpace: 'pre-wrap',
      },
    },
  },
  span: {
    component: 'span',
    props: {
      style: { whiteSpace: 'pre-wrap' },
    },
  },
  a: {
    component: Link,
    props: {
      target: '_blank',
      variant: 'bodySmall',
    },
  },
  ol: {
    component: 'ol',
    props: {
      style: {
        ...typographyVariants.bodyMedium,
        paddingLeft: '24px',
        margin: '8px 0',
        listStyleType: 'decimal',
        listStylePosition: 'outside',
      },
    },
  },
  ul: {
    component: 'ul',
    props: {
      style: {
        ...typographyVariants.bodyMedium,
        paddingLeft: '24px',
        margin: '8px 0',
        listStyleType: 'disc',
        listStylePosition: 'outside',
      },
    },
  },
  li: {
    component: 'li',
    props: {
      style: {
        ...typographyVariants.bodyMedium,
        whiteSpaceCollapse: 'preserve',
        display: 'list-item',
        listStylePosition: 'outside',
        paddingLeft: '4px',
        marginBottom: '4px',
      },
    },
  },
  strong: {
    component: 'strong',
    props: {
      style: { whiteSpace: 'pre-wrap' },
    },
  },
  br: {
    component: 'br',
    props: {},
  },
  em: {
    component: 'em',
    props: {
      style: { whiteSpace: 'pre-wrap' },
    },
  },
  img: {
    component: props => {
      const { src, alt, ...rest } = props;
      if (!src || !/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(src)) return null;
      return (
        <img
          src={src}
          alt={alt}
          {...rest}
        />
      );
    },
    props: {},
  },
};

const standardHtmlTags = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
];

export const isValidHTMLTag = tag => !!tag && standardHtmlTags.includes(tag.toLowerCase());

export const extractFirstHTMLTag = str => {
  const match = str.match(/<([^>]+)>/);
  return match.length ? match[0] : null;
};
