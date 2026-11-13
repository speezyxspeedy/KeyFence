import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useScanner } from '../../context/ScannerContext.tsx';
import { validateCustomRegex } from '../../services/detectionRules.ts';
import { Confidence, RuleCategory, Severity } from '../../types/index.ts';
import { ConfidenceLabel, SeverityTag } from '../common/SeverityBadge.tsx';

const RULE_CATEGORIES: RuleCategory[] = [
  'Cloud Credentials',
  'API Authentication',
  'Database Credentials',
  'Private Key Exposure',
  'Generic Password Assignment',
  'Webhook Credentials',
  'Configuration Secrets',
  'High Entropy Values',
];

export const RulesDetectionView: React.FC = () => {
  const {
    rules,
    toggleRuleEnabled,
    addCustomRule,
    deleteCustomRule,
    resetRulesToDefault,
  } = useScanner();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RuleCategory | 'ALL'>('ALL');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Custom rule form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RuleCategory>('API Authentication');
  const [severity, setSeverity] = useState<Severity>('HIGH');
  const [baseConfidence, setBaseConfidence] = useState<Confidence>('Medium');
  const [pattern, setPattern] = useState('');
  const [description, setDescription] = useState('');
  const [remediation, setRemediation] = useState(
    'Remove the matched secret from tracked files.\nRotate the credential with the provider.'
  );
  const [testSample, setTestSample] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const regexValidation = useMemo(() => {
    if (!pattern.trim()) return null;
    return validateCustomRegex(pattern);
  }, [pattern]);

  const sampleTestMatches = useMemo(() => {
    if (!regexValidation?.valid || !testSample) return null;
    try {
      const re = new RegExp(pattern.trim(), 'g');
      const matches: string[] = [];
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(testSample)) !== null && guard < 10) {
        guard++;
        if (m[0].length === 0) {
          re.lastIndex++;
          continue;
        }
        matches.push(m[1] || m[0]);
      }
      return matches;
    } catch {
      return null;
    }
  }, [regexValidation, pattern, testSample]);

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rules.filter((r) => {
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      if (q) {
        const hay = `${r.id} ${r.name} ${r.category} ${r.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rules, search, categoryFilter]);

  const handleCreateCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Rule name is required.');
      return;
    }

    const validation = validateCustomRegex(pattern);
    if (!validation.valid) {
      setFormError(validation.error || 'Invalid regular expression.');
      return;
    }

    addCustomRule({
      name,
      category,
      severity,
      baseConfidence,
      pattern,
      description,
      remediation,
    });

    setName('');
    setPattern('');
    setDescription('');
    setTestSample('');
    setShowCustomForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-[#E6EDF3]">
            Rules &amp; Detection Engine
          </h1>
          <p className="text-sm text-slate-600 dark:text-[#8B949E] mt-1">
            Enable, disable, or extend local detection rules across {rules.length} built-in and custom patterns.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetRulesToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-slate-200 dark:border-[#30363D] text-slate-700 dark:text-[#E6EDF3] hover:bg-slate-50 dark:hover:bg-[#161B22] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCustomForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Regex Rule</span>
          </button>
        </div>
      </div>

      {/* Custom Rule Builder */}
      {showCustomForm && (
        <form
          onSubmit={handleCreateCustomRule}
          className="rounded-lg border border-emerald-500/35 bg-white dark:bg-[#11151B] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
              Create Local Custom Regex Rule
            </h2>
            <span className="text-xs text-slate-500 dark:text-[#8B949E]">
              Protected against empty matches &amp; catastrophic backtracking
            </span>
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded border border-red-500/35 bg-red-500/10 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
                Rule Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Internal Service Token"
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RuleCategory)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
              >
                {RULE_CATEGORIES.filter((c) => c !== 'High Entropy Values').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
                  Confidence
                </label>
                <select
                  value={baseConfidence}
                  onChange={(e) => setBaseConfidence(e.target.value as Confidence)}
                  className="w-full px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
                Regex Pattern (JavaScript RegExp, bounded quantifiers recommended)
              </label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g. \b(corp_tok_[A-Za-z0-9]{16,40})\b"
                className="w-full px-3 py-1.5 font-mono text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
              />
              {regexValidation && (
                <p
                  className={`text-[11px] mt-1 flex items-center gap-1 ${
                    regexValidation.valid
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {regexValidation.valid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid &amp; safe regex pattern</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{regexValidation.error}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
                Test Sample Line (Optional local check)
              </label>
              <input
                type="text"
                value={testSample}
                onChange={(e) => setTestSample(e.target.value)}
                placeholder="Paste a sample string to test match count..."
                className="w-full px-3 py-1.5 font-mono text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
              />
              {sampleTestMatches !== null && (
                <p className="text-[11px] text-slate-500 dark:text-[#8B949E] mt-1">
                  Matched {sampleTestMatches.length} occurrence(s) in sample input.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what this rule detects..."
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-[#E6EDF3] mb-1">
                Remediation Guidance (one step per line)
              </label>
              <textarea
                rows={2}
                value={remediation}
                onChange={(e) => setRemediation(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-[#2B323D] bg-slate-50 dark:bg-[#0B0D10] text-slate-900 dark:text-[#E6EDF3]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="px-3 py-1.5 rounded text-xs font-medium border border-slate-200 dark:border-[#30363D] text-slate-700 dark:text-[#E6EDF3] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
            >
              Save Custom Rule
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules by ID, name, or description..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] text-slate-900 dark:text-[#E6EDF3]"
          />
        </div>
        <select
          aria-label="Filter rules by category"
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as RuleCategory | 'ALL')
          }
          className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] text-slate-900 dark:text-[#E6EDF3]"
        >
          <option value="ALL">All Categories</option>
          {RULE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Rules List */}
      <div className="rounded-lg border border-slate-200 dark:border-[#222933] bg-white dark:bg-[#11151B] divide-y divide-slate-200 dark:divide-[#222933]">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityTag severity={rule.severity} />
                <span className="font-mono text-xs text-slate-500 dark:text-[#8B949E]">
                  {rule.id}
                </span>
                <span className="text-sm font-display font-semibold text-slate-900 dark:text-[#E6EDF3]">
                  {rule.name}
                </span>
                {rule.isCustom && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300">
                    CUSTOM
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-[#8B949E]">
                {rule.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-[#6E7681]">
                <span>{rule.category}</span>
                <span aria-hidden="true">·</span>
                <ConfidenceLabel confidence={rule.baseConfidence} />
                <span aria-hidden="true">·</span>
                <code className="font-mono truncate max-w-md">{rule.pattern}</code>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {rule.isCustom && (
                <button
                  type="button"
                  onClick={() => deleteCustomRule(rule.id)}
                  aria-label={`Delete custom rule ${rule.name}`}
                  className="p-1.5 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                role="switch"
                aria-checked={rule.enabled}
                onClick={() => toggleRuleEnabled(rule.id)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  rule.enabled
                    ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-[#30363D] bg-slate-100 dark:bg-[#161B22] text-slate-500 dark:text-[#8B949E]'
                }`}
              >
                {rule.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
