import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonAvatar,
  IonChip,
  IonText,
  IonBackButton,
  IonButtons,
  IonFab,
  IonFabButton,
  IonModal,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import {
  arrowBackOutline,
  sendOutline,
  attachOutline,
  imageOutline,
  documentOutline,
  ellipsisVerticalOutline,
  closeOutline,
} from 'ionicons/icons';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  fileName?: string;
  fileUrl?: string;
}

interface ChatParams {
  appointmentId: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showFileModal, setShowFileModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const history = useHistory();
  // const { appointmentId } = useParams<ChatParams>();

  useEffect(() => {
    // Cargar mensajes simulados
    setMessages([
      {
        id: '1',
        text: 'Hola! Gracias por tu interés en mi servicio. ¿En qué puedo ayudarte?',
        sender: 'other',
        timestamp: new Date(Date.now() - 3600000),
        type: 'text',
      },
      {
        id: '2',
        text: 'Hola! Me gustaría saber más sobre el procedimiento de limpieza dental',
        sender: 'me',
        timestamp: new Date(Date.now() - 1800000),
        type: 'text',
      },
      {
        id: '3',
        text: 'Por supuesto! La limpieza incluye remoción de placa, sarro y pulido. Dura aproximadamente 45-60 minutos.',
        sender: 'other',
        timestamp: new Date(Date.now() - 900000),
        type: 'text',
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'me',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleFileUpload = (type: 'image' | 'file') => {
    // Simular carga de archivo
    const message: Message = {
      id: Date.now().toString(),
      text: type === 'image' ? 'Imagen enviada' : 'Archivo enviado',
      sender: 'me',
      timestamp: new Date(),
      type,
      fileName: type === 'image' ? 'foto.jpg' : 'documento.pdf',
    };
    setMessages([...messages, message]);
    setShowFileModal(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#FFFFFF' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/appointments" />
          </IonButtons>
          <IonTitle>Chat</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowFileModal(true)}>
              <IonIcon icon={ellipsisVerticalOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#FAFAFA' }}>
        <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Messages Container */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '70px' }}>
            <IonList lines="none">
              {messages.map((message) => (
                <div key={message.id} style={{
                  display: 'flex',
                  flexDirection: message.sender === 'me' ? 'row-reverse' : 'row',
                  marginBottom: '10px',
                  alignItems: 'flex-start',
                }}>
                  <IonAvatar style={{
                    width: '32px',
                    height: '32px',
                    margin: '0 8px',
                    background: message.sender === 'me' ? '#D40710' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#fff',
                  }}>
                    {message.sender === 'me' ? 'Tú' : 'DR'}
                  </IonAvatar>
                  
                  <div style={{
                    maxWidth: '70%',
                    margin: message.sender === 'me' ? '0 8px 0 0' : '0 0 0 8px',
                  }}>
                    <IonChip
                      style={{
                        background: message.sender === 'me' ? '#D40710' : '#FFFFFF',
                        color: message.sender === 'me' ? '#fff' : '#333',
                        borderRadius: '18px',
                        padding: '12px 16px',
                        margin: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '14px',
                        lineHeight: '1.4',
                      }}
                    >
                      {message.type === 'text' ? (
                        message.text
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <IonIcon 
                            icon={message.type === 'image' ? imageOutline : documentOutline} 
                            style={{ fontSize: '16px' }} 
                          />
                          <span>{message.fileName}</span>
                        </div>
                      )}
                    </IonChip>
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      marginTop: '4px',
                      textAlign: message.sender === 'me' ? 'right' : 'left',
                    }}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </IonList>
          </div>

          {/* Message Input */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#fff',
            padding: '10px',
            borderTop: '1px solid #eee',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IonButton
                fill="clear"
                onClick={() => setShowFileModal(true)}
                style={{ color: '#666' }}
              >
                <IonIcon icon={attachOutline} />
              </IonButton>
              
              <div style={{ flex: 1 }}>
                <IonInput
                  value={newMessage}
                  placeholder="Escribe un mensaje..."
                  onIonChange={(e) => setNewMessage(e.detail.value!)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  style={{
                    '--background': '#f5f5f5',
                    '--border-radius': '20px',
                    '--padding-start': '15px',
                    '--padding-end': '15px',
                    border: '1px solid #ddd',
                  }}
                />
              </div>
              
              <IonButton
                fill="clear"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                style={{ color: '#D40710' }}
              >
                <IonIcon icon={sendOutline} />
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>

      {/* File Upload Modal */}
      <IonModal
        isOpen={showFileModal}
        onDidDismiss={() => setShowFileModal(false)}
        style={{ '--border-radius': '16px' }}
      >
        <IonContent style={{ '--background': '#fff' }}>
          <div style={{ padding: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Adjuntar Archivo
              </h2>
              <IonButton
                fill="clear"
                onClick={() => setShowFileModal(false)}
              >
                <IonIcon icon={closeOutline} />
              </IonButton>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <IonButton
                expand="block"
                onClick={() => handleFileUpload('image')}
                style={{
                  height: '50px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
                }}
              >
                <IonIcon icon={imageOutline} slot="start" />
                Subir Imagen
              </IonButton>
              
              <IonButton
                expand="block"
                onClick={() => handleFileUpload('file')}
                style={{
                  height: '50px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2196F3, #42A5F5)',
                }}
              >
                <IonIcon icon={documentOutline} slot="start" />
                Subir Documento
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Chat;
