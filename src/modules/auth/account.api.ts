import { api } from '../../shared/api/ApiClient';

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/api/users/change-password', { currentPassword, newPassword });
}
