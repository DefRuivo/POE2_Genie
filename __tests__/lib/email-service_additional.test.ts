jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('email-service additional coverage', () => {
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'id-1' });
    const nodemailer = require('nodemailer');
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSendMail });

    process.env.SMTP_PASSWORD = 'secret';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.SMTP_EMAIL_FROM = 'no-reply@poe.gg';
    process.env.SMTP_EMAIL_FROM_NAME = 'POE2 Genie';
  });

  afterEach(() => {
    delete process.env.SMTP_PASSWORD;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.SMTP_EMAIL_FROM;
    delete process.env.SMTP_EMAIL_FROM_NAME;
    jest.restoreAllMocks();
  });

  it('sendKitchenJoinRequestEmail sends notification and handles transporter errors', async () => {
    const svc = require('@/lib/email-service');

    await svc.sendKitchenJoinRequestEmail('admin@poe.gg', 'Ranger', 'Atlas HQ');

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'admin@poe.gg',
      subject: 'Ranger wants to join Atlas HQ hideout',
    }));

    mockSendMail.mockRejectedValueOnce(new Error('smtp'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await svc.sendKitchenJoinRequestEmail('admin@poe.gg', 'Ranger', 'Atlas HQ');
    expect(errorSpy).toHaveBeenCalledWith('[Email Service] Error sending email:', expect.any(Error));
  });

  it('sendKitchenJoinRequestEmail skips when SMTP_PASSWORD is missing', async () => {
    const svc = require('@/lib/email-service');
    delete process.env.SMTP_PASSWORD;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await svc.sendKitchenJoinRequestEmail('admin@poe.gg', 'Ranger', 'Atlas HQ');

    expect(mockSendMail).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('[Email Service] SMTP_PASSWORD not set. Skipping email send.');
  });

  it('sendVerificationEmail supports language variants and error branch', async () => {
    const svc = require('@/lib/email-service');

    await svc.sendVerificationEmail('user@poe.gg', 'token-1', 'pt-BR');
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@poe.gg',
      subject: 'Verifique seu endereço de email',
      from: '"POE2 Genie" <no-reply@poe.gg>',
    }));

    mockSendMail.mockRejectedValueOnce(new Error('smtp'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await svc.sendVerificationEmail('user@poe.gg', 'token-2', 'en');
    expect(errorSpy).toHaveBeenCalledWith('[Email Service] Error sending verification email:', expect.any(Error));
  });

  it('sendInvitationEmail supports existing/new users and catches send errors', async () => {
    const svc = require('@/lib/email-service');

    await svc.sendInvitationEmail('member@poe.gg', 'Ranger', 'Atlas HQ', 'CODE1', true);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'member@poe.gg',
      subject: 'You have been added to Atlas HQ',
      text: expect.stringContaining('/login'),
    }));

    await svc.sendInvitationEmail('new@poe.gg', 'Ranger', 'Atlas HQ', 'CODE1', false);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'new@poe.gg',
      subject: 'You have been invited to join Atlas HQ hideout',
      text: expect.stringContaining('/register?email='),
    }));

    mockSendMail.mockRejectedValueOnce(new Error('smtp'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await svc.sendInvitationEmail('new@poe.gg', 'Ranger', 'Atlas HQ', 'CODE1', false);
    expect(errorSpy).toHaveBeenCalledWith('[Email Service] Error sending invitation email:', expect.any(Error));
  });

  it('sendPasswordChangedEmail handles fallback language and send failures', async () => {
    const svc = require('@/lib/email-service');

    await svc.sendPasswordChangedEmail('user@poe.gg', 'Ranger', 'es-ES');
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@poe.gg',
      subject: 'Security Alert: Password Changed',
    }));

    mockSendMail.mockRejectedValueOnce(new Error('smtp'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await svc.sendPasswordChangedEmail('user@poe.gg', 'Ranger', 'en');
    expect(errorSpy).toHaveBeenCalledWith('[Email Service] Error sending password changed email:', expect.any(Error));
  });

  it('sendPasswordResetEmail skips when SMTP_PASSWORD missing and handles send errors', async () => {
    const svc = require('@/lib/email-service');

    delete process.env.SMTP_PASSWORD;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await svc.sendPasswordResetEmail('user@poe.gg', 'Ranger', 'token-3', 'en');
    expect(warnSpy).toHaveBeenCalledWith('[Email Service] SMTP_PASSWORD not set. Skipping password reset email.');

    process.env.SMTP_PASSWORD = 'secret';
    mockSendMail.mockRejectedValueOnce(new Error('smtp'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await svc.sendPasswordResetEmail('user@poe.gg', 'Ranger', 'token-4', 'pt');
    expect(errorSpy).toHaveBeenCalledWith('[Email Service] Error sending password reset email:', expect.any(Error));
  });
});
