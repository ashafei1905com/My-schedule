import React, { useEffect, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { motion, AnimatePresence, animate } from 'motion/react';

export interface FitnessTargets {
  gender: 'male' | 'female';
  age: number;
  weight: number;
  height: number;
  activity: number;
  goal: 'muscle' | 'recomp' | 'fat_loss';
  body_fat?: number | null;
  bmr: number;
  tdee: number;
  target_kcal: number;
  target_protein: number;
  target_fats: number;
  target_carbs: number;
  target_fiber: number;
  formula?: string;
}

export interface FitnessWizardResultsProps {
  calc: FitnessTargets;
  lang?: 'ar' | 'en';
  onBack?: () => void;
  onSave?: () => void;
}

export const FitnessWizardResults: React.FC<FitnessWizardResultsProps> = ({
  calc,
  lang = 'ar',
  onBack,
  onSave
}) => {
  const isEn = lang === 'en';

  // Animated kcal counter value
  const [displayKcal, setDisplayKcal] = useState(0);

  useEffect(() => {
    const controls = animate(0, calc.target_kcal, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setDisplayKcal(Math.round(value))
    });
    return () => controls.stop();
  }, [calc.target_kcal]);

  // Macro calorie math
  const pKcal = calc.target_protein * 4;
  const fKcal = calc.target_fats * 9;
  const cKcal = calc.target_carbs * 4;
  const totalMacroKcal = pKcal + fKcal + cKcal || calc.target_kcal;

  const pPct = Math.round((pKcal / totalMacroKcal) * 100);
  const fPct = Math.round((fKcal / totalMacroKcal) * 100);
  const cPct = Math.max(0, 100 - pPct - fPct);

  // Caloric delta
  const delta = calc.target_kcal - calc.tdee;
  const deltaSign = delta > 0 ? '+' : '';

  // Formula badge text
  const formulaText = calc.body_fat
    ? (isEn ? `Katch-McArdle Formula (${calc.body_fat}% BF)` : `معادلة كاتش-ماكاردل (${calc.body_fat}% دهون)`)
    : (isEn ? 'Mifflin-St Jeor Formula' : 'معادلة ميفلين-سانت جور');

  // Strategy pill text & style
  let strategyText = '';
  let strategyStyle = {
    color: '#34d399',
    borderColor: 'rgba(52,211,153,.35)',
    background: 'rgba(52,211,153,.18)'
  };

  if (calc.goal === 'muscle') {
    strategyText = isEn ? '+250 kcal Surplus' : '+250 سعرة فائض عضل';
    strategyStyle = {
      color: '#38bdf8',
      borderColor: 'rgba(56,189,248,.35)',
      background: 'rgba(56,189,248,.18)'
    };
  } else if (calc.goal === 'fat_loss') {
    strategyText = isEn ? '18% Active Deficit' : 'عجز 18% لحرق الدهون';
    strategyStyle = {
      color: '#f87171',
      borderColor: 'rgba(248,113,113,.35)',
      background: 'rgba(248,113,113,.18)'
    };
  } else {
    strategyText = isEn ? '15% Moderate Deficit' : 'عجز 15% متوازن';
  }

  // Coaching text
  let coachingText = '';
  if (calc.goal === 'muscle') {
    coachingText = isEn
      ? 'Target 4–5 protein feedings distributed evenly every 3–4 hours with 0.3–0.5g/kg carbs post-workout to support anabolic recovery.'
      : 'احرص على توزيع البروتين على 4–5 وجبات كل 3–4 ساعات مع تناول كربوهيدرات بعد التمرين لدعم الاستشفاء ونمو العضلات.';
  } else if (calc.goal === 'fat_loss') {
    coachingText = isEn
      ? 'Maintain high protein intake to preserve lean muscle mass during your caloric deficit. Prioritize fibrous vegetables and hydration.'
      : 'حافظ على تناول كمية عالية من البروتين لحماية الكتلة العضلية أثناء عجز السعرات، واعتمد على الخضروات الورقية والماء.';
  } else {
    coachingText = isEn
      ? 'Optimize nutrient timing with complex carbohydrates centered around your resistance training sessions to stimulate lean recomposition.'
      : 'وزع الكربوهيدرات المعقدة حول أوقات التمارين الرياضية مع بروتين ثابت على مدار اليوم لتحقيق إعادة تشكيل الجسم بكفاءة.';
  }

  // Spring and ease transition constants
  const springTransition = {
    type: 'spring' as const,
    stiffness: 280,
    damping: 24
  };

  const smoothEase = [0.16, 1, 0.3, 1] as const;

  // Framer Motion Variants for macro progress bars & ratio segments
  const progressBarVariants = {
    initial: {
      width: '0%',
      opacity: 0.6
    },
    loaded: (custom: { pct: number; delay?: number }) => ({
      width: `${Math.min(100, Math.max(0, custom.pct))}%`,
      opacity: 1,
      transition: {
        width: {
          duration: 1.1,
          delay: custom.delay ?? 0.3,
          ease: smoothEase
        },
        opacity: {
          duration: 0.4,
          delay: custom.delay ?? 0.3
        }
      }
    })
  };

  const stackedSegmentVariants = {
    initial: {
      width: '0%',
      opacity: 0.7
    },
    loaded: (custom: { pct: number; delay?: number }) => ({
      width: `${Math.min(100, Math.max(0, custom.pct))}%`,
      opacity: 1,
      transition: {
        width: {
          duration: 1.05,
          delay: custom.delay ?? 0.65,
          ease: smoothEase
        },
        opacity: {
          duration: 0.35,
          delay: custom.delay ?? 0.65
        }
      }
    })
  };

  return (
    <div className="fw-results-container" dir={isEn ? 'ltr' : 'rtl'}>
      {/* 1. TDEE Summary Hero Card (Animated with Framer Motion) */}
      <motion.div
        className="fw-result-hero-card"
        id="fwHeroSummaryCard"
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          boxShadow: [
            '0 0 0px rgba(59,130,246,0)',
            '0 0 24px rgba(59,130,246,0.3)',
            '0 0 0px rgba(59,130,246,0)'
          ]
        }}
        transition={{
          duration: 0.65,
          ease: smoothEase,
          boxShadow: { duration: 1.4, delay: 0.25 }
        }}
      >
        <div className="fw-hero-meta-row">
          <div>
            <motion.span
              className="fw-hero-badge"
              id="wizHeroFormulaBadge"
              initial={{ opacity: 0, x: isEn ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              {formulaText}
            </motion.span>
            <div className="fw-hero-target-label" id="wizHeroTargetLbl">
              {isEn ? 'Target Daily Intake' : 'السعرات اليومية المستهدفة'}
            </div>
          </div>
          <motion.div
            className="fw-hero-strategy-pill"
            id="wizHeroStrategyPill"
            style={strategyStyle}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springTransition, delay: 0.2 }}
          >
            {strategyText}
          </motion.div>
        </div>

        <div className="fw-hero-kcal-row">
          <motion.div
            className="fw-hero-kcal-val"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springTransition, delay: 0.25 }}
          >
            <span id="wizCalcKcal">{displayKcal.toLocaleString()}</span>{' '}
            <span className="fw-hero-kcal-unit" id="wizHeroKcalUnit">
              {isEn ? 'kcal/day' : 'سعرة/يوم'}
            </span>
          </motion.div>
        </div>

        {/* Hero Sub Stats: BMR, TDEE, Caloric Delta */}
        <motion.div
          className="fw-hero-sub-stats"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45, ease: smoothEase }}
        >
          <div className="fw-sub-stat-item">
            <span className="fw-sub-stat-lbl" id="wizBmrLbl">
              {isEn ? 'Basal Metabolic Rate (BMR)' : 'الأيض الأساسي (BMR)'}
            </span>
            <span className="fw-sub-stat-val" id="wizResBmr">
              {Number(calc.bmr).toLocaleString()} {isEn ? 'kcal' : 'سعرة'}
            </span>
          </div>

          <div className="fw-sub-stat-div" />

          <div className="fw-sub-stat-item">
            <span className="fw-sub-stat-lbl" id="wizTdeeLbl">
              {isEn ? 'Maintenance Energy (TDEE)' : 'سعرات الثبات (TDEE)'}
            </span>
            <span className="fw-sub-stat-val" id="wizResTdee">
              {Number(calc.tdee).toLocaleString()} {isEn ? 'kcal' : 'سعرة'}
            </span>
          </div>

          <div className="fw-sub-stat-div" />

          <div className="fw-sub-stat-item">
            <span className="fw-sub-stat-lbl" id="wizDeltaLbl">
              {isEn ? 'Caloric Delta' : 'فارق السعرات اليومي'}
            </span>
            <span
              className="fw-sub-stat-val"
              id="wizResDelta"
              style={{
                color: delta > 0 ? '#38bdf8' : (delta < 0 ? '#34d399' : '#ffffff')
              }}
            >
              {deltaSign}{delta} {isEn ? 'kcal/day' : 'سعرة/يوم'}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* 2. 4-Card Macronutrient Bento Grid with Framer Motion Progress Bars */}
      <div className="fw-macro-grid">
        {/* Protein Card */}
        <motion.div
          className="fw-macro-card fw-card-protein"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: smoothEase }}
          whileHover={{ translateY: -2 }}
        >
          <div className="fw-macro-head">
            <span className="fw-macro-name" id="wizPName">
              {isEn ? 'Protein' : 'بروتين'}
            </span>
            <span className="fw-macro-pct" id="wizCalcPPct">
              {pPct}%
            </span>
          </div>
          <div className="fw-macro-val">
            <span id="wizCalcP">{calc.target_protein}</span>
            <span className="fw-macro-unit">{isEn ? 'g' : 'غ'}</span>
          </div>
          <div className="fw-macro-sub">
            <span id="wizCalcPKcal">{pKcal} {isEn ? 'kcal' : 'سعرة'}</span> ·{' '}
            <span id="wizCalcPRatio">
              {(calc.target_protein / (calc.weight || 75)).toFixed(1)} {isEn ? 'g/kg' : 'غ/كجم'}
            </span>
          </div>
          {/* Animated Macro Progress Bar (Protein) */}
          <div className="fw-macro-bar-track">
            <motion.div
              className="fw-macro-bar-fill fw-bar-p"
              id="wizPBarFill"
              variants={progressBarVariants}
              initial="initial"
              animate="loaded"
              custom={{ pct: pPct, delay: 0.35 }}
            />
          </div>
        </motion.div>

        {/* Fats Card */}
        <motion.div
          className="fw-macro-card fw-card-fats"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35, ease: smoothEase }}
          whileHover={{ translateY: -2 }}
        >
          <div className="fw-macro-head">
            <span className="fw-macro-name" id="wizFName">
              {isEn ? 'Fats' : 'دهون'}
            </span>
            <span className="fw-macro-pct" id="wizCalcFPct">
              {fPct}%
            </span>
          </div>
          <div className="fw-macro-val">
            <span id="wizCalcF">{calc.target_fats}</span>
            <span className="fw-macro-unit">{isEn ? 'g' : 'غ'}</span>
          </div>
          <div className="fw-macro-sub">
            <span id="wizCalcFKcal">{fKcal} {isEn ? 'kcal' : 'سعرة'}</span> ·{' '}
            <span id="wizCalcFRatio">
              {(calc.target_fats / (calc.weight || 75)).toFixed(1)} {isEn ? 'g/kg' : 'غ/كجم'}
            </span>
          </div>
          {/* Animated Macro Progress Bar (Fats) */}
          <div className="fw-macro-bar-track">
            <motion.div
              className="fw-macro-bar-fill fw-bar-f"
              id="wizFBarFill"
              variants={progressBarVariants}
              initial="initial"
              animate="loaded"
              custom={{ pct: fPct, delay: 0.45 }}
            />
          </div>
        </motion.div>

        {/* Carbs Card */}
        <motion.div
          className="fw-macro-card fw-card-carbs"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.45, ease: smoothEase }}
          whileHover={{ translateY: -2 }}
        >
          <div className="fw-macro-head">
            <span className="fw-macro-name" id="wizCName">
              {isEn ? 'Carbohydrates' : 'كربوهيدرات'}
            </span>
            <span className="fw-macro-pct" id="wizCalcCPct">
              {cPct}%
            </span>
          </div>
          <div className="fw-macro-val">
            <span id="wizCalcC">{calc.target_carbs}</span>
            <span className="fw-macro-unit">{isEn ? 'g' : 'غ'}</span>
          </div>
          <div className="fw-macro-sub">
            <span id="wizCalcCKcal">{cKcal} {isEn ? 'kcal' : 'سعرة'}</span> ·{' '}
            <span id="wizCalcCRole">
              {isEn ? 'Glycogen & Performance' : 'جليكوجين وطاقة'}
            </span>
          </div>
          {/* Animated Macro Progress Bar (Carbs) */}
          <div className="fw-macro-bar-track">
            <motion.div
              className="fw-macro-bar-fill fw-bar-c"
              id="wizCBarFill"
              variants={progressBarVariants}
              initial="initial"
              animate="loaded"
              custom={{ pct: cPct, delay: 0.55 }}
            />
          </div>
        </motion.div>

        {/* Fiber Card */}
        <motion.div
          className="fw-macro-card fw-card-fiber"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.55, ease: smoothEase }}
          whileHover={{ translateY: -2 }}
        >
          <div className="fw-macro-head">
            <span className="fw-macro-name" id="wizBName">
              {isEn ? 'Dietary Fiber' : 'ألياف غذائية'}
            </span>
            <span className="fw-macro-pct" id="wizCalcBPct">
              14g/1k
            </span>
          </div>
          <div className="fw-macro-val">
            <span id="wizCalcB">{calc.target_fiber}</span>
            <span className="fw-macro-unit">{isEn ? 'g' : 'غ'}</span>
          </div>
          <div className="fw-macro-sub">
            <span id="wizCalcBRole">
              {isEn ? 'Digestive Satiety & Health' : 'شبع وصحة الهضم'}
            </span>
          </div>
          {/* Animated Macro Progress Bar (Fiber) */}
          <div className="fw-macro-bar-track">
            <motion.div
              className="fw-macro-bar-fill fw-bar-b"
              id="wizBBarFill"
              variants={progressBarVariants}
              initial="initial"
              animate="loaded"
              custom={{ pct: 100, delay: 0.65 }}
            />
          </div>
        </motion.div>
      </div>

      {/* 3. Caloric Energy Ratio Distribution Bar with Animated Segments */}
      <motion.div
        className="fw-ratio-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: smoothEase }}
      >
        <div className="fw-ratio-header">
          <span className="fw-ratio-title" id="wizRatioTitle">
            {isEn ? 'Caloric Energy Ratio Distribution' : 'توزيع نسب السعرات الحرارية'}
          </span>
          <span className="fw-ratio-legend">
            <span className="fw-dot fw-dot-p" />{' '}
            <span id="wizLegendP">{isEn ? `Protein ${pPct}%` : `بروتين ${pPct}%`}</span>
            <span className="fw-dot fw-dot-c" style={{ [isEn ? 'marginLeft' : 'marginRight']: 8 }} />{' '}
            <span id="wizLegendC">{isEn ? `Carbs ${cPct}%` : `كارب ${cPct}%`}</span>
            <span className="fw-dot fw-dot-f" style={{ [isEn ? 'marginLeft' : 'marginRight']: 8 }} />{' '}
            <span id="wizLegendF">{isEn ? `Fats ${fPct}%` : `دهون ${fPct}%`}</span>
          </span>
        </div>
        <div className="fw-stacked-bar">
          <motion.div
            className="fw-stacked-segment fw-seg-p"
            id="wizSegP"
            title={`Protein ${pPct}%`}
            variants={stackedSegmentVariants}
            initial="initial"
            animate="loaded"
            custom={{ pct: pPct, delay: 0.65 }}
          />
          <motion.div
            className="fw-stacked-segment fw-seg-c"
            id="wizSegC"
            title={`Carbs ${cPct}%`}
            variants={stackedSegmentVariants}
            initial="initial"
            animate="loaded"
            custom={{ pct: cPct, delay: 0.75 }}
          />
          <motion.div
            className="fw-stacked-segment fw-seg-f"
            id="wizSegF"
            title={`Fats ${fPct}%`}
            variants={stackedSegmentVariants}
            initial="initial"
            animate="loaded"
            custom={{ pct: fPct, delay: 0.85 }}
          />
        </div>
      </motion.div>

      {/* 4. Actionable Coaching Insight Note */}
      <motion.div
        className="fw-coaching-note"
        id="wizCoachingNote"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease: smoothEase }}
      >
        <span className="fw-coach-icon">💡</span>
        <div>
          <div className="fw-coaching-title" id="wizCoachingTitle" style={{ fontWeight: 800, fontSize: '0.82rem', marginBottom: 2 }}>
            {isEn ? 'Scientific Nutrition Strategy' : 'الاستراتيجية الغذائية الموصى بها'}
          </div>
          <div id="wizCoachingText" style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--so, #cbd5e1)' }}>
            {coachingText}
          </div>
        </div>
      </motion.div>

      {/* 5. Results Actions Bar */}
      <motion.div
        className="fw-actions-bar"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.45, ease: smoothEase }}
      >
        <button
          type="button"
          id="btnBackToConfig"
          className="fw-btn-secondary"
          onClick={onBack}
        >
          <span>{isEn ? '←' : '→'}</span>{' '}
          <span id="fwBackBtnText">
            {isEn ? 'Edit Configuration' : 'تعديل البيانات'}
          </span>
        </button>
        <button
          type="button"
          id="btnSaveFitnessWizard"
          className="fw-btn-primary fw-btn-success"
          onClick={onSave}
        >
          <span id="fwSaveBtnText">
            {isEn ? 'Save & Apply Profile in USER_SETTINGS' : 'حفظ وتطبيق الملف في الإعدادات'}
          </span>{' '}
          ✅
        </button>
      </motion.div>
    </div>
  );
};

