import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Download, Loader, FileSpreadsheet, FileJson, FileText, FileType, Clock, CheckCircle2, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAgents } from '@/hooks/useAgents';
import { useDocumentContext } from '@/context/DocumentContext';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';

export function ExportPage() {
  const { documentId, requirements } = useDocumentContext();
  const canExport = Boolean(documentId) || requirements.length > 0;
  const { exportData, error } = useAgents(documentId || '');

  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'json' | 'pdf' | 'csv'>('excel');
  const [exportOptions, setExportOptions] = useState({
    requirements: true,
    tests: true,
    traceability: true,
    charts: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportUrl, setLastExportUrl] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<any[]>([
    {
      fileName: '2024-12-07_Plan_Tests.xlsx',
      date: new Date(Date.now() - 86400000),
      format: 'excel',
      size: 2048576,
    },
    {
      fileName: '2024-12-06_Requirements.json',
      date: new Date(Date.now() - 172800000),
      format: 'json',
      size: 512000,
    },
  ]);

  const disabledReason = useMemo(() => {
    if (!documentId && requirements.length === 0) return "Aucun document actif. Uploadez un document d'abord.";
    return null;
  }, [documentId, requirements]);

  // Génère un fichier et le télécharge directement
  const generateAndDownload = (data: any, filename: string, mimeType: string) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLastExportUrl(url);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      let filename = `export_${timestamp}`;
      let content: string;
      let mimeType: string;

      // Récupérer les données du localStorage ou du contexte
      const storedTests = localStorage.getItem('generated_tests');
      const tests = storedTests ? JSON.parse(storedTests) : [];
      
      const exportPayload = {
        documentId: documentId || 'unknown',
        exportDate: new Date().toISOString(),
        requirements: requirements,
        tests: tests,
        options: exportOptions,
      };

      switch (selectedFormat) {
        case 'json':
          content = JSON.stringify(exportPayload, null, 2);
          filename += '.json';
          mimeType = 'application/json';
          break;
          
        case 'csv':
          // Générer CSV des exigences
          let csv = 'ID,Titre,Description,Type,Priorité,Page\n';
          requirements.forEach((req: any) => {
            csv += `"${req.id}","${req.title || ''}","${(req.description || '').replace(/"/g, '""')}","${req.type || ''}","${req.priority || ''}","${req.pageNumber || ''}"\n`;
          });
          if (exportOptions.tests && tests.length > 0) {
            csv += '\n\nTests Générés\nID Test,ID Exigence,Titre,Description,Statut\n';
            tests.forEach((test: any) => {
              csv += `"${test.id}","${test.requirementId || ''}","${test.title || ''}","${(test.description || '').replace(/"/g, '""')}","${test.status || ''}"\n`;
            });
          }
          content = csv;
          filename += '.csv';
          mimeType = 'text/csv';
          break;
          
        case 'excel':
          // Pour Excel, on génère un CSV compatible (peut être ouvert dans Excel)
          let excelCsv = 'sep=,\nID,Titre,Description,Type,Priorité,Page\n';
          requirements.forEach((req: any) => {
            excelCsv += `"${req.id}","${req.title || ''}","${(req.description || '').replace(/"/g, '""')}","${req.type || ''}","${req.priority || ''}","${req.pageNumber || ''}"\n`;
          });
          content = excelCsv;
          filename += '.csv';
          mimeType = 'text/csv;charset=utf-8';
          break;
          
        case 'pdf':
          // Générer un vrai PDF avec jsPDF
          const pdf = new jsPDF();
          let yPos = 20;
          const pageWidth = pdf.internal.pageSize.getWidth();
          const margin = 20;
          const maxWidth = pageWidth - (margin * 2);
          
          // Titre
          pdf.setFontSize(20);
          pdf.setTextColor(0, 100, 200);
          pdf.text('RAPPORT D\'ANALYSE', pageWidth / 2, yPos, { align: 'center' });
          yPos += 10;
          
          pdf.setFontSize(12);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Date: ${timestamp}`, pageWidth / 2, yPos, { align: 'center' });
          yPos += 15;
          
          // Ligne séparatrice
          pdf.setDrawColor(0, 100, 200);
          pdf.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 10;
          
          // Résumé
          pdf.setFontSize(11);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`Document: ${documentId || 'N/A'}`, margin, yPos);
          yPos += 7;
          pdf.text(`Exigences extraites: ${requirements.length}`, margin, yPos);
          yPos += 7;
          pdf.text(`Tests générés: ${tests.length}`, margin, yPos);
          yPos += 15;
          
          // Section Exigences
          if (exportOptions.requirements && requirements.length > 0) {
            pdf.setFontSize(14);
            pdf.setTextColor(0, 100, 200);
            pdf.text('EXIGENCES', margin, yPos);
            yPos += 10;
            
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            
            requirements.forEach((req: any, i: number) => {
              if (yPos > 270) {
                pdf.addPage();
                yPos = 20;
              }
              
              pdf.setFont('helvetica', 'bold');
              pdf.text(`${i + 1}. [${req.id}] ${req.title || 'Sans titre'}`, margin, yPos);
              yPos += 6;
              
              pdf.setFont('helvetica', 'normal');
              const desc = req.description || '';
              if (desc) {
                const lines = pdf.splitTextToSize(desc, maxWidth - 10);
                lines.slice(0, 3).forEach((line: string) => {
                  pdf.text(`   ${line}`, margin, yPos);
                  yPos += 5;
                });
              }
              yPos += 5;
            });
          }
          
          // Section Tests
          if (exportOptions.tests && tests.length > 0) {
            yPos += 10;
            if (yPos > 250) {
              pdf.addPage();
              yPos = 20;
            }
            
            pdf.setFontSize(14);
            pdf.setTextColor(0, 100, 200);
            pdf.text('TESTS GÉNÉRÉS', margin, yPos);
            yPos += 10;
            
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            
            tests.forEach((test: any, i: number) => {
              if (yPos > 260) {
                pdf.addPage();
                yPos = 20;
              }
              
              // Supporter les deux formats de champs (français et anglais)
              const testTitle = test.nom || test.name || test.title || 'Sans titre';
              const testReqId = test.id_exigence || test.requirementId || 'N/A';
              const testObjectif = test.objectif || test.objective || test.description || '';
              const testType = test.type_test || test.type || 'fonctionnel';
              
              pdf.setFont('helvetica', 'bold');
              pdf.text(`${i + 1}. [${test.id}] ${testTitle}`, margin, yPos);
              yPos += 6;
              
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(80, 80, 80);
              pdf.text(`   Exigence: ${testReqId} | Type: ${testType}`, margin, yPos);
              yPos += 5;
              
              if (testObjectif) {
                const objLines = pdf.splitTextToSize(`   Objectif: ${testObjectif}`, maxWidth - 10);
                objLines.slice(0, 2).forEach((line: string) => {
                  pdf.text(line, margin, yPos);
                  yPos += 4;
                });
              }
              
              pdf.setTextColor(0, 0, 0);
              yPos += 4;
            });
          }
          
          // Télécharger le PDF
          filename += '.pdf';
          pdf.save(filename);
          
          // Pour l'historique, on stocke juste le nom
          setExportHistory((prev) => [
            {
              fileName: filename,
              date: new Date(),
              format: 'pdf',
              size: 0,
              isPdf: true,
            },
            ...prev,
          ]);
          
          setLastExportUrl('pdf-generated');
          setIsExporting(false);
          return; // Sortir car le PDF est déjà téléchargé
          
        default:
          content = JSON.stringify(exportPayload, null, 2);
          filename += '.json';
          mimeType = 'application/json';
      }

      // Télécharger le fichier (pour les formats non-PDF)
      generateAndDownload(content, filename, mimeType);

      // Ajouter à l'historique
      setExportHistory((prev) => [
        {
          fileName: filename,
          date: new Date(),
          format: selectedFormat,
          size: new Blob([content]).size,
          content: content,
          mimeType: mimeType,
        },
        ...prev,
      ]);
      
      setLastExportUrl(filename);

    } catch (err) {
      console.error('Error exporting:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Télécharger depuis l'historique
  const handleDownloadFromHistory = (file: any) => {
    if (file.isPdf) {
      // Pour les PDF, on ne peut pas les re-télécharger sans les régénérer
      alert('Les exports PDF doivent être régénérés. Sélectionnez PDF et cliquez sur "Télécharger l\'Export".');
      return;
    }
    if (file.content) {
      generateAndDownload(file.content, file.fileName, file.mimeType || 'application/octet-stream');
    } else {
      // Fichier de démonstration
      const demoContent = `Fichier de démonstration: ${file.fileName}`;
      generateAndDownload(demoContent, file.fileName, 'text/plain');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatIcons = {
    excel: FileSpreadsheet,
    json: FileJson,
    pdf: FileText,
    csv: FileType,
  };

  const formatColors = {
    excel: 'from-green-600 to-emerald-600',
    json: 'from-yellow-600 to-orange-600',
    pdf: 'from-red-600 to-rose-600',
    csv: 'from-blue-600 to-cyan-600',
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-teal-600/5 to-slate-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700 mb-6">
            <Download className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-slate-300">Export Manager</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Export Multi-Format
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Exportez vos analyses en Excel, JSON, PDF ou CSV avec traçabilité complète
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {!canExport && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertDescription className="flex items-center justify-between text-amber-400">
              <span>Aucun document n'est chargé. Uploadez un document pour générer un export.</span>
              <Link to="/upload" className="text-blue-400 hover:text-blue-300 underline transition-colors">
                Aller à l'upload
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Format Selection */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600/10 to-teal-600/10 border-b border-slate-800 px-6 py-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-400" />
              Sélection du Format
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['excel', 'json', 'pdf', 'csv'] as const).map((format) => {
                const Icon = formatIcons[format];
                return (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedFormat === format
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${formatColors[format]} flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-semibold text-white uppercase">{format}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {format === 'excel' && 'Feuille de calcul'}
                      {format === 'json' && 'Données structurées'}
                      {format === 'pdf' && 'Rapport PDF'}
                      {format === 'csv' && 'Texte délimité'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-b border-slate-800 px-6 py-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-slate-400" />
              Options d'Export
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {[
              { key: 'requirements', label: 'Inclure les exigences', description: 'Liste complète des exigences extraites' },
              { key: 'tests', label: 'Inclure les tests', description: 'Cas de test générés automatiquement' },
              { key: 'traceability', label: 'Matrice de traçabilité', description: 'Lien entre exigences et tests' },
              { key: 'charts', label: 'Graphes de couverture', description: 'Visualisation des métriques' },
            ].map((option) => (
              <div 
                key={option.key} 
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  exportOptions[option.key as keyof typeof exportOptions]
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => setExportOptions((prev) => ({
                  ...prev,
                  [option.key]: !prev[option.key as keyof typeof exportOptions],
                }))}
              >
                <Checkbox
                  id={option.key}
                  checked={exportOptions[option.key as keyof typeof exportOptions]}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      [option.key]: checked,
                    }))
                  }
                  className="border-slate-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <Label htmlFor={option.key} className="flex-1 cursor-pointer">
                  <p className="font-medium text-white">{option.label}</p>
                  <p className="text-sm text-slate-400">{option.description}</p>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="space-y-4">
          <Button
            onClick={handleExport}
            disabled={isExporting || !canExport}
            size="lg"
            className="w-full h-16 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg shadow-green-500/25 text-lg font-semibold rounded-xl"
          >
            {isExporting ? (
              <>
                <Loader className="mr-3 h-6 w-6 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <FileDown className="mr-3 h-6 w-6" />
                Télécharger l'Export ({selectedFormat.toUpperCase()})
              </>
            )}
          </Button>
          
          {lastExportUrl && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-medium">Export généré avec succès !</span>
              </div>
              <span className="text-sm text-slate-400">Le fichier a été téléchargé</span>
            </div>
          )}
        </div>
        {disabledReason && (
          <p className="text-sm text-slate-500 text-center">{disabledReason}</p>
        )}

        {/* Export History */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-b border-slate-800 px-6 py-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              Historique des Exports
            </h3>
          </div>
          
          <div className="p-6">
            {exportHistory.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Aucun export pour le moment</p>
            ) : (
              <div className="space-y-3">
                {exportHistory.map((file, idx) => {
                  const Icon = formatIcons[file.format as keyof typeof formatIcons] || FileText;
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${formatColors[file.format as keyof typeof formatColors] || 'from-slate-600 to-slate-700'} flex items-center justify-center`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{file.fileName}</p>
                          <p className="text-xs text-slate-400">
                            {file.date.toLocaleDateString('fr-FR')} • {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                          {file.format.toUpperCase()}
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => handleDownloadFromHistory(file)}
                          className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
