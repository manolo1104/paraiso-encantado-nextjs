import { NextRequest, NextResponse } from 'next/server';

// TODO: Integrar SendGrid o Nodemailer
// npm install @sendgrid/mail

interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  type?: 'reservation' | 'inquiry' | 'complaint' | 'other';
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactRequest = await request.json();

    // Validaciones
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // TODO: Enviar email con SendGrid
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    //
    // const msg = {
    //   to: process.env.EMAIL_TO_ADMIN,
    //   from: process.env.EMAIL_FROM,
    //   replyTo: body.email,
    //   subject: `Nuevo mensaje: ${body.subject}`,
    //   html: `
    //     <h2>Nuevo mensaje de contacto</h2>
    //     <p><strong>Nombre:</strong> ${body.name}</p>
    //     <p><strong>Email:</strong> ${body.email}</p>
    //     <p><strong>Teléfono:</strong> ${body.phone}</p>
    //     <p><strong>Tipo:</strong> ${body.type || 'general'}</p>
    //     <p><strong>Mensaje:</strong></p>
    //     <p>${body.message.replace(/\n/g, '<br>')}</p>
    //   `,
    // };
    //
    // await sgMail.send(msg);

    // TODO: Guardar en base de datos o Google Sheets

    // Respuesta simulada
    return NextResponse.json(
      {
        success: true,
        message: 'Mensaje recibido. Te contactaremos pronto.',
        id: `MSG-${Date.now()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/contact:', error);
    return NextResponse.json(
      { error: 'Error al enviar el mensaje' },
      { status: 500 }
    );
  }
}
