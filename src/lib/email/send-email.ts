import nodemailer from 'nodemailer'

type SendEmailParams = {
  to?: string | string[]
  bcc?: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, bcc, subject, html, text }: SendEmailParams) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const from = process.env.EMAIL_FROM ?? process.env.SMTP_USER

  const toField = to
    ? Array.isArray(to) ? to : [to]
    : undefined

  const bccField = bcc
    ? Array.isArray(bcc) ? bcc : [bcc]
    : undefined

  if (!toField && !bccField) throw new Error('sendEmail: se requiere al menos "to" o "bcc"')

  await transporter.sendMail({
    from,
    to: toField,
    bcc: bccField,
    subject,
    html,
    text,
  })
}
