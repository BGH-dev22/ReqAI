import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const API_URL = 'http://localhost:8000';
const STORAGE_KEY = 'reqai_conversations';

export interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  data?: {
    requirements?: any[];
    tests?: any[];
    citations?: any[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  date: Date;
  documentName?: string;
  documentId?: string;
  messages: Message[];
  requirements?: any[];
  tests?: any[];
}

interface ConversationContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  isLoading: boolean;
  isBackendAvailable: boolean;
  createNewConversation: () => Promise<string>;
  loadConversation: (id: string) => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<void>;
  setCurrentConversationId: (id: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<Message | null>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// Générer un ID unique
const generateId = () => `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);

  // Transformer les données API en format Conversation
  const transformApiConversation = (apiConv: any): Conversation => ({
    id: apiConv.id,
    title: apiConv.title,
    date: new Date(apiConv.updated_at || apiConv.created_at),
    documentName: apiConv.document_name,
    documentId: apiConv.document_id,
    messages: (apiConv.messages || []).map((msg: any) => ({
      id: msg.id,
      type: msg.type,
      content: msg.content,
      timestamp: new Date(msg.created_at),
      data: msg.data,
    })),
  });

  // Sauvegarder dans localStorage
  const saveToLocalStorage = useCallback((convs: Conversation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }, []);

  // Charger depuis localStorage
  const loadFromLocalStorage = useCallback((): Conversation[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((conv: any) => ({
          ...conv,
          date: new Date(conv.date),
          messages: (conv.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
    return [];
  }, []);

  // Vérifier si le backend est disponible et charger les données
  useEffect(() => {
    const init = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(`${API_URL}/conversations`, { 
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          const convs = (data.conversations || []).map(transformApiConversation);
          setConversations(convs);
          setIsBackendAvailable(true);
          console.log('Backend available, loaded', convs.length, 'conversations');
          return;
        }
      } catch (error) {
        console.log('Backend not available, using localStorage');
      }
      
      // Fallback vers localStorage
      setIsBackendAvailable(false);
      const localConvs = loadFromLocalStorage();
      setConversations(localConvs);
    };
    
    init();
  }, [loadFromLocalStorage]);

  // Sauvegarder dans localStorage à chaque changement (fallback)
  useEffect(() => {
    if (conversations.length > 0) {
      saveToLocalStorage(conversations);
    }
  }, [conversations, saveToLocalStorage]);

  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  // Message de bienvenue par défaut
  const createWelcomeMessage = (): Message => ({
    id: `welcome-${Date.now()}`,
    type: 'agent',
    content: "Bonjour ! 👋 Je suis votre assistant d'analyse des exigences.\n\nVoici ce que je peux faire pour vous :\n• 📄 **Analyser vos documents** - Uploadez un fichier PDF ou DOCX\n• ❓ **Répondre à vos questions** sur le contenu du document\n• 🧪 **Générer des tests** pour chaque exigence extraite\n\nCommencez par uploader un document en cliquant sur le bouton 📎 ou en glissant un fichier ici.",
    timestamp: new Date(),
  });

  // Créer une nouvelle conversation
  const createNewConversation = useCallback(async (): Promise<string> => {
    setIsLoading(true);
    
    try {
      if (isBackendAvailable) {
        const res = await fetch(`${API_URL}/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Nouvelle conversation' }),
        });
        
        if (res.ok) {
          const data = await res.json();
          const newConv = transformApiConversation(data);
          setConversations(prev => [newConv, ...prev]);
          setCurrentConversationId(newConv.id);
          setIsLoading(false);
          return newConv.id;
        }
      }
    } catch (error) {
      console.error('Backend error, falling back to local:', error);
    }
    
    // Fallback local
    const newId = generateId();
    const newConv: Conversation = {
      id: newId,
      title: 'Nouvelle conversation',
      date: new Date(),
      messages: [createWelcomeMessage()],
    };
    
    setConversations(prev => {
      const updated = [newConv, ...prev];
      saveToLocalStorage(updated);
      return updated;
    });
    setCurrentConversationId(newId);
    setIsLoading(false);
    
    return newId;
  }, [isBackendAvailable, saveToLocalStorage]);

  // Charger une conversation
  const loadConversation = useCallback(async (id: string): Promise<Conversation | null> => {
    setIsLoading(true);
    
    try {
      if (isBackendAvailable) {
        const res = await fetch(`${API_URL}/conversations/${id}`);
        if (res.ok) {
          const data = await res.json();
          const conv = transformApiConversation(data);
          
          setConversations(prev => {
            const exists = prev.find(c => c.id === id);
            if (exists) {
              return prev.map(c => c.id === id ? conv : c);
            }
            return [conv, ...prev];
          });
          
          setCurrentConversationId(id);
          setIsLoading(false);
          return conv;
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
    
    // Fallback local
    const conv = conversations.find(c => c.id === id) || null;
    setCurrentConversationId(id);
    setIsLoading(false);
    return conv;
  }, [isBackendAvailable, conversations]);

  // Supprimer une conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      if (isBackendAvailable) {
        await fetch(`${API_URL}/conversations/${id}`, { method: 'DELETE' });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
    
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToLocalStorage(updated);
      return updated;
    });
    
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  }, [isBackendAvailable, currentConversationId, saveToLocalStorage]);

  // Ajouter un message
  const addMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> => {
    if (!currentConversationId) return null;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...message,
      timestamp: new Date(),
    };
    
    try {
      if (isBackendAvailable) {
        const res = await fetch(`${API_URL}/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: message.type,
            content: message.content,
            data: message.data || null,
          }),
        });
        
        if (res.ok) {
          const savedMsg = await res.json();
          newMessage.id = savedMsg.id;
          newMessage.timestamp = new Date(savedMsg.created_at);
        }
      }
    } catch (error) {
      console.error('Error adding message to backend:', error);
    }
    
    // Mettre à jour localement
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === currentConversationId) {
          const updatedConv = {
            ...conv,
            messages: [...conv.messages, newMessage],
            date: new Date(),
          };
          
          // Mettre à jour le titre automatiquement
          if (message.type === 'user') {
            const userMessages = updatedConv.messages.filter(m => m.type === 'user');
            if (userMessages.length === 1) {
              if (message.content.startsWith('📄')) {
                const parts = message.content.split(':');
                if (parts.length > 1) {
                  updatedConv.title = `Analyse de ${parts[parts.length - 1].trim()}`;
                }
              } else {
                updatedConv.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
              }
            }
          }
          
          return updatedConv;
        }
        return conv;
      });
      
      saveToLocalStorage(updated);
      return updated;
    });
    
    return newMessage;
  }, [currentConversationId, isBackendAvailable, saveToLocalStorage]);

  // Renommer une conversation
  const renameConversation = useCallback(async (id: string, newTitle: string) => {
    try {
      if (isBackendAvailable) {
        await fetch(`${API_URL}/conversations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle }),
        });
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
    
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === id ? { ...conv, title: newTitle, date: new Date() } : conv
      );
      saveToLocalStorage(updated);
      return updated;
    });
  }, [isBackendAvailable, saveToLocalStorage]);

  return (
    <ConversationContext.Provider value={{
      conversations,
      currentConversationId,
      currentConversation,
      isLoading,
      isBackendAvailable,
      createNewConversation,
      loadConversation,
      deleteConversation,
      setCurrentConversationId,
      addMessage,
      renameConversation,
    }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}
