export class InvalidPublicationDateError extends Error {
  constructor() {
    super("Publication date must use YYYY, YYYY-MM, YYYY/MM, YYYY-MM-DD, or YYYY/MM/DD");
    this.name = "InvalidPublicationDateError";
  }
}

export function normalizePublicationDateInput(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})(?:([-\/])(\d{1,2})(?:\2(\d{1,2}))?)?$/);
  if (!match) throw new InvalidPublicationDateError();

  const year = Number(match[1]);
  const month = match[3] ? Number(match[3]) : null;
  const day = match[4] ? Number(match[4]) : null;
  if (year < 1000 || year > new Date().getFullYear() + 1) throw new InvalidPublicationDateError();
  if (month !== null && (month < 1 || month > 12)) throw new InvalidPublicationDateError();
  if (day !== null) {
    const daysInMonth = new Date(Date.UTC(year, month!, 0)).getUTCDate();
    if (day < 1 || day > daysInMonth) throw new InvalidPublicationDateError();
  }

  if (month === null) return String(year);
  const separator = match[2];
  const normalizedMonth = String(month).padStart(2, "0");
  return day === null
    ? `${year}${separator}${normalizedMonth}`
    : `${year}${separator}${normalizedMonth}${separator}${String(day).padStart(2, "0")}`;
}

export function publicationYear(value: string | null | undefined): number | null {
  const match = value?.match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}
