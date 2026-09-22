import MacroTrends, { mountMacroTrends, unmountMacroTrends, resolveUserTargets } from './components/MacroTrends';
import FitnessWizardResults, { mountFitnessWizardResults, unmountFitnessWizardResults, animateFitnessWizardElements } from './components/FitnessWizardResults';
import { motion, AnimatePresence, animate } from 'motion/react';

// Expose on global window object
if (typeof window !== 'undefined') {
  (window as any).MacroTrendsComponent = MacroTrends;
  (window as any).MacroTrends = {
    Component: MacroTrends,
    mount: mountMacroTrends,
    unmount: unmountMacroTrends,
    resolveUserTargets
  };

  (window as any).FitnessWizardResultsComponent = FitnessWizardResults;
  (window as any).FitnessWizardResults = {
    Component: FitnessWizardResults,
    mount: mountFitnessWizardResults,
    unmount: unmountFitnessWizardResults,
    animateElements: animateFitnessWizardElements
  };

  (window as any).FramerMotion = {
    motion,
    AnimatePresence,
    animate
  };

  (window as any).Motion = {
    motion,
    AnimatePresence,
    animate
  };
}

export {
  MacroTrends,
  mountMacroTrends,
  unmountMacroTrends,
  resolveUserTargets,
  FitnessWizardResults,
  mountFitnessWizardResults,
  unmountFitnessWizardResults,
  animateFitnessWizardElements,
  motion,
  AnimatePresence,
  animate
};
