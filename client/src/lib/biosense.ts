export type DataPoint = { time_h: number; value: number };

export type BioSignal = {
  signal_id: string;
  organism: { name: string };
  modality: { domain: string; measurement: string; unit: string };
  experiment: {
    poised_potential_mv: number;
    mediator: string;
    mediator_concentration_um: number;
    condition_source: string;
  };
  sampling: {
    time_column: string;
    time_unit: string;
    interval_hours: number;
    rate_hz: number;
    duration_hours: number;
  };
  source: {
    type: string;
    publisher: string;
    doi: string;
    title: string;
    license: string;
    archive_file: string;
    workbook: string;
    sheet: string;
    retrieved_utc: string;
  };
  provenance: {
    raw_archive_sha256: string;
    extraction: string;
    processing_version: string;
  };
  uploadMetadata?: {
    uploadId: string;
    originalFilename: string;
    importedAt: string;
    source: 'USER_UPLOAD';
    timeColumn: string;
    signalColumn: string;
    unit: string;
    rowCount: number;
    validationStatus: 'READY';
  };
  data: DataPoint[];
};

export type Analysis = {
  sampleCount: number;
  durationHours: number;
  intervalHours: number;
  rateHz: number;
  mean: number;
  median: number;
  variance: number;
  std: number;
  rms: number;
  peakToPeak: number;
  min: number;
  max: number;
  missing: number;
  duplicateTimes: number;
  irregular: boolean;
  flatline: boolean;
  baselineStability: number;
  dominantFrequencyHz: number;
  spectralCentroidHz: number;
  spectralBandwidthHz: number;
  spectralEntropy: number;
  method: {
    name: string;
    window: string;
    segment: number;
    overlap: number;
  };
  psd: { frequencyHz: number; power: number }[];
};

export type InputInspection = {
  timeDetected: boolean;
  signalDetected: boolean;
  sampleCount: number;
  durationHours: number;
  intervalHours: number;
  rateHz: number;
  missingValues: number;
  nonFiniteValues: number;
  duplicateTimes: number;
  timeOrderValid: boolean;
  irregularSampling: boolean;
  flatline: boolean;
  baselineStability: number;
  status: 'READY' | 'FAULT';
};

export type SignalEvent = {
  event_id: string;
  type: 'TRANSIENT_EXCURSION' | 'POSITIVE_PEAK' | 'NEGATIVE_PEAK';
  start_time_h: number;
  peak_time_h: number;
  end_time_h: number;
  duration_s: number;
  peak_value: number;
  baseline_value: number;
  amplitude_delta: number;
  confidence: 'DETERMINISTIC';
  source_signal: string;
};

export type EventDetection = {
  events: SignalEvent[];
  method: 'deterministic-threshold';
  baseline: 'rolling-median';
  baselineWindow: number;
  variability: 'MAD';
  thresholdFactor: number;
  thresholdMethod: 'MAD' | 'MAD_WITH_ROBUST_FALLBACK';
  groupingRule: 'MERGE_GAPS_WITHIN_MINIMUM_SEPARATION';
  threshold: number;
  minimumSeparationSamples: number;
  minimumDurationSamples: number;
  status: 'READY' | 'NO_EVENTS' | 'UNAVAILABLE';
  reason?: string;
};

const finite = (value: number) => Number.isFinite(value);
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

function radix2(values: number[]): { real: number[]; imag: number[] } {
  const n = values.length;
  const real = [...values];
  const imag = new Array(n).fill(0);
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
    }
  }
  for (let length = 2; length <= n; length <<= 1) {
    const angle = -2 * Math.PI / length;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);
    for (let start = 0; start < n; start += length) {
      let currentReal = 1;
      let currentImag = 0;
      const half = length >> 1;
      for (let offset = 0; offset < half; offset += 1) {
        const even = start + offset;
        const odd = even + half;
        const oddReal = real[odd] * currentReal - imag[odd] * currentImag;
        const oddImag = real[odd] * currentImag + imag[odd] * currentReal;
        real[odd] = real[even] - oddReal;
        imag[odd] = imag[even] - oddImag;
        real[even] += oddReal;
        imag[even] += oddImag;
        const nextReal = currentReal * wReal - currentImag * wImag;
        currentImag = currentReal * wImag + currentImag * wReal;
        currentReal = nextReal;
      }
    }
  }
  return { real, imag };
}

function nextPowerOfTwo(value: number) {
  let size = 1;
  while (size < value) size <<= 1;
  return size;
}

