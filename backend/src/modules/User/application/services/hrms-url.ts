import { ServiceUnavailableException } from '@nestjs/common';

export function hrmsActionUrl(path: string, token: string) {
  const configured = process.env.APP_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
  let url: URL;
  try { url = new URL(configured); }
  catch { throw new ServiceUnavailableException('APP_URL must be configured as a valid public URL'); }
  if ((process.env.NODE_ENV === 'production' && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash) {
    throw new ServiceUnavailableException('APP_URL must be a secure public base URL');
  }
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`;
  url.hash = `token=${encodeURIComponent(token)}`;
  return url.toString();
}
