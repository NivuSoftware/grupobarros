import nodemailer from 'nodemailer'

const SMTP_SERVER = process.env.SMTP_SERVER || 'localhost'
const SMTP_PORT = Number(process.env.SMTP_PORT) || 1025
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS || ''
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || ''
const MAIL_SENDER = process.env.MAIL_SENDER || EMAIL_ADDRESS || 'Grupo Barros <no-reply@grupobarros.local>'

const shouldUseAuth = EMAIL_ADDRESS.trim() !== '' && EMAIL_PASSWORD.trim() !== ''

const transporter = nodemailer.createTransport({
  host: SMTP_SERVER,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  ...(shouldUseAuth ? { auth: { user: EMAIL_ADDRESS, pass: EMAIL_PASSWORD } } : {}),
})

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function sendMail({
  to,
  subject,
  text,
  html,
  from = MAIL_SENDER,
}: {
  to: string
  subject: string
  text: string
  html: string
  from?: string
}) {
  return transporter.sendMail({ from, to, subject, text, html })
}

export async function sendTransferenciaPendienteEmail({
  to,
  nombre,
  sorteoNombre,
  cantidadBoletos,
  compraId,
}: {
  to: string
  nombre: string
  sorteoNombre: string
  cantidadBoletos: number
  compraId: string
}) {
  const currentYear = new Date().getFullYear()
  return sendMail({
    to,
    subject: `Compra en revisión - Grupo Barros`,
    text: [
      `Hola ${nombre},`,
      '',
      `Recibimos tu compra de ${cantidadBoletos} boletos para ${sorteoNombre}.`,
      `Tu comprobante de transferencia está siendo revisado por nuestro equipo.`,
      `Una vez validado, recibirás tus números asignados por correo electrónico.`,
      '',
      `ID de tu compra: ${compraId}`,
      '',
      'Gracias por participar con Grupo Barros.',
    ].join('\n'),
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#080808;font-family:Arial,Helvetica,sans-serif;color:#f8f3df;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:32px auto;background-color:#111111;border:1px solid #6f5520;border-radius:14px;overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg,#cda33a,#f4d469,#9c741d);padding:30px 24px;text-align:center;color:#090909;">
        <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.08em;">GRUPO BARROS</h1>
        <p style="margin:8px 0 0 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;">Comprobante en revisión</p>
      </td>
    </tr>
    <tr>
      <td style="padding:30px 28px;">
        <h2 style="margin:0;color:#f4d469;font-size:22px;">Hola ${escapeHtml(nombre)}</h2>
        <p style="margin:14px 0 0 0;color:#d7d0ba;font-size:15px;line-height:1.7;">
          Recibimos tu solicitud de compra de <strong style="color:#f4d469;">${cantidadBoletos}</strong> boletos para <strong>${escapeHtml(sorteoNombre)}</strong>.
        </p>
        <div style="margin-top:24px;padding:20px;border:1px solid #6f5520;border-radius:10px;background-color:#0b0b0b;text-align:center;">
          <p style="margin:0 0 8px 0;color:#a9a08d;font-size:12px;text-transform:uppercase;letter-spacing:0.16em;">Estado de tu compra</p>
          <p style="margin:0;font-size:22px;font-weight:900;color:#f4d469;">&#9203; En revisión</p>
          <p style="margin:12px 0 0 0;color:#d7d0ba;font-size:13px;line-height:1.6;">
            Estamos verificando tu comprobante de transferencia bancaria.<br>
            Cuando sea aprobado, recibirás otro correo con tus números asignados.
          </p>
        </div>
        <div style="margin-top:20px;padding:14px 18px;border:1px solid #2a2416;border-radius:8px;background-color:#0b0b0b;">
          <p style="margin:0 0 4px 0;color:#a9a08d;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;">ID de tu compra</p>
          <p style="margin:0;color:#f8f3df;font-family:Menlo,Consolas,monospace;font-size:12px;word-break:break-all;">${escapeHtml(compraId)}</p>
        </div>
        <p style="margin:22px 0 0 0;color:#a9a08d;font-size:13px;line-height:1.6;">
          Si tienes dudas, conserva este correo y el ID de tu compra como referencia.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 24px;text-align:center;border-top:1px solid #2a2416;color:#8f8878;font-size:12px;">
        &copy; ${currentYear} Grupo Barros. Todos los derechos reservados.
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}

export async function sendPurchaseConfirmationEmail({
  to,
  nombre,
  sorteoNombre,
  cantidadBoletos,
  boletos,
}: {
  to: string
  nombre: string
  sorteoNombre: string
  cantidadBoletos: number
  boletos: {
    id: string
    numero: number
    tiene_numero_especial?: boolean
  }[]
}) {
  const boletosOrdenados = [...boletos].sort((a, b) => a.numero - b.numero)
  const numerosTexto = boletosOrdenados.map((b) => String(b.numero).padStart(4, '0')).join(', ')
  const boletosTexto = boletosOrdenados
    .map((b) => `Numero ${String(b.numero).padStart(4, '0')} - Código único del boleto: ${b.id}`)
    .join('\n')
  const boletosHtml = boletosOrdenados
    .map((boleto) => {
      const numero = String(boleto.numero).padStart(4, '0')
      const especial = boleto.tiene_numero_especial
        ? '<span style="display:inline-block;margin-top:8px;padding:4px 8px;border-radius:999px;background-color:#f4d469;color:#090909;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;">Numero especial</span>'
        : ''

      return `
        <tr>
          <td style="padding:0 0 14px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0;background:#0b0b0b;border:1px solid #6f5520;border-radius:14px;overflow:hidden;">
              <tr>
                <td width="34%" style="padding:18px;text-align:center;background:linear-gradient(135deg,#cda33a,#f4d469,#9c741d);color:#090909;">
                  <p style="margin:0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em;">Boleto</p>
                  <p style="margin:8px 0 0 0;font-size:34px;line-height:1;font-weight:900;letter-spacing:0.08em;">${escapeHtml(numero)}</p>
                  ${especial}
                </td>
                <td style="padding:18px;">
                  <p style="margin:0 0 8px 0;color:#a9a08d;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;">Código único para reclamar premio</p>
                  <p style="margin:0;color:#f8f3df;font-family:Menlo,Consolas,monospace;font-size:14px;line-height:1.5;word-break:break-all;">${escapeHtml(boleto.id)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    })
    .join('')
  const currentYear = new Date().getFullYear()

  return sendMail({
    to,
    subject: `Tus boletos de Grupo Barros - ${sorteoNombre}`,
    text: [
      `Hola ${nombre},`,
      '',
      `Tu compra de ${cantidadBoletos} boletos para ${sorteoNombre} fue registrada correctamente.`,
      `Tus numeros asignados son: ${numerosTexto}`,
      '',
      'Códigos únicos de cada boleto para reclamar premios:',
      boletosTexto,
      '',
      'Gracias por participar con Grupo Barros.',
    ].join('\n'),
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#080808;font-family:Arial,Helvetica,sans-serif;color:#f8f3df;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:32px auto;background-color:#111111;border:1px solid #6f5520;border-radius:14px;overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg,#cda33a,#f4d469,#9c741d);padding:30px 24px;text-align:center;color:#090909;">
        <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.08em;">GRUPO BARROS</h1>
        <p style="margin:8px 0 0 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;">Compra confirmada</p>
      </td>
    </tr>
    <tr>
      <td style="padding:30px 28px;">
        <h2 style="margin:0;color:#f4d469;font-size:22px;">Hola ${escapeHtml(nombre)}</h2>
        <p style="margin:14px 0 0 0;color:#d7d0ba;font-size:15px;line-height:1.7;">
          Tu compra de <strong style="color:#f4d469;">${cantidadBoletos}</strong> boletos para <strong>${escapeHtml(sorteoNombre)}</strong> fue registrada correctamente.
        </p>
        <div style="margin-top:24px;padding:18px;border:1px solid #6f5520;border-radius:10px;background-color:#0b0b0b;">
          <p style="margin:0 0 12px 0;color:#a9a08d;font-size:12px;text-transform:uppercase;letter-spacing:0.16em;">Numeros asignados</p>
          <p style="margin:0;color:#f4d469;font-size:20px;font-weight:800;line-height:1.7;">${escapeHtml(numerosTexto)}</p>
        </div>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
          <tr>
            <td style="padding:0 0 12px 0;">
              <p style="margin:0;color:#a9a08d;font-size:12px;text-transform:uppercase;letter-spacing:0.16em;">Boletos:</p>
            </td>
          </tr>
          ${boletosHtml}
        </table>
        <p style="margin:22px 0 0 0;color:#a9a08d;font-size:13px;line-height:1.6;">
          Conserva este correo. El código único de cada boleto sirve para verificar y reclamar premios.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 24px;text-align:center;border-top:1px solid #2a2416;color:#8f8878;font-size:12px;">
        &copy; ${currentYear} Grupo Barros. Todos los derechos reservados.
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}
