// Country utilities (lightweight, no schema impact)

// Kept for compatibility with common flag-icon class patterns
export const isoToFlag = (iso) => `fi fi-${String(iso || '').toLowerCase()}`;

export const isoToFlagEmoji = (iso) => {
  if (!iso || String(iso).length !== 2) return '🌍';
  return String(iso)
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt()))
    .join('');
};

// Modifying country/region names
const COUNTRY_NAME_OVERRIDES = {
  AC: 'Ascension Island',
  BQ: 'Bonaire',
  CN: 'China',
  FK: 'Falkland Islands',
  IR: 'Iran',
  KR: 'South Korea',
  LA: 'Laos',
  MD: 'Moldova',
  MK: 'North Macedonia',
  PS: 'Palestine',
  RU: 'Russia',
  SY: 'Syria',
  TA: 'Tristan da Cunha',
  TR: 'Turkey',
  TW: 'Taiwan',
  VA: 'Vatican City',
};

const displayNames =
  typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

const REGION_FALLBACK = [
  'SG', 'MY', 'ID', 'TH', 'VN', 'PH', 'IN', 'CN', 'HK', 'TW', 'KR', 'JP',
  'US', 'GB', 'AU', 'NZ', 'CA',
  'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE',
  'AE', 'SA', 'QA',
  'ZA', 'NG',
  'BR', 'MX', 'AR',
];

const buildRegionCodes = () => {
  if (!displayNames) return REGION_FALLBACK;

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const generated = [];

  for (let i = 0; i < letters.length; i += 1) {
    for (let j = 0; j < letters.length; j += 1) {
      const code = `${letters[i]}${letters[j]}`;
      const name = displayNames.of(code);
      if (name && name !== code && !String(name).toLowerCase().startsWith('unknown')) {
        generated.push(code);
      }
    }
  }

  return generated.length ? generated : REGION_FALLBACK;
};

const REGION_CODES = buildRegionCodes();

const getCountryName = (iso) => {
  const normalized = String(iso || '').toUpperCase();
  return COUNTRY_NAME_OVERRIDES[normalized] || displayNames?.of(normalized) || normalized;
};

// Partial calling code map (extend as needed)
const CALLING_CODE_MAP = {
  SG: '+65',
  MY: '+60',
  ID: '+62',
  TH: '+66',
  VN: '+84',
  PH: '+63',
  IN: '+91',
  CN: '+86',
  KR: '+82',
  JP: '+81',
  US: '+1',
  GB: '+44',
  AU: '+61',
  CA: '+1',
};

/**
 * Full country list with optional dial code + flag
 */
export const COUNTRIES = REGION_CODES
  .map((iso) => ({
    iso,
    name: getCountryName(iso),
    code: CALLING_CODE_MAP[iso] || '',
    flag: isoToFlag(iso),
    emoji: isoToFlagEmoji(iso),
  }))
  .filter((c) => c.name && c.name !== c.iso)
  .sort((a, b) => a.name.localeCompare(b.name));

export const flagImageUrl = (iso, size = 20) => {
  if (!iso || String(iso).length !== 2) return '';
  return `https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${String(iso).toLowerCase()}.png`;
};

const COUNTRY_LOOKUP = new Map(
  COUNTRIES.flatMap((country) => [
    [country.iso.toLowerCase(), country.iso],
    [country.name.toLowerCase(), country.iso],
    [`${country.name}an`.toLowerCase(), country.iso],
  ])
);

/** Normalize free-text nationality/country into ISO code when possible */
export const normalizeNationalityToIso = (value) => {
  if (!value) return '';
  const normalized = String(value).trim().toLowerCase();
  return COUNTRY_LOOKUP.get(normalized) || '';
};

export const isSingaporeNationality = (value) => {
  if (!value) return false;
  const iso = normalizeNationalityToIso(value);
  if (iso) return iso === 'SG';

  const plain = String(value).trim().toLowerCase();
  return plain === 'singapore' || plain === 'singaporean' || plain.includes('singapore');
};

export const INTERNATIONAL_STUDENT_LINKS = [
  {
    title: 'Brief guide for international students',
    url: 'https://www.ntu.edu.sg/about-us/global/students/guide-for-international-students',
  },
  {
    title: "Student's Pass application",
    url: "https://www.ntu.edu.sg/life-at-ntu/student-life/student-services/onestop/student's-pass/application-of-student's-pass",
  },
  {
    title: 'For exchange students',
    url: 'https://www.ntu.edu.sg/education/student-exchanges',
  },
];
