import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, TestTube, FileText, Clock, Loader2, RefreshCw, History } from 'lucide-react';

interface ChatHistory {
  id: string;
  document_id: string;
  question: string;
  answer: string;
  created_at: string;
}

interface TestHistory {
  id: string;
  document_id: string;
  requirement_id: string;
  requirement_title: string;
  test_data: any;
  created_at: string;
}

interface DocumentHistory {
  id: string;
  file_name: string;
  format: string;
  status: string;
  created_at: string;
}

export function HistoryPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [tests, setTests] = useState<TestHistory[]>([]);
  const [documents, setDocuments] = useState<DocumentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data: chatData } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: testData } = await supabase
        .from('test_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: docData } = await supabase
        .from('documents')
        .select('id, file_name, format, status, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setChats(chatData || []);
      setTests(testData || []);
      setDocuments(docData || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-slate-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 mb-6">
            <History className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-slate-300">Historique</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Votre Historique
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Retrouvez toutes vos conversations, tests générés et documents analysés
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="chats" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto bg-slate-900/80 border border-slate-800 p-1 rounded-xl mb-8">
            <TabsTrigger 
              value="chats" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <MessageSquare className="h-4 w-4" />
              Chats ({chats.length})
            </TabsTrigger>
            <TabsTrigger 
              value="tests" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <TestTube className="h-4 w-4" />
              Tests ({tests.length})
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
            >
              <FileText className="h-4 w-4" />
              Documents ({documents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="mt-0">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Historique des Conversations</h3>
                    <p className="text-sm text-slate-400">Vos questions-réponses passées</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {chats.length === 0 ? (
                  <p className="text-center text-slate-500 py-12">
                    Aucune conversation pour le moment
                  </p>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {chats.map((chat) => (
                        <div key={chat.id} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3 hover:border-indigo-500/30 transition-all">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                              {chat.document_id.slice(0, 8)}...
                            </Badge>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(chat.created_at)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-white font-medium">
                              <span className="text-indigo-400">Q:</span> {chat.question}
                            </p>
                            <p className="text-slate-400 text-sm">
                              <span className="text-purple-400">R:</span> {chat.answer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tests" className="mt-0">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                    <TestTube className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Historique des Tests Générés</h3>
                    <p className="text-sm text-slate-400">Tests créés automatiquement</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {tests.length === 0 ? (
                  <p className="text-center text-slate-500 py-12">
                    Aucun test généré pour le moment
                  </p>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {tests.map((test) => (
                        <div key={test.id} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3 hover:border-green-500/30 transition-all">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              {test.requirement_id}
                            </Badge>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(test.created_at)}
                            </span>
                          </div>
                          <p className="font-medium text-white">{test.requirement_title}</p>
                          <p className="text-sm text-slate-400">
                            {test.test_data?.description || 'Test généré automatiquement'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Historique des Documents</h3>
                    <p className="text-sm text-slate-400">Documents uploadés et analysés</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {documents.length === 0 ? (
                  <p className="text-center text-slate-500 py-12">
                    Aucun document uploadé pour le moment
                  </p>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-blue-500/30 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-slate-400" />
                              </div>
                              <div>
                                <span className="font-medium text-white">{doc.file_name}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                                    {doc.format.toUpperCase()}
                                  </Badge>
                                  <Badge className={`text-xs ${
                                    doc.status === 'analyzed' 
                                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  }`}>
                                    {doc.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(doc.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            onClick={loadHistory}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>
    </div>
  );
}
