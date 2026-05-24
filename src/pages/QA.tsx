import { useMemo, useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { useAgents } from '@/hooks/useAgents';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, MessageSquare, Sparkles } from 'lucide-react';
import { useDocumentContext } from '@/context/DocumentContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  citations?: Array<{
    page: number;
    section: string;
    text: string;
    confidence: number;
  }>;
  confidence?: number;
}

export function QAPage() {
  const { documentId } = useDocumentContext();
  const canQuery = Boolean(documentId);
  const { askQuestion, error } = useAgents(documentId || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const disabledReason = useMemo(() => {
    if (!documentId) return "Aucun document actif. Uploadez un document d'abord.";
    return null;
  }, [documentId]);

  const handleSendMessage = async (question: string) => {
    if (!documentId) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await askQuestion(question);

      const agentMessage: Message = {
        id: `msg-${Date.now()}-response`,
        type: 'agent',
        content: response.answer,
        timestamp: new Date(),
        citations: response.citations,
        confidence: response.relevanceScore,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      console.error('Error asking question:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-blue-600/5 to-slate-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 mb-6">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-300">Q&A Assistant</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Questions & Réponses
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Posez des questions sur votre document et obtenez des réponses avec citations précises
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30 mb-6">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {!canQuery && (
          <Alert className="bg-amber-500/10 border-amber-500/30 mb-6">
            <AlertDescription className="flex items-center justify-between text-amber-400">
              <span>Aucun document n'est chargé. Uploadez un document pour poser des questions.</span>
              <Button asChild variant="outline" size="sm" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                <Link to="/upload">Aller à l'upload</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Feature hints */}
        {messages.length === 0 && canQuery && (
          <div className="mb-8">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Suggestions de questions</h3>
                  <p className="text-sm text-slate-400">Commencez par ces exemples</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "Quelles sont les exigences principales du document ?",
                  "Résumez les objectifs de ce projet",
                  "Quelles sont les contraintes techniques mentionnées ?",
                  "Listez les critères de validation",
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-left p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-slate-300 hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        </div>
        
        {disabledReason && (
          <p className="text-sm text-slate-500 mt-4 text-center">{disabledReason}</p>
        )}
      </div>
    </div>
  );
}
