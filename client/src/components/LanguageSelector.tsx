import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check, Share2, Copy } from 'lucide-react';

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
 * Normalizes input language names, codes, and aliases (case-insensitive) to canonical codes
 */
export const resolveLanguageCode = (input?: string | null): string | null => {
  if (!input) return null;
  const cleaned = input.trim().toLowerCase();
  if (!cleaned) return null;

  // Direct code match (e.g. 'es', 'de', 'ar', 'zh-cn')
  const direct = LANGUAGES.find(l => l.code.toLowerCase() === cleaned);
  if (direct) return direct.code;

  // Exact name or nativeName match (e.g. 'spanish' -> 'es', 'arabic' -> 'ar')
  const byName = LANGUAGES.find(
    l => l.name.toLowerCase() === cleaned || l.nativeName.toLowerCase() === cleaned
  );
  if (byName) return byName.code;

  // Common language name aliases
  const aliasMap: Record<string, string> = {
    sp: 'es',
    esp: 'es',
    espanol: 'es',
    español: 'es',
    spanish: 'es',
    ger: 'de',
    deutsch: 'de',
    german: 'de',
    ara: 'ar',
    arabic: 'ar',
    fre: 'fr',
    fra: 'fr',
    french: 'fr',
    francais: 'fr',
    français: 'fr',
    rus: 'ru',
    russian: 'ru',
    por: 'pt',
    portuguese: 'pt',
    português: 'pt',
    ita: 'it',
    italian: 'it',
    italiano: 'it',
    tur: 'tr',
    turkish: 'tr',
    türkçe: 'tr',
    hin: 'hi',
    hindi: 'hi',
    chi: 'zh-CN',
    zho: 'zh-CN',
    chinese: 'zh-CN',
    mandarin: 'zh-CN',
    zh: 'zh-CN',
    'zh-cn': 'zh-CN',
    eng: 'en',
    english: 'en'
  };

  if (aliasMap[cleaned]) {
    return aliasMap[cleaned];
  }

  return null;
};

/**
 * Extracts language code from current URL query parameters (?lang=..., ?hl=..., ?locale=...) or hash
 */
export const getLanguageFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const paramVal = params.get('lang') || params.get('hl') || params.get('locale');
    if (paramVal) {
      const resolved = resolveLanguageCode(paramVal);
      if (resolved) return resolved;
    }
  } catch {}

  try {
    const hash = window.location.hash;
    if (hash && hash.includes('googtrans')) {
      const match = hash.match(/googtrans\([^|/]+\|([^)]+)\)/);
      if (match && match[1]) {
        const resolved = resolveLanguageCode(match[1]);
        if (resolved) return resolved;
      }
    }
  } catch {}

  return null;
};

/**
 * Updates the current URL with ?lang=<code> without a full page reload so the browser address bar is immediately shareable
 */
export const updateUrlLanguage = (code: string) => {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (code === 'en') {
      url.searchParams.delete('lang');
      url.searchParams.delete('hl');
      url.searchParams.delete('locale');
    } else {
      url.searchParams.set('lang', code);
    }
    window.history.replaceState({}, '', url.toString());
  } catch {}
};

/**
 * Builds a shareable URL containing the active language query parameter
 */