function welch(values: number[], rateHz: number) {
  const segment = Math.min(256, nextPowerOfTwo(Math.max(16, Math.floor(values.length / 4))));
  const actualSegment = Math.min(segment, values.length);
  const overlap = Math.floor(actualSegment / 2);
  const step = Math.max(1, actualSegment - overlap);
  const accum = new Array(Math.floor(actualSegment / 2) + 1).fill(0);
  let windows = 0;
  for (let start = 0; start + actualSegment <= values.length; start += step) {
    const chunk = values.slice(start, start + actualSegment);
    const mean = average(chunk);
    const windowed = chunk.map((value, index) => (value - mean) * (0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (actualSegment - 1))));
    const fft = radix2([...windowed, ...new Array(nextPowerOfTwo(actualSegment) - actualSegment).fill(0)]);
    const n = fft.real.length;
    for (let i = 0; i <= actualSegment / 2; i += 1) accum[i] += (fft.real[i] ** 2 + fft.imag[i] ** 2) / n;
    windows += 1;
  }
  const psd = accum.map((power, index) => ({ frequencyHz: index * rateHz / actualSegment, power: power / Math.max(1, windows) })).filter((point) => finite(point.power));
  const totalPower = psd.reduce((sum, point) => sum + point.power, 0) || 1;
  const dominant = psd.slice(1).reduce((best, point) => point.power > best.power ? point : best, psd[1] ?? psd[0]);
  const centroid = psd.reduce((sum, point) => sum + point.frequencyHz * point.power, 0) / totalPower;
  const bandwidth = Math.sqrt(psd.reduce((sum, point) => sum + ((point.frequencyHz - centroid) ** 2) * point.power, 0) / totalPower);
  const entropy = -psd.reduce((sum, point) => { const probability = point.power / totalPower; return probability > 0 ? sum + probability * Math.log2(probability) : sum; }, 0) / Math.log2(Math.max(2, psd.length));
  return { psd, dominantFrequencyHz: dominant?.frequencyHz ?? 0, spectralCentroidHz: centroid, spectralBandwidthHz: bandwidth, spectralEntropy: entropy, method: { name: 'WELCH', window: 'HANN', segment: actualSegment, overlap } };
}

export function inspectSignal(signal: BioSignal): InputInspection {
  const times = signal.data.map((point) => point.time_h);
  const values = signal.data.map((point) => point.value);
  const validTimes = times.filter(finite);
  const validValues = values.filter(finite);
  const deltas = validTimes.slice(1).map((time, index) => time - validTimes[index]).filter(finite);
  const timeOrderValid = validTimes.length > 1 && validTimes.every((time, index) => index === 0 || time > validTimes[index - 1]);
  const intervalHours = deltas.length ? average(deltas) : Number.NaN;
  const irregularSampling = !deltas.length || deltas.some((delta) => Math.abs(delta - intervalHours) > Math.max(1e-8, intervalHours * 0.01));
  const mean = validValues.length ? average(validValues) : Number.NaN;
  const baseline = validValues.slice(0, Math.min(30, validValues.length));
  const baselineStability = baseline.length ? Math.sqrt(average(baseline.map((value) => (value - average(baseline)) ** 2))) : Number.NaN;
  const nonFiniteValues = values.length - validValues.length;
  const duplicateTimes = validTimes.length - new Set(validTimes).size;
  return {
    timeDetected: validTimes.length === times.length && validTimes.length > 1,
    signalDetected: validValues.length === values.length && validValues.length > 1,
    sampleCount: signal.data.length,
    durationHours: validTimes.length > 1 ? validTimes[validTimes.length - 1] - validTimes[0] : Number.NaN,
    intervalHours,
    rateHz: Number.isFinite(intervalHours) && intervalHours > 0 ? 1 / (intervalHours * 3600) : Number.NaN,
    missingValues: values.length - validValues.length,
    nonFiniteValues,
    duplicateTimes,
    timeOrderValid,
    irregularSampling,
    flatline: validValues.length > 0 && validValues.every((value) => value === validValues[0]),
    baselineStability,
    status: validTimes.length > 1 && validValues.length > 1 && nonFiniteValues === 0 && duplicateTimes === 0 && timeOrderValid && !irregularSampling ? 'READY' : 'FAULT',
  };
}

