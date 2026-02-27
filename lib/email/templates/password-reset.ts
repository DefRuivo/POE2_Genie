import { translations } from '@/lib/translations';
import { baseTemplate } from './base-template';
import { escapeHtml } from '../utils/html-escape';

export const passwordResetEmailTemplate = (resetUrl: string, language: string = 'en') => {
  // Normalize language
  let langKey = language;
  if (language.toLowerCase().startsWith('pt')) {
    langKey = 'pt-BR';
  }

  const t = (translations[langKey as keyof typeof translations] || translations['en']).email.passwordReset;

  const safeResetUrl = escapeHtml(resetUrl);
  const content = `
    <h2>${t.heading}</h2>
    <p>${t.message}</p>
    <div style="text-align: center;">
      <a href="${safeResetUrl}" class="button">${t.button}</a>
    </div>
    <p style="margin-top: 30px; font-size: 14px; color: #718096;">
      ${t.backupAction}<br>
      <a href="${safeResetUrl}" class="link-text">${safeResetUrl}</a>
    </p>
    <p style="font-size: 14px; color: #718096; margin-top: 20px;">
      ${t.expiryMessage}
    </p>
  `;

  return baseTemplate(content, t.subject);
};
