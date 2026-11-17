// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ComplexityInfo from '../components/ComplexityInfo';

describe('ComplexityInfo (EL-7556)', () => {
  afterEach(cleanup);

  it('explains each dimension and shows the live, calibrated cut points', () => {
    render(
      <ComplexityInfo
        meta={{ thresholds: { medium: 6.2, high: 18, extreme: 75 }, thresholds_source: 'calibrated' }}
      />,
    );

    expect(screen.getByText(/Higher is not worse/)).toBeInTheDocument();
    expect(screen.getByTestId('complexity-info-context')).toHaveTextContent('1,000 tokens');
    expect(screen.getByTestId('complexity-info-tools')).toHaveTextContent('indexing 5');
    // After calibration the defaults must not show
    expect(screen.getByTestId('complexity-info-labels')).toHaveTextContent('Low under 6.2');
    expect(screen.getByTestId('complexity-info-labels')).not.toHaveTextContent('under 10');
    expect(screen.getByTestId('complexity-info-labels')).toHaveTextContent('updated nightly');
  });

  it('falls back to generic label text before the meta loads', () => {
    render(<ComplexityInfo />);

    expect(screen.getByTestId('complexity-info-labels')).toHaveTextContent(
      'typical runs on this installation',
    );
  });
});
