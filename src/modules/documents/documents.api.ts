import { api } from '../../shared/api/ApiClient';
import { filesApi } from '../../shared/api/FilesClient';
import { UploadDocumentInput, UserDocument } from './types';

export async function listDocuments(category?: string): Promise<UserDocument[]> {
  const res = await api.get('/api/documents', { params: category ? { category } : {} });
  const data: any = res.data;
  return Array.isArray(data) ? (data as UserDocument[]) : ((data?.documents ?? []) as UserDocument[]);
}

export async function uploadDocument(input: UploadDocumentInput): Promise<UserDocument> {
  // 1) Subir archivo al servicio de archivos (filesvc)
  const fd = new FormData();
  fd.append('file', input.file);
  const up = await filesApi.post('/upload', fd);
  const meta = up.data as { file_url: string; file_name: string; file_mime?: string; file_size?: number };

  // 2) Registrar metadatos en el backend
  const body = {
    title: input.title,
    description: input.description,
    category: input.category,
    year: input.year,
    file_url: meta.file_url,
    file_name: meta.file_name,
    file_mime: meta.file_mime,
    file_size: meta.file_size,
  };
  const res = await api.post('/api/documents', body);
  return res.data as UserDocument;
}

export async function deleteDocument(docId: string): Promise<void> {
  await api.delete(`/api/documents/${docId}`);
}
