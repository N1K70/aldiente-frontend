export type ProfileRole = 'patient' | 'student';

export interface ProfileCompletionItem {
  id: string;
  label: string;
  icon: string;
  done: boolean;
  description: string;
  optional?: boolean;
}

interface CompletionState {
  items: ProfileCompletionItem[];
  requiredCount: number;
  doneCount: number;
  percent: number;
  complete: boolean;
}

function hasValue(value: unknown) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value != null && value !== false;
}

function hasBio(value: unknown) {
  return typeof value === 'string' && value.trim().length >= 20;
}

export function buildProfileCompletionItems(
  profile: Record<string, unknown>,
  role: ProfileRole = 'patient',
  documentsCount = 0,
): ProfileCompletionItem[] {
  if (role === 'student') {
    return [
      {
        id: 'name',
        label: 'Nombre completo',
        icon: 'user',
        done: hasValue(profile.full_name) || hasValue(profile.name),
        description: 'Tu nombre visible para los pacientes',
      },
      {
        id: 'uni',
        label: 'Universidad',
        icon: 'school',
        done: hasValue(profile.university_id) || hasValue(profile.university),
        description: 'Universidad donde estudias',
      },
      {
        id: 'uniLoc',
        label: 'Ubicación clínica',
        icon: 'pin',
        done: hasValue(profile.university_location) || hasValue(profile.location),
        description: 'Dirección de tu clínica universitaria',
      },
      {
        id: 'year',
        label: 'Año de carrera',
        icon: 'calendar',
        done: hasValue(profile.career_year) || hasValue(profile.year),
        description: 'Tu año actual en la carrera',
      },
      {
        id: 'certs',
        label: 'Certificaciones',
        icon: 'star',
        done: hasValue(profile.certifications),
        description: 'Certificados o especialidades',
      },
      {
        id: 'bio',
        label: 'Biografía',
        icon: 'edit',
        done: hasBio(profile.bio),
        description: 'Descripción profesional (mínimo 20 caracteres)',
      },
      {
        id: 'docs',
        label: 'Documentos acreditativos',
        icon: 'file',
        done: documentsCount > 0,
        description: 'Sube al menos un documento de respaldo',
        optional: true,
      },
      {
        id: 'altLoc',
        label: 'Ubicación alternativa',
        icon: 'pin',
        done: hasValue(profile.alternative_location),
        description: 'Consulta particular u otro lugar',
        optional: true,
      },
    ];
  }

  return [
    {
      id: 'name',
      label: 'Nombre completo',
      icon: 'user',
      done: hasValue(profile.name) || hasValue(profile.full_name),
      description: 'Tu nombre en la plataforma',
    },
    {
      id: 'phone',
      label: 'Teléfono',
      icon: 'phone',
      done: hasValue(profile.phone),
      description: 'Número de contacto',
    },
    {
      id: 'birth',
      label: 'Fecha de nacimiento',
      icon: 'calendar',
      done: hasValue(profile.birthdate) || hasValue(profile.birth_date) || hasValue(profile.birthDate),
      description: 'Necesaria para ficha clínica',
    },
    {
      id: 'gender',
      label: 'Género',
      icon: 'user',
      done: hasValue(profile.gender),
      description: 'Información para el estudiante',
    },
    {
      id: 'address',
      label: 'Dirección',
      icon: 'pin',
      done: hasValue(profile.address) || hasValue(profile.location),
      description: 'Para ubicar clínicas cercanas',
    },
  ];
}

export function getProfileCompletionState(
  profile: Record<string, unknown>,
  role: ProfileRole = 'patient',
  documentsCount = 0,
): CompletionState {
  const items = buildProfileCompletionItems(profile, role, documentsCount);
  const required = items.filter((item) => !item.optional);
  const doneCount = required.filter((item) => item.done).length;
  const requiredCount = required.length;
  const percent = requiredCount === 0 ? 0 : Math.round((doneCount / requiredCount) * 100);
  const complete = requiredCount > 0 && doneCount >= requiredCount;

  return { items, requiredCount, doneCount, percent, complete };
}
