import { PlateFormatPipe } from './plate-format.pipe'

describe('PlateFormatPipe', () => {
  let pipe: PlateFormatPipe

  beforeEach(() => {
    pipe = new PlateFormatPipe()
  })

  it('formats old-style plate (no separator) with default middle dot', () => {
    expect(pipe.transform('ABC1234')).toBe('ABC·1234')
  })

  it('normalizes old-style plate that already has a dash', () => {
    expect(pipe.transform('ABC-1234')).toBe('ABC·1234')
  })

  it('formats old-style plate with dash separator', () => {
    expect(pipe.transform('ABC1234', '-')).toBe('ABC-1234')
  })

  it('formats old-style plate with space separator', () => {
    expect(pipe.transform('ABC1234', ' ')).toBe('ABC 1234')
  })

  it('returns Mercosul plate unchanged (no separator added)', () => {
    expect(pipe.transform('ABC1D23')).toBe('ABC1D23')
  })

  it('normalizes Mercosul plate with extra chars', () => {
    expect(pipe.transform('ABC-1D23')).toBe('ABC1D23')
  })

  it('returns empty string for null', () => {
    expect(pipe.transform(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(pipe.transform('')).toBe('')
  })

  it('returns original value for invalid plate', () => {
    expect(pipe.transform('INVALID')).toBe('INVALID')
  })

  it('handles lowercase input (normalizes to uppercase)', () => {
    expect(pipe.transform('abc1234')).toBe('ABC·1234')
  })

  it('handles lowercase Mercosul input', () => {
    expect(pipe.transform('abc1d23')).toBe('ABC1D23')
  })
})
