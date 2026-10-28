'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface Translations {
  // Navigation & General
  langCode: string;
  langName: string;
  langSwitchLabel: string;
  themeLight: string;
  themeDark: string;
  themeLightMode: string;
  themeNightMode: string;
  setupWizard: string;
  returnToWizard: string;
  help: string;
  helpSupport: string;
  signIn: string;
  signInPortal: string;
  saveDraft: string;
  saved: string;
  saving: string;
  unsaved: string;
  draftBadge: string;
  companyAdmin: string;
  secureSso: string;
  copyright: string;

  // Login Page Visual Panel
  visualBadge: string;
  visualHeadline: string;
  visualDesc: string;
  visualNarrative: string;
  visualPill1: string;
  visualPill2: string;
  visualPill3: string;

  // Login Form
  brandSub: string;
  loginTag: string;
  loginTitle: string;
  loginSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailRequired: string;
  emailInvalid: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  passwordRequired: string;
  passwordMin: string;
  signInBtn: string;
  signingInBtn: string;
  ssoNotice: string;
  signedInAs: string;
  launchWizard: string;

  // Setup Wizard Steps & Navigation
  stepPrefix: string;
  stepOf: string;
  requiredBadge: string;
  optionalBadge: string;
  previousBtn: string;
  saveContinueBtn: string;
  skipStepBtn: string;
  publishWorkspaceBtn: string;
}

