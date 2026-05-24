import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader, Circle, XCircle, CheckCircle } from 'lucide-react';
import { AgentProgress, AgentStatus } from '@/types/agent';

interface MultiAgentProgressProps {
  agents: AgentProgress[];
}

export function MultiAgentProgress({ agents }: MultiAgentProgressProps) {
  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case AgentStatus.RUNNING:
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      case AgentStatus.ERROR:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case AgentStatus.PAUSED:
        return <Circle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">⚙️ Progression Multi-Agent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.agentName} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(agent.status)}
                <div className="flex-1">
                  <p className="font-medium text-sm">{agent.agentName}</p>
                  {agent.message && (
                    <p className="text-xs text-muted-foreground">{agent.message}</p>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {agent.progress}%
              </span>
            </div>
            <Progress value={agent.progress} className="h-2" />
            {agent.error && (
              <p className="text-xs text-red-500">{agent.error}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
