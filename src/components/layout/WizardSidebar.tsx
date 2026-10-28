'use client';

import React from 'react';
import { useWizard, PAGE_DEFINITIONS } from '@/context/WizardContext';
import { STEPS_LABELS, OPTIONAL_STEP_INDICES } from '@/mocks/mockSetupData';
import { useLanguage } from '@/context/LanguageContext';

export interface WizardSidebarProps {
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

const ARABIC_STEP_LABELS: Record<string, string> = {
  'Company Profile': 'ملف الشركة',
  'Branches & Sites': 'الفروع والمواقع',
  'Calendars & Policies': 'التقويمات والسياسات',
  'Shifts & Working Hours': 'الورديات وساعات العمل',
  'Organization Structure': 'الهيكل التنظيمي',
  'Roles & Hierarchy': 'الأدوار والتسلسل',
  'Access & Permissions': 'الصلاحيات والأذونات',
  'Notification Rules': 'قواعد الإشعارات',
};

export const WizardSidebar: React.FC<WizardSidebarProps> = ({
  isOpenOnMobile,
  onCloseMobile,
}) => {
  const { state, goStep } = useWizard();
  const { isRTL } = useLanguage();

  const getStepStatus = (n: number): [string, 'c' | 'x' | 'a' | 'p' | 's' | 'n'] => {
    const currentStepNum = PAGE_DEFINITIONS[state.pageIndex]?.st ?? 0;
    const maxStepNum = PAGE_DEFINITIONS[state.maxPageIndex]?.st ?? 0;
    const isSuccess = state.isPublishedDone;

    if (isSuccess) return [isRTL ? 'مكتمل' : 'Completed', 'c'];

    const currentPage = PAGE_DEFINITIONS[state.pageIndex];
    if (state.isBlockedMode && currentPage?.id === 'Blocked') {
      if (n === 2 && !state.blockingFixes.p) return [isRTL ? 'محظور' : 'Blocked', 'x'];
      if (n === 3 && !state.blockingFixes.s) return [isRTL ? 'يتطلب الانتباه' : 'Needs Attention', 'a'];
      if (n === 5 && !state.blockingFixes.r) return [isRTL ? 'محظور' : 'Blocked', 'x'];
    }

    if (n === currentStepNum) return [isRTL ? 'قيد الإنجاز' : 'In Progress', 'p'];
    if (state.skippedSteps[n] && n <= maxStepNum) return [isRTL ? 'تم التخطي' : 'Skipped', 's'];
    return n < maxStepNum
      ? [isRTL ? 'مكتمل' : 'Completed', 'c']
      : [isRTL ? 'لم يبدأ بعد' : 'Not Started', 'n'];
  };

  const completedCount = STEPS_LABELS.filter((_, n) => getStepStatus(n)[1] === 'c').length;
  const progressPercent = (completedCount / 8) * 100;

  const isMobile = React.useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {};
      const mql = window.matchMedia('(max-width: 768px)');
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false),
    () => false
  );

  if (isMobile && !isOpenOnMobile) {
    return null;
  }

  return (
    <>
      {isOpenOnMobile && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside id="sb" className={isOpenOnMobile ? 'mobile-open' : ''}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: '4px 8px 0' }}>{isRTL ? 'إعداد الشركة' : 'Company Setup'}</h3>
            {isOpenOnMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="btn sm"
                aria-label="Close navigation menu"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  padding: '2px 8px',
                  fontSize: 13,
                  borderRadius: 6,
                }}
              >
                ✕
              </button>
            )}
          </div>
          <small style={{ margin: isRTL ? '0 8px 0 0' : '0 0 0 8px' }}>
            {isRTL
              ? `اكتمل ${completedCount} من 8 خطوات`
              : `${completedCount} of 8 steps complete`}
          </small>
          <div className="bar">
            <i style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {STEPS_LABELS.map((title, n) => {
            const [label, key] = getStepStatus(n);
            const isOptional = OPTIONAL_STEP_INDICES.includes(n);
            const displayTitle = isRTL && ARABIC_STEP_LABELS[title] ? ARABIC_STEP_LABELS[title] : title;

            let dotContent: React.ReactNode = n + 1;
            if (key === 'c') dotContent = '✓';
            if (key === 'x') dotContent = '!';

            return (
              <button
                key={title}
                className={`st ${key === 'p' ? 'on' : ''}`}
                onClick={() => {
                  goStep(n);
                  if (onCloseMobile) onCloseMobile();
                }}
                aria-current={key === 'p' ? 'step' : undefined}
              >
                <span className={`dot ${key}`}>{dotContent}</span>
                <span>
                  <b>{displayTitle}</b>
                  <small>
                    {label}
                    {isOptional ? (isRTL ? ' · اختياري' : ' · optional') : ''}
                  </small>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="note">
          {isRTL
            ? 'النسخ المنشورة غير قابلة للتعديل. التعديلات المستقبلية تنشئ نسخة جديدة.'
            : 'Published versions are immutable. Future edits create a new version.'}
        </div>
      </aside>
    </>
  );
};
