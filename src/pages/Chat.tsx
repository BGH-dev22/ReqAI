import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Loader, 
  Bot, 
  User, 
  Upload, 
  FileText, 
  Sparkles,
  CheckCircle2,
  TestTube2,
  BookOpen
} from 'lucide-react';
import { useDocumentContext } from '@/context/DocumentContext';
import { useConversation, Message } from '@/context/ConversationContext';
import { useAgents, setGlobalLLMProvider } from '@/hooks/useAgents';
import { useDocument } from '@/hooks/useDocument';
import { LLMSelector } from '@/components/LLMSelector';

export function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedLLM, setSelectedLLM] = useState('groq'); // Default to Grok
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { documentId, requirements, setRequirements, setDocumentId } = useDocumentContext();
  const { 
    currentConversation, 
    currentConversationId, 
    createNewConversation, 
    addMessage: addMessageToBackend 
  } = useConversation();
  const { uploadDocument, isLoading: isUploading } = useDocument();
  const { askQuestion, generateTests } = useAgents(documentId || '');

  const [generatedTests, setGeneratedTests] = useState<any[]>([]);

  // Messages provenant du contexte de conversation
  const messages = currentConversation?.messages || [];

  // Mettre à jour le provider LLM global quand le sélecteur change
  const handleLLMChange = (modelId: string) => {
    setSelectedLLM(modelId);
    setGlobalLLMProvider(modelId);
  };

  // Auto-créer une conversation si aucune n'existe
  useEffect(() => {
    if (!currentConversationId) {
      createNewConversation();
    }
  }, [currentConversationId, createNewConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fonction pour ajouter un message et sauvegarder dans le backend
  const addMessage = async (message: { type: 'user' | 'agent' | 'system'; content: string; data?: any }) => {
    await addMessageToBackend(message);
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsLoading(true);

    // Message utilisateur
    await addMessage({
      type: 'user',
      content: `📄 J'uploade le fichier : ${file.name}`,
    });

    try {
      const result = await uploadDocument(file);
      
      // Vérifier que result existe
      const reqs = result?.requirements || [];
      
      // Message système de succès
      await addMessage({
        type: 'agent',
        content: `✅ **Document analysé avec succès !**\n\n📄 **Fichier :** ${file.name}\n📊 **Exigences extraites :** ${reqs.length}\n\nVous pouvez maintenant :\n• Me poser des **questions** sur le document\n• Me demander de **générer les tests** pour les exigences\n\n💡 *Essayez : "Génère les tests pour toutes les exigences"*`,
        data: { requirements: reqs }
      });

      if (reqs.length > 0) {
        setRequirements(reqs);
      }
    } catch (error) {
      await addMessage({
        type: 'agent',
        content: `❌ Erreur lors de l'analyse du document. Veuillez réessayer.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Ajouter le message utilisateur
    await addMessage({
      type: 'user',
      content: userMessage,
    });

    setIsLoading(true);

    try {
      // Détecter si c'est une demande de génération de tests
      const isTestRequest = userMessage.toLowerCase().includes('test') || 
                           userMessage.toLowerCase().includes('génère') ||
                           userMessage.toLowerCase().includes('genere') ||
                           userMessage.toLowerCase().includes('générer');

      if (isTestRequest && requirements.length > 0) {
        // Génération de tests
        const reqsForGeneration = requirements.map(r => ({
          id: r.id,
          titre: r.title,
          description: r.description,
          type: r.type,
          priorite: r.priority,
        }));

        const result = await generateTests(reqsForGeneration);
        const tests = result.test_cases || result.tests || [];
        setGeneratedTests(tests);
        
        // Sauvegarder les tests dans localStorage pour l'export
        localStorage.setItem('generated_tests', JSON.stringify(tests));
        console.log(`✅ ${tests.length} tests sauvegardés dans localStorage pour l'export`);

        // Construire le message avec les tests (supporter les champs français et anglais)
        let testMessage = `🧪 **Tests générés avec succès !**\n\nVoici les cas de test pour chaque exigence :\n\n`;
        
        tests.forEach((test: any, idx: number) => {
          // Supporter les deux formats de champs
          const reqId = test.id_exigence || test.requirement_id || test.requirementId || `REQ-${(idx % requirements.length) + 1}`;
          const testTitle = test.nom || test.name || test.title || 'Test de validation';
          const testObjectif = test.objectif || test.objective || test.description || '';
          const testType = test.type_test || test.type || 'fonctionnel';
          const testProcedure = test.procedure || test.steps || '';
          
          testMessage += `---\n\n**${reqId}** → **${test.id || `TEST-${idx + 1}`}**\n`;
          testMessage += `📋 **${testTitle}**\n`;
          testMessage += `🏷️ Type: ${testType}\n`;
          
          if (testObjectif) {
            testMessage += `🎯 Objectif: ${testObjectif}\n`;
          }
          
          if (testProcedure) {
            testMessage += `\n**Procédure :**\n`;
            if (typeof testProcedure === 'string') {
              testMessage += `${testProcedure}\n`;
            } else if (Array.isArray(testProcedure)) {
              testProcedure.forEach((step: any, sIdx: number) => {
                const stepDesc = typeof step === 'string' ? step : step.description;
                testMessage += `${sIdx + 1}. ${stepDesc}\n`;
              });
            }
          }
          testMessage += '\n';
        });

        testMessage += `\n✅ **${tests.length} tests générés** pour **${requirements.length} exigences**\n\n💾 Cliquez sur le bouton **Exporter** dans la barre de navigation pour télécharger les résultats.`;

        await addMessage({
          type: 'agent',
          content: testMessage,
          data: { tests, requirements }
        });
      } else if (!documentId) {
        // Pas de document uploadé
        await addMessage({
          type: 'agent',
          content: `⚠️ Aucun document n'est chargé.\n\nVeuillez d'abord uploader un document PDF ou DOCX en cliquant sur le bouton 📎 ci-dessous.`,
        });
      } else {
        // Question normale sur le document
        const response = await askQuestion(userMessage);
        
        let answerMessage = response.answer || "Je n'ai pas pu trouver de réponse.";
        
        if (response.citations && response.citations.length > 0) {
          answerMessage += `\n\n📎 **Sources :**\n`;
          response.citations.forEach((cit: any, idx: number) => {
            answerMessage += `• Page ${cit.page}, ${cit.section} (${Math.round(cit.confidence)}%)\n`;
          });
        }

        await addMessage({
          type: 'agent',
          content: answerMessage,
          data: { citations: response.citations }
        });
      }
    } catch (error) {
      await addMessage({
        type: 'agent',
        content: `❌ Une erreur s'est produite. Veuillez réessayer.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.pdf') || file.name.endsWith('.docx'))) {
      handleFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const quickActions = [
    { label: "Quelles sont les exigences principales ?", icon: BookOpen },
    { label: "Génère les tests pour toutes les exigences", icon: TestTube2 },
    { label: "Résume le document", icon: FileText },
  ];

  return (
    <div 
      className="flex flex-col h-[calc(100vh-64px)] bg-slate-950"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.type === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                    : 'bg-gradient-to-br from-cyan-600 to-blue-600'
                }`}>
                  {msg.type === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-white" />
                  )}
                </div>
                
                {/* Message Content */}
                <div className={`p-4 rounded-2xl ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-slate-200'
                }`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content.split('\n').map((line, i) => {
                      // Rendre le markdown basique
                      let rendered = line;
                      rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      return (
                        <span key={i} dangerouslySetInnerHTML={{ __html: rendered + (i < msg.content.split('\n').length - 1 ? '<br/>' : '') }} />
                      );
                    })}
                  </div>

                  {/* Timestamp */}
                  <p className={`text-xs mt-2 ${msg.type === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
                  <Loader className="h-5 w-5 animate-spin text-cyan-400" />
                  <span className="text-sm text-slate-300">
                    {isUploading ? 'Analyse du document en cours...' : 'Réflexion en cours...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions - Only show when no document or after welcome */}
          {!isLoading && documentId && messages.length <= 3 && (
            <div className="flex flex-wrap gap-2 justify-center py-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(action.label);
                    setTimeout(() => handleSend(), 100);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all text-sm"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Document Status Bar */}
      {documentId && (
        <div className="border-t border-slate-800 px-4 py-2 bg-slate-900/50">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Document chargé
              </Badge>
              {uploadedFile && (
                <span className="text-sm text-slate-400">{uploadedFile.name}</span>
              )}
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {requirements.length} exigences
              </Badge>
              {generatedTests.length > 0 && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  {generatedTests.length} tests générés
                </Badge>
              )}
            </div>
            {/* LLM Selector */}
            <LLMSelector
              selectedModel={selectedLLM}
              onModelChange={handleLLMChange}
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-800 p-4 bg-slate-900/80 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="h-12 w-12 shrink-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              <Upload className="h-5 w-5" />
            </Button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <Input
                placeholder={documentId ? "Posez une question ou demandez de générer les tests..." : "Uploadez d'abord un document..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20 h-12 pr-12 rounded-xl text-base"
                style={{ color: '#ffffff', caretColor: '#22d3ee' }}
              />
            </div>

            {/* LLM Selector (shown when no document) */}
            {!documentId && (
              <LLMSelector
                selectedModel={selectedLLM}
                onModelChange={handleLLMChange}
                disabled={isLoading}
              />
            )}

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="h-12 w-12 shrink-0 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-xs text-slate-500 mt-2 text-center">
            Glissez un fichier PDF/DOCX ou cliquez sur 📎 pour uploader • Appuyez sur Entrée pour envoyer
          </p>
        </div>
      </div>
    </div>
  );
}
