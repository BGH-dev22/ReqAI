import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader, Bot, User, BookOpen, AlertCircle, CheckCircle2, Shield, Layers, TestTube2, Clock, Target, ListChecks, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Composant pour afficher un cas de test
function TestCaseCard({ test, index }: { test: any; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const typeColors: Record<string, string> = {
    'fonctionnel': 'bg-blue-500/20 text-blue-300 border-blue-400/40',
    'performance': 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    'sécurité': 'bg-red-500/20 text-red-300 border-red-400/40',
    'endurance': 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    'environnemental': 'bg-green-500/20 text-green-300 border-green-400/40',
    'conformité': 'bg-teal-500/20 text-teal-300 border-teal-400/40',
  };

  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-xl overflow-hidden">
      {/* Header - toujours visible */}
      <div 
        className="p-3 sm:p-4 cursor-pointer hover:bg-slate-700/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-xs font-mono">
                {test.id || `TEST-${String(index + 1).padStart(3, '0')}`}
              </Badge>
              <Badge className={`text-xs font-medium border ${typeColors[test.type_test?.toLowerCase()] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                <TestTube2 className="h-3 w-3 mr-1" />
                {test.type_test || 'Test'}
              </Badge>
              {test.duree_estimee && (
                <Badge className="bg-slate-600/50 text-slate-300 border-slate-500/40 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {test.duree_estimee}
                </Badge>
              )}
            </div>
            <h4 className="text-sm font-medium text-white">
              {test.nom || test.name || `Cas de test ${index + 1}`}
            </h4>
            {test.objectif && (
              <p className="text-xs text-slate-400 flex items-start gap-1">
                <Target className="h-3 w-3 mt-0.5 shrink-0" />
                {test.objectif}
              </p>
            )}
          </div>
          <button className="text-slate-400 hover:text-white p-1">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Détails - visible quand expanded */}
      {isExpanded && (
        <div className="border-t border-slate-600 p-3 sm:p-4 space-y-3 bg-slate-800/30">
          {/* Préconditions */}
          {test.preconditions && (
            <div>
              <p className="text-xs font-medium text-cyan-400 mb-1 flex items-center gap-1">
                <ListChecks className="h-3 w-3" /> Préconditions
              </p>
              <p className="text-xs text-slate-300 pl-4">{test.preconditions}</p>
            </div>
          )}

          {/* Procédure */}
          {test.procedure && (
            <div>
              <p className="text-xs font-medium text-cyan-400 mb-1 flex items-center gap-1">
                <ListChecks className="h-3 w-3" /> Procédure
              </p>
              <div className="text-xs text-slate-300 pl-4 whitespace-pre-line">
                {typeof test.procedure === 'string' ? test.procedure : 
                  Array.isArray(test.procedure) ? test.procedure.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n') : ''}
              </div>
            </div>
          )}

          {/* Équipements */}
          {test.equipements && test.equipements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-cyan-400 mb-1 flex items-center gap-1">
                <Wrench className="h-3 w-3" /> Équipements
              </p>
              <div className="flex flex-wrap gap-1 pl-4">
                {(Array.isArray(test.equipements) ? test.equipements : [test.equipements]).map((eq: string, i: number) => (
                  <Badge key={i} className="bg-slate-600/50 text-slate-300 text-xs">{eq}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Résultat attendu */}
          {test.attendu && (
            <div>
              <p className="text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Résultat attendu
              </p>
              <p className="text-xs text-slate-300 pl-4">{test.attendu}</p>
            </div>
          )}

          {/* Critère de réussite */}
          {test.critere_reussite && (
            <div>
              <p className="text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1">
                <Target className="h-3 w-3" /> Critère de réussite
              </p>
              <p className="text-xs text-slate-300 pl-4">{test.critere_reussite}</p>
            </div>
          )}

          {/* Exigence liée */}
          {test.id_exigence && (
            <div className="pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                Exigence liée: <span className="text-cyan-400 font-mono">{test.id_exigence}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Composant pour afficher une exigence
function ExigenceCard({ exigence, index }: { exigence: any; index: number }) {
  const priorityColors: Record<string, string> = {
    'Critique': 'bg-red-500/20 text-red-300 border-red-400/40',
    'Haute': 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    'Moyenne': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
    'Basse': 'bg-green-500/20 text-green-300 border-green-400/40',
  };

  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-3 sm:p-4 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {exigence.id && (
          <Badge className="bg-slate-600/50 text-slate-300 border-slate-500/40 text-xs font-mono">
            {exigence.id}
          </Badge>
        )}
        {exigence.categorie && (
          <Badge className="bg-cyan-500/30 text-cyan-300 border-cyan-400/40 text-xs font-medium flex items-center gap-1">
            {exigence.categorie === 'Sécurité' ? <Shield className="h-3 w-3" /> : 
             exigence.categorie === 'Compatibilité' ? <Layers className="h-3 w-3" /> : 
             <CheckCircle2 className="h-3 w-3" />}
            {exigence.categorie}
          </Badge>
        )}
        {exigence.priorite && (
          <Badge className={`text-xs font-medium border flex items-center gap-1 ${priorityColors[exigence.priorite] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
            {exigence.priorite === 'Critique' && <AlertCircle className="h-3 w-3" />}
            Priorité: {exigence.priorite}
          </Badge>
        )}
      </div>
      {exigence.titre && (
        <h4 className="text-sm font-medium text-white">{exigence.titre}</h4>
      )}
      <p className="text-sm text-slate-200 leading-relaxed">
        {exigence.description || exigence.texte || exigence.content}
      </p>
    </div>
  );
}

