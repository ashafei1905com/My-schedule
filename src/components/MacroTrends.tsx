import React, { useState, useMemo, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';

export interface MacroTargets {
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  kcal: number;
  source?: string;
}

export interface DayMacroData {
  iso: string;
  dayLabel: string;
  fullDayLabel: string;
  isToday: boolean;
  consumed: {
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    kcal: number;
  };
  target: MacroTargets;
}

export interface MacroTrendsProps {
  userSettings?: any;
  selectedDate?: string;
  historyData?: any;
  onClose?: () => void;
  lang?: 'ar' | 'en';
}

// Helper to resolve user targets from USER_SETTINGS
export function resolveUserTargets(settings?: any): MacroTargets {
  const s = settings || (typeof window !== 'undefined' ? (window as any).USER_SETTINGS : {}) || {};
  const fm = s.fitness_metrics || {};

  const p = Number(fm.target_protein || s.target_protein || fm.protein || s.protein || 140);
  const c = Number(fm.target_carbs || s.target_carbs || fm.carbs || s.carbs || 210);
  const f = Number(fm.target_fats || s.target_fats || fm.fats || fm.fat || s.fat || s.fats || 65);
  const b = Number(fm.target_fiber || s.target_fiber || fm.fiber || s.fiber || 30);
  const k = Number(fm.target_kcal || s.target_kcal || fm.kcal || s.calories || s.kcal || (p * 4 + c * 4 + f * 9));

  return {
    protein: Math.round(p),
    carbs: Math.round(c),
    fats: Math.round(f),
    fiber: Math.round(b),
    kcal: Math.round(k),
    source: (fm.target_kcal || s.target_protein) ? 'fitness_wizard' : 'default_plan'
  };
}

// Fetch macro data for a specific day
export function getDayMacroStats(isoDate: string, userTargets: MacroTargets): DayMacroData {
  const w = typeof window !== 'undefined' ? (window as any) : {};
  let consumed = { protein: 0, carbs: 0, fats: 0, fiber: 0, kcal: 0 };
  let dayTarget = { ...userTargets };

  if (typeof w.computeDayMacros === 'function' && typeof w.getJDfromISO === 'function') {
    try {
      const jd = w.getJDfromISO(isoDate);
      const res = w.computeDayMacros(jd, isoDate);
      if (res && res.consumed) {
        consumed = {
          protein: Math.round((res.consumed.p || 0) * 10) / 10,
          carbs: Math.round((res.consumed.c || 0) * 10) / 10,
          fats: Math.round((res.consumed.f || 0) * 10) / 10,
          fiber: Math.round((res.consumed.b || 0) * 10) / 10,
          kcal: Math.round(res.consumed.k || (res.consumed.p * 4 + res.consumed.c * 4 + res.consumed.f * 9) || 0)
        };
      }
      if (res && res.target && res.target.p > 0) {
        dayTarget = {
          protein: Math.round(res.target.p),
          carbs: Math.round(res.target.c),
          fats: Math.round(res.target.f),
          fiber: Math.round(res.target.b || 30),
          kcal: Math.round(res.target.k || (res.target.p * 4 + res.target.c * 4 + res.target.f * 9)),
          source: userTargets.source
        };
      }
    } catch (e) {
      console.warn('Error fetching day macros:', e);
    }
  }

  // Day labels
  const dateObj = new Date(isoDate + 'T00:00:00');
  const dayIdx = isNaN(dateObj.getDay()) ? 0 : dateObj.getDay();
  const arDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arShort = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const enDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const enShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const todayISO = w.TODAY || new Date().toISOString().slice(0, 10);
  const isToday = isoDate === todayISO;

  return {
    iso: isoDate,
    dayLabel: w.USER_SETTINGS?.lang === 'en' ? enShort[dayIdx] : arShort[dayIdx],
    fullDayLabel: w.USER_SETTINGS?.lang === 'en' ? enDays[dayIdx] : arDays[dayIdx],
    isToday,
    consumed,
    target: dayTarget
  };
}

export const MacroTrends: React.FC<MacroTrendsProps> = ({
  userSettings,
  selectedDate,
  onClose,
  lang: initialLang
}) => {
  const w = typeof window !== 'undefined' ? (window as any) : {};
  const currentSettings = userSettings || w.USER_SETTINGS || {};
  const isEn = (initialLang || currentSettings.lang) === 'en';

  const [activeDate, setActiveDate] = useState<string>(
    selectedDate || w.SELECTED_DATE || w.TODAY || new Date().toISOString().slice(0, 10)
  );
  const [viewMode, setViewMode] = useState<'comparison' | 'trends' | 'ratio'>('comparison');
  const [rangeType, setRangeType] = useState<'today' | '7days' | 'week'>('7days');
  const [unit, setUnit] = useState<'grams' | 'calories'>('grams');

  // Sync with global state if it changes
  useEffect(() => {
    if (selectedDate && selectedDate !== activeDate) {
      setActiveDate(selectedDate);
    }
  }, [selectedDate]);

  const targets = useMemo(() => resolveUserTargets(currentSettings), [currentSettings]);

  // Build days list based on selected range
  const daysData = useMemo(() => {
    const todayISO = w.TODAY || new Date().toISOString().slice(0, 10);
    const dateOff = (offset: number, base: string) => {
      if (typeof w.dateOff === 'function') return w.dateOff(offset, base);
      const d = new Date(base + 'T00:00:00');
      d.setDate(d.getDate() + offset);
      return d.toISOString().slice(0, 10);
    };

    const currentWeekStartISO = (base: string) => {
      if (typeof w.currentWeekStartISO === 'function') return w.currentWeekStartISO(base);
      const d = new Date(base + 'T00:00:00');
      const day = d.getDay();
      const diff = (day + 1) % 7; // Saturday as 0 in Islamic / Arab calendar
      d.setDate(d.getDate() - diff);
      return d.toISOString().slice(0, 10);
    };

    const result: DayMacroData[] = [];

    if (rangeType === 'today') {
      result.push(getDayMacroStats(activeDate, targets));
    } else if (rangeType === 'week') {
      const startSat = currentWeekStartISO(todayISO);
      for (let i = 0; i < 7; i++) {
        const iso = dateOff(i, startSat);
        result.push(getDayMacroStats(iso, targets));
      }
    } else {
      // Last 7 days
      for (let i = -6; i <= 0; i++) {
        const iso = dateOff(i, todayISO);
        result.push(getDayMacroStats(iso, targets));
      }
    }
    return result;
  }, [rangeType, activeDate, targets, w]);

  // Current day data for direct comparison
  const currentDayStats = useMemo(() => {
    const found = daysData.find(d => d.iso === activeDate);
    return found || getDayMacroStats(activeDate, targets);
  }, [daysData, activeDate, targets]);

  // Comparison Bar Chart Data (Category comparison: Protein, Carbs, Fats)
  const comparisonData = useMemo(() => {
    const c = currentDayStats.consumed;
    const t = currentDayStats.target;

    const multiplier = unit === 'calories' ? { p: 4, c: 4, f: 9 } : { p: 1, c: 1, f: 1 };
    const unitLabel = unit === 'calories' ? (isEn ? 'kcal' : 'سعرة') : (isEn ? 'g' : 'جم');

    return [
      {
        macroKey: 'protein',
        name: isEn ? 'Protein' : 'البروتين',
        consumed: Math.round(c.protein * multiplier.p),
        target: Math.round(t.protein * multiplier.p),
        pct: t.protein > 0 ? Math.round((c.protein / t.protein) * 100) : 0,
        unit: unitLabel,
        color: '#3b82f6',
        targetColor: '#1e3a8a',
        diff: Math.round((c.protein - t.protein) * multiplier.p),
        calories: Math.round(c.protein * 4),
        rawGrams: c.protein,
        rawTargetGrams: t.protein
      },
      {
        macroKey: 'carbs',
        name: isEn ? 'Carbs' : 'الكاربوهيدرات',
        consumed: Math.round(c.carbs * multiplier.c),
        target: Math.round(t.carbs * multiplier.c),
        pct: t.carbs > 0 ? Math.round((c.carbs / t.carbs) * 100) : 0,
        unit: unitLabel,
        color: '#f59e0b',
        targetColor: '#78350f',
        diff: Math.round((c.carbs - t.carbs) * multiplier.c),
        calories: Math.round(c.carbs * 4),
        rawGrams: c.carbs,
        rawTargetGrams: t.carbs
      },
      {
        macroKey: 'fats',
        name: isEn ? 'Fats' : 'الدهون الصحية',
        consumed: Math.round(c.fats * multiplier.f),
        target: Math.round(t.fats * multiplier.f),
        pct: t.fats > 0 ? Math.round((c.fats / t.fats) * 100) : 0,
        unit: unitLabel,
        color: '#ef4444',
        targetColor: '#881337',
        diff: Math.round((c.fats - t.fats) * multiplier.f),
        calories: Math.round(c.fats * 9),
        rawGrams: c.fats,
        rawTargetGrams: t.fats
      }
    ];
  }, [currentDayStats, unit, isEn]);

  // Multi-Day Trends Bar Chart Data (Each day has Protein, Carbs, Fats bars)
  const trendsChartData = useMemo(() => {
    return daysData.map(d => {
      const c = d.consumed;
      const t = d.target;
      return {
        iso: d.iso,
        label: d.dayLabel,
        fullLabel: d.fullDayLabel,
        isToday: d.isToday,
        protein: unit === 'calories' ? Math.round(c.protein * 4) : Math.round(c.protein),
        carbs: unit === 'calories' ? Math.round(c.carbs * 4) : Math.round(c.carbs),
        fats: unit === 'calories' ? Math.round(c.fats * 9) : Math.round(c.fats),
        targetProtein: unit === 'calories' ? Math.round(t.protein * 4) : Math.round(t.protein),
        targetCarbs: unit === 'calories' ? Math.round(t.carbs * 4) : Math.round(t.carbs),
        targetFats: unit === 'calories' ? Math.round(t.fats * 9) : Math.round(t.fats),
        totalKcal: c.kcal,
        targetKcal: t.kcal
      };
    });
  }, [daysData, unit]);

  // Caloric Ratio Data (% of total calories from protein, carbs, fats)
  const ratioData = useMemo(() => {
    const c = currentDayStats.consumed;
    const t = currentDayStats.target;

    const actualKcalP = c.protein * 4;
    const actualKcalC = c.carbs * 4;
    const actualKcalF = c.fats * 9;
    const totalActualKcal = Math.max(1, actualKcalP + actualKcalC + actualKcalF);

    const targetKcalP = t.protein * 4;
    const targetKcalC = t.carbs * 4;
    const targetKcalF = t.fats * 9;
    const totalTargetKcal = Math.max(1, targetKcalP + targetKcalC + targetKcalF);

    return [
      {
        name: isEn ? 'Protein' : 'البروتين',
        actualPct: Math.round((actualKcalP / totalActualKcal) * 100),
        targetPct: Math.round((targetKcalP / totalTargetKcal) * 100),
        actualKcal: Math.round(actualKcalP),
        targetKcal: Math.round(targetKcalP),
        color: '#3b82f6'
      },
      {
        name: isEn ? 'Carbs' : 'الكاربوهيدرات',
        actualPct: Math.round((actualKcalC / totalActualKcal) * 100),
        targetPct: Math.round((targetKcalC / totalTargetKcal) * 100),
        actualKcal: Math.round(actualKcalC),
        targetKcal: Math.round(targetKcalC),
        color: '#f59e0b'
      },
      {
        name: isEn ? 'Fats' : 'الدهون',
        actualPct: Math.round((actualKcalF / totalActualKcal) * 100),
        targetPct: Math.round((targetKcalF / totalTargetKcal) * 100),
        actualKcal: Math.round(actualKcalF),
        targetKcal: Math.round(targetKcalF),
        color: '#ef4444'
      }
    ];
  }, [currentDayStats, isEn]);

  // Custom Recharts Tooltip
  const CustomComparisonTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isCalories = unit === 'calories';
      const u = isCalories ? (isEn ? 'kcal' : 'سعرة') : (isEn ? 'g' : 'جم');

      return (
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6)',
            color: '#f1f5f9',
            fontSize: '13px',
            minWidth: '210px',
            direction: isEn ? 'ltr' : 'rtl'
          }}
        >
          <div style={{ fontWeight: 800, color: data.color, marginBottom: '6px', fontSize: '14px' }}>
            {data.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>{isEn ? 'Actual Intake:' : 'المستهلك الفعلي:'}</span>
            <span style={{ fontWeight: 700 }}>{data.consumed} {u}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>{isEn ? 'Target (Settings):' : 'الهدف المحدد:'}</span>
            <span style={{ fontWeight: 700 }}>{data.target} {u}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8' }}>{isEn ? 'Adherence:' : 'نسبة التحقيق:'}</span>
            <span style={{ fontWeight: 800, color: data.pct >= 90 && data.pct <= 110 ? '#10b981' : (data.pct < 90 ? '#f59e0b' : '#38bdf8') }}>
              {data.pct}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #1e293b' }}>
            <span style={{ color: '#64748b' }}>{isEn ? 'Calories:' : 'السعرات:'}</span>
            <span style={{ color: '#a855f7', fontWeight: 700 }}>{data.calories} {isEn ? 'kcal' : 'سعرة'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTrendsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const u = unit === 'calories' ? (isEn ? 'kcal' : 'سعرة') : (isEn ? 'g' : 'جم');

      return (
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6)',
            color: '#f1f5f9',
            fontSize: '12px',
            minWidth: '220px',
            direction: isEn ? 'ltr' : 'rtl'
          }}
        >
          <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '6px', fontSize: '13px' }}>
            {data.fullLabel} ({data.iso})
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa', marginBottom: '3px' }}>
            <span>{isEn ? 'Protein:' : 'البروتين:'}</span>
            <span style={{ fontWeight: 700 }}>{data.protein} / {data.targetProtein} {u}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24', marginBottom: '3px' }}>
            <span>{isEn ? 'Carbs:' : 'الكاربوهيدرات:'}</span>
            <span style={{ fontWeight: 700 }}>{data.carbs} / {data.targetCarbs} {u}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171', marginBottom: '3px' }}>
            <span>{isEn ? 'Fats:' : 'الدهون:'}</span>
            <span style={{ fontWeight: 700 }}>{data.fats} / {data.targetFats} {u}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #1e293b' }}>
            <span style={{ color: '#94a3b8' }}>{isEn ? 'Total Calories:' : 'إجمالي السعرات:'}</span>
            <span style={{ color: '#10b981', fontWeight: 800 }}>{data.totalKcal} / {data.targetKcal} {isEn ? 'kcal' : 'سعرة'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="macroTrendsRoot"
      className="macro-trends-container"
      style={{
        backgroundColor: '#0a0e1a',
        color: '#f1f5f9',
        fontFamily: "'Cairo', -apple-system, BlinkMacSystemFont, sans-serif",
        borderRadius: '16px',
        border: '1px solid #1e2d45',
        padding: '20px',
        width: '100%',
        maxWidth: '820px',
        margin: '0 auto',
        boxSizing: 'border-box',
        direction: isEn ? 'ltr' : 'rtl'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #1e2d45',
          paddingBottom: '14px',
          marginBottom: '18px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🍽️</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f1f5f9' }}>
              {isEn ? 'Daily Macro Distribution & Trends' : 'تحليل توزيع الماكروز والأهداف اليومية'}
            </h3>
            <span
              style={{
                backgroundColor: targets.source === 'fitness_wizard' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                color: targets.source === 'fitness_wizard' ? '#34d399' : '#60a5fa',
                border: `1px solid ${targets.source === 'fitness_wizard' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`,
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              {targets.source === 'fitness_wizard'
                ? (isEn ? 'Mifflin-St Jeor Targets' : 'أهداف ويزارد اللياقة')
                : (isEn ? 'User Targets' : 'أهداف الإعدادات')}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
            {isEn
              ? 'Visualize daily protein, carbs, and fats compared to scientific targets stored in USER_SETTINGS.'
              : 'مقارنة استهلاك البروتين، الكاربوهيدرات، والدهون اليومية مع الأهداف المحفوظة في USER_SETTINGS.'}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            ✕ {isEn ? 'Close' : 'إغلاق'}
          </button>
        )}
      </div>

      {/* Control Bar: View Modes, Ranges, Units */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px'
        }}
      >
        {/* View Mode Pills */}
        <div style={{ display: 'flex', gap: '6px', background: '#111827', padding: '4px', borderRadius: '10px', border: '1px solid #1e2d45' }}>
          <button
            type="button"
            onClick={() => setViewMode('comparison')}
            style={{
              background: viewMode === 'comparison' ? '#3b82f6' : 'transparent',
              color: viewMode === 'comparison' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            📊 {isEn ? 'Target vs Consumed' : 'مقارنة الأهداف'}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('trends')}
            style={{
              background: viewMode === 'trends' ? '#3b82f6' : 'transparent',
              color: viewMode === 'trends' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            📈 {isEn ? '7-Day Trends' : 'مسار الأيام'}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('ratio')}
            style={{
              background: viewMode === 'ratio' ? '#3b82f6' : 'transparent',
              color: viewMode === 'ratio' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            ⚖️ {isEn ? 'Caloric %' : 'نسب السعرات'}
          </button>
        </div>

        {/* Range & Unit Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {viewMode === 'trends' && (
            <div style={{ display: 'flex', gap: '4px', background: '#111827', padding: '4px', borderRadius: '8px', border: '1px solid #1e2d45' }}>
              <button
                type="button"
                onClick={() => setRangeType('7days')}
                style={{
                  background: rangeType === '7days' ? '#1e293b' : 'transparent',
                  color: rangeType === '7days' ? '#38bdf8' : '#64748b',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isEn ? 'Last 7 Days' : 'آخر ٧ أيام'}
              </button>
              <button
                type="button"
                onClick={() => setRangeType('week')}
                style={{
                  background: rangeType === 'week' ? '#1e293b' : 'transparent',
                  color: rangeType === 'week' ? '#38bdf8' : '#64748b',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isEn ? 'Current Week' : 'الأسبوع الحالي'}
              </button>
            </div>
          )}

          {/* Unit Toggle */}
          <div style={{ display: 'flex', gap: '4px', background: '#111827', padding: '4px', borderRadius: '8px', border: '1px solid #1e2d45' }}>
            <button
              type="button"
              onClick={() => setUnit('grams')}
              style={{
                background: unit === 'grams' ? '#3b82f6' : 'transparent',
                color: unit === 'grams' ? '#fff' : '#64748b',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isEn ? 'Grams (g)' : 'جرامات (جم)'}
            </button>
            <button
              type="button"
              onClick={() => setUnit('calories')}
              style={{
                background: unit === 'calories' ? '#3b82f6' : 'transparent',
                color: unit === 'calories' ? '#fff' : '#64748b',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isEn ? 'Calories (kcal)' : 'سعرات (kcal)'}
            </button>
          </div>
        </div>
      </div>

      {/* Target & Intake Snapshot Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}
      >
        {/* Protein Card */}
        <div
          style={{
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '12px',
            padding: '12px 14px',
            borderLeft: isEn ? '4px solid #3b82f6' : '1px solid #1e2d45',
            borderRight: !isEn ? '4px solid #3b82f6' : '1px solid #1e2d45'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
              {isEn ? '🥩 Protein' : '🥩 البروتين'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: currentDayStats.consumed.protein >= currentDayStats.target.protein * 0.9 ? '#10b981' : '#f59e0b'
              }}
            >
              {Math.round((currentDayStats.consumed.protein / Math.max(1, currentDayStats.target.protein)) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
            {currentDayStats.consumed.protein} <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {currentDayStats.target.protein} {isEn ? 'g' : 'جم'}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {Math.round(currentDayStats.consumed.protein * 4)} {isEn ? 'kcal' : 'سعرة'}
          </div>
        </div>

        {/* Carbs Card */}
        <div
          style={{
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '12px',
            padding: '12px 14px',
            borderLeft: isEn ? '4px solid #f59e0b' : '1px solid #1e2d45',
            borderRight: !isEn ? '4px solid #f59e0b' : '1px solid #1e2d45'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
              {isEn ? '🍚 Carbs' : '🍚 الكارب'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: currentDayStats.consumed.carbs <= currentDayStats.target.carbs * 1.1 ? '#10b981' : '#f59e0b'
              }}
            >
              {Math.round((currentDayStats.consumed.carbs / Math.max(1, currentDayStats.target.carbs)) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24', marginTop: '4px' }}>
            {currentDayStats.consumed.carbs} <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {currentDayStats.target.carbs} {isEn ? 'g' : 'جم'}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {Math.round(currentDayStats.consumed.carbs * 4)} {isEn ? 'kcal' : 'سعرة'}
          </div>
        </div>

        {/* Fats Card */}
        <div
          style={{
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '12px',
            padding: '12px 14px',
            borderLeft: isEn ? '4px solid #ef4444' : '1px solid #1e2d45',
            borderRight: !isEn ? '4px solid #ef4444' : '1px solid #1e2d45'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
              {isEn ? '🥑 Fats' : '🥑 الدهون'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: currentDayStats.consumed.fats <= currentDayStats.target.fats * 1.05 ? '#10b981' : '#ef4444'
              }}
            >
              {Math.round((currentDayStats.consumed.fats / Math.max(1, currentDayStats.target.fats)) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#f87171', marginTop: '4px' }}>
            {currentDayStats.consumed.fats} <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {currentDayStats.target.fats} {isEn ? 'g' : 'جم'}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {Math.round(currentDayStats.consumed.fats * 9)} {isEn ? 'kcal' : 'سعرة'}
          </div>
        </div>

        {/* Total Calories Card */}
        <div
          style={{
            background: '#111827',
            border: '1px solid #1e2d45',
            borderRadius: '12px',
            padding: '12px 14px',
            borderLeft: isEn ? '4px solid #8b5cf6' : '1px solid #1e2d45',
            borderRight: !isEn ? '4px solid #8b5cf6' : '1px solid #1e2d45'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
              {isEn ? '🔥 Energy' : '🔥 الطاقة'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#a855f7' }}>
              {Math.round((currentDayStats.consumed.kcal / Math.max(1, currentDayStats.target.kcal)) * 100)}%
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#c084fc', marginTop: '4px' }}>
            {currentDayStats.consumed.kcal} <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {currentDayStats.target.kcal}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {isEn ? 'Target Kcal in Settings' : 'الهدف المحفوظ في الإعدادات'}
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Chart Area */}
      <div
        style={{
          background: '#0d1322',
          border: '1px solid #1e2d45',
          borderRadius: '14px',
          padding: '16px 14px 10px 14px',
          marginBottom: '18px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9' }}>
            {viewMode === 'comparison' && (isEn ? 'Direct Comparison: Consumed vs Target' : 'مقارنة مباشرة: المستهلك الفعلي مقابل الهدف')}
            {viewMode === 'trends' && (isEn ? 'Daily Multi-Day Macro Distribution' : 'توزيع الماكروز عبر الأيام')}
            {viewMode === 'ratio' && (isEn ? 'Macronutrient Caloric Ratio (% vs %)' : 'نسب توزيع السعرات الحرارية (%)')}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {isEn ? `Unit: ${unit}` : `الوحدة: ${unit === 'calories' ? 'سعرات' : 'جرامات'}`}
          </div>
        </div>

        <div style={{ width: '100%', height: 280 }}>
          {viewMode === 'comparison' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 15, right: 20, left: 10, bottom: 20 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#1e2d45' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1e2d45' }}
                  tickFormatter={val => `${val}`}
                />
                <Tooltip content={<CustomComparisonTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend
                  wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'consumed') return isEn ? 'Consumed (Actual)' : 'المستهلك الفعلي';
                    if (value === 'target') return isEn ? 'Target (USER_SETTINGS)' : 'الهدف المحدد في الإعدادات';
                    return value;
                  }}
                />
                <Bar
                  dataKey="consumed"
                  name="consumed"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                >
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-c-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Bar
                  dataKey="target"
                  name="target"
                  fill="#334155"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {viewMode === 'trends' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendsChartData}
                margin={{ top: 15, right: 20, left: 10, bottom: 20 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#1e2d45' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1e2d45' }}
                  tickFormatter={val => `${val}`}
                />
                <Tooltip content={<CustomTrendsTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend
                  wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'protein') return isEn ? 'Protein' : 'البروتين';
                    if (value === 'carbs') return isEn ? 'Carbs' : 'الكاربوهيدرات';
                    if (value === 'fats') return isEn ? 'Fats' : 'الدهون';
                    return value;
                  }}
                />
                <Bar dataKey="protein" name="protein" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="carbs" name="carbs" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="fats" name="fats" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={20} />
                
                {/* Target Reference Lines */}
                <ReferenceLine
                  y={unit === 'calories' ? targets.protein * 4 : targets.protein}
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                  opacity={0.6}
                />
                <ReferenceLine
                  y={unit === 'calories' ? targets.carbs * 4 : targets.carbs}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  opacity={0.6}
                />
                <ReferenceLine
                  y={unit === 'calories' ? targets.fats * 9 : targets.fats}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  opacity={0.6}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {viewMode === 'ratio' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ratioData}
                margin={{ top: 15, right: 20, left: 10, bottom: 20 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#1e2d45' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={{ stroke: '#1e2d45' }}
                  tickFormatter={val => `${val}%`}
                />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${val}%`,
                    name === 'actualPct'
                      ? (isEn ? 'Actual Caloric Ratio' : 'النسبة الفعلية من السعرات')
                      : (isEn ? 'Target Ratio (Settings)' : 'النسبة المستهدفة')
                  ]}
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #1e2d45',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'actualPct') return isEn ? 'Actual % of Calories' : 'النسبة الفعلية من السعرات';
                    if (value === 'targetPct') return isEn ? 'Target % from USER_SETTINGS' : 'النسبة المستهدفة في الإعدادات';
                    return value;
                  }}
                />
                <Bar
                  dataKey="actualPct"
                  name="actualPct"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                >
                  {ratioData.map((entry, index) => (
                    <Cell key={`cell-r-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Bar
                  dataKey="targetPct"
                  name="targetPct"
                  fill="#334155"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Actionable Nutri-Coach Insights Footer */}
      <div
        style={{
          background: '#111827',
          border: '1px solid #1e2d45',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          fontSize: '12px',
          lineHeight: '1.6'
        }}
      >
        <span style={{ fontSize: '24px', flexShrink: 0 }}>💡</span>
        <div>
          <span style={{ fontWeight: 800, color: '#38bdf8' }}>
            {isEn ? 'Nutritional Coaching Observation:' : 'ملاحظة التوجيه الغذائي:'}
          </span>{' '}
          {currentDayStats.consumed.protein < currentDayStats.target.protein * 0.85 ? (
            isEn
              ? `Protein intake is ${Math.round(currentDayStats.target.protein - currentDayStats.consumed.protein)}g below target. Prioritize Greek yogurt, chicken breast, or whey protein to meet muscle repair thresholds.`
              : `استهلاك البروتين أقل من الهدف بمقدار ${Math.round(currentDayStats.target.protein - currentDayStats.consumed.protein)} جم. ركز على إدخال مصادر مثل الزبادي اليوناني، صدور الدجاج، أو الواي بروتين لدعم البناء العضلي.`
          ) : currentDayStats.consumed.fats > currentDayStats.target.fats * 1.15 ? (
            isEn
              ? `Fats exceeded daily target by ${Math.round(currentDayStats.consumed.fats - currentDayStats.target.fats)}g. Keep cooking oils and nut portions measured for optimal caloric deficit.`
              : `الدهون تجاوزت الهدف اليومي بمقدار ${Math.round(currentDayStats.consumed.fats - currentDayStats.target.fats)} جم. احرص على قياس زيوت الطهي والمكسرات بالميزان لضمان الالتزام بالسعرات.`
          ) : (
            isEn
              ? `Outstanding macro consistency! Your protein, carbs, and fats distribution tightly matches your Mifflin-St Jeor metabolic goals in USER_SETTINGS.`
              : `توزيع غذائي متوازن وممتاز! نسب البروتين والكاربوهيدرات والدهون متطابقة بدرجة عالية مع أهداف معادلة ميفلين المحفوظة في الإعدادات.`
          )}
        </div>
      </div>
    </div>
  );
};

// Mount helper for vanilla JS / index.html integration
const mountedRoots = new Map<HTMLElement, Root>();

export function mountMacroTrends(container: HTMLElement | string, props?: MacroTrendsProps): Root | null {
  const targetEl = typeof container === 'string' ? document.getElementById(container) : container;
  if (!targetEl) {
    console.error(`[MacroTrends] Target element not found:`, container);
    return null;
  }

  let root = mountedRoots.get(targetEl);
  if (!root) {
    root = createRoot(targetEl);
    mountedRoots.set(targetEl, root);
  }

  root.render(<MacroTrends {...props} />);
  return root;
}

export function unmountMacroTrends(container: HTMLElement | string): boolean {
  const targetEl = typeof container === 'string' ? document.getElementById(container) : container;
  if (!targetEl) return false;

  const root = mountedRoots.get(targetEl);
  if (root) {
    root.unmount();
    mountedRoots.delete(targetEl);
    return true;
  }
  return false;
}

// Attach to window for global access
if (typeof window !== 'undefined') {
  (window as any).MacroTrendsComponent = MacroTrends;
  (window as any).MacroTrends = {
    Component: MacroTrends,
    mount: mountMacroTrends,
    unmount: unmountMacroTrends,
    resolveUserTargets
  };
}

export default MacroTrends;