export const buildTranslatedUrl = (code?: string): string => {
  if (typeof window === 'undefined') return '';
  const targetCode = code || localStorage.getItem('praztech_selected_lang') || 'en';
  try {
    const url = new URL(window.location.href);
    if (targetCode === 'en') {
      url.searchParams.delete('lang');
      url.searchParams.delete('hl');
      url.searchParams.delete('locale');
    } else {
      url.searchParams.set('lang', targetCode);
    }
    return url.toString();
  } catch {
    return window.location.origin + window.location.pathname + (targetCode !== 'en' ? `?lang=${targetCode}` : '');
  }
};

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
  const [copiedLink, setCopiedLink] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read current active language: URL params take priority, followed by cookie / localStorage
  const detectLanguage = (): string => {
    try {
      // 1. URL Parameter Priority (links sent to international buyers)
      const urlLang = getLanguageFromUrl();
      if (urlLang) {
        if (urlLang === 'en') {
          clearGoogTransCookie();
          try { localStorage.setItem('praztech_selected_lang', 'en'); } catch {}
          return 'en';
        }
        setGoogTransCookie(urlLang);
        try { localStorage.setItem('praztech_selected_lang', urlLang); } catch {}
        return urlLang;
      }

      // 2. Local storage preference
      const saved = localStorage.getItem('praztech_selected_lang');
      if (saved === 'en') {
        clearGoogTransCookie();
        return 'en';
      }

      // 3. Existing Google Translate cookie
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
    } else {
      setGoogTransCookie(active);
      updateUrlLanguage(active);
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

    // Suppress Google Translate banner and body offset on DOM injection (without continuous polling)
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

        // If active language is non-English, ensure Google Translate dropdown selects it
        if (active !== 'en') {
          const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
          if (select && select.value !== active) {
            select.value = active;
            select.dispatchEvent(new Event('change'));
          }
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

    // Sync on browser back/forward history events
    const handlePopState = () => {
      const poppedLang = detectLanguage();
      setCurrentLang(poppedLang);
      if (poppedLang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
      } else {
        document.documentElement.removeAttribute('dir');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('popstate', handlePopState);

    return () => {
      observer.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleSelectLanguage = (code: string) => {
    setCurrentLang(code);
    try { localStorage.setItem('praztech_selected_lang', code); } catch {}
    updateUrlLanguage(code);

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

  const handleCopyShareLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = buildTranslatedUrl(currentLang);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const currentObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  if (variant === 'mobile') {
    return (
      <div className="pt-2 border-t border-[#381c59]/70 space-y-2">
        <div className="flex items-center justify-between px-3 py-2 text-xs text-[#dcd5e4] font-medium">
          <span className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-[#b5a8c8]" />
            <span>Select Language</span>
          </span>
          <span className="font-mono text-[11px] bg-[#381c59] text-white px-2 py-0.5 rounded border border-[#5e3e8b]/40">
            {currentObj.flag} {currentObj.nativeName}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 px-2 max-h-52 overflow-y-auto">
          {LANGUAGES.map(lang => {
            const isSelected = lang.code === currentLang;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#5e3e8b] text-white font-bold shadow-xs'
                    : 'bg-[#2e075d] hover:bg-[#381c59] text-[#dcd5e4]'
                }`}
              >
                <span className="flex items-center space-x-1.5 truncate">
                  <span className="text-sm">{lang.flag}</span>
                  <span className="truncate">{lang.nativeName}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Mobile One-Click Copy Shareable Link */}
        <div className="px-2 pt-1 pb-1">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-[#381c59] hover:bg-[#5e3e8b] text-white transition-colors cursor-pointer border border-[#5e3e8b]/50 shadow-sm"
          >
            <span className="flex items-center space-x-2">
              <Share2 className="w-3.5 h-3.5 text-[#dcd5e4]" />
              <span>{copiedLink ? 'Link Copied to Clipboard!' : `Copy Link in ${currentObj.nativeName}`}</span>
            </span>
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#dcd5e4]" />
            )}
          </button>
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
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#24064a] border border-[#5e3e8b]/60 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
          <div className="px-3.5 py-2 border-b border-[#381c59] flex items-center justify-between text-[11px] text-[#b5a8c8] font-semibold uppercase tracking-wider bg-[#1f0540]">
            <span>Translate Website</span>
            <span className="font-mono text-[10px] text-white/60">{currentObj.code.toUpperCase()}</span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1 scrollbar-thin">
            {LANGUAGES.map(lang => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors cursor-pointer text-left ${
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

          {/* Desktop One-Click Copy Shareable Link Strip */}
          <div className="p-2 border-t border-[#381c59] bg-[#1a0435]">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#dcd5e4] hover:text-white hover:bg-[#381c59] transition-colors cursor-pointer"
              title="Copy link to this page in the active language"
            >
              <span className="flex items-center space-x-1.5 truncate">
                <Share2 className="w-3.5 h-3.5 text-[#b5a8c8] shrink-0" />
                <span className="truncate">
                  {copiedLink ? 'Link Copied to Clipboard!' : `Copy Link in ${currentObj.nativeName}`}
                </span>
              </span>
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1.5" />
              ) : (
                <Copy className="w-3 h-3 text-[#b5a8c8] shrink-0 ml-1.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
