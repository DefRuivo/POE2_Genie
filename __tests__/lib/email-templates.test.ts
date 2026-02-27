import { invitationEmailTemplate } from '@/lib/email/templates/invitation';
import { verificationEmailTemplate } from '@/lib/email/templates/verification';
import { kitchenJoinRequestTemplate } from '@/lib/email/templates/kitchen-join-request';

describe('email templates coverage', () => {
  it('renders invitation template for existing users without invite code section', () => {
    const html = invitationEmailTemplate(
      'Alice <script>',
      'Atlas & Co',
      undefined,
      'https://example.com/join?x=1&y=2',
      'Open',
      true,
    );

    expect(html).toContain("You've been added to a hideout");
    expect(html).toContain('Alice &lt;script&gt;');
    expect(html).toContain('Atlas &amp; Co');
    expect(html).not.toContain('Your Hideout Code');
    expect(html).toContain('https://example.com/join?x=1&amp;y=2');
  });

  it('renders invitation template for new users with invite code section', () => {
    const html = invitationEmailTemplate(
      'Bob',
      'Hideout',
      'ABC123',
      'https://example.com/register',
      'Create Account',
      false,
    );

    expect(html).toContain("You've been invited to a hideout");
    expect(html).toContain('Your Hideout Code');
    expect(html).toContain('ABC123');
    expect(html).toContain('Create Account');
  });

  it('renders verification template in EN and PT-BR', () => {
    const enHtml = verificationEmailTemplate('https://example.com/verify?t=abc', 'en');
    const ptHtml = verificationEmailTemplate('https://example.com/verify?t=abc', 'pt-BR');

    expect(enHtml).toContain('Verify your email address');
    expect(enHtml).toContain('Welcome to POE2 Genie!');
    expect(enHtml).toContain('Verify Email Address');
    expect(enHtml).toContain("If you did not sign up for POE2 Genie, please ignore this email.");

    expect(ptHtml).toContain('Verifique seu endereço de email');
    expect(ptHtml).toContain('Bem-vindo ao POE2 Genie!');
    expect(ptHtml).toContain('Verificar Email');
    expect(ptHtml).toContain('Se você não se cadastrou no POE2 Genie, ignore este email.');
  });

  it('renders kitchen join request template with escaped values', () => {
    const html = kitchenJoinRequestTemplate(
      'Carol <b>',
      'Guild & Friends',
      'https://example.com/app?next=<script>',
    );

    expect(html).toContain('Hideout Join Request');
    expect(html).toContain('Carol &lt;b&gt;');
    expect(html).toContain('Guild &amp; Friends');
    expect(html).toContain('https://example.com/app?next=&lt;script&gt;');
  });
});
