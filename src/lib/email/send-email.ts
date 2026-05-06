import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

type SendEmailParams = {
  to?: string | string[]
  bcc?: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, bcc, subject, html, text }: SendEmailParams) {
  const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER

  // Si no se indica 'to', el campo se autoasigna al remitente.
  // Esto permite envíos BCC puros donde ningún destinatario ve a los demás.
  const toField = to
    ? Array.isArray(to) ? to : [to]
    : [from!]

  const bccField = bcc
    ? Array.isArray(bcc) ? bcc : [bcc]
    : undefined

  await transporter.sendMail({
    from,
    to: toField,
    bcc: bccField,
    subject,
    html,
    text,
  })
}