export function analyzeSignal(signal: BioSignal): Analysis {
  const values = signal.data.map((point) => point.value).filter(finite);
  const times = signal.data.map((point) => point.time_h).filter(finite);
  const mean = average(values);
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance = average(values.map((value) => (value - mean) ** 2));
  const std = Math.sqrt(variance);
  const missing = signal.data.length - values.length;
  const duplicateTimes = times.length - new Set(times).size;
  const deltas = times.slice(1).map((time, index) => time - times[index]).filter(finite);
  const intervalHours = average(deltas);
  const irregular = deltas.some((delta) => Math.abs(delta - intervalHours) > Math.max(1e-8, intervalHours * 0.01));
  const baseline = values.slice(0, Math.min(30, values.length));
  const baselineStability = Math.sqrt(average(baseline.map((value) => (value - average(baseline)) ** 2)));
  const spectrum = welch(values, 1 / (intervalHours * 3600));
  return {
    sampleCount: signal.data.length,
    durationHours: times[times.length - 1] - times[0],
    intervalHours,
    rateHz: 1 / (intervalHours * 3600),
    mean,
    median,
    variance,
    std,
    rms: Math.sqrt(average(values.map((value) => value ** 2))),
    peakToPeak: Math.max(...values) - Math.min(...values),
    min: Math.min(...values),
    max: Math.max(...values),
    missing,
    duplicateTimes,
    irregular,
    flatline: std === 0,
    baselineStability,
    ...spectrum,
  };
}

export function detectSignalEvents(signal: BioSignal): EventDetection {
  const points = signal.data.filter((point) => finite(point.time_h) && finite(point.value));
  const thresholdFactor = 3;
  if (points.length < 8) return { events: [], method: 'deterministic-threshold', baseline: 'rolling-median', baselineWindow: 0, variability: 'MAD', thresholdFactor, thresholdMethod: 'MAD', groupingRule: 'MERGE_GAPS_WITHIN_MINIMUM_SEPARATION', threshold: Number.NaN, minimumSeparationSamples: 0, minimumDurationSamples: 0, status: 'UNAVAILABLE', reason: 'At least eight finite samples are required.' };
  const window = Math.min(31, points.length % 2 === 0 ? points.length - 1 : points.length);
  const half = Math.floor(window / 2);
  const medianOf = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)]; };
  const baseline = points.map((_, index) => medianOf(points.slice(Math.max(0, index - half), Math.min(points.length, index + half + 1)).map((point) => point.value)));
  const residuals = points.map((point, index) => point.value - baseline[index]);
  const residualMedian = medianOf(residuals);
  const mad = medianOf(residuals.map((value) => Math.abs(value - residualMedian)));
  if (residuals.every((value) => value === 0)) return { events: [], method: 'deterministic-threshold', baseline: 'rolling-median', baselineWindow: window, variability: 'MAD', thresholdFactor, thresholdMethod: 'MAD', groupingRule: 'MERGE_GAPS_WITHIN_MINIMUM_SEPARATION', threshold: 0, minimumSeparationSamples: Math.max(3, Math.floor(points.length * 0.005)), minimumDurationSamples: Math.max(2, Math.floor(points.length * 0.002)), status: 'NO_EVENTS' };
  const differences = residuals.slice(1).map((value, index) => Math.abs(value - residuals[index]));
  const fallbackScale = differences.length ? medianOf(differences) : 0;
  const thresholdMethod = mad > 0 ? 'MAD' : 'MAD_WITH_ROBUST_FALLBACK';
  const threshold = Math.max(thresholdFactor * 1.4826 * mad, thresholdFactor * fallbackScale, 0.1 * thresholdFactor * Math.sqrt(average(residuals.map((value) => value ** 2))), 1e-12);
  const minimumDurationSamples = Math.max(2, Math.floor(points.length * 0.002));
  const minimumSeparationSamples = Math.max(3, Math.floor(points.length * 0.005));
  const candidates: { start: number; end: number }[] = [];
  let start = -1;
  residuals.forEach((residual, index) => {
    if (Math.abs(residual) >= threshold && start < 0) start = index;
    if (start >= 0 && (Math.abs(residual) < threshold || index === residuals.length - 1)) {
      const end = Math.abs(residual) >= threshold && index === residuals.length - 1 ? index : index - 1;
      if (end - start + 1 >= minimumDurationSamples) candidates.push({ start, end });
      start = -1;
    }
  });
  const merged: { start: number; end: number }[] = [];
  candidates.forEach((candidate) => { const previous = merged[merged.length - 1]; if (previous && candidate.start - previous.end <= minimumSeparationSamples) previous.end = candidate.end; else merged.push({ ...candidate }); });
  const events = merged.map(({ start: eventStart, end: eventEnd }, index) => {
    let peakIndex = eventStart;
    for (let cursor = eventStart + 1; cursor <= eventEnd; cursor += 1) if (Math.abs(residuals[cursor]) > Math.abs(residuals[peakIndex])) peakIndex = cursor;
    const delta = residuals[peakIndex];
    return { event_id: `EVT-${String(index + 1).padStart(3, '0')}`, type: delta >= 0 ? 'POSITIVE_PEAK' : 'NEGATIVE_PEAK', start_time_h: points[eventStart].time_h, peak_time_h: points[peakIndex].time_h, end_time_h: points[eventEnd].time_h, duration_s: (points[eventEnd].time_h - points[eventStart].time_h) * 3600, peak_value: points[peakIndex].value, baseline_value: baseline[peakIndex], amplitude_delta: delta, confidence: 'DETERMINISTIC', source_signal: signal.signal_id } as SignalEvent;
  });
  return { events, method: 'deterministic-threshold', baseline: 'rolling-median', baselineWindow: window, variability: 'MAD', thresholdFactor, thresholdMethod, groupingRule: 'MERGE_GAPS_WITHIN_MINIMUM_SEPARATION', threshold, minimumSeparationSamples, minimumDurationSamples, status: events.length ? 'READY' : 'NO_EVENTS' };
}

