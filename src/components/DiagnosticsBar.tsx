import React from 'react';
import type { StreamStats, VisualizerConfig } from '../types/visualizer';
import { Activity, Sparkles, Cpu } from 'lucide-react';

interface DiagnosticsBarProps {
  stats: StreamStats;
  config: VisualizerConfig;
}

export const DiagnosticsBar: React.FC<DiagnosticsBarProps> = ({ stats, config }) => {
  if (!config.showDiagnostics) return null;

  return (
    <div className="floating-hud-badge" title="Performance & Resolution telemetry">
      <span className="hud-metric">
        <Activity size={12} className="text-emerald-400" />
        <span className="hud-val">{stats.fps.toFixed(0)} FPS</span>
      </span>
      <span className="hud-sep">•</span>
      <span className="hud-metric">
        <Sparkles size={12} className="text-amber-400" />
        <span className="hud-val">
          {stats.activeElements > 1000
            ? `${(stats.activeElements / 1000).toFixed(1)}k`
            : stats.activeElements}
        </span>
      </span>
      <span className="hud-sep">•</span>
      <span className="hud-metric">
        <Cpu size={12} className="text-cyan-400" />
        <span className="hud-val">{config.engineType === 'webgl' ? 'GPU' : '2D'}</span>
      </span>
    </div>
  );
};
