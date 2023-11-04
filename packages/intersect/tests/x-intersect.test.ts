import { getLengthValue, getRootMargin, getThreshold } from '../src';

describe('x-intersect utilities', () => {
  it('can get threshold', () => {
    expect(getThreshold([])).toBe(0);
    expect(getThreshold(['100', 'threshold', '10'])).toBe(0.1);
    expect(getThreshold(['50', 'threshold', '100'])).toBe(1);
    expect(getThreshold(['50', 'full', 'threshold', '50'])).toBe(0.99);
    expect(getThreshold(['75', 'half', 'threshold', '69'])).toBe(0.5);
  });
  it('can get length value', () => {
    expect(getLengthValue('10px')).toBe('10px');
    expect(getLengthValue('10')).toBe('10px');
    expect(getLengthValue('10%')).toBe('10%');
    expect(getLengthValue('10px10')).toBeNull();
  });
  it('can get root margin', () => {
    expect(getRootMargin([])).toBe('0px 0px 0px 0px');
    expect(getRootMargin(['margin'])).toBe('0px 0px 0px 0px');
    expect(getRootMargin(['margin', '300px'])).toBe('300px');
    expect(getRootMargin(['margin', '300px', '0'])).toBe('300px 0px');
    expect(getRootMargin(['margin', '300px', '0', '50%'])).toBe(
      '300px 0px 50%',
    );
    expect(getRootMargin(['margin', '300px', '0', '50%', '0'])).toBe(
      '300px 0px 50% 0px',
    );
    expect(getRootMargin(['margin', '300px', '0', '50%', '0', '100'])).toBe(
      '300px 0px 50% 0px',
    );
    expect(getRootMargin(['margin', '300px', 'once'])).toBe('300px');
    expect(getRootMargin(['margin', '300px', 'once', '0'])).toBe('300px 0px');
  });
});
