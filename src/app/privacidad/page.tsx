import Link from 'next/link';
import { Wordmark } from '@/components/brand';

const sections = [
  {
    title: 'Finalidad',
    content: 'ALDIENTE usa las respuestas del cuestionario de investigación para validar el piloto, entender barreras de acceso y contactar a quienes acepten conversar. No crea una cuenta, ficha clínica ni reserva a partir de este formulario.',
  },
  {
    title: 'Datos que tratamos',
    content: 'Solicitamos datos de contacto, ciudad y respuestas de investigación. Para pacientes, la respuesta sobre necesidad de atención dental puede constituir información sensible; se solicita autorización expresa y se evita pedir diagnósticos, exámenes o antecedentes clínicos.',
  },
  {
    title: 'Almacenamiento y acceso',
    content: 'Los leads se guardan en la base de datos PostgreSQL de Supabase. La tabla no está disponible para consultas públicas. Solo personal autorizado de ALDIENTE con necesidad de realizar investigación o seguimiento comercial puede acceder a la vista administrativa protegida.',
  },
  {
    title: 'Plazo de conservación',
    content: 'Conservamos los datos por un máximo de 90 días para la finalidad descrita y luego los eliminamos. Podemos conservar información agregada y no identificable para medir la investigación.',
  },
  {
    title: 'Tus derechos',
    content: 'Puedes solicitar información, rectificación, eliminación, oposición o portabilidad de tus datos, según corresponda. Escríbenos a hola@aldiente.cl con el asunto “Privacidad cuestionario”. Verificaremos tu identidad antes de responder una solicitud.',
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-aurora)', color: 'var(--ink-900)', padding: '20px 24px 64px' }}>
      <header style={{ maxWidth: 760, margin: '0 auto 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <Link href="/landing" aria-label="Volver a ALDIENTE" style={{ textDecoration: 'none' }}><Wordmark size={20} /></Link>
        <Link href="/interes" style={{ color: 'var(--ink-600)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Volver al cuestionario</Link>
      </header>

      <article style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ color: 'var(--brand-700)', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>ALDIENTE · Investigación de mercado</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 6vw, 50px)', lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 16px' }}>Información de privacidad</h1>
        <p style={{ color: 'var(--ink-600)', fontSize: 17, lineHeight: 1.55, margin: '0 0 38px' }}>Versión 1.0 · Vigente desde el 1 de septiembre de 2026.</p>

        <div style={{ display: 'grid', gap: 30 }}>
          {sections.map(section => (
            <section key={section.title}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.15, margin: '0 0 8px' }}>{section.title}</h2>
              <p style={{ color: 'var(--ink-700)', fontSize: 16, lineHeight: 1.6, margin: 0 }}>{section.content}</p>
            </section>
          ))}
        </div>

        <p style={{ borderTop: '1px solid var(--ink-200)', color: 'var(--ink-500)', fontSize: 14, lineHeight: 1.5, margin: '44px 0 0', paddingTop: 20 }}>Esta información operacional debe ser revisada y aprobada por asesoría jurídica antes de ampliar el piloto o tratar nuevas categorías de datos.</p>
      </article>
    </main>
  );
}
