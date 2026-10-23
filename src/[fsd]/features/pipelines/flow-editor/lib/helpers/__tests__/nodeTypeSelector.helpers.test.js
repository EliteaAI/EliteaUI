import { describe, expect, it } from 'vitest';

import { BOUNDARY_MARGIN, TWO_COLUMNS_WIDTH, getNodeTypeSelectorLayout } from '../nodeTypeSelector.helpers';

const rect = ({ top = 0, left = 0, width, height }) => ({
  top,
  left,
  width,
  height,
  bottom: top + height,
  right: left + width,
});

describe('getNodeTypeSelectorLayout', () => {
  it('keeps the default two-column layout when there is no boundary', () => {
    expect(getNodeTypeSelectorLayout({ boundaryRect: null })).toEqual({
      columns: 2,
      maxWidth: null,
      maxHeight: null,
    });
  });

  it('uses two columns on a wide canvas', () => {
    const layout = getNodeTypeSelectorLayout({
      boundaryRect: rect({ width: 1200, height: 800 }),
      isCentered: true,
    });

    expect(layout.columns).toBe(2);
    expect(layout.maxWidth).toBe(1200 - BOUNDARY_MARGIN * 2);
  });

  it('switches to one column when two columns do not fit', () => {
    const layout = getNodeTypeSelectorLayout({
      boundaryRect: rect({ width: TWO_COLUMNS_WIDTH, height: 800 }),
      isCentered: true,
    });

    expect(layout.columns).toBe(1);
  });

  it('limits the height to the canvas when centered', () => {
    const layout = getNodeTypeSelectorLayout({
      boundaryRect: rect({ top: 100, width: 1200, height: 500 }),
      isCentered: true,
    });

    expect(layout.maxHeight).toBe(500 - BOUNDARY_MARGIN * 2);
  });

  it('limits the height to the space below the anchor', () => {
    const layout = getNodeTypeSelectorLayout({
      boundaryRect: rect({ top: 100, width: 1200, height: 600 }),
      anchorRect: rect({ top: 60, width: 80, height: 32 }),
    });

    expect(layout.maxHeight).toBe(700 - 92 - 8 - BOUNDARY_MARGIN);
  });

  it('never shrinks below a usable height', () => {
    const layout = getNodeTypeSelectorLayout({
      boundaryRect: rect({ width: 1200, height: 120 }),
      isCentered: true,
    });

    expect(layout.maxHeight).toBe(200);
  });
});
