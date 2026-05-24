import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Download, 
  Menu, 
  X, 
  LogOut, 
  User, 
  Brain, 
  Plus, 
  History,
  FileText,
  Trash2,
  ChevronLeft,
  Settings,
  Pencil,
  Check,
  FlaskConical,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useConversation } from '@/context/ConversationContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { 
    conversations, 
    currentConversationId, 
    createNewConversation, 
    loadConversation, 
    deleteConversation,
    renameConversation 
  } = useConversation();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Récupérer le nom de l'utilisateur depuis les métadonnées
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNewChat = () => {
    // Créer une nouvelle conversation (l'ancienne est déjà sauvegardée automatiquement)
    createNewConversation();
    navigate('/chat');
  };

  const handleLoadChat = (id: string) => {
    loadConversation(id);
    navigate('/chat');
    setMobileMenuOpen(false);
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyDownRename = async (id: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditTitle('');
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const convDate = new Date(date);
    const diffDays = Math.floor((today.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return convDate.toLocaleDateString('fr-FR');
  };

  // Grouper l'historique par date
  const groupedHistory = conversations.reduce((groups: { [key: string]: typeof conversations }, item) => {
    const dateKey = formatDate(item.date);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(item);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar - Desktop */}
      <aside className={`
        hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300
        ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}
      `}>
        {/* Header Sidebar */}
        <div className="p-4 border-b border-slate-800">
          <Button
            onClick={handleNewChat}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 justify-start gap-3"
          >
            <Plus className="h-4 w-4" />
            Nouvelle conversation
          </Button>
        </div>

        {/* Historique */}
        <ScrollArea className="flex-1 px-2 py-4">
          <div className="space-y-4">
            {Object.entries(groupedHistory).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {dateLabel}
                </p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => editingId !== item.id && handleLoadChat(item.id)}
                      className={`group flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors ${
                        currentConversationId === item.id ? 'bg-slate-800 border border-slate-700' : ''
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {editingId === item.id ? (
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDownRename(item.id, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 text-sm bg-slate-700 border-slate-600 text-white"
                            autoFocus
                          />
                        ) : (
                          <>
                            <p className="text-sm text-slate-300 truncate">{item.title}</p>
                            {item.documentName && (
                              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <FileText className="h-3 w-3" />
                                {item.documentName}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      {/* Actions : Renommer / Sauvegarder / Supprimer */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {editingId === item.id ? (
                          <button
                            onClick={(e) => handleSaveRename(item.id, e)}
                            className="p-1 hover:bg-slate-700 rounded"
                          >
                            <Check className="h-3.5 w-3.5 text-green-400" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleStartRename(item.id, item.title, e)}
                            className="p-1 hover:bg-slate-700 rounded"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-500 hover:text-blue-400" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="p-1 hover:bg-slate-700 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {conversations.length === 0 && (
              <div className="px-3 py-8 text-center">
                <History className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Aucun historique</p>
                <p className="text-xs text-slate-600 mt-1">Vos conversations apparaîtront ici</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Profil en bas de la sidebar */}
        <div className="border-t border-slate-800 p-3">
          {/* Bouton Export */}
          <Link
            to="/export"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2 transition-all
              ${location.pathname === '/export' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Exporter</span>
          </Link>

          {/* Bouton Tests & Qualité */}
          <Link
            to="/tests"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2 transition-all
              ${location.pathname === '/tests' 
                ? 'bg-purple-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            <FlaskConical className="h-4 w-4" />
            <span className="text-sm font-medium">Tests & Qualité</span>
          </Link>

          {/* Profil utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <Settings className="h-4 w-4 text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 bg-slate-900 border-slate-800 mb-2">
              <DropdownMenuLabel className="text-slate-300">
                <div className="flex flex-col">
                  <span className="font-medium">{userName}</span>
                  <span className="text-xs text-slate-500 truncate">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Toggle Sidebar Button - Desktop */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-slate-800 border border-slate-700 rounded-r-lg p-1.5 hover:bg-slate-700 transition-colors"
        style={{ left: sidebarOpen ? '288px' : '0' }}
      >
        <ChevronLeft className={`h-4 w-4 text-slate-400 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-400 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/chat" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white">ReqAI</span>
          </Link>
          <Link to="/export" className="p-2 text-slate-400 hover:text-white">
            <Download className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-80 bg-slate-900 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="font-bold text-white">Historique</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <Button
                onClick={() => { handleNewChat(); setMobileMenuOpen(false); }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 justify-start gap-3"
              >
                <Plus className="h-4 w-4" />
                Nouvelle conversation
              </Button>
            </div>

            {/* History */}
            <ScrollArea className="flex-1 px-2">
              {Object.entries(groupedHistory).map(([dateLabel, items]) => (
                <div key={dateLabel} className="mb-4">
                  <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase">{dateLabel}</p>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 cursor-pointer ${
                        currentConversationId === item.id ? 'bg-slate-800' : ''
                      }`}
                      onClick={() => handleLoadChat(item.id)}
                    >
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </ScrollArea>

            {/* Profile */}
            <div className="border-t border-slate-800 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
