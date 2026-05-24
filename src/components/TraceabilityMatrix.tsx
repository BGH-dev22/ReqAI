import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { TraceabilityLink } from '@/types/test';

interface TraceabilityMatrixProps {
  links: TraceabilityLink[];
  totalCoverage: number;
}

export function TraceabilityMatrix({ links = [], totalCoverage = 0 }: TraceabilityMatrixProps) {
  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'bg-green-500';
    if (coverage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Si pas de liens, afficher un message
  if (!links || links.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">🔗 Matrice de Traçabilité</CardTitle>
            <Badge variant="outline">
              Couverture globale: 0%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune liaison exigence-test disponible. Générez des tests pour voir la matrice.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">🔗 Matrice de Traçabilité</CardTitle>
          <Badge variant="outline">
            Couverture globale: {Math.round(totalCoverage)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="font-semibold">Exigence</TableHead>
                <TableHead className="font-semibold">Tests Associés</TableHead>
                <TableHead className="font-semibold">Couverture</TableHead>
                <TableHead className="font-semibold">Vérifiée</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link, linkIndex) => (
                <TableRow key={link.requirementId || link.id || `link-${linkIndex}`} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {link.requirementId || link.id || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(link.testIds || link.test_ids || []).map((testId: string, testIndex: number) => (
                        <Badge key={`${testId}-${testIndex}`} variant="secondary" className="text-xs">
                          {testId}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-full max-w-xs">
                      <Progress value={link.coverage} className="flex-1 h-2" />
                      <span className="text-xs font-medium min-w-fit">
                        {Math.round(link.coverage)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={link.verified ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {link.verified ? '✓ Vérifié' : 'Non vérifié'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
