import { describe, expect, it } from 'vitest';

import { TEXT_LINK_SX } from '../textLink.constants';

const palette = { text: { link: '#006DD1', linkHover: '#29B8F5' } };

describe('TEXT_LINK_SX EL-7011 BUG-38', () => {
  it('keeps the link colour on hover and underlines it, so hover keeps 4.5:1 in both themes', () => {
    const sx = TEXT_LINK_SX({ palette });

    expect(sx.color).toBe('#006DD1');
    expect(sx['&:hover']).toEqual({ color: '#006DD1', textDecoration: 'underline' });
  });
});
