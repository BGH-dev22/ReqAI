import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  Cpu, 
  Cloud, 
  Zap, 
  Check,
  Server,
  Sparkles,
  Brain
} from 'lucide-react';

export interface LLMModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  local: boolean;
  icon?: React.ReactNode;
}

const AVAILABLE_MODELS: LLMModel[] = [
  // Modèles locaux
  {
    id: 'tinyllama',
    name: 'TinyLlama',
    description: 'Léger et rapide (637 MB)',
    provider: 'ollama',
    local: true,
  },
  {
    id: 'phi3',
    name: 'Phi-3 Mini',
    description: 'Microsoft - Performant (2.2 GB)',
    provider: 'ollama',
    local: true,
  },
  // Modèles API
  {
    id: 'groq',
    name: 'Grok (xAI)',
    description: 'Modèle xAI puissant',
    provider: 'groq',
    local: false,
  },
  {
    id: 'mistral',
    name: 'Mistral Devstral 2',
    description: 'Mistral AI - Gratuit',
    provider: 'openrouter',
    local: false,
  },
  {
    id: 'kimi',
    name: 'Qwen3 4B',
    description: 'Qwen 3 - Rapide et gratuit',
    provider: 'openrouter',
    local: false,
  },
];

interface LLMSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function LLMSelector({ selectedModel, onModelChange, disabled = false }: LLMSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

  const localModels = AVAILABLE_MODELS.filter(m => m.local);
  const apiModels = AVAILABLE_MODELS.filter(m => !m.local);

  const getModelIcon = (model: LLMModel) => {
    if (model.local) {
      return <Cpu className="h-4 w-4 text-emerald-400" />;
    }
    switch (model.id) {
      case 'groq':
        return <Zap className="h-4 w-4 text-orange-400" />;
      case 'mistral':
        return <Sparkles className="h-4 w-4 text-blue-400" />;
      case 'kimi':
        return <Brain className="h-4 w-4 text-purple-400" />;
      default:
        return <Cloud className="h-4 w-4 text-cyan-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="ghost"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="h-9 px-3 bg-slate-800/50 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 rounded-lg text-slate-200 gap-2"
      >
        {getModelIcon(currentModel)}
        <span className="text-sm font-medium hidden sm:inline">{currentModel.name}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
              <h3 className="text-sm font-semibold text-white">Choisir le modèle LLM</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sélectionnez un modèle local ou cloud</p>
            </div>

            {/* Local Models Section */}
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                <Server className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Modèles Locaux</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                  100% Privé
                </Badge>
              </div>
              {localModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    selectedModel === model.id
                      ? 'bg-emerald-500/20 border border-emerald-500/30'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {getModelIcon(model)}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white">{model.name}</p>
                    <p className="text-xs text-slate-400">{model.description}</p>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="h-4 w-4 text-emerald-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700 my-1" />

            {/* API Models Section */}
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-400 uppercase tracking-wide">Modèles Cloud</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5 py-0">
                  Plus puissants
                </Badge>
              </div>
              {apiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    selectedModel === model.id
                      ? 'bg-cyan-500/20 border border-cyan-500/30'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {getModelIcon(model)}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white">{model.name}</p>
                    <p className="text-xs text-slate-400">{model.description}</p>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="h-4 w-4 text-cyan-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-700 bg-slate-800/30">
              <p className="text-[10px] text-slate-500 text-center">
                Les modèles locaux gardent vos données privées
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { AVAILABLE_MODELS };
