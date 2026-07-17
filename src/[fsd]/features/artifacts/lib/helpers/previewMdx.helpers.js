export const stripMdxMetadata = source => {
  let processed = source;
  processed = processed.replace(/^import\s[^;]*?['"][^'"]*['"]\s*;?\s*$/gm, '');
  return processed.trim();
};

export const evaluateMdx = async source => {
  const processed = stripMdxMetadata(source);
  const [{ evaluate }, runtime, { default: remarkGfm }] = await Promise.all([
    import('@mdx-js/mdx'),
    import('react/jsx-runtime'),
    import('remark-gfm'),
  ]);
  const { default: MDXContent } = await evaluate(processed, {
    ...runtime,
    remarkPlugins: [remarkGfm],
    development: false,
  });
  return MDXContent;
};
