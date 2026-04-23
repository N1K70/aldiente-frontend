'use client';

import React from 'react';
import { Glass, Icon, Button } from '@/components/ui';

interface Props {
  onClose: () => void;
}

export default function TermsModal({ onClose }: Props) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.4)', backdropFilter: 'blur(6px)', zIndex: 200 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201, padding: '0 0 env(safe-area-inset-bottom,0)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}>
        <Glass hi radius={0} style={{ borderRadius: '24px 24px 0 0', padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', maxHeight: '92dvh' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--ink-200)', margin: '0 auto 20px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em', margin: 0 }}>Términos y Condiciones</h2>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 99, background: 'rgba(10,22,40,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={18} color="var(--ink-500)" />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.6 }}>
            <p>Bienvenido a ALDIENTE. Al utilizar esta aplicación, aceptas los siguientes términos y condiciones.</p>
            <h3 style={{ fontWeight: 700, color: 'var(--ink-900)', marginTop: 20 }}>Uso del Servicio</h3>
            <p>La plataforma conecta pacientes con estudiantes de odontología para la provisión de servicios bajo supervisión docente certificada.</p>
            <h3 style={{ fontWeight: 700, color: 'var(--ink-900)', marginTop: 20 }}>Privacidad</h3>
            <p>Tratamos tus datos conforme a la Política de Privacidad. Revisa los detalles sobre almacenamiento, finalidades y tus derechos como titular.</p>
            <h3 style={{ fontWeight: 700, color: 'var(--ink-900)', marginTop: 20 }}>Responsabilidades</h3>
            <p>ALDIENTE no garantiza resultados clínicos específicos y actúa como intermediario tecnológico entre pacientes y estudiantes supervisados.</p>
            <h3 style={{ fontWeight: 700, color: 'var(--ink-900)', marginTop: 20 }}>Contacto</h3>
            <p>Para consultas legales, contáctanos en soporte@aldiente.cl</p>
            <p style={{ color: 'var(--ink-400)', fontSize: 12, marginTop: 24 }}>Última actualización: septiembre 2025</p>
          </div>

          <div style={{ paddingTop: 20, borderTop: '1px solid var(--ink-100)', marginTop: 12 }}>
            <Button size="lg" full onClick={onClose}>Entendido</Button>
          </div>
        </Glass>
      </div>
    </>
  );
}