// Fonction pour formater le contenu des messages
function formatMessageContent(content: string): React.ReactNode {
  // Nettoyer le contenu
  let cleanContent = content.trim();
  
  // Extraire le JSON des backticks si présent
  const jsonMatch = cleanContent.match(/```json\s*([\s\S]*?)```/);
  const textBefore = jsonMatch ? cleanContent.substring(0, cleanContent.indexOf('```json')).trim() : '';
  
  // Essayer de parser le JSON
  let jsonContent: any = null;
  
  if (jsonMatch) {
    try {
      jsonContent = JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      // Parsing échoué
    }
  } else if (cleanContent.startsWith('{') || cleanContent.startsWith('[')) {
    try {
      jsonContent = JSON.parse(cleanContent);
    } catch (e) {
      // Parsing échoué
    }
  }

  // Si on a du JSON valide, le formater selon son type
  if (jsonContent) {
    // Cas 1: Liste de tests ou objet avec tests
    const tests = Array.isArray(jsonContent) && jsonContent[0]?.id?.includes('TEST') ? jsonContent :
                  jsonContent.tests ? jsonContent.tests :
                  jsonContent.cas_de_test ? jsonContent.cas_de_test :
                  jsonContent.test_cases ? jsonContent.test_cases : null;
    
    if (tests && Array.isArray(tests) && tests.length > 0) {
      return (
        <div className="space-y-4">
          {textBefore && <p className="text-sm leading-relaxed text-white mb-4">{textBefore}</p>}
          <div className="flex items-center gap-2 mb-3">
            <TestTube2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              {tests.length} cas de test générés
            </span>
          </div>
          <div className="space-y-3">
            {tests.map((test: any, index: number) => (
              <TestCaseCard key={test.id || index} test={test} index={index} />
            ))}
          </div>
        </div>
      );
    }

    // Cas 2: Liste d'exigences ou objet avec exigences
    const exigences = Array.isArray(jsonContent) && (jsonContent[0]?.categorie || jsonContent[0]?.priorite || jsonContent[0]?.description) ? jsonContent :
                      jsonContent.exigences ? jsonContent.exigences :
                      jsonContent.requirements ? jsonContent.requirements : null;
    
    if (exigences && Array.isArray(exigences) && exigences.length > 0) {
      return (
        <div className="space-y-4">
          {textBefore && <p className="text-sm leading-relaxed text-white mb-4">{textBefore}</p>}
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">
              {exigences.length} exigences identifiées
            </span>
          </div>
          <div className="space-y-3">
            {exigences.map((exigence: any, index: number) => (
              <ExigenceCard key={exigence.id || index} exigence={exigence} index={index} />
            ))}
          </div>
        </div>
      );
    }

    // Cas 3: Autre JSON - afficher proprement
    return (
      <div className="space-y-3">
        {textBefore && <p className="text-sm leading-relaxed text-white mb-4">{textBefore}</p>}
        <pre className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-xs overflow-x-auto text-slate-300">
          {JSON.stringify(jsonContent, null, 2)}
        </pre>
      </div>
    );
  }
  
  // Contenu normal - retourner tel quel
  return <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">{content}</p>;
}

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

interface ChatInterfaceProps {
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string) => Promise<void>;
}

export function ChatInterface({ messages, isLoading = false, onSendMessage }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    await onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 sm:p-6 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-slate-400 text-lg">Posez une question sur le document...</p>
              <p className="text-slate-500 text-sm mt-2">L'IA analysera le contenu et vous répondra avec des citations précises</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[90%] lg:max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                      : 'bg-gradient-to-br from-cyan-600 to-blue-600'
                  }`}>
                    {msg.type === 'user' ? (
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className={`p-3 sm:p-4 rounded-2xl overflow-hidden ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                      : 'bg-slate-800/90 border border-slate-600 text-white'
                  }`}>
                    {formatMessageContent(msg.content)}

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 space-y-3 border-t border-slate-600 pt-3">
                        <p className="text-xs font-semibold flex items-center gap-1 text-cyan-400">
                          <BookOpen className="h-3 w-3" />
                          Citations:
                        </p>
                        {msg.citations.map((citation, idx) => (
                          <div key={idx} className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                            <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                              Page {citation.page}, {citation.section}
                            </Badge>
                            <p className="text-xs italic text-slate-400">"{citation.text}"</p>
                            <div className="flex items-center gap-2">
                              <div className="h-1 flex-1 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" 
                                  style={{ width: `${citation.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">{Math.round(citation.confidence)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Confidence Score */}
                    {msg.type === 'agent' && msg.confidence !== undefined && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <span>Pertinence:</span>
                        <div className="h-1.5 w-20 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500" 
                            style={{ width: `${msg.confidence}%` }}
                          />
                        </div>
                        <span>{Math.round(msg.confidence)}%</span>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className={`text-xs mt-2 ${msg.type === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
                  <Loader className="h-5 w-5 animate-spin text-cyan-400" />
                  <span className="text-sm text-slate-300">Agent Q/R en train de chercher...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-slate-800 p-4 bg-slate-900/50">
        <div className="flex gap-3">
          <Input
            placeholder="Poser une question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
            className="shrink-0 h-12 w-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Appuyez sur Entrée pour envoyer
        </p>
      </div>
    </div>
  );
}
