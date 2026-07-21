import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Ngunga <onboarding@resend.dev>";

interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  locale: "pt" | "fr";
  userName: string;
}

const emailCopy = {
  pt: {
    subject: "Redefinir a sua palavra-passe — Ngunga",
    greeting: (name: string) => `Olá, ${name},`,
    body: "Recebemos um pedido para redefinir a palavra-passe da sua conta Ngunga. Clique no botão abaixo para criar uma nova palavra-passe.",
    button: "Redefinir palavra-passe",
    expiry: "Este link expira em 1 hora.",
    ignore: "Se não foi você quem pediu isto, pode ignorar este e-mail com segurança — a sua palavra-passe actual continua válida.",
  },
  fr: {
    subject: "Réinitialiser votre mot de passe — Ngunga",
    greeting: (name: string) => `Bonjour ${name},`,
    body: "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Ngunga. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.",
    button: "Réinitialiser le mot de passe",
    expiry: "Ce lien expire dans 1 heure.",
    ignore: "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité — votre mot de passe actuel reste valide.",
  },
};

export async function sendPasswordResetEmail({ to, resetUrl, locale, userName }: SendPasswordResetEmailParams) {
  const copy = emailCopy[locale] ?? emailCopy.pt;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #7c3aed; font-size: 20px;">Ngunga</h1>
      <p>${copy.greeting(userName)}</p>
      <p>${copy.body}</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          ${copy.button}
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">${copy.expiry}</p>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">${copy.ignore}</p>
    </div>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: copy.subject,
    html,
  });
}