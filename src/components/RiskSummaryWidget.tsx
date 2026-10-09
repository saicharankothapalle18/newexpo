import React from 'react';
import { UnifiedIncident, RiskLevel } from '../types';
import { getActiveRiskZoneCounts, RISK_COLORS } from '../utils/riskZone';
import { ShieldAlert, AlertTriangle, Info, Radio } from 'lucide-react';

interface RiskSummaryWidgetProps {
    incidents: UnifiedIncident[];
    selectedRiskFilter?: RiskLevel | 'ALL';
    onSelectRiskFilter?: (filter: RiskLevel | 'ALL') => void;
    compact?: boolean;
}

/**
 * Small tactical risk summary widget displaying active zones by severity:
 * 🔴 Critical (Red)
 * 🟠 High Risk (Orange)
 * 🟡 Moderate (Yellow)
 * 
 * STRICT REQUIREMENT: No green category exists or is ever rendered.
 */
export const RiskSummaryWidget: React.FC<RiskSummaryWidgetProps> = ({
    incidents,
    selectedRiskFilter = 'ALL',
    onSelectRiskFilter,
    compact = false
}) => {
    const counts = getActiveRiskZoneCounts(incidents);

    const items: Array<{
        level: RiskLevel;
        title: string;
        count: number;
        colorHex: string;
        bgClass: string;
        textClass: string;
        borderClass: string;
        icon: React.ReactNode;
    }> = [
        {
            level: 'RED',
            title: 'Critical Zones',
            count: counts.red,
            colorHex: RISK_COLORS.RED.hex,
            bgClass: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300',
            textClass: 'text-red-700',
            borderClass: 'border-red-400',
            icon: <ShieldAlert className="w-4 h-4 text-red-600" />
        },
        {
            level: 'ORANGE',
            title: 'High Risk Zones',
            count: counts.orange,
            colorHex: RISK_COLORS.ORANGE.hex,
            bgClass: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300',
            textClass: 'text-amber-800',
            borderClass: 'border-amber-400',
            icon: <AlertTriangle className="w-4 h-4 text-amber-600" />
        },
        {
            level: 'YELLOW',
            title: 'Moderate Zones',
            count: counts.yellow,
            colorHex: RISK_COLORS.YELLOW.hex,
            bgClass: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300',
            textClass: 'text-yellow-800',
            borderClass: 'border-yellow-400',
            icon: <Info className="w-4 h-4 text-yellow-600" />
        }
    ];

    if (compact) {
        return (
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-sky-400/30 text-xs shadow-md">
                <span className="text-[11px] font-mono font-medium text-slate-600 uppercase tracking-wider mr-1 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-sky-600 animate-pulse" />
                    Zones:
                </span>
                {items.map(item => {
                    const isSelected = selectedRiskFilter === item.level;
                    return (
                        <button
                            key={item.level}
                            type="button"
                            onClick={() => onSelectRiskFilter && onSelectRiskFilter(isSelected ? 'ALL' : item.level)}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all border ${item.bgClass} ${
                                isSelected ? 'ring-2 ring-sky-500/50 shadow-sm' : ''
                            }`}
                            title={`Filter ${item.title}`}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.colorHex }} />
                            <span>{item.count}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="bg-white/95 backdrop-blur-md border border-sky-400/30 rounded-xl p-3 shadow-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-400/20">
                <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-slate-900 tracking-wider uppercase">
                        Active Risk Zones
                    </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                    Total: <strong className="text-slate-900">{counts.total}</strong> active
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {items.map(item => {
                    const isSelected = selectedRiskFilter === item.level;
                    return (
                        <button
                            key={item.level}
                            type="button"
                            onClick={() => onSelectRiskFilter && onSelectRiskFilter(isSelected ? 'ALL' : item.level)}
                            className={`flex flex-col p-2 rounded-lg border transition-all text-left ${item.bgClass} ${
                                isSelected ? 'ring-2 ring-sky-500/50 shadow-md scale-[1.02]' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="text-xs">{item.icon}</span>
                                <span className={`text-base font-bold font-mono ${item.textClass}`}>
                                    {item.count}
                                </span>
                            </div>
                            <div className="mt-1 text-[11px] font-medium leading-tight">
                                {item.level === 'RED' && '🔴 Critical'}
                                {item.level === 'ORANGE' && '🟠 High Risk'}
                                {item.level === 'YELLOW' && '🟡 Moderate'}
                            </div>
                        </button>
                    );
                })}
            </div>

            {selectedRiskFilter !== 'ALL' && onSelectRiskFilter && (
                <div className="mt-2 text-right">
                    <button
                        type="button"
                        onClick={() => onSelectRiskFilter('ALL')}
                        className="text-[10px] text-sky-600 hover:text-sky-800 underline font-mono"
                    >
                        Reset Filter (Show All)
                    </button>
                </div>
            )}
        </div>
    );
};

