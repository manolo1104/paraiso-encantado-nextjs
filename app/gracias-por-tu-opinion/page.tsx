import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Gracias por tu opinión — Paraíso Encantado' };

const STARS = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];
const MESSAGES: Record<number, { title: string; sub: string }> = {
  1: { title: 'Gracias por contarnos.', sub: 'Lamentamos no haber cumplido tus expectativas. Tu opinión nos ayuda a mejorar.' },
  2: { title: 'Apreciamos tu honestidad.', sub: 'Sabemos que podemos hacer mejor las cosas y tomaremos tu calificación muy en serio.' },
  3: { title: 'Gracias por tu calificación.', sub: 'Seguiremos trabajando para ofrecerte una experiencia todavía más memorable.' },
  4: { title: '¡Qué bueno que disfrutaste tu estancia!', sub: 'Nos alegra saber que fue una buena experiencia. Nos vemos pronto. 🌿' },
  5: { title: '¡Nos alegra mucho saberlo!', sub: '5 estrellas nos llenan de energía para seguir creando momentos mágicos. ¡Gracias!' },
};

export default async function GraciasPorTuOpinion({
  searchParams,
}: {
  searchParams: Promise<{ conf?: string; rating?: string }>;
}) {
  const params = await searchParams;
  const rating = Math.min(5, Math.max(0, parseInt(params.rating || '5')));
  const conf   = params.conf || '';
  const msg    = MESSAGES[rating] || MESSAGES[5];

  return (
    <main style={{
      minHeight: '100vh', background: '#f0ebe3',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif",
    }}>
      <div style={{
        maxWidth: 540, width: '100%', background: '#faf8f5',
        padding: '60px 48px', textAlign: 'center',
      }}>
        {/* Logo / Brand */}
        <p style={{
          fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase',
          color: '#8a7d6b', marginBottom: 32,
        }}>
          Paraíso Encantado · Xilitla
        </p>

        {/* Stars */}
        {rating > 0 && (
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 36, color: '#c9a97a', marginBottom: 24, lineHeight: 1,
          }}>
            {STARS[rating]}
          </p>
        )}

        {/* Title */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 32, fontWeight: 300, fontStyle: 'italic',
          color: '#2a2218', marginBottom: 16, lineHeight: 1.2,
        }}>
          {msg.title}
        </h1>

        <p style={{ fontSize: 15, color: '#4a3f30', lineHeight: 1.8, marginBottom: 40 }}>
          {msg.sub}
        </p>

        {/* Optional comment form */}
        <form
          id="comment-form"
          style={{ textAlign: 'left', marginBottom: 40 }}
          onSubmit={undefined}
        >
          <label style={{
            display: 'block', fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase',
            color: '#9a8a74', marginBottom: 10,
          }}>
            ¿Quieres añadir algún comentario? (opcional)
          </label>
          <textarea
            name="comment"
            rows={4}
            placeholder="Cuéntanos más sobre tu experiencia…"
            style={{
              width: '100%', padding: '12px 14px', border: '1px solid #d4cec7',
              background: '#fff', fontFamily: "'Jost', sans-serif", fontSize: 14,
              color: '#2a2218', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            style={{
              marginTop: 12, background: '#2a2218', color: '#faf8f5', border: 'none',
              padding: '12px 28px', fontFamily: "'Jost', sans-serif",
              fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Enviar comentario
          </button>
          {/* Client-side submit — inline script for minimal JS */}
          <script dangerouslySetInnerHTML={{ __html: `
            document.getElementById('comment-form').addEventListener('submit', async function(e) {
              e.preventDefault();
              const comment = e.target.comment.value.trim();
              if (!comment) return;
              try {
                await fetch('/api/feedback', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ conf: '${conf}', rating: ${rating}, comment })
                });
                e.target.comment.value = '';
                document.getElementById('comment-thanks').style.display = 'block';
              } catch {}
            });
          ` }} />
          <p id="comment-thanks" style={{ display: 'none', marginTop: 12, color: '#2d7a34', fontSize: 13 }}>
            ✓ Comentario enviado. ¡Gracias!
          </p>
        </form>

        {/* Divider */}
        <div style={{ height: 1, background: '#e4ddd3', marginBottom: 32 }} />

        {/* Back to site */}
        <a
          href="https://www.paraisoencantado.com"
          style={{
            fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase',
            color: '#8a7d6b', textDecoration: 'none', borderBottom: '1px solid #c9b99a',
            paddingBottom: 2,
          }}
        >
          Volver al sitio
        </a>
      </div>
    </main>
  );
}
