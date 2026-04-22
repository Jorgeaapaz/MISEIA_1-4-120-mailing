import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAILHOG_HOST || 'localhost',
  port: Number(process.env.MAIL_PORT) || 1027,
  secure: false,
  ignoreTLS: true,
})

export interface MailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendMail(options: MailOptions): Promise<void> {
  await transporter.sendMail({
    from: options.from || process.env.MAIL_FROM || 'noreply@mailing.local',
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}
