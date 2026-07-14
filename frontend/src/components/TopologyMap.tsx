import React from 'react'
import { 
  Globe, 
  Cpu, 
  Database, 
  HardDrive, 
  ArrowRightLeft,
  Network 
} from 'lucide-react'

export const TopologyMap: React.FC = () => {
  return (
    <div className="w-full bg-slate-50/50 dark:bg-neutral-800/20 border border-slate-100 dark:border-neutral-700/60 rounded-2xl p-lg flex flex-col items-center">
      <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-neutral-700/60 pb-sm mb-md text-xs text-slate-400">
        <span className="flex items-center gap-1"><Network className="h-4 w-4 text-sky-500" /> Infrastructure Link Health</span>
        <span className="text-emerald-500 font-bold uppercase flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" /> Synchronized
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
                animation: dash 2s linear infinite;
              }
            `}</style>
          </defs>

          {/* Internet to Load Balancer */}
          <path d="M 320 60 L 320 130" stroke="#0284c7" strokeWidth="2.5" className="flow-path" fill="none" />

          {/* Load Balancer to EC2 Cluster */}
          <path d="M 320 130 L 320 210" stroke="#0284c7" strokeWidth="2.5" className="flow-path" fill="none" />

          {/* EC2 Cluster to S3 Bucket */}
          <path d="M 320 210 L 160 300" stroke="#10b981" strokeWidth="2.5" className="flow-path" fill="none" />

          {/* EC2 Cluster to RDS Database */}
          <path d="M 320 210 L 480 300" stroke="#8b5cf6" strokeWidth="2.5" className="flow-path" fill="none" />
        </svg>

        {/* Node: Internet */}
        <div className="absolute top-[3%] left-[43%] flex flex-col items-center group">
          <div className="p-3 bg-slate-100 dark:bg-neutral-800 border-2 border-slate-300 rounded-full flex items-center justify-center text-slate-600 shadow-md transition-transform group-hover:scale-110">
            <Globe className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Internet (WAN)</span>
        </div>

        {/* Node: Load Balancer */}
        <div className="absolute top-[28%] left-[43%] flex flex-col items-center group">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/20 border-2 border-sky-500 rounded-full flex items-center justify-center text-sky-600 shadow-md transition-transform group-hover:scale-110">
            <ArrowRightLeft className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold text-sky-600 mt-1 uppercase">Application Load Balancer</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 animate-pulse" />
        </div>

        {/* Node: EC2 Cluster */}
        <div className="absolute top-[52%] left-[43%] flex flex-col items-center group">
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-500 rounded-full flex items-center justify-center text-orange-600 shadow-md transition-transform group-hover:scale-110">
            <Cpu className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold text-orange-600 mt-1 uppercase">EC2 Instances</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 animate-pulse" />
        </div>

        {/* Node: S3 Bucket */}
        <div className="absolute bottom-[10%] left-[15%] flex flex-col items-center group">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-600 shadow-md transition-transform group-hover:scale-110">
            <HardDrive className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold text-emerald-600 mt-1 uppercase">S3 Storage</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 animate-pulse" />
        </div>

        {/* Node: RDS Database */}
        <div className="absolute bottom-[10%] right-[15%] flex flex-col items-center group">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border-2 border-purple-500 rounded-full flex items-center justify-center text-purple-600 shadow-md transition-transform group-hover:scale-110">
            <Database className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold text-purple-600 mt-1 uppercase">RDS Databases</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
