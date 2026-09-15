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
  psd: { frequencyHz: number; power: number }[];
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
  return { psd, dominantFrequencyHz: dominant?.frequencyHz ?? 0, spectralCentroidHz: centroid, spectralBandwidthHz: bandwidth, spectralEntropy: entropy };
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

export function downsample(data: DataPoint[], count = 260) {
  if (data.length <= count) return data;
  const stride = (data.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, index) => data[Math.round(index * stride)]);
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
