import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const TooltipMarkdownContent = ({ children: externalChildren }) => {
  if (!externalChildren) return null;

  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        p: ({ children }) => <p style={{ margin: '0rem' }}>{children}</p>,
        strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
        ul: ({ children }) => (
          <ul style={{ margin: '0rem', paddingLeft: '1rem', listStyleType: 'disc' }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{ margin: '0rem', paddingLeft: '1rem', listStyleType: 'decimal' }}>{children}</ol>
        ),
        li: ({ children }) => <li style={{ marginBottom: '0rem' }}>{children}</li>,
        code: ({ children }) => (
          <code
            style={{
              fontFamily: 'monospace',
              fontSize: '0.85em',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '.1875rem',
              padding: '.0625rem .25rem',
            }}
          >
            {children}
          </code>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            {children}
          </a>
        ),
      }}
    >
      {externalChildren}
    </Markdown>
  );
};

export default TooltipMarkdownContent;