export function downsample(data: DataPoint[], count = 260) {
  if (data.length <= count) return data;
  const stride = (data.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, index) => data[Math.round(index * stride)]);
}

export function eventRegisterCsv(signal: BioSignal, detection: EventDetection): string {
  const headers = ['event_id', 'signal_id', 'event_type', 'polarity', 'start_time', 'peak_time', 'end_time', 'duration_s', 'peak_value', 'baseline_value', 'amplitude_delta', 'detector_method', 'baseline_method', 'threshold_method', 'processing_version'];
  const escape = (value: string | number) => { const text = String(value); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; };
  const rows = detection.events.map((event) => [event.event_id, signal.signal_id, event.type, event.type === 'POSITIVE_PEAK' ? 'positive' : 'negative', event.start_time_h, event.peak_time_h, event.end_time_h, event.duration_s, event.peak_value, event.baseline_value, event.amplitude_delta, detection.method, detection.baseline, detection.thresholdMethod, signal.provenance.processing_version].map(escape).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function formatNumber(value: number, digits = 3) {
  if (!Number.isFinite(value)) return 'UNAVAILABLE';
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function formatFrequency(value: number) {
  if (!Number.isFinite(value) || value === 0) return '0 Hz';
  if (value < 0.001) return `${(value * 1000).toFixed(3)} mHz`;
  return `${value.toFixed(4)} Hz`;
}

export const CSV_MAX_BYTES = 10_000_000;
export const CSV_MIN_ROWS = 4;
export type CsvInspection = InputInspection & { fileName: string; rowCount: number; columnCount: number; columns: string[]; selectedTime: string; selectedSignal: string; unit: string; mappingStatus: 'READY' | 'REVIEW' | 'REJECTED'; timeCandidates: string[]; signalCandidates: string[]; message?: string };
export type CsvStructure = { fileName: string; columns: string[]; rows: string[][]; timeCandidates: string[]; signalCandidates: string[]; suggestedTime?: string; suggestedSignal?: string; error?: string };

function csvRows(text: string): { rows: string[][]; error?: string } {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') { if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted; }
    else if (character === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) { if (character === '\r' && text[index + 1] === '\n') index += 1; row.push(cell.trim()); if (row.some((value) => value !== '')) rows.push(row); row = []; cell = ''; }
    else cell += character;
  }
  if (quoted) return { rows, error: '[ INPUT SCHEMA FAULT ] CSV contains an unterminated quoted field.' };
  if (cell !== '' || row.length) { row.push(cell.trim()); if (row.some((value) => value !== '')) rows.push(row); }
  return { rows };
}

const numericRatio = (values: string[]) => values.length ? values.filter((value) => value.trim() !== '' && Number.isFinite(Number(value))).length / values.length : 0;
const likelyTime = (name: string) => /^(time|timestamp|datetime|date|seconds?|hours?|time[_ -]?s)$/i.test(name.trim()) || /time|timestamp|datetime/i.test(name);
const likelySignal = (name: string) => /signal|value|current|voltage|amplitude|measurement|data/i.test(name);

export function inspectCsvStructure(text: string, filename: string): CsvStructure {
  if (!filename.toLowerCase().endsWith('.csv')) return { fileName: filename, columns: [], rows: [], timeCandidates: [], signalCandidates: [], error: '[ INPUT SCHEMA FAULT ] Only .csv files are accepted.' };
  if (!text.trim()) return { fileName: filename, columns: [], rows: [], timeCandidates: [], signalCandidates: [], error: '[ INPUT SCHEMA FAULT ] CSV file is empty.' };
  if (new TextEncoder().encode(text).byteLength > CSV_MAX_BYTES) return { fileName: filename, columns: [], rows: [], timeCandidates: [], signalCandidates: [], error: `[ INPUT RECORD TOO LARGE ] CSV exceeds the configured ${CSV_MAX_BYTES / 1_000_000} MB limit.` };
  const parsed = csvRows(text);
  if (parsed.error) return { fileName: filename, columns: [], rows: [], timeCandidates: [], signalCandidates: [], error: parsed.error };
  const [header = [], ...rows] = parsed.rows;
  const columns = header.map((column) => column.trim());
  if (columns.length < 2 || columns.some((column) => !column)) return { fileName: filename, columns, rows, timeCandidates: [], signalCandidates: [], error: '[ INPUT SCHEMA FAULT ] CSV requires at least two non-empty columns.' };
  if (new Set(columns.map((column) => column.toLowerCase())).size !== columns.length) return { fileName: filename, columns, rows, timeCandidates: [], signalCandidates: [], error: '[ INPUT SCHEMA FAULT ] CSV column names must be unique.' };
  if (rows.some((row) => row.length !== columns.length)) return { fileName: filename, columns, rows, timeCandidates: [], signalCandidates: [], error: '[ INPUT SCHEMA FAULT ] CSV rows do not have a consistent column count.' };
  if (rows.length < CSV_MIN_ROWS) return { fileName: filename, columns, rows, timeCandidates: [], signalCandidates: [], error: `[ INPUT SCHEMA FAULT ] CSV requires at least ${CSV_MIN_ROWS} data rows.` };
  const scored = columns.map((column, index) => { const values = rows.map((row) => row[index] ?? ''); const ratio = numericRatio(values); const numbers = values.map(Number).filter(Number.isFinite); const monotonic = numbers.length > 1 && numbers.every((value, cursor) => cursor === 0 || value > numbers[cursor - 1]); return { column, index, ratio, monotonic, timeScore: ratio * 4 + (monotonic ? 3 : 0) + (likelyTime(column) ? 4 : 0), signalScore: ratio * 3 + (likelySignal(column) ? 4 : 0) }; });
  const timeScored = scored.filter((item) => item.ratio === 1 && (item.monotonic || likelyTime(item.column))).sort((a, b) => b.timeScore - a.timeScore);
  const timeCandidates = timeScored.map((item) => item.column);
  const suggestedTime = timeScored[0] && timeScored[0].timeScore > (timeScored[1]?.timeScore ?? -Infinity) ? timeScored[0].column : undefined;
  const signalScored = scored.filter((item) => item.ratio === 1 && item.column !== suggestedTime).sort((a, b) => b.signalScore - a.signalScore);
  const signalCandidates = signalScored.map((item) => item.column);
  const suggestedSignal = signalScored[0] && signalScored[0].signalScore > (signalScored[1]?.signalScore ?? -Infinity) ? signalScored[0].column : undefined;
  return { fileName: filename, columns, rows, timeCandidates, signalCandidates, suggestedTime, suggestedSignal };
}

export function parseCsvObservation(text: string, filename: string, timeColumn?: string, signalColumn?: string, unit = 'UNAVAILABLE'): { signal?: BioSignal; inspection?: CsvInspection; error?: string } {
  const structure = inspectCsvStructure(text, filename);
  if (structure.error) return { error: structure.error };
  const probableTime = timeColumn ?? structure.suggestedTime;
  const probableSignal = signalColumn ?? structure.suggestedSignal;
  const base = { fileName: filename, rowCount: structure.rows.length, columnCount: structure.columns.length, columns: structure.columns, selectedTime: probableTime ?? '', selectedSignal: probableSignal ?? '', unit, timeCandidates: structure.timeCandidates, signalCandidates: structure.signalCandidates };
  if (!probableTime || !probableSignal || probableTime === probableSignal) return { error: '[ REVIEW COLUMN MAPPING ] Select one valid time column and one valid signal column.', inspection: { ...inspectSignal({ data: [], signal_id: 'CSV-PENDING', organism: { name: 'UNAVAILABLE' }, modality: { domain: 'user-upload', measurement: 'user-provided signal', unit }, experiment: { poised_potential_mv: Number.NaN, mediator: 'UNAVAILABLE', mediator_concentration_um: Number.NaN, condition_source: 'USER CSV' }, sampling: { time_column: '', time_unit: 'UNAVAILABLE', interval_hours: Number.NaN, rate_hz: Number.NaN, duration_hours: Number.NaN }, source: { type: 'user_upload', publisher: 'BioSense Grid', doi: 'UNAVAILABLE', title: filename, license: 'UNAVAILABLE', archive_file: filename, workbook: 'UNAVAILABLE', sheet: 'UNAVAILABLE', retrieved_utc: new Date().toISOString() }, provenance: { raw_archive_sha256: 'UNAVAILABLE', extraction: 'CSV structure inspected', processing_version: 'biosense-grid-h51' } }), ...base, mappingStatus: 'REVIEW', message: 'Time and signal columns must be selected.' } };
  const timeIndex = structure.columns.indexOf(probableTime); const signalIndex = structure.columns.indexOf(probableSignal);
  if (timeIndex < 0 || signalIndex < 0 || timeIndex === signalIndex) return { error: '[ REVIEW COLUMN MAPPING ] Selected columns are not available.', inspection: { ...base, timeDetected: false, signalDetected: false, sampleCount: structure.rows.length, durationHours: Number.NaN, intervalHours: Number.NaN, rateHz: Number.NaN, missingValues: 0, nonFiniteValues: 0, duplicateTimes: 0, timeOrderValid: false, irregularSampling: true, flatline: false, baselineStability: Number.NaN, status: 'FAULT', mappingStatus: 'REVIEW', message: 'Selected columns are not available.' } };
  const data = structure.rows.map((row) => ({ time_h: row[timeIndex].trim() === '' ? Number.NaN : Number(row[timeIndex]), value: row[signalIndex].trim() === '' ? Number.NaN : Number(row[signalIndex]) }));
  const uploadId = `CSV-${filename.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toUpperCase()}`;
  const importedAt = new Date().toISOString();
  const signal: BioSignal = { signal_id: uploadId, organism: { name: 'UNAVAILABLE' }, modality: { domain: 'user-upload', measurement: 'user-provided signal', unit }, experiment: { poised_potential_mv: Number.NaN, mediator: 'UNAVAILABLE', mediator_concentration_um: Number.NaN, condition_source: 'USER CSV' }, sampling: { time_column: probableTime, time_unit: 'UNAVAILABLE', interval_hours: Number.NaN, rate_hz: Number.NaN, duration_hours: Number.NaN }, source: { type: 'user_upload', publisher: 'BioSense Grid', doi: 'UNAVAILABLE', title: filename, license: 'UNAVAILABLE', archive_file: filename, workbook: 'UNAVAILABLE', sheet: 'UNAVAILABLE', retrieved_utc: importedAt }, provenance: { raw_archive_sha256: 'UNAVAILABLE', extraction: `CSV import; time=${probableTime}; signal=${probableSignal}`, processing_version: 'biosense-grid-h51' }, uploadMetadata: { uploadId, originalFilename: filename, importedAt, source: 'USER_UPLOAD', timeColumn: probableTime, signalColumn: probableSignal, unit, rowCount: data.length, validationStatus: 'READY' }, data };
  const inspected = inspectSignal(signal); const inspection: CsvInspection = { ...inspected, ...base, mappingStatus: inspected.status === 'READY' ? 'READY' : 'REJECTED', message: inspected.status === 'READY' ? undefined : 'Selected columns contain invalid, duplicate, non-monotonic, or irregular data.' };
  if (inspected.status !== 'READY') return { error: `[ SIGNAL INPUT INVALID ] ${inspection.message}`, inspection };
  return { signal, inspection };
}

export function compareCompatible(a: BioSignal, b: BioSignal) {
  const reasons: string[] = [];
  if (a.modality.domain !== b.modality.domain) reasons.push('modality differs');
  if (a.modality.unit !== b.modality.unit) reasons.push('unit differs');
  if (a.sampling.time_unit !== b.sampling.time_unit) reasons.push('time representation differs');
  if (a.data.length < 4 || b.data.length < 4) reasons.push('insufficient rows');
  return { compatible: reasons.length === 0, reasons };
}
