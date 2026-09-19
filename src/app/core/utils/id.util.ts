export const generateId = (prefix: string): string => `${prefix}-${crypto.randomUUID()}`;

export const slugify = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
