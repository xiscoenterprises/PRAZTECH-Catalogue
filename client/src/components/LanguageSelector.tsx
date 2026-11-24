import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳' }
];

/**
 * Returns all possible domain variations for cookie scoping (host, parent domain, with and without leading dot)
 */
const getDomainVariations = (): string[] => {
  if (typeof window === 'undefined') return [''];
  const host = window.location.hostname;
  if (!host) return [''];
  const parts = host.split('.');
  const domains = ['', host, `.${host}`];
  if (parts.length > 2) {
    const parent = parts.slice(-2).join('.');
    domains.push(parent, `.${parent}`);
  }
  return Array.from(new Set(domains));
};

/**
 * Exhaustively clears googtrans cookies across all domains and paths to ensure clean reversion to English
 */
const clearGoogTransCookie = () => {
  const domains = getDomainVariations();
  const paths = ['/', ''];
  domains.forEach(d => {
    paths.forEach(p => {
      const dAttr = d ? ` domain=${d};` : '';
      const pAttr = p ? ` path=${p};` : '';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC;${pAttr}${dAttr}`;
    });
  });
};

/**
 * Sets googtrans cookie across all domain variations so Google Translate reliably reads it
 */
const setGoogTransCookie = (code: string) => {
  const domains = getDomainVariations();
  const cookieVal = `/en/${code}`;
  domains.forEach(d => {
    const dAttr = d ? ` domain=${d};` : '';
    document.cookie = `googtrans=${cookieVal}; path=/;${dAttr}`;
  });
};

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

interface LanguageSelectorProps {
  variant?: 'desktop' | 'mobile';
  onLanguageChange?: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'desktop',
  onLanguageChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read current active language from cookie or localStorage
  const detectLanguage = (): string => {
    try {
      const saved = localStorage.getItem('praztech_selected_lang');
      if (saved === 'en') {
        clearGoogTransCookie();
        return 'en';
      }
      const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
      if (match && match[1]) {
        const parts = decodeURIComponent(match[1]).split('/');
        const code = parts[parts.length - 1];
        if (code && code !== 'en' && LANGUAGES.some(l => l.code === code)) {
          return code;
        }
      }
      if (saved && LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'en';
  };

  useEffect(() => {
    const active = detectLanguage();
    if (active === 'en') {
      clearGoogTransCookie();
    }
    setCurrentLang(active);

    // Apply RTL for Arabic if detected
    if (active === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.removeAttribute('dir');
    }

    // Initialize Google Translate Script
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: LANGUAGES.map(l => l.code).join(','),
              autoDisplay: false
            },
            'google_translate_element'
          );
        }
      };
    }

    // Load Google Translate script if not present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    // Suppress Google Translate banner and body offset on DOM injection (without polling)
    const suppressGoogleBanner = () => {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.setProperty('top', '0px', 'important');
      }
      if (document.documentElement.style.top && document.documentElement.style.top !== '0px') {
        document.documentElement.style.setProperty('top', '0px', 'important');
      }
      const banners = document.querySelectorAll<HTMLElement>(
        '.goog-te-banner-frame, iframe[class*="VIpgJd"], .VIpgJd-ZVi9od-ORHb-OEVmcd, .skiptranslate iframe'
      );
      banners.forEach(b => {
        if (b.style.display !== 'none') {
          b.style.setProperty('display', 'none', 'important');
          b.style.setProperty('visibility', 'hidden', 'important');
          b.style.setProperty('height', '0px', 'important');
        }
      });
    };

    suppressGoogleBanner();

    let isHandlingMutation = false;
    const observer = new MutationObserver((mutations) => {
      if (isHandlingMutation) return;
      isHandlingMutation = true;
      try {
        let shouldSuppress = false;
        for (const m of mutations) {
          if (m.type === 'childList' && m.addedNodes.length > 0) {
            shouldSuppress = true;
            break;
          }
          if (m.type === 'attributes' && m.attributeName === 'style') {
            if (document.body.style.top && document.body.style.top !== '0px') {
              shouldSuppress = true;
              break;
            }
          }
        }
        if (shouldSuppress) {
          suppressGoogleBanner();
        }
      } finally {
        isHandlingMutation = false;
      }
    });

    observer.observe(document.body, {
      childList: true,
      attributes: true,
      attributeFilter: ['style']
    });

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      observer.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectLanguage = (code: string) => {
    setCurrentLang(code);
    localStorage.setItem('praztech_selected_lang', code);

    if (code === 'en') {
      // 1. Thoroughly wipe googtrans across all domain variations
      clearGoogTransCookie();
      document.documentElement.removeAttribute('dir');

      // 2. Try resetting Google Translate widget directly if attached
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (select) {
        const defaultOpt = Array.from(select.options).find(o => o.value === '' || o.value === 'en');
        if (defaultOpt) {
          select.value = defaultOpt.value;
          select.dispatchEvent(new Event('change'));
        }
      }

      setIsOpen(false);
      if (onLanguageChange) onLanguageChange();

      // 3. Reload cleanly so all DOM elements revert to pristine source English
      setTimeout(() => {
        window.location.reload();
      }, 50);
      return;
    }

    // Set cookie across all domain variations
    setGoogTransCookie(code);

    if (code === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.removeAttribute('dir');
    }

    // Trigger translate select element if available
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }

    setIsOpen(false);
    if (onLanguageChange) onLanguageChange();
  };

  const currentObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  if (variant === 'mobile') {
    return (
      <div className="pt-2 border-t border-[#381c59]/70">
        <div className="flex items-center justify-between px-3 py-2 text-xs text-[#dcd5e4] font-medium">
          <span className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-[#b5a8c8]" />
            <span>Select Language</span>
          </span>
          <span className="font-mono text-[11px] bg-[#381c59] text-white px-2 py-0.5 rounded border border-[#5e3e8b]/40">
            {currentObj.flag} {currentObj.nativeName}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 px-2 mt-1 max-h-56 overflow-y-auto">
          {LANGUAGES.map(lang => {
            const isSelected = lang.code === currentLang;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#5e3e8b] text-white font-bold'
                    : 'bg-[#2e075d] hover:bg-[#381c59] text-[#dcd5e4]'
                }`}
              >
                <span className="flex items-center space-x-1.5 truncate">
                  <span className="text-sm">{lang.flag}</span>
                  <span className="truncate">{lang.nativeName}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop Navbar Dropdown
  return (
    <div className="relative notranslate" ref={dropdownRef}>
      {/* Hidden anchor element for Google Translate */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-2 sm:px-2.5 inline-flex items-center justify-center space-x-1 sm:space-x-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0 box-border leading-none ${
          isOpen
            ? 'bg-[#381c59] text-white border-[#5e3e8b]'
            : 'bg-[#24064a] hover:bg-[#381c59] text-[#dcd5e4] hover:text-white border-[#5e3e8b]/40'
        }`}
        title="Change website language"
        aria-label="Change website language"
      >
        <span className="text-sm leading-none shrink-0">{currentObj.flag}</span>
        <span className="font-mono text-[11px] sm:text-xs font-semibold tracking-wide leading-none">
          {currentObj.code.toUpperCase()}
        </span>
        <ChevronDown className={`w-3 h-3 opacity-70 transition-transform hidden sm:inline ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#24064a] border border-[#5e3e8b]/60 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-[#381c59] flex items-center justify-between text-[11px] text-[#b5a8c8] font-semibold uppercase tracking-wider">
            <span>Translate Website</span>
            <span className="font-mono text-[10px] text-white/60">Auto</span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1 scrollbar-thin">
            {LANGUAGES.map(lang => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#381c59] text-white font-bold'
                      : 'text-[#dcd5e4] hover:bg-[#2e075d] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="text-base shrink-0">{lang.flag}</span>
                    <div className="truncate">
                      <div className="truncate text-xs leading-snug">{lang.nativeName}</div>
                      <div className="text-[10px] text-[#b5a8c8] font-normal leading-none">{lang.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
