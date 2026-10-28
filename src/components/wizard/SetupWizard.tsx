'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useWizard, PAGE_DEFINITIONS } from '@/context/WizardContext';
import { OPTIONAL_STEP_INDICES } from '@/mocks/mockSetupData';
import { WizardHeader } from '@/components/layout/WizardHeader';
import { WizardSidebar } from '@/components/layout/WizardSidebar';
import { WizardFooter } from '@/components/layout/WizardFooter';
import { ToastContainer } from '@/components/common/ToastContainer';
import { ModalDialog } from '@/components/common/ModalDialog';
import { useLanguage } from '@/context/LanguageContext';

import { View01CompanyProfile } from '@/components/views/View01CompanyProfile';
import { View02LocaleUrl } from '@/components/views/View02LocaleUrl';
import { View03BranchesEmpty } from '@/components/views/View03BranchesEmpty';
import { View04BranchForm } from '@/components/views/View04BranchForm';
import { View05BranchesList } from '@/components/views/View05BranchesList';
import { View06CalendarsPolicies } from '@/components/views/View06CalendarsPolicies';
import { View07Shifts } from '@/components/views/View07Shifts';
import { View08Organization } from '@/components/views/View08Organization';
import { View09RoleForm } from '@/components/views/View09RoleForm';
import { View10RolesList } from '@/components/views/View10RolesList';
import { View11PermissionMatrix } from '@/components/views/View11PermissionMatrix';
import { View12NotificationForm } from '@/components/views/View12NotificationForm';
import { View13NotificationsList } from '@/components/views/View13NotificationsList';
import { View14ReviewPublish } from '@/components/views/View14ReviewPublish';
import { View15BlockedErrors } from '@/components/views/View15BlockedErrors';
import { View16PublishSuccess } from '@/components/views/View16PublishSuccess';

const VIEW_COMPONENTS: React.FC[] = [
  /* 0 */ View01CompanyProfile,
  /* 1 */ View02LocaleUrl,
  /* 2 */ View03BranchesEmpty,
  /* 3 */ View04BranchForm,
  /* 4 */ View05BranchesList,
  /* 5 */ View06CalendarsPolicies,
  /* 6 */ View07Shifts,
  /* 7 */ View08Organization,
  /* 8 */ View09RoleForm,
  /* 9 */ View10RolesList,
  /* 10 */ View11PermissionMatrix,
  /* 11 */ View12NotificationForm,
  /* 12 */ View13NotificationsList,
  /* 13 */ View14ReviewPublish,
  /* 14 */ View15BlockedErrors,
  /* 15 */ View16PublishSuccess,
];

export const SetupWizard: React.FC = () => {
  const { state, setDirty } = useWizard();
  const { isRTL, t } = useLanguage();
  const mainRef = useRef<HTMLElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentPage = PAGE_DEFINITIONS[state.pageIndex] || PAGE_DEFINITIONS[0];
  const ActiveView = VIEW_COMPONENTS[state.pageIndex] || VIEW_COMPONENTS[0];

  // Reset scroll to top on page switch, matching HTML document.querySelector("main").scrollTop=0
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [state.pageIndex]);

  const stepNumber = currentPage.st + 1;
  const isOptional = OPTIONAL_STEP_INDICES.includes(currentPage.st);
  const requirementText = isOptional ? t.optionalBadge : t.requiredBadge;
  const pageLabelText = currentPage.pageLabel ? ` · ${currentPage.pageLabel.toUpperCase()}` : '';

  return (
    <div className="wizard-layout" dir={isRTL ? 'rtl' : 'ltr'}>
      <WizardSidebar
        isOpenOnMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      <div className="rt">
        <WizardHeader
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <main
          ref={mainRef}
          onInput={() => setDirty()}
        >
          <div className="in" id="pg">
            {!currentPage.noStep && (
              <section className="card" style={{ marginBottom: 14 }}>
                <div className="kick">
                  STEP {stepNumber} OF 8 · {requirementText}
                  {pageLabelText}
                </div>
                <h1>{currentPage.title}</h1>
                <p className="sub" style={{ margin: 0 }}>
                  {currentPage.sub}
                </p>
              </section>
            )}

            <ActiveView />
          </div>
        </main>
        <WizardFooter />
      </div>

      <ToastContainer />
      <ModalDialog />
    </div>
  );
};
