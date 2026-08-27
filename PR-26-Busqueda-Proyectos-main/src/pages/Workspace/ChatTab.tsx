import { RefObject } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input';
import type { User } from '@/features/usuarios';
import type { WorkspaceChatMessage } from './types';

export function ChatTab({
  projectName,
  participantsCount,
  messages,
  currentUser,
  users,
  messagesEndRef,
  messageText,
  setMessageText,
  onSend,
  sending,
  isReadOnly,
}: {
  projectName: string;
  participantsCount: number;
  messages: WorkspaceChatMessage[];
  currentUser: User | null;
  users: User[];
  messagesEndRef: RefObject<HTMLDivElement>;
  messageText: string;
  setMessageText: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  isReadOnly: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col h-[600px] bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm">{projectName}</p>
              <p className="text-xs text-muted-foreground">{participantsCount} participante{participantsCount !== 1 ? 's' : ''} · Chat del proyecto</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-success font-medium">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              En vivo
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-muted-foreground">No hay mensajes aún</p>
              <p className="text-sm text-muted-foreground/70">¡Sé el primero en iniciar la conversación!</p>
            </div>
          ) : (
            messages.map((message, idx) => {
              const isOwn = message.usuario_id === currentUser?.id;
              const sender = message.usuario?.nombre_completo ||
                users.find(u => u.id === message.usuario_id)?.nombre_completo || 'Usuario';
              const senderInitial = sender.charAt(0).toUpperCase();
              // Show avatar only when sender changes
              const prevMsg = messages[idx - 1];
              const showHeader = !prevMsg || prevMsg.usuario_id !== message.usuario_id;
              const dateLabel = new Date(message.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={message.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className="flex flex-col justify-end flex-shrink-0">
                    {showHeader ? (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground text-xs font-black shadow-sm ${isOwn ? 'bg-primary' : 'bg-muted'
                        }`}>
                        {senderInitial}
                      </div>
                    ) : <div className="w-8" />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {showHeader && (
                      <p className={`text-[11px] font-semibold text-muted-foreground mb-1 ${isOwn ? 'text-right' : ''}`}>
                        {isOwn ? 'Tú' : sender}
                      </p>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isOwn
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm border border-border/50'
                      }`}>
                      {message.contenido}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 px-1">{dateLabel}</p>
                  </div>
                </div>
              );
            })
          )}
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2 bg-background border border-border rounded-2xl px-4 py-2 shadow-sm focus-within:border-primary transition-colors">
            <Input
              placeholder={isReadOnly ? "El chat está deshabilitado en proyectos suspendidos, archivados o terminados" : "Escribe un mensaje..."}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              className="flex-1 border-none bg-transparent shadow-none focus:ring-0 px-0 py-0 text-sm"
              disabled={sending || isReadOnly}
            />
            <button
              onClick={onSend}
              disabled={!messageText.trim() || sending || isReadOnly}
              className={`min-h-11 min-w-11 rounded-xl flex items-center justify-center transition-all ${messageText.trim() && !sending && !isReadOnly
                ? 'bg-primary text-primary-foreground shadow-md hover:scale-105 cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">Enter para enviar · Se actualiza cada 3 segundos</p>
        </div>
      </div>
    </motion.div>
  );
}
