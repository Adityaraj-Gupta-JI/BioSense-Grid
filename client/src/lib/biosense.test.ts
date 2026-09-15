import { describe, expect, it } from 'vitest';
import { analyzeSignal, BioSignal, compareCompatible, detectSignalEvents, eventRegisterCsv, inspectSignal, parseCsvObservation } from './biosense';

function fixture(values: number[]): BioSignal {
  return {
    signal_id: 'TEST-FIXTURE', organism: { name: 'TEST FIXTURE ONLY' },
    modality: { domain: 'test', measurement: 'mathematical fixture', unit: 'TEST' },
    experiment: { poised_potential_mv: 0, mediator: 'TEST', mediator_concentration_um: 0, condition_source: 'mathematical fixture' },
    sampling: { time_column: 'time_h', time_unit: 'hour', interval_hours: 1 / 3600, rate_hz: 1, duration_hours: (values.length - 1) / 3600 },
    source: { type: 'mathematical_test_fixture', publisher: 'BioSense Grid', doi: 'UNAVAILABLE', title: 'Test fixture', license: 'UNAVAILABLE', archive_file: 'UNAVAILABLE', workbook: 'UNAVAILABLE', sheet: 'UNAVAILABLE', retrieved_utc: 'UNAVAILABLE' },
    provenance: { raw_archive_sha256: 'TEST', extraction: 'test fixture', processing_version: 'test' },
    data: values.map((value, index) => ({ time_h: index / 3600, value })),
  };
}

describe('BioSense deterministic analysis', () => {
  it('identifies a constant signal as flatline with zero variance', () => {
    const result = analyzeSignal(fixture(new Array(64).fill(4)));
    expect(result.mean).toBe(4);
    expect(result.variance).toBe(0);
    expect(result.rms).toBe(4);
    expect(result.flatline).toBe(true);
  });

  it('keeps a zero signal at zero without invalid spectral values', () => {
    const result = analyzeSignal(fixture(new Array(64).fill(0)));
    expect(result.rms).toBe(0);
    expect(result.psd.every((point) => Number.isFinite(point.power))).toBe(true);
  });

  it('detects energy in a known periodic fixture', () => {
    const result = analyzeSignal(fixture(Array.from({ length: 128 }, (_, index) => Math.sin((2 * Math.PI * index) / 16))));
    expect(result.std).toBeGreaterThan(0.6);
    expect(result.dominantFrequencyHz).toBeGreaterThan(0);
  });

  it('validates the real-flow shape without inventing source units', () => {
    const result = inspectSignal(fixture([1, 2, 3, 4]));
    expect(result.status).toBe('READY');
    expect(result.sampleCount).toBe(4);
    expect(result.missingValues).toBe(0);
  });

  it('parses valid CSV through the canonical signal model', () => {
    const parsed = parseCsvObservation('time,value\n0,1\n1,2\n2,3\n3,4\n', 'fixture.csv');
    expect(parsed.signal?.data).toHaveLength(4);
    expect(parsed.inspection?.status).toBe('READY');
  });

  it('rejects invalid CSV and detects duplicate timestamps', () => {
    expect(parseCsvObservation('', 'empty.csv').error).toContain('empty');
    const parsed = parseCsvObservation('time,value\n0,1\n0,2\n1,3\n2,4\n', 'duplicate.csv');
    expect(parsed.inspection?.duplicateTimes).toBe(1);
    expect(parsed.inspection?.status).toBe('FAULT');
  });

  it('validates comparable signal contexts', () => {
    const a = fixture([1, 2, 3, 4]);
    const b = fixture([2, 3, 4, 5]);
    expect(compareCompatible(a, b).compatible).toBe(true);
    b.modality.unit = 'OTHER';
    expect(compareCompatible(a, b).compatible).toBe(false);
  });

  it('returns no signal events for constant and zero test fixtures', () => {
    expect(detectSignalEvents(fixture(new Array(64).fill(4))).events).toHaveLength(0);
    expect(detectSignalEvents(fixture(new Array(64).fill(0))).events).toHaveLength(0);
  });

  it('detects two separated mathematical pulse test fixtures', () => {
    const values = new Array(100).fill(0);
    values[20] = 5; values[21] = 5; values[22] = 5;
    values[70] = -5; values[71] = -5; values[72] = -5;
    const result = detectSignalEvents(fixture(values));
    expect(result.events).toHaveLength(2);
    expect(result.events[0].type).toBe('POSITIVE_PEAK');
    expect(result.events[1].type).toBe('NEGATIVE_PEAK');
  });

  it('does not over-detect small deterministic noise around a stable baseline', () => {
    const values = Array.from({ length: 100 }, (_, index) => (index % 2 ? 0.01 : -0.01));
    const result = detectSignalEvents(fixture(values));
    expect(result.events.length).toBeLessThanOrEqual(1);
  });

  it('groups a sustained excursion with a brief threshold gap as one event', () => {
    const values = new Array(100).fill(0);
    for (let index = 30; index < 34; index += 1) values[index] = 5;
    for (let index = 36; index < 40; index += 1) values[index] = 5;
    const result = detectSignalEvents(fixture(values));
    expect(result.events).toHaveLength(1);
    expect(result.groupingRule).toBe('MERGE_GAPS_WITHIN_MINIMUM_SEPARATION');
    expect(result.events[0].duration_s).toBeGreaterThan(0);
  });

  it('exports one stable CSV row per detected event', () => {
    const values = new Array(100).fill(0); values[20] = 5; values[21] = 5; values[22] = 5; values[70] = -5; values[71] = -5; values[72] = -5;
    const signal = fixture(values);
    const result = detectSignalEvents(signal);
    const csv = eventRegisterCsv(signal, result);
    expect(csv.split('\n')).toHaveLength(result.events.length + 1);
    expect(csv.split('\n')[0]).toContain('event_id,signal_id,event_type,polarity');
    expect(csv).toContain('TEST-FIXTURE');
  });

  it('runs reproducibly on the preserved real source-derived observation', async () => {
    const source = await import('../../public/data/biosense-demo-rf-1um.json');
    const realSignal = source.default as BioSignal;
    const first = detectSignalEvents(realSignal);
    const second = detectSignalEvents(realSignal);
    expect(first.events).toEqual(second.events);
    expect(first.events.every((event) => event.source_signal === realSignal.signal_id && event.end_time_h >= event.start_time_h)).toBe(true);
    expect(eventRegisterCsv(realSignal, first).split('\n')).toHaveLength(first.events.length + 1);
  });
});
