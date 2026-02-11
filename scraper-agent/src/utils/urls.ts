
export const CLIENT_URL = process.env.CLIENT_URL || 'https://siteo.io';

export const buildWebsiteUrl = (slug: string) => `${CLIENT_URL}/w/${slug}`;
export const buildAdminUrl = (slug: string) => `${CLIENT_URL}/w/${slug}/admin`;
export const buildResetPasswordUrl = (slug: string, token: string) => `${CLIENT_URL}/w/${slug}/admin/reset-password?token=${token}`;
