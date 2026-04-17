import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS!;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD!;
const SMTP_SERVER = process.env.SMTP_SERVER || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const MAIL_SENDER = process.env.MAIL_SENDER || EMAIL_ADDRESS;
const MAIL_RECIPIENT = process.env.MAIL_RECIPIENT || "haylandsebastian5@gmail.com";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, empresa, telefono, email, mensaje } = body;

    if (!nombre || !telefono || !email || !mensaje) {
      return NextResponse.json({ success: false, message: "Campos requeridos faltantes" }, { status: 400 });
    }

    const empresaNombre = empresa || "No especificada";
    const currentYear = new Date().getFullYear();

    const transporter = nodemailer.createTransport({
      host: SMTP_SERVER,
      port: SMTP_PORT,
      secure: false,
      auth: { user: EMAIL_ADDRESS, pass: EMAIL_PASSWORD },
    });

    await transporter.sendMail({
      from: MAIL_SENDER,
      to: MAIL_RECIPIENT,
      subject: `Nueva consulta web - ${nombre}`,
      text: `Nueva consulta recibida (EFICORP ACCOUNTING)\n\nNombre: ${nombre}\nEmpresa: ${empresaNombre}\nTelefono: ${telefono}\nEmail: ${email}\nMensaje: ${mensaje}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:40px auto;background-color:#ffffff;border-radius:16px;box-shadow:0 8px 24px rgba(15,23,42,0.12);overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:36px 24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:30px;font-weight:800;">EFICORP ACCOUNTING</h1>
        <p style="color:#10b981;margin:10px 0 0 0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;">Gestion contable y empresarial</p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 36px 10px 36px;text-align:center;">
        <h2 style="color:#065f46;font-size:18px;font-weight:700;">Nueva consulta web</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6;">Has recibido un nuevo mensaje a traves del formulario de contacto.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 36px 28px 36px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="34%" style="background-color:#f8fafc;padding:14px;border:1px solid #e2e8f0;font-weight:600;color:#475569;font-size:13px;">Nombre</td>
            <td style="padding:14px;border:1px solid #e2e8f0;color:#0f172a;font-weight:600;font-size:15px;">${nombre}</td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:14px;border:1px solid #e2e8f0;font-weight:600;color:#475569;font-size:13px;">Empresa</td>
            <td style="padding:14px;border:1px solid #e2e8f0;color:#0f172a;font-size:14px;">${empresaNombre}</td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:14px;border:1px solid #e2e8f0;font-weight:600;color:#475569;font-size:13px;">Telefono</td>
            <td style="padding:14px;border:1px solid #e2e8f0;color:#0f172a;font-size:14px;">${telefono}</td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:14px;border:1px solid #e2e8f0;font-weight:600;color:#475569;font-size:13px;">Email</td>
            <td style="padding:14px;border:1px solid #e2e8f0;color:#1e3a8a;font-size:14px;">${email}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:18px;">
              <p style="margin:0 0 8px 0;font-weight:600;color:#475569;font-size:13px;">Mensaje</p>
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;color:#334155;font-size:14px;line-height:1.6;">${mensaje}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color:#f8fafc;padding:22px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0 0 8px 0;">Mensaje enviado desde el sitio web de EFICORP ACCOUNTING.</p>
        <p style="color:#94a3b8;font-size:12px;margin:0;">&copy; ${currentYear} EFICORP ACCOUNTING. Todos los derechos reservados.</p>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    return NextResponse.json({ success: true, message: "Correo enviado correctamente" });
  } catch (error) {
    console.error("Error al enviar correo:", error);
    return NextResponse.json({ success: false, message: "No se pudo enviar el correo" }, { status: 500 });
  }
}
