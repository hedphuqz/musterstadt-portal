/**
 * Validation utilities conforming to Bürgerportal Musterstadt business rules
 * documented in architecture.md (§4).
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateRequired(value: string | undefined | null, fieldName: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} ist ein Pflichtfeld.`;
  }
  return null;
}

export function validateVehicleRegistration(v: string): string | null {
  const t = v.trim(), n = t.length;
  return !n ? 'Bitte geben Sie ein Fahrzeugkennzeichen ein.'
    : n < 5 ? 'Das Fahrzeugkennzeichen muss mindestens 5 Zeichen lang sein.'
    : n > 20 ? 'Das Fahrzeugkennzeichen darf maximal 20 Zeichen lang sein.'
    : null;
}

export function normalizeVehicleRegistration(val: string): string {
  return val.trim().toUpperCase();
}

export function validateZone(val: string): string | null {
  if (!val || val.trim().length === 0) {
    return 'Bitte wählen Sie eine Parkzone aus.';
  }
  return null;
}

export function validatePostcode(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) {
    return 'Bitte geben Sie eine Postleitzahl ein.';
  }
  if (!/^\d{5}$/.test(trimmed)) {
    return 'Die Postleitzahl muss genau 5 Ziffern enthalten (z. B. 80331).';
  }
  return null;
}

export function validateDogName(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) {
    return 'Bitte geben Sie den Namen des Hundes ein.';
  }
  if (trimmed.length > 100) {
    return 'Der Name darf maximal 100 Zeichen lang sein.';
  }
  return null;
}

export function validateChipNumber(val?: string): string | null {
  if (!val || val.trim().length === 0) {
    return null; // optional
  }
  const trimmed = val.trim();
  if (!/^\d{15}$/.test(trimmed)) {
    return 'Die Chip-Nummer muss genau 15 Ziffern umfassen (ISO 11784 Standard).';
  }
  return null;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}
