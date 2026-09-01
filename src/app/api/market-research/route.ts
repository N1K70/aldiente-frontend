import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const PERSONAS = ['patient', 'student', 'university'] as const;
const MAX_FIELD_LENGTH = 2_000;

type Persona = (typeof PERSONAS)[number];
type Input = Record<string, unknown>;

function stringValue(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function optionalString(value: unknown, maxLength?: number) {
  const normalized = stringValue(value, maxLength);
  return normalized || undefined;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPersona(value: unknown): value is Persona {
  return typeof value === 'string' && PERSONAS.includes(value as Persona);
}

function referrerOrigin(value: string | null) {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function validationError(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  let body: Input;

  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return validationError('La respuesta no tiene un formato válido.');
    }
    body = parsed as Input;
  } catch {
    return validationError('No pudimos leer tus respuestas.');
  }

  // Honeypot: acknowledge automated submissions without forwarding their content.
  if (stringValue(body.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const persona = body.persona;
  const name = stringValue(body.name, 120);
  const email = stringValue(body.email, 254).toLowerCase();
  const consent = body.consent === true;

  if (!isPersona(persona)) return validationError('Selecciona cómo te relacionas con este tema.');
  if (name.length < 2) return validationError('Ingresa tu nombre para poder contactarte.');
  if (!isEmail(email)) return validationError('Ingresa un correo electrónico válido.');
  if (!consent) return validationError('Necesitamos tu autorización para usar estos datos de contacto.');

  const details = {
    city: optionalString(body.city, 120),
    phone: optionalString(body.phone, 40),
    treatmentNeed: optionalString(body.treatmentNeed, 120),
    currentChallenge: optionalString(body.currentChallenge, 120),
    availability: optionalString(body.availability, 120),
    university: optionalString(body.university, 180),
    clinicalStage: optionalString(body.clinicalStage, 120),
    patientAcquisition: optionalString(body.patientAcquisition, 120),
    organization: optionalString(body.organization, 180),
    respondentRole: optionalString(body.respondentRole, 120),
    hasClinic: optionalString(body.hasClinic, 120),
    institutionalAcquisition: optionalString(body.institutionalAcquisition, 120),
    notes: optionalString(body.notes),
  };

  if (persona === 'patient' && (!details.treatmentNeed || !details.currentChallenge)) {
    return validationError('Cuéntanos qué atención buscas y qué te dificulta acceder a ella.');
  }
  if (persona === 'student' && (!details.university || !details.patientAcquisition)) {
    return validationError('Indica tu universidad y cómo consigues pacientes hoy.');
  }
  if (persona === 'university' && (!details.organization || !details.respondentRole || !details.hasClinic)) {
    return validationError('Indica institución, cargo y situación de la clínica docente.');
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { ok: false, error: 'El formulario aún no está configurado para recibir respuestas. Inténtalo nuevamente más tarde.' },
      { status: 503 },
    );
  }

  const receivedAt = new Date().toISOString();
  const leadId = crypto.randomUUID();
  const submission = {
    id: leadId,
    source: 'aldiente-web-market-research',
    receivedAt,
    persona,
    contact: { name, email, phone: details.phone },
    details,
    attribution: {
      utmSource: optionalString(body.utmSource, 120),
      utmMedium: optionalString(body.utmMedium, 120),
      utmCampaign: optionalString(body.utmCampaign, 120),
      referrerOrigin: referrerOrigin(request.headers.get('referer')),
    },
    consent: {
      granted: true,
      version: 'market-research-v1',
    },
  };

  try {
    const blob = await put(`market-research/${receivedAt.slice(0, 10)}/${leadId}.json`, JSON.stringify(submission), {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
    });

    console.info('[market-research] lead stored', { leadId, persona, pathname: blob.pathname });
  } catch {
    console.error('[market-research] lead storage unavailable', { leadId, persona });
    return NextResponse.json(
      { ok: false, error: 'No pudimos registrar tu respuesta. Inténtalo nuevamente más tarde.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
