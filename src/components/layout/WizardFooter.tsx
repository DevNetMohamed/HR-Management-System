'use client';

import React from 'react';
import { useWizard, PAGE_DEFINITIONS } from '@/context/WizardContext';
import { useLanguage } from '@/context/LanguageContext';

export const WizardFooter: React.FC = () => {
  const {
    state,
    back,
    next,
    skip,
    saveDraft,
    go,
    promptPublish,
    confirmPublish,
    addToast,
  } = useWizard();
  const { isRTL, t } = useLanguage();

  const currentPage = PAGE_DEFINITIONS[state.pageIndex];

  // Success view has no footer
  if (currentPage?.id === 'Success') {
    return null;
  }

  // Review & Publish view has custom footer
  if (currentPage?.id === 'Review & Publish') {
    return (
      <footer id="ft">
        <button className="btn" onClick={() => go('Rules List')}>
          {isRTL ? 'العودة للتعديل' : 'Back to edit'}
        </button>
        <span className="sp" />
        <button className="btn" onClick={() => saveDraft(false)}>
          {isRTL ? 'حفظ كمسودة' : 'Save as draft'}
        </button>
        <button className="btn" onClick={() => addToast(isRTL ? 'لا توجد تغييرات منذ v0.4' : 'No changes since v0.4')}>
          {isRTL ? 'مراجعة التغييرات' : 'Review changes'}
        </button>
        <button className="btn p" onClick={promptPublish}>
          {isRTL ? 'نشر الإعدادات' : 'Publish configuration'}
        </button>
      </footer>
    );
  }

  // Blocked view has custom footer with live blocking error count
  if (currentPage?.id === 'Blocked') {
    const remainingErrors = 3 - state.blockingFixes.p - state.blockingFixes.s - state.blockingFixes.r;

    return (
      <footer id="ft">
        <button className="btn" onClick={() => go('Review & Publish')}>
          {isRTL ? 'العودة للتعديل' : 'Back to edit'}
        </button>
        <span className="sp" />
        {remainingErrors > 0 && (
          <b style={{ color: 'var(--err)', [isRTL ? 'marginLeft' : 'marginRight']: 10 }}>
            {remainingErrors} {isRTL ? 'أخطاء مانعة للنشر' : 'blocking errors'}
          </b>
        )}
        <button className="btn" onClick={() => saveDraft(false)}>
          {isRTL ? 'حفظ كمسودة' : 'Save as draft'}
        </button>
        <button
          className="btn p"
          disabled={remainingErrors > 0}
          onClick={confirmPublish}
        >
          {isRTL ? 'نشر الإعدادات' : 'Publish configuration'}
        </button>
      </footer>
    );
  }

  const nextButtonText = () => {
    if (currentPage?.nextLabel) {
      if (isRTL) {
        if (currentPage.nextLabel.includes('Continue')) return 'حفظ ومتابعة ←';
        if (currentPage.nextLabel.includes('Review')) return 'مراجعة ونشر ←';
        return currentPage.nextLabel;
      }
      return currentPage.nextLabel;
    }
    return isRTL ? 'حفظ ومتابعة ←' : 'Save & Continue →';
  };

  // Standard step footer
  return (
    <footer id="ft">
      {state.pageIndex > 0 && (
        <button className="btn" onClick={back}>
          {isRTL ? 'السابق →' : '← Back'}
        </button>
      )}
      <span className="sp" />
      {currentPage?.skip && (
        <button className="btn g" onClick={skip}>
          {isRTL ? 'تخطي الآن' : 'Skip for now'}
        </button>
      )}
      <button className="btn" onClick={() => saveDraft(true)}>
        {isRTL ? 'حفظ كمسودة وخروج' : 'Save draft & exit'}
      </button>
      <button className="btn p" onClick={next}>
        {nextButtonText()}
      </button>
    </footer>
  );
};
