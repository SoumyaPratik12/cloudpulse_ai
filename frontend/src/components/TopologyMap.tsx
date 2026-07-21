import React from 'react'
import { 
  Cpu, 
  Database, 
  HardDrive, 
  ArrowRightLeft,
  Network,
  Lock,
  Zap,
  Loader2,
  AlertTriangle
} from 'lucide-react'

export interface TopologyNode {
  id: string
  name: string
  type: string
  state: 'planned' | 'provisioning' | 'live' | 'degraded' | 'error'
  cpu?: number
  errorRate?: number
  connectionCount?: number
  cost?: number
  drifted?: boolean
}

interface TopologyMapProps {
  nodes: TopologyNode[]
  onNodeClick?: (node: TopologyNode) => void
}

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  vpc: { x: 140, y: 55 },
  iam: { x: 500, y: 55 },
  alb: { x: 320, y: 135 },
  ecs: { x: 320, y: 220 },
  ec2: { x: 320, y: 220 },
  lambda: { x: 320, y: 220 },
  s3: { x: 160, y: 315 },
  rds: { x: 480, y: 315 },
}

export const TopologyMap: React.FC<TopologyMapProps> = ({ nodes, onNodeClick }) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'vpc': return <Network className="h-5 w-5" />
      case 'iam': return <Lock className="h-5 w-5" />
      case 'alb': return <ArrowRightLeft className="h-5 w-5" />
      case 'ecs': return <Cpu className="h-5 w-5" />
      case 'ec2': return <Cpu className="h-5 w-5" />
      case 'lambda': return <Zap className="h-5 w-5" />
      case 's3': return <HardDrive className="h-5 w-5" />
      case 'rds': return <Database className="h-5 w-5" />
      default: return <Network className="h-5 w-5" />
    }
  }

  const getNodeStyles = (state: string) => {
    switch (state) {
      case 'planned':
        return 'bg-slate-50 dark:bg-neutral-800 text-slate-400 border-slate-200 dark:border-neutral-700 opacity-60'
      case 'provisioning':
        return 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 border-sky-500 animate-pulse border-2'
      case 'live':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-500 border-2'
      case 'degraded':
      case 'error':
        return 'bg-red-50 dark:bg-red-950/20 text-red-600 border-red-500 animate-bounce border-2'
      default:
        return 'bg-slate-50 dark:bg-neutral-800 text-slate-400 border-slate-200'
    }
  }

  // Draw connections dynamically if nodes are present
  const hasNode = (id: string) => nodes.some(n => n.id === id)
  const getNodeState = (id: string) => nodes.find(n => n.id === id)?.state || 'planned'

  const getLineColor = (fromId: string, toId: string) => {
    const fromState = getNodeState(fromId)
    const toState = getNodeState(toId)
    if (fromState === 'live' && toState === 'live') return '#10b981' // Green for healthy active connection
    if (fromState === 'degraded' || toState === 'degraded' || fromState === 'error' || toState === 'error') return '#ef4444' // Red
    if (fromState === 'provisioning' || toState === 'provisioning') return '#0284c7' // Blue
    return '#cbd5e1' // Gray
  }

  return (
    <div className="w-full bg-slate-50/50 dark:bg-neutral-800/20 border border-slate-100 dark:border-neutral-700/60 rounded-2xl p-lg flex flex-col items-center">
      <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-neutral-700/60 pb-sm mb-md text-xs text-slate-400">
        <span className="flex items-center gap-1"><Network className="h-4 w-4 text-sky-500" /> Interactive Infrastructure Canvas</span>
        <span className="text-slate-400 font-medium flex items-center gap-1.5">
          Click nodes to inspect logs, attached IAM policies and CloudWatch metrics
        </span>
      </div>

      <div className="relative w-full max-w-[640px] aspect-[4/3] bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-xl p-md shadow-inner overflow-hidden">
        {/* Animated Background Grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />

        {/* SVG Drawing Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -40;
                }
              }
              .flow-path {
                stroke-dasharray: 8, 8;
                animation: dash 2.5s linear infinite;
              }
            `}</style>
          </defs>

          {/* VPC to ALB */}
          {hasNode('vpc') && hasNode('alb') && (
            <path 
              d={`M ${NODE_POSITIONS.vpc.x} ${NODE_POSITIONS.vpc.y} L ${NODE_POSITIONS.alb.x} ${NODE_POSITIONS.alb.y}`} 
              stroke={getLineColor('vpc', 'alb')} 
              strokeWidth="2" 
              className="flow-path" 
              fill="none" 
            />
          )}

          {/* ALB to Compute Node */}
          {hasNode('alb') && (hasNode('ecs') || hasNode('ec2') || hasNode('lambda')) && (
            <path 
              d={`M ${NODE_POSITIONS.alb.x} ${NODE_POSITIONS.alb.y} L ${NODE_POSITIONS.ecs.x} ${NODE_POSITIONS.ecs.y}`} 
              stroke={getLineColor('alb', hasNode('ecs') ? 'ecs' : hasNode('ec2') ? 'ec2' : 'lambda')} 
              strokeWidth="2" 
              className="flow-path" 
              fill="none" 
            />
          )}

          {/* IAM to Compute Node */}
          {hasNode('iam') && (hasNode('ecs') || hasNode('ec2') || hasNode('lambda')) && (
            <path 
              d={`M ${NODE_POSITIONS.iam.x} ${NODE_POSITIONS.iam.y} L ${NODE_POSITIONS.ecs.x} ${NODE_POSITIONS.ecs.y}`} 
              stroke={getLineColor('iam', hasNode('ecs') ? 'ecs' : hasNode('ec2') ? 'ec2' : 'lambda')} 
              strokeWidth="2" 
              className="flow-path" 
              fill="none" 
            />
          )}

          {/* Compute Node to S3 */}
          {hasNode('s3') && (hasNode('ecs') || hasNode('ec2') || hasNode('lambda')) && (
            <path 
              d={`M ${NODE_POSITIONS.ecs.x} ${NODE_POSITIONS.ecs.y} L ${NODE_POSITIONS.s3.x} ${NODE_POSITIONS.s3.y}`} 
              stroke={getLineColor(hasNode('ecs') ? 'ecs' : hasNode('ec2') ? 'ec2' : 'lambda', 's3')} 
              strokeWidth="2" 
              className="flow-path" 
              fill="none" 
            />
          )}

          {/* Compute Node to RDS */}
          {hasNode('rds') && (hasNode('ecs') || hasNode('ec2') || hasNode('lambda')) && (
            <path 
              d={`M ${NODE_POSITIONS.ecs.x} ${NODE_POSITIONS.ecs.y} L ${NODE_POSITIONS.rds.x} ${NODE_POSITIONS.rds.y}`} 
              stroke={getLineColor(hasNode('ecs') ? 'ecs' : hasNode('ec2') ? 'ec2' : 'lambda', 'rds')} 
              strokeWidth="2" 
              className="flow-path" 
              fill="none" 
            />
          )}
        </svg>

        {/* Nodes Grid */}
        {nodes.map(node => {
          const pos = NODE_POSITIONS[node.id] || { x: 320, y: 160 }
          const styles = getNodeStyles(node.state)
          const icon = getNodeIcon(node.type)

          return (
            <div 
              key={node.id}
              onClick={() => onNodeClick?.(node)}
              className="absolute flex flex-col items-center group cursor-pointer"
              style={{ top: `${pos.y - 30}px`, left: `${pos.x - 45}px`, width: '90px' }}
            >
              <div className={`p-2.5 rounded-full border shadow-md transition-all duration-200 group-hover:scale-110 flex items-center justify-center relative ${styles}`}>
                {icon}
                
                {/* Micro indicators */}
                {node.state === 'provisioning' && (
                  <span className="absolute -top-1 -right-1 bg-sky-500 text-white rounded-full p-0.5 shadow-sm">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  </span>
                )}
                {node.state === 'live' && !node.drifted && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 rounded-full h-3 w-3 shadow-sm border border-white dark:border-neutral-900 animate-pulse" />
                )}
                {node.state === 'live' && node.drifted && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm animate-bounce">
                    <AlertTriangle className="h-2.5 w-2.5" />
                  </span>
                )}
                {(node.state === 'degraded' || node.state === 'error') && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm animate-ping">
                    <AlertTriangle className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold text-center text-neutral-800 dark:text-neutral-200 mt-1 uppercase truncate w-full block">
                {node.name}
              </span>
              {node.state === 'live' && node.cpu !== undefined && (
                <span className="text-[8px] text-slate-400 font-semibold block">
                  CPU: {node.cpu}%
                </span>
              )}
              {node.state === 'provisioning' && (
                <span className="text-[8px] text-sky-500 font-bold block animate-pulse">
                  Building...
                </span>
              )}
              {node.state === 'planned' && (
                <span className="text-[8px] text-slate-400 font-medium block">
                  Planned
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