const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    langCode: 'en',
    langName: 'English',
    langSwitchLabel: 'العربية',
    themeLight: '☀ Light',
    themeDark: '☾ Dark',
    themeLightMode: '☀ Light mode',
    themeNightMode: '☾ Night mode',
    setupWizard: 'Setup Wizard',
    returnToWizard: 'Setup Wizard →',
    help: 'Help',
    helpSupport: 'Help & Support',
    signIn: 'Sign In',
    signInPortal: 'Sign In Portal',
    saveDraft: 'Save Draft',
    saved: 'Saved',
    saving: 'Saving…',
    unsaved: 'Unsaved changes',
    draftBadge: 'Draft v0.4',
    companyAdmin: 'Company Admin',
    secureSso: 'Secure SSO',
    copyright: '© 2026 Dynamic SaaS HRMS',

    visualBadge: 'ENTERPRISE WORKFORCE CLOUD',
    visualHeadline: 'Welcome to Dynamic HRMS',
    visualDesc: 'Manage your HR tasks smarter, faster, and easier — all in one unified place.',
    visualNarrative: 'PEOPLE · PERFORMANCE · POSSIBILITIES',
    visualPill1: 'Enterprise SSO Ready',
    visualPill2: 'Dual Dashboard Architecture',
    visualPill3: 'Multi-Branch Governance',

    brandSub: 'Enterprise Portal',
    loginTag: 'Workforce Sign In',
    loginTitle: 'Welcome back',
    loginSubtitle: 'Sign in to access your workspace.',
    emailLabel: 'EMAIL ADDRESS',
    emailPlaceholder: 'name@company.com',
    emailRequired: 'Email address is required.',
    emailInvalid: 'Please enter a valid work email address.',
    passwordLabel: 'PASSWORD',
    passwordPlaceholder: 'Enter your password',
    passwordRequired: 'Password is required.',
    passwordMin: 'Password must be at least 6 characters.',
    signInBtn: 'Sign in',
    signingInBtn: 'Signing in…',
    ssoNotice: 'Protected by Enterprise Single Sign-On policies. Contact your system administrator if you experience access difficulties.',
    signedInAs: 'Signed in as',
    launchWizard: 'Launch Setup Wizard',

    stepPrefix: 'STEP',
    stepOf: 'OF 8',
    requiredBadge: 'REQUIRED',
    optionalBadge: 'OPTIONAL',
    previousBtn: '← Previous',
    saveContinueBtn: 'Save & Continue →',
    skipStepBtn: 'Skip this step',
    publishWorkspaceBtn: 'Publish Workspace',
  },
  ar: {
    langCode: 'ar',
    langName: 'العربية',
    langSwitchLabel: 'English',
    themeLight: '☀ نهاري',
    themeDark: '☾ ليلي',
    themeLightMode: '☀ الوضع النهاري',
    themeNightMode: '☾ الوضع الليلي',
    setupWizard: 'معالج الإعداد',
    returnToWizard: 'معالج الإعداد ←',
    help: 'المساعدة',
    helpSupport: 'المساعدة والدعم',
    signIn: 'تسجيل الدخول',
    signInPortal: 'بوابة الدخول',
    saveDraft: 'حفظ كمسودة',
    saved: 'محفوظ',
    saving: 'جاري الحفظ…',
    unsaved: 'تغييرات غير محفوظة',
    draftBadge: 'مسودة v0.4',
    companyAdmin: 'مسؤول الشركة',
    secureSso: 'دخول موحد آمن',
    copyright: '© 2026 Dynamic SaaS HRMS',

    visualBadge: 'سحابة القوى العاملة للمؤسسات',
    visualHeadline: 'مرحباً بك في Dynamic HRMS',
    visualDesc: 'أدر مهام الموارد البشرية بذكاء وسرعة وسهولة — كل ذلك في منصة موحدة واحدة.',
    visualNarrative: 'الأفراد · الأداء · الإمكانيات',
    visualPill1: 'جاهز للدخول الموحد SSO',
    visualPill2: 'هيكل لوحة تحكم مزدوج',
    visualPill3: 'إدارة متعددة الفروع',

    brandSub: 'بوابة المؤسسات',
    loginTag: 'تسجيل دخول الموظفين',
    loginTitle: 'أهلاً بك مجدداً',
    loginSubtitle: 'سجل الدخول للوصول إلى مساحة عملك.',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'البريد الالكتروني',
    emailRequired: 'البريد الإلكتروني مطلوب.',
    emailInvalid: 'يرجى إدخال بريد إلكتروني صالح للعمل.',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    passwordRequired: 'كلمة المرور مطلوبة.',
    passwordMin: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    signInBtn: 'تسجيل الدخول',
    signingInBtn: 'جاري تسجيل الدخول…',
    ssoNotice: 'محمي بسياسات الدخول الموحد للمؤسسات. اتصل بمسؤول النظام إذا واجهتك أي صعوبات في الوصول.',
    signedInAs: 'تم تسجيل الدخول باسم',
    launchWizard: 'الانتقال لمعالج الإعداد',

    stepPrefix: 'الخطوة',
    stepOf: 'من 8',
    requiredBadge: 'إلزامي',
    optionalBadge: 'اختياري',
    previousBtn: 'السابق →',
    saveContinueBtn: '← حفظ ومتابعة',
    skipStepBtn: 'تخطي هذه الخطوة',
    publishWorkspaceBtn: 'نشر مساحة العمل',
  },
};

interface LanguageContextType {
  language: Language;
  direction: Direction;
  isRTL: boolean;
  t: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'csw-lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load persisted language from localStorage on client mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (savedLang === 'ar' || savedLang === 'en') {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
        document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
      } else {
        // Default to Arabic or English based on browser language if appropriate
        const browserLang = navigator.language.startsWith('ar') ? 'ar' : 'en';
        setLanguageState(browserLang);
        document.documentElement.lang = browserLang;
        document.documentElement.dir = browserLang === 'ar' ? 'rtl' : 'ltr';
      }
    } catch {
      // localStorage not accessible
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage not accessible
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  }, [language, setLanguage]);

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = language === 'ar';
  const t = useMemo(() => TRANSLATIONS[language], [language]);

  const value = useMemo(
    () => ({
      language,
      direction,
      isRTL,
      t,
      setLanguage,
      toggleLanguage,
    }),
    [language, direction, isRTL, t, setLanguage, toggleLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return sensible defaults if rendered outside of provider during SSR or tests
    return {
      language: 'en',
      direction: 'ltr',
      isRTL: false,
      t: TRANSLATIONS.en,
      setLanguage: () => {},
      toggleLanguage: () => {},
    };
  }
  return context;
};
