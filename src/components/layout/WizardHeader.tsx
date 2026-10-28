'use client';

import React from 'react';
import Link from 'next/link';
import { useWizard } from '@/context/WizardContext';
import { useLanguage } from '@/context/LanguageContext';

export interface WizardHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({ onOpenMobileMenu }) => {
  const { state, toggleTheme, addToast, saveDraft } = useWizard();
  const { isRTL, t, toggleLanguage } = useLanguage();

  const isClient = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const getDotClass = () => {
    if (state.saveStatus === 'Saved') return 'd';
    if (state.saveStatus === 'Saving…') return 'd s';
    return 'd u';
  };

  const getStatusText = () => {
    if (state.saveStatus === 'Saved') return t.saved;
    if (state.saveStatus === 'Saving…') return t.saving;
    return t.unsaved;
  };

  return (
    <header id="hd">
      {isMobile && (
        <button
          type="button"
          className="btn sm menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open sidebar menu"
          title="Open sidebar navigation"
          style={{ padding: '6px 8px', marginRight: 2 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
      <div className="lg">N</div>
      <div>
        <b>Nile Horizon Technologies</b>
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          <span className="pill">{t.draftBadge}</span>
          <span className="pill" id="sv">
            <i className={getDotClass()} /> {getStatusText()}
          </span>
        </div>
      </div>
      <span className="sp" />

      {/* Language Switcher Icon Button in Navbar */}
      <button
        type="button"
        className="btn sm"
        onClick={toggleLanguage}
        aria-label="Toggle language"
        title={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12.5,
          padding: '6px 12px',
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{t.langSwitchLabel}</span>
      </button>

      {/* Theme Mode Toggle Button */}
      <button
        className="btn"
        onClick={toggleTheme}
        aria-label="Switch colour mode"
        suppressHydrationWarning
      >
        {isClient && state.theme === 'dark' ? t.themeLightMode : t.themeNightMode}
      </button>

      {/* User Profile Dropdown Trigger */}
      <div style={{ position: 'relative' }} ref={userMenuRef}>
        <div
          className="av"
          onClick={() => setIsUserMenuOpen((prev) => !prev)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          role="button"
          tabIndex={0}
          aria-expanded={isUserMenuOpen}
          aria-haspopup="menu"
          title="User menu"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsUserMenuOpen((prev) => !prev);
            }
          }}
        >
          <i>MS</i>
          <div>
            Mostafa Salama<small>{t.companyAdmin}</small>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--mut)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              marginLeft: 2,
              transition: 'transform 0.2s ease',
              transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {isUserMenuOpen && (
          <div
            className="user-dropdown-panel"
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: isRTL ? 'auto' : 0,
              left: isRTL ? 0 : 'auto',
              width: '220px',
              backgroundColor: 'var(--card, #ffffff)',
              border: '1px solid var(--s2, #D0D5DD)',
              borderRadius: '12px',
              boxShadow: '0 12px 30px rgba(5, 19, 89, 0.16), 0 4px 10px rgba(5, 19, 89, 0.08)',
              padding: '6px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. Help */}
            <button
              type="button"
              className="menu-dropdown-item"
              role="menuitem"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'var(--p1, #2440F0)',
                fontWeight: 600,
                fontSize: '13.5px',
                textDecoration: 'none',
                cursor: 'pointer',
                textAlign: isRTL ? 'right' : 'left',
                boxSizing: 'border-box',
              }}
              onClick={() => {
                setIsUserMenuOpen(false);
                addToast(isRTL ? 'مركز المساعدة: أدلة الدعم متوفرة على مدار الساعة' : 'Help center opens here');
              }}
            >
              <span
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: 'var(--s3, #F2F7FF)',
                  color: 'var(--p1, #2440F0)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--p1, #2440F0)' }}>{t.help}</span>
            </button>

            {/* 2. Sign In */}
            <Link
              href="/login"
              className="menu-dropdown-item"
              role="menuitem"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'var(--p1, #2440F0)',
                fontWeight: 600,
                fontSize: '13.5px',
                textDecoration: 'none',
                cursor: 'pointer',
                textAlign: isRTL ? 'right' : 'left',
                boxSizing: 'border-box',
              }}
              onClick={() => setIsUserMenuOpen(false)}
            >
              <span
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: 'var(--s3, #F2F7FF)',
                  color: 'var(--p1, #2440F0)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--p1, #2440F0)' }}>{t.signIn}</span>
            </Link>

            <div style={{ height: '1px', background: 'var(--s2, #D0D5DD)', margin: '4px 6px' }} />

            {/* 3. Save draft & exit */}
            <button
              type="button"
              className="menu-dropdown-item"
              role="menuitem"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'var(--p1, #2440F0)',
                fontWeight: 600,
                fontSize: '13.5px',
                textDecoration: 'none',
                cursor: 'pointer',
                textAlign: isRTL ? 'right' : 'left',
                boxSizing: 'border-box',
              }}
              onClick={() => {
                setIsUserMenuOpen(false);
                saveDraft(true);
                addToast(isRTL ? 'تم حفظ المسودة بنجاح' : 'Draft saved successfully');
              }}
            >
              <span
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: 'var(--s3, #F2F7FF)',
                  color: 'var(--p1, #2440F0)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--p1, #2440F0)' }}>{t.saveDraft}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