// Vanilla DOM element animation helper using Framer Motion's animate()
export function animateFitnessWizardElements(container?: HTMLElement | null) {
  const root = container || document;

  // 1. TDEE Summary Card
  const heroCard = root.querySelector('.fw-result-hero-card') as HTMLElement;
  if (heroCard) {
    animate(
      heroCard,
      {
        opacity: [0, 1],
        y: [28, 0],
        scale: [0.95, 1],
        boxShadow: [
          '0 0 0px rgba(59,130,246,0)',
          '0 0 24px rgba(59,130,246,0.3)',
          '0 0 0px rgba(59,130,246,0)'
        ]
      },
      { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
    );
  }

  // 2. Macro Progress Bars
  const pBar = root.querySelector('#wizPBarFill') as HTMLElement;
  if (pBar) {
    const targetW = pBar.style.width || '31%';
    pBar.style.width = '0%';
    animate(pBar, { width: ['0%', targetW] }, { duration: 0.95, delay: 0.3, ease: [0.16, 1, 0.3, 1] });
  }

  const fBar = root.querySelector('#wizFBarFill') as HTMLElement;
  if (fBar) {
    const targetW = fBar.style.width || '25%';
    fBar.style.width = '0%';
    animate(fBar, { width: ['0%', targetW] }, { duration: 0.95, delay: 0.45, ease: [0.16, 1, 0.3, 1] });
  }

  const cBar = root.querySelector('#wizCBarFill') as HTMLElement;
  if (cBar) {
    const targetW = cBar.style.width || '44%';
    cBar.style.width = '0%';
    animate(cBar, { width: ['0%', targetW] }, { duration: 0.95, delay: 0.6, ease: [0.16, 1, 0.3, 1] });
  }

  // Fiber
  const bBar = root.querySelector('.fw-card-fiber .fw-macro-bar-fill') as HTMLElement;
  if (bBar) {
    bBar.style.width = '0%';
    animate(bBar, { width: ['0%', '100%'] }, { duration: 0.95, delay: 0.7, ease: [0.16, 1, 0.3, 1] });
  }

  // 3. Stacked ratio bar segments
  const segP = root.querySelector('#wizSegP') as HTMLElement;
  if (segP) {
    const targetW = segP.style.width || '31%';
    segP.style.width = '0%';
    animate(segP, { width: ['0%', targetW] }, { duration: 0.95, delay: 0.6, ease: [0.16, 1, 0.3, 1] });
  }

  const segC = root.querySelector('#wizSegC') as HTMLElement;
  if (segC) {
    const targetW = segC.style.width || '44%';
    segC.style.width = '0%';
    animate(segC, { width: ['0%', targetW] }, { duration: 0.95, delay: 0.75, ease: [0.16, 1, 0.3, 1] });
  }

  const segF = root.querySelector('#wizSegF') as HTMLElement;
  if (segF) {
    const targetW = segF.style.width || '25%';
    segF.style.width = '0%';
    animate(segF, { width: ['0%', targetW] }, { duration: 0.95, delay: 0.85, ease: [0.16, 1, 0.3, 1] });
  }

  // 4. Stagger macro cards
  const macroCards = root.querySelectorAll('.fw-macro-card');
  macroCards.forEach((card, idx) => {
    animate(
      card as HTMLElement,
      { opacity: [0, 1], y: [18, 0] },
      { duration: 0.45, delay: 0.2 + idx * 0.1, ease: [0.16, 1, 0.3, 1] }
    );
  });
}

// React Mount / Unmount helpers
const mountedRoots = new Map<HTMLElement, Root>();

export function mountFitnessWizardResults(
  container: HTMLElement | string,
  props: FitnessWizardResultsProps
): Root | null {
  const targetEl = typeof container === 'string' ? document.getElementById(container) : container;
  if (!targetEl) {
    console.error('[FitnessWizardResults] Target element not found:', container);
    return null;
  }

  let root = mountedRoots.get(targetEl);
  if (!root) {
    root = createRoot(targetEl);
    mountedRoots.set(targetEl, root);
  }

  root.render(<FitnessWizardResults {...props} />);
  return root;
}

export function unmountFitnessWizardResults(container: HTMLElement | string): boolean {
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

// Global window registration
if (typeof window !== 'undefined') {
  (window as any).FitnessWizardResultsComponent = FitnessWizardResults;
  (window as any).FitnessWizardResults = {
    Component: FitnessWizardResults,
    mount: mountFitnessWizardResults,
    unmount: unmountFitnessWizardResults,
    animateElements: animateFitnessWizardElements
  };
}

export default FitnessWizardResults;
