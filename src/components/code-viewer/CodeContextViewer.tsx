import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';
import { Finding, FindingStatus } from '../../types/index.ts';
import {
  ConfidenceLabel,
  DemoMarker,
  SeverityTag,
  StatusLabel,
} from '../common/SeverityBadge.tsx';

const ALL_STATUSES: FindingStatus[] = [
  'OPEN',
  'REVIEWED',
  'FALSE POSITIVE',
  'ACCEPTED RISK',
  'RESOLVED',
];

export const CodeContextViewer: React.FC<{
  finding: Finding;
  onClose?: () => void;
}> = ({ finding, onClose }) => {
  const { updateFindingStatus, getEphemeralRawSecret } = useScanner();
  const [copiedLoc, setCopiedLoc] = useState(false);
  const [revealRequested, setRevealRequested] = useState(false);

  // Reset reveal state whenever user switches to a different finding
  useEffect(() => {
    setRevealRequested(false);
    setCopiedLoc(false);
  }, [finding.id]);

  const rawSecret = revealRequested ? getEphemeralRawSecret(finding.id) : null;

  const handleCopyLocation = async () => {
    try {
      await navigator.clipboard.writeText(`${finding.filePath}:${finding.lineNumber}`);
      setCopiedLoc(true);
      setTimeout(() => setCopiedLoc(false), 2000);
    } catch {
      // Ignore clipboard failure cleanly
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-[#222933] flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityTag severity={finding.severity} />
            <ConfidenceLabel confidence={finding.confidence} />
            <StatusLabel status={finding.status} />
            {finding.isDemo && <DemoMarker />}
            {finding.isHeuristicOnly && (
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-300">
                Heuristic-only
              </span>
            )}
          </div>
          <h3 className="text-base font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            {finding.ruleName}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-[#8B949E]">
            <span className="break-all text-slate-800 dark:text-[#E6EDF3]">
              {finding.filePath}:{finding.lineNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span>{finding.ruleId}</span>
            <span aria-hidden="true">·</span>
            <span>{finding.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyLocation}
            title="Copy file path and line number (never copies secret)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border border-slate-200 dark:border-[#30363D] text-slate-700 dark:text-[#E6EDF3] hover:bg-slate-50 dark:hover:bg-[#161B22] cursor-pointer"
          >
            {copiedLoc ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied Location</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy file:line</span>
              </>
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close detail panel"
              className="p-1.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5 overflow-y-auto flex-1">
        {/* Status Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-[#8B949E]">
            Triage Status
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((st) => {
              const active = finding.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => updateFindingStatus(finding.id, st)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'border border-slate-200 dark:border-[#30363D] text-slate-700 dark:text-[#8B949E] hover:bg-slate-100 dark:hover:bg-[#161B22]'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Masked Value + Explicit Opt-In Reveal */}
        <div className="rounded-md border border-slate-200 dark:border-[#222933] bg-slate-50 dark:bg-[#0B0D10] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-[#8B949E]">
              Matched Value (Masked by Default)
            </span>
            <button
              type="button"
              onClick={() => setRevealRequested((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
            >
              {revealRequested ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide Value</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reveal In-Memory Value</span>
                </>
              )}
            </button>
          </div>

          <code className="block font-mono text-xs text-slate-900 dark:text-[#E6EDF3] break-all select-all">
            {revealRequested
              ? rawSecret ?? '[Unavailable — ephemeral memory cleared]'
              : finding.maskedValue}
          </code>

          {revealRequested && (
            <div className="flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300 pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Security warning: Displaying unmasked potential credentials on screen. Ensure no screen sharing or recording is active. Value exists only in current session memory.
              </span>
            </div>
          )}
        </div>

        {/* Safely Escaped Code Context Viewer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8B949E]">
            <span>Code Context (Safely Escaped &amp; Masked)</span>
            <span className="font-mono">
              Line {finding.lineNumber}, Col {finding.columnNumber}
            </span>
          </div>

          <div className="rounded-md border border-slate-200 dark:border-[#222933] bg-slate-950 text-slate-100 overflow-x-auto">
            <div className="py-2 font-mono text-xs leading-6">
              {finding.contextLines.map((ctx) => (
                <div
                  key={ctx.lineNumber}
                  className={`flex px-3 ${
                    ctx.isMatchLine
                      ? 'bg-red-500/15 text-red-100'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="w-10 shrink-0 select-none text-right pr-3 text-slate-500 tabular-nums">
                    {ctx.lineNumber}
                  </span>
                  <pre className="whitespace-pre-wrap break-all flex-1 font-mono">
                    {ctx.maskedContent}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why Flagged */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            Why This Was Flagged
          </h4>
          <p className="text-xs text-slate-600 dark:text-[#8B949E] leading-relaxed">
            {finding.explanation}
          </p>
        </div>

        {/* Remediation Guidance */}
        <div className="space-y-2 rounded-md border border-slate-200 dark:border-[#222933] bg-slate-50 dark:bg-[#161B22] p-4">
          <div className="flex items-center gap-2 text-xs font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Recommended Defensive Remediation ({finding.category})</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-[#8B949E]">
            {finding.remediation.map((step, i) => (
              <li key={i} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-500 dark:text-[#6E7681] pt-1">
            Guidance only: KeyFence never modifies your source files or contacts external providers automatically.
          </p>
        </div>
      </div>
    </div>
  );
};
