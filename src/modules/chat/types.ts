export type ChatConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

export interface ChatMessage {
  id: string;
  chatId: string;
  appointmentId: string;
  senderId: string;
  senderEmail?: string | null;
  senderRole?: string | null;
  senderName?: string | null;
  content: string;
  sentAt: string | null;
  isRead: boolean;
}

export interface ChatJoinSuccess {
  ok: true;
  chatId: string;
  appointment: {
    id: string;
    status: string;
    patientId: string;
    patientName?: string | null;
    studentId: string;
    studentName?: string | null;
  };
  messages: ChatMessage[];
}

export interface ChatJoinError {
  ok: false;
  error: string;
}

export type ChatJoinResponse = ChatJoinSuccess | ChatJoinError;
