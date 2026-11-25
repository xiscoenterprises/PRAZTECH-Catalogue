import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SubModelSelector } from '../components/SubModelSelector';
import { SlidersHorizontal } from 'lucide-react';
import { Product, SubModel } from '../types';

export interface ProductShowcaseConfig {
  product: Product;
  language?: string; // Target language code: 'en' | 'es' | 'fr' | 'de' | 'ar' | 'ru' | 'pt' | 'it' | 'tr' | 'hi' | 'zh-CN'
  headline?: string;
  productTitle?: string;
  tagline?: string;
  categoryBadge?: string;
  highlightBadge?: string;
  selectedImageUrl?: string;
  selectedSubModel?: SubModel | null;
  variantCardElement?: HTMLElement | null;
  aspectRatio?: 'portrait' | 'square'; // Default 'portrait' = 1200x1600+ (A4 flyer)
  theme?: 'royal-purple' | 'dark-slate' | 'clean-white';
  includeFeatures: boolean;
  includeSpecs: boolean;
  includeVariants?: boolean;
  includeApplications: boolean;
  customNotes?: string;
  companyName?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const SHOWCASE_FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Kohinoor Devanagari", "Noto Sans Devanagari", "Geeza Pro", "Arial", sans-serif';

export const SHOWCASE_I18N: Record<string, {
  headerSubtitle: string;
  headerContact: string;
  modelPrefix: string;
  genuineBadge: string;
  defaultCategory: string;
  keyAdvantages: string;
  specAndVariant: string;
  options: string;
  techSpecsMatrix: string;
  targetApps: string;
  footerFactory: string;
  footerQuality: string;
  footerExport: string;
  officialOverview: string;
  photoFallback: string;
  defaultFeatures: string[];
  defaultApps: string[];
}> = {
  en: {
    headerSubtitle: 'AUTOMOTIVE VALVE REBUILDING & PRECISION TOOLING',
    headerContact: 'Web: www.praztechtools.com  |  Phone: +91 8744020102  |  Asaf Ali Rd, Delhi',
    modelPrefix: 'MODEL:',
    genuineBadge: 'GENUINE PRAZTECH® TOOL',
    defaultCategory: 'PRECISION TOOLING',
    keyAdvantages: 'KEY ENGINEERING ADVANTAGES',
    specAndVariant: 'Specification and variant',
    options: 'options',
    techSpecsMatrix: 'TECHNICAL SPECIFICATIONS MATRIX',
    targetApps: 'TARGET APPLICATIONS & MACHINE SHOP COMPATIBILITY',
    footerFactory: 'PRAZTECH® ENGINEERING • FACTORY DIRECT PRECISION',
    footerQuality: 'Precision Factory Calibrated Tooling • 100% Quality Inspected • Made in India',
    footerExport: 'Export Inquiries & Workshop Enquiries: xiscoenterprises@gmail.com',
    officialOverview: 'OFFICIAL PRODUCT OVERVIEW',
    photoFallback: 'Product Photo:',
    defaultFeatures: [
      'Tungsten carbide precision tooling for mirror seat finish',
      'Rigid vibration-free pilot alignment for micron repeatability',
      'Hardened & tempered industrial alloy body construction',
      'Compatible with standard workshop drive spindles & hand handles',
      '100% factory inspection with certificate of accuracy'
    ],
    defaultApps: [
      'Motorcycles & Scooters (2-Wheeler)',
      'Passenger Cars & SUV Engines',
      'Commercial Heavy Diesel & Trucks',
      'Agricultural Tractors & Stationary Gensets',
      'Precision CNC & Manual Rebuilding Benches'
    ]
  },
  es: {
    headerSubtitle: 'RECONSTRUCCIÓN DE VÁLVULAS AUTOMOTRICES Y HERRAMIENTAS DE PRECISIÓN',
    headerContact: 'Web: www.praztechtools.com  |  Tel: +91 8744020102  |  Asaf Ali Rd, Delhi',
    modelPrefix: 'MODELO:',
    genuineBadge: 'HERRAMIENTA ORIGINAL PRAZTECH®',
    defaultCategory: 'HERRAMIENTAS DE PRECISIÓN',
    keyAdvantages: 'VENTAJAS DE INGENIERÍA PRINCIPALES',
    specAndVariant: 'Especificación y variantes',
    options: 'opciones',
    techSpecsMatrix: 'MATRIZ DE ESPECIFICACIONES TÉCNICAS',
    targetApps: 'APLICACIONES PRINCIPALES Y COMPATIBILIDAD DE TALLER',
    footerFactory: 'PRAZTECH® ENGINEERING • PRECISIÓN DIRECTA DE FÁBRICA',
    footerQuality: 'Herramientas Calibradas en Fábrica de Precisión • 100% Inspeccionadas • Fabricado en India',
    footerExport: 'Consultas de Exportación y Talleres: xiscoenterprises@gmail.com',
    officialOverview: 'FICHA TÉCNICA OFICIAL',
    photoFallback: 'Foto del producto:',
    defaultFeatures: [
      'Herramientas de carburo de tungsteno para acabado de espejo',
      'Alineación de piloto rígida sin vibración para repetibilidad micrométrica',
      'Cuerpo en aleación industrial templada y endurecida',
      'Compatible con husillos de taller estándar y mangos manuales',
      'Inspección de fábrica al 100% con certificado de precisión'
    ],
    defaultApps: [
      'Motocicletas y Scooters (2 Ruedas)',
      'Motores de Autos de Pasajeros y SUV',
      'Camiones y Diésel Pesado Comercial',
      'Tractores Agrícolas y Grupos Electrógenos',
      'Bancos de Rectificado CNC y Manual'
    ]
  },
  fr: {
    headerSubtitle: 'RÉNOVATION DE SOUPAPES AUTOMOBILES & OUTILLAGE DE PRÉCISION',
    headerContact: 'Web : www.praztechtools.com  |  Tél : +91 8744020102  |  Asaf Ali Rd, Delhi',
    modelPrefix: 'MODÈLE :',
    genuineBadge: 'OUTIL AUTHENTIQUE PRAZTECH®',
    defaultCategory: 'OUTILLAGE DE PRÉCISION',
    keyAdvantages: "AVANTAGES D'INGÉNIERIE CLÉS",
    specAndVariant: 'Spécifications et variantes',
    options: 'options',
    techSpecsMatrix: 'MATRICE DES SPÉCIFICATIONS TECHNIQUES',
    targetApps: "APPLICATIONS CIBLES ET COMPATIBILITÉ D'ATELIER",
    footerFactory: "PRAZTECH® ENGINEERING • PRÉCISION DIRECTE D'USINE",
    footerQuality: "Outillage Calibré en Usine de Précision • Contrôle Qualité 100% • Fabriqué en Inde",
    footerExport: "Demandes d'Exportation & Ateliers : xiscoenterprises@gmail.com",
    officialOverview: 'FICHE TECHNIQUE OFFICIELLE',
    photoFallback: 'Photo du produit :',
    defaultFeatures: [
      "Outillage carbure de tungstène de précision pour finition miroir",
      "Alignement rigide sans vibration pour une répétabilité micrométrique",
      "Corps en alliage industriel trempé et revenu haute résistance",
      "Compatible avec les broches d'atelier standard et porte-outils manuels",
      "Contrôle d'usine à 100% avec certificat d'exactitude"
    ],
    defaultApps: [
      'Motos et scooters (2-roues)',
      'Moteurs de voitures particulières et SUV',
      'Poids lourds et diesel commercial',
      'Tracteurs agricoles et groupes électrogènes',
      'Bancs de rénovation CNC et manuels'
    ]
  },
  de: {
    headerSubtitle: 'AUTOMOBIL-VENTILBEARBEITUNG & PRÄZISIONSWERKZEUGE',
    headerContact: 'Web: www.praztechtools.com  |  Tel: +91 8744020102  |  Asaf Ali Rd, Delhi',
    modelPrefix: 'MODELL:',
    genuineBadge: 'ORIGINAL PRAZTECH® WERKZEUG',
    defaultCategory: 'PRÄZISIONSWERKZEUGE',
    keyAdvantages: 'WICHTIGSTE ENTWICKLUNGSVORTEILE',
    specAndVariant: 'Spezifikationen und Varianten',
    options: 'Optionen',
    techSpecsMatrix: 'TECHNISCHE SPEZIFIKATIONEN',
    targetApps: 'ZIELANWENDUNGEN & WERKSTATTKOMPATIBILITÄT',
    footerFactory: 'PRAZTECH® ENGINEERING • PRÄZISION DIREKT AB WERK',
    footerQuality: 'Präzisionswerkzeuge Werkseitig Kalibriert • 100% Qualitätsgeprüft • Hergestellt in Indien',
    footerExport: 'Exportanfragen & Werkstattanfragen: xiscoenterprises@gmail.com',
    officialOverview: 'OFFIZIELLE PRODUKTÜBERSICHT',
    photoFallback: 'Produktfoto:',
    defaultFeatures: [
      'Wolframkarbid-Präzisionswerkzeuge für spiegelglattes Finish',
      'Starre, vibrationsfreie Pilotführung für mikrometergenaue Wiederholbarkeit',
      'Gehärteter und angelassener Industrielegierungskörper',
      'Kompatibel mit Standard-Werkstattspindeln und Handgriffen',
      '100% Werksprüfung mit Genauigkeitszertifikat'
    ],
    defaultApps: [
      'Motorräder & Motorroller (Zweiräder)',
      'Pkw- und SUV-Motoren',
      'Schwere Nutzfahrzeuge & Lkw-Diesel',
      'Landwirtschaftliche Traktoren & Stromaggregate',
      'Präzisions-CNC- & manuelle Instandsetzungsbänke'
    ]
  },
  ar: {
    headerSubtitle: 'إعادة بناء صمامات المحركات وأدوات الهندسة الدقيقة',
    headerContact: 'موقع: www.praztechtools.com  |  هاتف: +91 8744020102  |  طريق آصف علي، دلهي',
    modelPrefix: 'الموديل:',
    genuineBadge: 'أداة برازتيك® أصلية',
    defaultCategory: 'أدوات هندسية دقيقة',
    keyAdvantages: 'أبرز المزايا الهندسية والتصميمية',
    specAndVariant: 'المواصفات والخيارات',
    options: 'خيارات',
    techSpecsMatrix: 'جدول المواصفات الفنية المعتمدة',
    targetApps: 'مجالات الاستخدام وتوافق ورش العمل',
    footerFactory: 'هندسة برازتيك® • دقة تصنيع مباشرة من المصنع',
    footerQuality: 'أدوات معايرة بدقة في المصنع • فحص جودة 100% • صنع في الهند',
    footerExport: 'استفسارات التصدير والورش: xiscoenterprises@gmail.com',
    officialOverview: 'نظرة عامة رسمية للمنتج',
    photoFallback: 'صورة المنتج:',
    defaultFeatures: [
      'أدوات كربيد التنجستن فائقة الدقة لإنهاء مثالي لمقعد الصمام',
      'محاذاة توجيهية صلبة خالية من الاهتزاز لدقة متناهية بالميكرون',
      'هيكل متين من سبائك صناعية معالجة حرارياً ومقساة',
      'متوافق مع مغازل التشغيل القياسية بالورش والمقابض اليدوية',
      'فحص مصنعي شامل بنسبة 100% مع شهادة دقة معتمدة'
    ],
    defaultApps: [
      'الدراجات النارية والسكوتر (عجلتان)',
      'محركات سيارات الركاب والسيارات الرياضية',
      'الشاحنات التجارية ومحركات الديزل الثقيلة',
      'الجرارات الزراعية والمولدات الثابتة',
      'منصات التجديد اليدوية وآلات CNC الدقيقة'
    ]
  },
  ru: {
    headerSubtitle: 'ВОССТАНОВЛЕНИЕ КЛАПАНОВ ДВС И ПРЕЦИЗИОННЫЙ ИНСТРУМЕНТ',
    headerContact: 'Сайт: www.praztechtools.com  |  Тел: +91 8744020102  |  Дели, Индия',
    modelPrefix: 'МОДЕЛЬ:',
    genuineBadge: 'ОРИГИНАЛЬНЫЙ ИНСТРУМЕНТ PRAZTECH®',
    defaultCategory: 'ПРЕЦИЗИОННЫЙ ИНСТРУМЕНТ',
    keyAdvantages: 'КЛЮЧЕВЫЕ ИНЖЕНЕРНЫЕ ПРЕИМУЩЕСТВА',
    specAndVariant: 'Спецификация и варианты',
    options: 'вариантов',
    techSpecsMatrix: 'МАТРИЦА ТЕХНИЧЕСКИХ ХАРАКТЕРИСТИК',
    targetApps: 'СФЕРЫ ПРИМЕНЕНИЯ И СОВМЕСТИМОСТЬ В МАСТЕРСКОЙ',
    footerFactory: 'PRAZTECH® ENGINEERING • ЗАВОДСКАЯ ТОЧНОСТЬ НАПРЯМУЮ',
    footerQuality: 'Заводская прецизионная калибровка • 100% контроль качества • Сделано в Индии',
    footerExport: 'Экспортные запросы и заказы для мастерских: xiscoenterprises@gmail.com',
    officialOverview: 'ОФИЦИАЛЬНЫЙ ОБЗОР ПРОДУКТА',
    photoFallback: 'Фотография продукта:',
    defaultFeatures: [
      'Прецизионный твердосплавный инструмент для зеркальной чистоты седла',
      'Жесткое безвибрационное центрирование для микронной точности',
      'Закаленный корпус из легированной инструментальной стали',
      'Совместимость со стандартными шпинделями и ручными приводами',
      '100% заводской контроль качества с сертификатом точности'
    ],
    defaultApps: [
      'Мотоциклы и скутеры (2-колесный транспорт)',
      'Легковые автомобили и двигатели внедорожников',
      'Коммерческий грузовой и тяжелый дизельный транспорт',
      'Сельскохозяйственные тракторы и генераторные установки',
      'Прецизионные станки с ЧПУ и ручные восстановительные стенды'
    ]
  },
  pt: {
    headerSubtitle: 'RECONSTRUÇÃO DE VÁLVULAS AUTOMOTIVAS E FERRAMENTAS DE PRECISÃO',
    headerContact: 'Web: www.praztechtools.com  |  Tel: +91 8744020102  |  Asaf Ali Rd, Delhi',
    modelPrefix: 'MODELO:',
    genuineBadge: 'FERRAMENTA GENUÍNA PRAZTECH®',
    defaultCategory: 'FERRAMENTAS DE PRECISÃO',
    keyAdvantages: 'PRINCIPAIS VANTAGENS DE ENGENHARIA',
    specAndVariant: 'Especificações e variantes',
    options: 'opções',
    techSpecsMatrix: 'MATRIZ DE ESPECIFICAÇÕES TÉCNICAS',
    targetApps: 'APLICAÇÕES PRINCIPAIS E COMPATIBILIDADE DE OFICINA',
    footerFactory: 'PRAZTECH® ENGINEERING • PRECISÃO DIRETO DA FÁBRICA',
    footerQuality: 'Ferramentas Calibradas com Precisão na Fábrica • 100% Inspecionadas • Fabricado na Índia',
    footerExport: 'Consultas de Exportação e Oficinas: xiscoenterprises@gmail.com',
    officialOverview: 'VISÃO GERAL OFICIAL',
    photoFallback: 'Foto do produto:',
    defaultFeatures: [
      'Ferramental em carboneto de tungstênio para acabamento espelhado',
      'Alinhamento rígido sem vibração para repetibilidade micrométrica',
      'Corpo em liga industrial temperada de alta resistência',
      'Compatível com fusos de oficina padrão e cabos manuais',
      'Inspeção de fábrica 100% com certificado de precisão'
    ],
    defaultApps: [
      'Motocicletas e Scooters (2 Rodas)',
      'Motores de Carros de Passeio e SUVs',
      'Caminhões e Motores Diesel Pesados',
      'Tratores Agrícolas e Grupos Geradores',
      'Bancadas de Usinagem CNC e Manuais'
    ]
  },
  it: {
    headerSubtitle: 'RICOSTRUZIONE VALVOLE AUTO E UTENSILI DI PRECISIONE',
    headerContact: 'Web: www.praztechtools.com  |  Tel: +91 8744020102  |  Asaf Ali Rd, Delhi',
    modelPrefix: 'MODELLO:',
    genuineBadge: 'UTENSILE ORIGINALE PRAZTECH®',
    defaultCategory: 'UTENSILI DI PRECISIONE',
    keyAdvantages: 'PRINCIPALI VANTAGGI INGEGNERISTICI',
    specAndVariant: 'Specifiche e varianti',
    options: 'opzioni',
    techSpecsMatrix: 'MATRICE DELLE SPECIFICHE TECNICHE',
    targetApps: 'APPLICAZIONI TARGET E COMPATIBILITÀ DI OFFICINA',
    footerFactory: 'PRAZTECH® ENGINEERING • PRECISIONE DIRETTA DI FABBRICA',
    footerQuality: 'Utensili Calibrati con Precisione in Fabbrica • Controllo Qualità 100% • Made in India',
    footerExport: 'Richieste di Esportazione e Officine: xiscoenterprises@gmail.com',
    officialOverview: 'SCHEDA UFFICIALE PRODOTTO',
    photoFallback: 'Foto del prodotto:',
    defaultFeatures: [
      'Utensili di precisione in carburo di tungsteno per finitura a specchio',
      'Allineamento rigido senza vibrazioni per ripetibilità micrometrica',
      'Corpo in lega industriale temprata e bonificata',
      'Compatibile con mandrini standard da officina e impugnature manuali',
      'Controllo di fabbrica al 100% con certificato di precisione'
    ],
    defaultApps: [
      'Motocicli e scooter (2 ruote)',
      'Motori per autovetture e SUV',
      'Veicoli commerciali pesanti e diesel industriali',
      'Trattori agricoli e gruppi elettrogeni stazionari',
      'Banchi di rettifica di precisione CNC e manuali'
    ]
  },
  tr: {
    headerSubtitle: 'OTOMOTİV SUBAP REVİZYONU VE HASSAS MÜHENDİSLİK TAKIMLARI',
    headerContact: 'Web: www.praztechtools.com  |  Tel: +91 8744020102  |  Asaf Ali Rd, Delhi',
    modelPrefix: 'MODEL:',
    genuineBadge: 'ORİJİNAL PRAZTECH® TAKIMI',
    defaultCategory: 'HASSAS TAKIMLAR',
    keyAdvantages: 'ÖNEMLİ MÜHENDİSLİK AVANTAJLARI',
    specAndVariant: 'Teknik Özellikler ve Varyantlar',
    options: 'seçenek',
    techSpecsMatrix: 'TEKNİK ÖZELLİKLER TABLOSU',
    targetApps: 'HEDEF UYGULAMALAR VE ATÖLYE UYUMLULUĞU',
    footerFactory: 'PRAZTECH® MÜHENDİSLİK • FABRİKADAN DOĞRUDAN HASSASİYET',
    footerQuality: 'Fabrikada Hassas Kalibre Edilmiş Takımlar • %100 Kalite Kontrollü • Hindistan Malı',
    footerExport: 'İhracat ve Atölye Talepleri: xiscoenterprises@gmail.com',
    officialOverview: 'RESMİ ÜRÜN TANITIMI',
    photoFallback: 'Ürün Fotoğrafı:',
    defaultFeatures: [
      'Ayna pürüzsüzlüğünde subap yuvası için tungsten karbür hassas takım',
      'Mikron hassasiyetinde tekrarlanabilirlik için titreşimsiz rijit kılavuz',
      'Sertleştirilmiş ve menevişlenmiş endüstriyel alaşımlı gövde',
      'Standart atölye tahrik milleri ve el kollar ile tam uyumlu',
      'Hassasiyet sertifikalı %100 fabrika kalite kontrolü'
    ],
    defaultApps: [
      'Motosikletler ve Scooterlar (2 Tekerlekli)',
      'Binek Araçlar ve SUV Motorları',
      'Ağır Ticari Dizel ve Kamyon Motorları',
      'Zirai Traktörler ve Sabit Jeneratörler',
      'Hassas CNC ve Manuel Revizyon Tezgahları'
    ]
  },
  hi: {
    headerSubtitle: 'ऑटोमोटिव वाल्व रीबिल्डिंग एवं सटीक इंजीनियरिंग टूल्स',
    headerContact: 'वेब: www.praztechtools.com  |  फ़ोन: +91 8744020102  |  आसफ़ अली रोड, दिल्ली',
    modelPrefix: 'मॉडल:',
    genuineBadge: 'असली प्राज़टेक® इंजीनियरिंग टूल',
    defaultCategory: 'सटीक इंजीनियरिंग टूल्स',
    keyAdvantages: 'प्रमुख इंजीनियरिंग विशेषताएं व लाभ',
    specAndVariant: 'विशिष्टता और संस्करण',
    options: 'विकल्प',
    techSpecsMatrix: 'तकनीकी विशिष्टता विवरण तालिका',
    targetApps: 'लक्षित अनुप्रयोग एवं वर्कशॉप अनुकूलता',
    footerFactory: 'प्राज़टेक® इंजीनियरिंग • फ़ैक्टरी डायरेक्ट प्रिसिजन',
    footerQuality: 'सटीक फ़ैक्टरी कैलिब्रेटेड टूल्स • 100% गुणवत्ता निरीक्षित • भारत में निर्मित',
    footerExport: 'निर्यात एवं कार्यशाला पूछताछ: xiscoenterprises@gmail.com',
    officialOverview: 'आधिकारिक उत्पाद विवरण',
    photoFallback: 'उत्पाद फ़ोटो:',
    defaultFeatures: [
      'मिरर वाल्व सीट फ़िनिश के लिए टंगस्टन कार्बाइड प्रिसिजन टूलिंग',
      'माइक्रोन स्तर की सटीकता के लिए कंपन-मुक्त पायलट अलाइनमेंट',
      'कठोर एवं टेम्पर्ड औद्योगिक अलॉय बॉडी निर्माण',
      'मानक वर्कशॉप ड्राइव स्पिंडल और हैंड हैंडल के साथ संगत',
      'सटीकता प्रमाणपत्र के साथ 100% फ़ैक्टरी गुणवत्ता निरीक्षण'
    ],
    defaultApps: [
      'मोटरसाइकिल एवं स्कूटर (दोपहिया वाहन)',
      'यात्री कारें एवं एसयूवी इंजन',
      'कमर्शियल भारी डीजल एवं ट्रक इंजन',
      'कृषि ट्रैक्टर एवं स्थिर जनरेटर सेट',
      'सटीक सीएनसी एवं मैनुअल रीबिल्डिंग वर्कबेंच'
    ]
  },
  'zh-CN': {
    headerSubtitle: '汽车气门重修与高精密工程工具',
    headerContact: '官方网站: www.praztechtools.com  |  联系电话: +91 8744020102  |  印度德里工厂',
    modelPrefix: '型号：',
    genuineBadge: '原装正品 PRAZTECH® 精工工具',
    defaultCategory: '高精密工程工具',
    keyAdvantages: '核心工程技术优势与加工亮点',
    specAndVariant: '规格与型号选项',
    options: '个规格选项',
    techSpecsMatrix: '官方技术规格参数矩阵',
    targetApps: '目标加工应用与机修车间适配性',
    footerFactory: 'PRAZTECH® 工程装备 • 原厂直供高精度',
    footerQuality: '原厂精密校准工具 • 100% 严苛出厂质检 • 印度制造',
    footerExport: '出口咨询与车间采购咨询：xiscoenterprises@gmail.com',
    officialOverview: '官方正品产品概览',
    photoFallback: '产品实物图：',
    defaultFeatures: [
      '碳化钨超精密刀具，实现镜面级气门座光洁度',
      '高刚性无振动导向对中，确保微米级同轴重复定位精度',
      '经淬火回火热处理的高强度工业合金钢主体',
      '全面兼容机修车间主流驱动主轴及手用旋转手柄',
      '100% 原厂精密检验并附带精度出厂检验合格证书'
    ],
    defaultApps: [
      '摩托车与踏板车动力总成（两轮机车）',
      '家用乘用车及各类 SUV 发动机气门系统',
      '商用重型卡车与工程柴油发动机',
      '农用拖拉机动力系统与工业固定发电机组',
      '高精度数控 CNC 及手动发动机再造维修工位'
    ]
  }
};

export const normalizeShowcaseLang = (lang?: string): string => {
  if (!lang) return 'en';
  const l = lang.toLowerCase().trim();
  if (l === 'zh' || l === 'zh-cn' || l === 'zh_cn' || l === 'chinese') return 'zh-CN';
  if (l.startsWith('es')) return 'es';
  if (l.startsWith('fr')) return 'fr';
  if (l.startsWith('de')) return 'de';
  if (l.startsWith('ar')) return 'ar';
  if (l.startsWith('ru')) return 'ru';
  if (l.startsWith('pt')) return 'pt';
  if (l.startsWith('it')) return 'it';
  if (l.startsWith('tr')) return 'tr';
  if (l.startsWith('hi')) return 'hi';
  return 'en';
};

export const getShowcaseText = (
  key: keyof (typeof SHOWCASE_I18N)['en'],
  lang: string = 'en'
): any => {
  const norm = normalizeShowcaseLang(lang);
  const dict = SHOWCASE_I18N[norm] || SHOWCASE_I18N.en;
  return dict[key] ?? SHOWCASE_I18N.en[key];
};

export const CATEGORY_I18N: Record<string, Record<string, string>> = {
  'valve seat grinding kit sets': {
    en: 'Valve Seat Grinding Kit Sets',
    es: 'Kits de Rectificado de Asientos de Válvula',
    fr: 'Kits de Rectification de Sièges de Soupape',
    de: 'Ventilsitz-Schleifsets',
    ar: 'أطقم تجليخ مقاعد الصمامات',
    ru: 'Наборы для шлифования седел клапанов',
    pt: 'Kits de Retífica de Sede de Válvula',
    it: 'Kit di Rettifica Sedi Valvole',
    tr: 'Subap Yuvası Taşlama Kitleri',
    hi: 'वाल्व सीट ग्राइंडिंग किट सेट्स',
    'zh-CN': '气门座研磨成套工具组'
  },
  'valve grinding stones': {
    en: 'Valve Grinding Stones',
    es: 'Piedras de Rectificado de Válvulas',
    fr: 'Meules de Rectification de Soupapes',
    de: 'Ventilsitz-Schleifsteine',
    ar: 'أحجار تجليخ الصمامات',
    ru: 'Шлифовальные камни для клапанов',
    pt: 'Pedras de Retífica de Válvulas',
    it: 'Mole per Rettifica Valvole',
    tr: 'Subap Taşlama Taşları',
    hi: 'वाल्व ग्राइंडिंग स्टोन्स',
    'zh-CN': '气门座精密研磨砂轮'
  },
  'valve seat cutters': {
    en: 'Valve Seat Cutters',
    es: 'Cortadores de Asientos de Válvula',
    fr: 'Fraises pour Sièges de Soupape',
    de: 'Ventilsitzfräser',
    ar: 'قواطع مقاعد الصمامات',
    ru: 'Фрезы для седел клапанов',
    pt: 'Fresas para Sedes de Válvulas',
    it: 'Frese per Sedi Valvole',
    tr: 'Subap Yuvası Raybaları / Bıçakları',
    hi: 'वाल्व सीट कटर',
    'zh-CN': '硬质合金气门座铣刀'
  },
  'honing stones & tools': {
    en: 'Honing Stones & Tools',
    es: 'Piedras y Herramientas de Bruñido',
    fr: 'Pierres et Outils de Rodage',
    de: 'Hohnsteine & Hohnwerkzeuge',
    ar: 'أحجار وأدوات صقل الأسطوانات',
    ru: 'Хонинговальные бруски и инструмент',
    pt: 'Pedras e Ferramentas de Brunimento',
    it: 'Pietre e Utensili per Levigatura',
    tr: 'Honlama Taşları ve Takımları',
    hi: 'होनिंग स्टोन्स एवं टूल्स',
    'zh-CN': '精密珩磨油石与珩磨工具'
  },
  'valve guide reamers': {
    en: 'Valve Guide Reamers',
    es: 'Escariadores de Guías de Válvula',
    fr: 'Alésoirs de Guides de Soupape',
    de: 'Ventilführungs-Reibahlen',
    ar: 'بريمات موجهات الصمامات',
    ru: 'Развертки направляющих клапанов',
    pt: 'Alargadores de Guias de Válvulas',
    it: 'Alesatori per Guide Valvole',
    tr: 'Subap Kılavuz Raybaları',
    hi: 'वाल्व गाइड रीमर्स',
    'zh-CN': '气门导管高精度铰刀'
  },
  'carbide boring bits': {
    en: 'Carbide Boring Bits',
    es: 'Cuchillas de Mandrinado de Carburo',
    fr: "Outils d'Alésage en Carbure",
    de: 'Hartmetall-Bohrwerkzeuge',
    ar: 'لقم خراطة وتوسيع كربيدية',
    ru: 'Твердосплавные расточные резцы',
    pt: 'Pastilhas de Mandrilamento de Metal Duro',
    it: 'Inserti di Alesatura in Metallo Duro',
    tr: 'Karbür Delik İşleme Bıçakları',
    hi: 'कार्बाइड बोरिंग बिट्स',
    'zh-CN': '硬质合金精密镗孔刀头'
  },
  'accessories & stands': {
    en: 'Accessories & Stands',
    es: 'Accesorios y Soportes',
    fr: 'Accessoires et Supports',
    de: 'Zubehör & Halterungen',
    ar: 'الملحقات وحوامل العمل',
    ru: 'Аксессуары и стенды',
    pt: 'Acessórios e Suportes',
    it: 'Accessori e Supporti',
    tr: 'Aksesuarlar ve Standlar',
    hi: 'सहायक उपकरण एवं स्टैंड',
    'zh-CN': '修整工作台与车间辅具'
  },
  'precision tooling': {
    en: 'Precision Tooling',
    es: 'Herramientas de Precisión',
    fr: 'Outillage de Précision',
    de: 'Präzisionswerkzeuge',
    ar: 'أدوات هندسية دقيقة',
    ru: 'Прецизионный инструмент',
    pt: 'Ferramental de Precisão',
    it: 'Utensili di Precisione',
    tr: 'Hassas Takımlar',
    hi: 'सटीक इंजीनियरिंग टूल्स',
    'zh-CN': '高精密工程工具'
  }
};

export const getTranslatedCategory = (category?: string, lang: string = 'en'): string => {
  if (!category) return getShowcaseText('defaultCategory', lang);
  const normLang = normalizeShowcaseLang(lang);
  if (normLang === 'en') return category;

  const key = category.trim().toLowerCase();
  for (const [catKey, map] of Object.entries(CATEGORY_I18N)) {
    if (key.includes(catKey) || catKey.includes(key)) {
      return map[normLang] || map.en || category;
    }
  }
  return category;
};

export const SPEC_LABELS_I18N: Record<string, Record<string, string>> = {
  'model / series': {
    es: 'Modelo / Serie',
    fr: 'Modèle / Série',
    de: 'Modell / Serie',
    ar: 'الموديل / السلسلة',
    ru: 'Модель / Серия',
    pt: 'Modelo / Série',
    it: 'Modello / Serie',
    tr: 'Model / Seri',
    hi: 'मॉडल / श्रृंखला',
    'zh-CN': '产品型号 / 系列'
  },
  'tool category': {
    es: 'Categoría de Herramienta',
    fr: "Catégorie d'Outil",
    de: 'Werkzeugkategorie',
    ar: 'فئة الأداة',
    ru: 'Категория инструмента',
    pt: 'Categoria de Ferramenta',
    it: 'Categoria Utensile',
    tr: 'Takım Kategorisi',
    hi: 'टूल श्रेणी',
    'zh-CN': '工具类别分类'
  },
  'variant coverage': {
    es: 'Cobertura de Variantes',
    fr: 'Couverture des Variantes',
    de: 'Variantenumfang',
    ar: 'نطاق الخيارات والمقاسات',
    ru: 'Охват вариантов',
    pt: 'Cobertura de Variantes',
    it: 'Copertura Varianti',
    tr: 'Varyant Kapsamı',
    hi: 'संस्करण कवरेज',
    'zh-CN': '覆盖规格范围'
  },
  'sizes covered': {
    es: 'Tamaños Cubiertos',
    fr: 'Tailles Couvertes',
    de: 'Abgedeckte Größen',
    ar: 'المقاسات المشمولة',
    ru: 'Рабочие размеры',
    pt: 'Tamanhos Cobertos',
    it: 'Misure Coperte',
    tr: 'Kapsanan Boyutlar',
    hi: 'शामिल आकार',
    'zh-CN': '支持尺寸范围'
  },
  'spindle & drive': {
    es: 'Husillo y Accionamiento',
    fr: 'Broche et Entraînement',
    de: 'Spindel & Antrieb',
    ar: 'المغزل وآلية التشغيل',
    ru: 'Шпиндель и привод',
    pt: 'Fuso e Acionamento',
    it: 'Mandrino e Azionamento',
    tr: 'Mil ve Tahrik Bağlantısı',
    hi: 'स्पिंडल और ड्राइव',
    'zh-CN': '主轴接口与驱动方式'
  },
  'tool material': {
    es: 'Material de Herramienta',
    fr: "Matériau de l'Outil",
    de: 'Werkzeugmaterial',
    ar: 'مادة صنع الأداة',
    ru: 'Материал инструмента',
    pt: 'Material da Ferramenta',
    it: 'Materiale Utensile',
    tr: 'Takım Malzemesi',
    hi: 'टूल सामग्री',
    'zh-CN': '工具主体材质'
  },
  'surface finish': {
    es: 'Acabado Superficial',
    fr: 'Finition de Surface',
    de: 'Oberflächengüte',
    ar: 'صقل وتشطيب السطح',
    ru: 'Чистота поверхности',
    pt: 'Acabamento de Superfície',
    it: 'Finitura Superficiale',
    tr: 'Yüzey Pürüzlülüğü',
    hi: 'सतह फ़िनिश',
    'zh-CN': '加工表面光洁度'
  },
  'concentricity': {
    es: 'Concentricidad y Tolerancia',
    fr: 'Concentricité & Tolérance',
    de: 'Rundlaufgenauigkeit',
    ar: 'التركيز ودقة التمركز',
    ru: 'Концентричность и биение',
    pt: 'Concentricidade e Tolerância',
    it: 'Concentricità e Tolleranza',
    tr: 'Eşmerkezlilik ve Salgı',
    hi: 'संकेंद्रिकता (Concentricity)',
    'zh-CN': '同轴度与跳动公差'
  },
  'calibration & origin': {
    es: 'Calibración y Origen',
    fr: 'Calibrage & Origine',
    de: 'Kalibrierung & Herkunft',
    ar: 'المعايرة وبلد المنشأ',
    ru: 'Калибровка и происхождение',
    pt: 'Calibração e Origem',
    it: 'Calibrazione e Origine',
    tr: 'Kalibrasyon ve Menşei',
    hi: 'कैलिब्रेशन एवं मूल देश',
    'zh-CN': '出厂校准与产地'
  },
  'application': {
    es: 'Aplicación Principal',
    fr: 'Application Principale',
    de: 'Haupteinsatzbereich',
    ar: 'الاستخدام الأساسي',
    ru: 'Основное назначение',
    pt: 'Aplicação Principal',
    it: 'Applicazione Principale',
    tr: 'Uygulama Alanı',
    hi: 'मुख्य अनुप्रयोग',
    'zh-CN': '适用加工场景'
  },
  'material': {
    es: 'Material',
    fr: 'Matériau',
    de: 'Material',
    ar: 'المادة',
    ru: 'Материал',
    pt: 'Material',
    it: 'Materiale',
    tr: 'Malzeme',
    hi: 'सामग्री',
    'zh-CN': '材质'
  },
  'bore range': {
    es: 'Rango de Diámetro / Bore',
    fr: "Plage d'Alésage",
    de: 'Bohrungsbereich',
    ar: 'نطاق قطر التجويف',
    ru: 'Диапазон диаметров',
    pt: 'Faixa de Diâmetro',
    it: 'Gamma di Alesaggio',
    tr: 'Delik Çapı Aralığı',
    hi: 'बोर रेंज (व्यास)',
    'zh-CN': '珩磨孔径范围'
  },
  'grit grade': {
    es: 'Grano Abrasivo',
    fr: 'Grain Abrasif',
    de: 'Körnung',
    ar: 'حبيبات الكشط (Grit)',
    ru: 'Зернистость абразива',
    pt: 'Granulometria',
    it: 'Grana Abrasiva',
    tr: 'Kum Tane Boyutu',
    hi: 'ग्रिट ग्रेड',
    'zh-CN': '磨料粒度'
  },
  'stone color': {
    es: 'Color de Piedra',
    fr: 'Couleur de Meule',
    de: 'Steinfarbe',
    ar: 'لون الحجر الكاشط',
    ru: 'Цвет абразива',
    pt: 'Cor da Pedra',
    it: 'Colore Mola',
    tr: 'Taş Rengi',
    hi: 'स्टोन का रंग',
    'zh-CN': '砂轮颜色材质'
  },
  'dimensions': {
    es: 'Dimensiones',
    fr: 'Dimensions',
    de: 'Abmessungen',
    ar: 'الأبعاد القياسية',
    ru: 'Габаритные размеры',
    pt: 'Dimensões',
    it: 'Dimensioni',
    tr: 'Ölçüler',
    hi: 'आयाम (Dimensions)',
    'zh-CN': '外形几何尺寸'
  }
};

export const getTranslatedSpecLabel = (label: string, lang: string = 'en'): string => {
  const normLang = normalizeShowcaseLang(lang);
  if (normLang === 'en') return label;

  const key = label.trim().toLowerCase();
  for (const [specKey, map] of Object.entries(SPEC_LABELS_I18N)) {
    if (key === specKey || key.includes(specKey) || specKey.includes(key)) {
      return map[normLang] || map.en || label;
    }
  }
  return label;
};

export const getTranslatedSpecValue = (value: string, lang: string = 'en'): string => {
  const normLang = normalizeShowcaseLang(lang);
  if (normLang === 'en' || !value) return value;

  const valLower = value.toLowerCase();

  if (valLower.includes('tungsten carbide') && valLower.includes('hardened')) {
    const map: Record<string, string> = {
      es: 'Carburo de Tungsteno Micrograno y Acero Templado de Herramientas',
      fr: 'Carbure de Tungstène Micro-grain et Acier à Outils Trempé',
      de: 'Mikrokorn-Wolframkarbid & gehärteter Werkzeugstahl',
      ar: 'كربيد التنجستن عالي النقاوة وفولاذ أدوات مقسى صناعي',
      ru: 'Микрозернистый карбид вольфрама и закаленная инструментальная сталь',
      pt: 'Carboneto de Tungstênio Microgrão e Aço Ferramenta Temperado',
      it: 'Carburo di Tungsteno a Grana Fine e Acciaio per Utensili Temprato',
      tr: 'Mikro Tane Tungsten Karbür ve Sertleştirilmiş Takım Çeliği',
      hi: 'माइक्रो-ग्रेन टंगस्टन कार्बाइड और कठोर टूल स्टील',
      'zh-CN': '微晶碳化钨合金与特种淬火回火工具钢'
    };
    return map[normLang] || value;
  }

  if (valLower.includes('precision ground') || valLower.includes('< 0.2 ra')) {
    const map: Record<string, string> = {
      es: 'Superficies Cilíndricas Rectificadas de Precisión (< 0.2 Ra)',
      fr: 'Surfaces Cylindriques Rectifiées de Précision (< 0,2 Ra)',
      de: 'Präzisionsgeschliffene Zylinderflächen (< 0,2 Ra)',
      ar: 'أسطح أسطوانية مجلخة بدقة متناهية (< 0.2 Ra)',
      ru: 'Прецизионно шлифованные цилиндрические поверхности (< 0.2 Ra)',
      pt: 'Superfícies Cilíndricas Retificadas com Precisão (< 0.2 Ra)',
      it: 'Superfici Cilindriche Rettificate di Precisione (< 0.2 Ra)',
      tr: 'Hassas Taşlanmış Silindirik Yüzeyler (< 0.2 Ra)',
      hi: 'सटीक ग्राउंड बेलनाकार सतह (< 0.2 Ra)',
      'zh-CN': '超精精密研磨外圆柱面（粗糙度 < 0.2 Ra）'
    };
    return map[normLang] || value;
  }

  if (valLower.includes('runout') || valLower.includes('0.005mm')) {
    const map: Record<string, string> = {
      es: 'Dentro de ±0.005 mm de tolerancia de excentricidad industrial',
      fr: 'Dans la tolérance de faux-rond industriel de ±0,005 mm',
      de: 'Innerhalb von ±0,005 mm Rundlauftoleranz',
      ar: 'ضمن تفاوت تشغيل صناعي متقدم ±0.005 مم',
      ru: 'В пределах допуска радиального биения ±0,005 мм',
      pt: 'Dentro da tolerância industrial de batimento de ±0,005 mm',
      it: 'Entro la tolleranza di concentricità industriale di ±0,005 mm',
      tr: '±0.005 mm endüstriyel salgı toleransı dahilinde',
      hi: '±0.005 मिमी औद्योगिक रनआउट सहिष्णुता के भीतर',
      'zh-CN': '严格控制在 ±0.005mm 工业级超精径向跳动公差内'
    };
    return map[normLang] || value;
  }

  if (valLower.includes('calibrated') && valLower.includes('india')) {
    const map: Record<string, string> = {
      es: '100% Calibrado e Inspeccionado en Fábrica en India',
      fr: '100% Calibré et Contrôlé en Qualité en Inde',
      de: '100% werkskalibriert & qualitätsgeprüft in Indien',
      ar: 'معاير بنسبة 100% ومفحوص الجودة بالمصنع في الهند',
      ru: '100% заводская калибровка и контроль качества в Индии',
      pt: '100% Calibrado e com Qualidade Inspecionada na Índia',
      it: 'Calibrato al 100% e con Controllo Qualità Eseguito in India',
      tr: "Hindistan'da %100 Kalibre Edilmiş ve Kalite Kontrolü Yapılmıştır",
      hi: 'भारत में 100% कैलिब्रेटेड और गुणवत्ता निरीक्षित',
      'zh-CN': '在印度工厂通过 100% 严苛出厂仪器校准与质量检测'
    };
    return map[normLang] || value;
  }

  if (valLower.includes('configurations')) {
    const confWordMap: Record<string, string> = {
      es: 'configuraciones',
      fr: 'configurations',
      de: 'Konfigurationen',
      ar: 'خيارات تشغيل',
      ru: 'конфигураций',
      pt: 'configurações',
      it: 'configurazioni',
      tr: 'konfigürasyon',
      hi: 'विन्यास / विकल्प',
      'zh-CN': '种可选配置规格'
    };
    const toWordMap: Record<string, string> = {
      es: 'hasta',
      fr: 'à',
      de: 'bis',
      ar: 'إلى',
      ru: 'до',
      pt: 'até',
      it: 'a',
      tr: 'ila',
      hi: 'से',
      'zh-CN': '至'
    };
    const confWord = confWordMap[normLang] || 'configurations';
    const toWord = toWordMap[normLang] || 'to';
    return value.replace(/Configurations/i, confWord).replace(/\bto\b/i, toWord);
  }

  return value;
};

export const getProductTranslatedCopy = (
  product: Product | any,
  lang: string = 'en'
): {
  title: string;
  tagline: string;
  category: string;
} => {
  const normLang = normalizeShowcaseLang(lang);
  if (normLang === 'en') {
    return {
      title: product.name,
      tagline: product.description || 'Industrial grade valve reconditioning and precision seat cutting system.',
      category: product.category || 'PRECISION TOOLING'
    };
  }

  const slug = (product.slug || '').toLowerCase();
  const cat = getTranslatedCategory(product.category, normLang);

  const productDb: Record<string, Record<string, { title: string; tagline: string }>> = {
    vgs1116: {
      es: {
        title: 'Piedra de Rectificado de Asiento de Válvula 11/16" (Tipo Sioux)',
        tagline: 'Piedra abrasiva para rectificado de alta velocidad en asientos de válvula de culatas.'
      },
      fr: {
        title: 'Meule de Rectification de Sièges de Soupape 11/16" (Type Sioux)',
        tagline: 'Meule de rodage de précision pour sièges de soupapes de culasses sur machines Sioux.'
      },
      de: {
        title: 'Ventilsitz-Schleifstein 11/16" (Sioux-Standard)',
        tagline: 'Hochgeschwindigkeits-Präzisionsschleifstein für Ventilsitz-Instandsetzung von Zylinderköpfen.'
      },
      ar: {
        title: 'حجر تجليخ مقعد الصمام 11/16 بوصة (معيار سيوكس)',
        tagline: 'حجر كشط عالي السرعة لإعادة تشغيل وتجليخ مقاعد صمامات المحركات بدقة تامة.'
      },
      ru: {
        title: 'Шлифовальный камень седел клапанов 11/16" (Sioux)',
        tagline: 'Высокоскоростной прецизионный камень для восстановления и шлифования седел клапанов.'
      },
      pt: {
        title: 'Pedra de Retífica de Sede de Válvula 11/16" (Tipo Sioux)',
        tagline: 'Pedra abrasiva de alta velocidade para retífica e assentamento de válvulas de cabeçotes.'
      },
      it: {
        title: 'Mola per Rettifica Sedi Valvole 11/16" (Standard Sioux)',
        tagline: 'Mola abrasiva ad alta velocità per la rettifica e ripristino delle sedi valvole di testate.'
      },
      tr: {
        title: 'Subap Yuvası Taşlama Taşı 11/16" (Sioux Tipi)',
        tagline: 'Silindir kapaklarındaki subap yuvalarının yüksek devirli hassas taşlanması için abrasif taş.'
      },
      hi: {
        title: 'वाल्व सीट ग्राइंडिंग स्टोन 11/16" (सियॉक्स मानक)',
        tagline: 'सिलेंडर हेड में वाल्व सीटों के सटीक हाई-स्पीड ग्राइंडिंग और पुनर्निर्माण हेतु औद्योगिक स्टोन।'
      },
      'zh-CN': {
        title: '11/16" 气门座高精密研磨砂轮（Sioux 标准螺纹）',
        tagline: '用于发动机汽缸盖进排气门座圈高速超精精密研磨成型的原厂研磨砂轮。'
      }
    },
    vgs916: {
      es: {
        title: 'Piedra de Rectificado de Asiento de Válvula 9/16" (Black & Decker)',
        tagline: 'Piedra abrasiva para rectificado de asientos de válvula con rosca estándar 9/16".'
      },
      fr: {
        title: 'Meule de Rectification de Sièges de Soupape 9/16" (Black & Decker)',
        tagline: 'Meule de rectification de haute précision avec filetage 9/16" Black & Decker.'
      },
      de: {
        title: 'Ventilsitz-Schleifstein 9/16" (Black & Decker)',
        tagline: 'Präzisionsschleifstein mit 9/16"-Gewinde für Black & Decker Ventilsitz-Schleifmaschinen.'
      },
      ar: {
        title: 'حجر تجليخ مقعد الصمام 9/16 بوصة (بلاك آند ديكر)',
        tagline: 'حجر كشط دقيق بسن 9/16 بوصة مخصص لآلات بلاك آند ديكر لتجليخ مقاعد الصمامات.'
      },
      ru: {
        title: 'Шлифовальный камень седел клапанов 9/16" (Black & Decker)',
        tagline: 'Прецизионный камень с резьбой 9/16" для станков Black & Decker.'
      },
      pt: {
        title: 'Pedra de Retífica de Sede de Válvula 9/16" (Black & Decker)',
        tagline: 'Pedra abrasiva de precisão com rosca 9/16" padrão Black & Decker para cabeçotes.'
      },
      it: {
        title: 'Mola per Rettifica Sedi Valvole 9/16" (Black & Decker)',
        tagline: 'Mola di precisione con attacco filettato 9/16" standard Black & Decker.'
      },
      tr: {
        title: 'Subap Yuvası Taşlama Taşı 9/16" (Black & Decker)',
        tagline: 'Black & Decker standardı 9/16" dişli hassas subap yuvası taşlama taşı.'
      },
      hi: {
        title: 'वाल्व सीट ग्राइंडिंग स्टोन 9/16" (ब्लैक एंड डेकर)',
        tagline: 'ब्लैक एंड डेकर मानक 9/16" थ्रेड के साथ वाल्व सीट प्रिसिजन ग्राइंडिंग स्टोन।'
      },
      'zh-CN': {
        title: '9/16" 气门座精密研磨砂轮（百得 Black & Decker 标准）',
        tagline: '适用于百得规格 9/16" 螺纹主轴的发动机气门座精密研磨成型砂轮。'
      }
    },
    vgs716: {
      es: {
        title: 'Piedra de Rectificado de Asiento de Válvula 7/16"',
        tagline: 'Piedra abrasiva para rectificadoras compactas de asientos de válvula con rosca 7/16".'
      },
      fr: {
        title: 'Meule de Rectification de Sièges de Soupape 7/16"',
        tagline: 'Meule de précision compacte avec filetage 7/16" pour soupapes de petits moteurs.'
      },
      de: {
        title: 'Ventilsitz-Schleifstein 7/16"',
        tagline: 'Kompakter Schleifstein mit 7/16"-Gewinde für Kleinmotoren und Motorrad-Zylinderköpfe.'
      },
      ar: {
        title: 'حجر تجليخ مقعد الصمام 7/16 بوصة',
        tagline: 'حجر كشط مدمج بسن 7/16 بوصة مخصص للمحركات الصغيرة ومحركات الدراجات.'
      },
      ru: {
        title: 'Шлифовальный камень седел клапанов 7/16"',
        tagline: 'Компактный шлифовальный камень с резьбой 7/16" для головок малых двигателей.'
      },
      pt: {
        title: 'Pedra de Retífica de Sede de Válvula 7/16"',
        tagline: 'Pedra abrasiva compacta com rosca 7/16" para cabeçotes de motores médios e leves.'
      },
      it: {
        title: 'Mola per Rettifica Sedi Valvole 7/16"',
        tagline: 'Mola compatta con filettatura 7/16" per motori leggeri e motocicli.'
      },
      tr: {
        title: 'Subap Yuvası Taşlama Taşı 7/16"',
        tagline: 'Küçük motorlar ve motosiklet silindir kapakları için 7/16" dişli taşlama taşı.'
      },
      hi: {
        title: 'वाल्व सीट ग्राइंडिंग स्टोन 7/16"',
        tagline: 'छोटे इंजनों और मोटरसाइकिल सिलेंडर हेड्स के लिए 7/16" थ्रेड ग्राइंडिंग स्टोन।'
      },
      'zh-CN': {
        title: '7/16" 气门座精密研磨砂轮（小机型与两轮车发动机）',
        tagline: '配备标准 7/16" 螺纹的高精砂轮，专为小型机及摩托车汽缸盖阀门翻新设计。'
      }
    },
    host: {
      es: {
        title: 'Piedra de Bruñido de Carburo de Silicio',
        tagline: 'Piedras de bruñido de carburo de silicio para acabado cilíndrico de alta precisión.'
      },
      fr: {
        title: 'Pierre de Rodage en Carbure de Silicium',
        tagline: 'Pierres abrasives en carbure de silicium pour alésage et rodage de cylindres.'
      },
      de: {
        title: 'Siliziumkarbid-Hohnstein',
        tagline: 'Industrielle Siliziumkarbid-Hohnsteine für präzises Zylinderhonen und Kreuzschliff.'
      },
      ar: {
        title: 'حجر هونينغ من كربيد السيليكون',
        tagline: 'أحجار صقل كربيد السيليكون لتشطيب أسطوانات المحركات بدقة وإتقان فائق.'
      },
      ru: {
        title: 'Хонинговальный брусок из карбида кремния',
        tagline: 'Бруски из карбида кремния для прецизионного хонингования и сетки цилиндров.'
      },
      pt: {
        title: 'Pedra de Brunimento em Carbeto de Silício',
        tagline: 'Pedras abrasivas de carbeto de silício para brunimento de cilindros com acabamento ideal.'
      },
      it: {
        title: 'Pietra di Levigatura in Carburo di Silicio',
        tagline: 'Pietre per levigatura cilindri in carburo di silicio per finitura a tratteggio incrociato.'
      },
      tr: {
        title: 'Silisyum Karbür Honlama Taşı',
        tagline: 'Silindir çapı işleme ve hassas çapraz desen için silisyum karbür honlama taşları.'
      },
      hi: {
        title: 'सिलिकॉन कार्बाइड होनिंग स्टोन',
        tagline: 'सिलेंडर बोरिंग और सटीक क्रॉसहैच फ़िनिश के लिए सिलिकॉन कार्बाइड होनिंग स्टोन।'
      },
      'zh-CN': {
        title: '碳化硅超精密气缸珩磨油石',
        tagline: '用于发动机气缸孔高精度珩磨切削与平台网纹研磨的特种碳化硅油石。'
      }
    },
    vscct: {
      es: {
        title: 'Juego de Cortadores de Asiento de Válvula con Punta de Carburo',
        tagline: 'Cuchillas de corte con insertos de carburo de tungsteno para rectificado rápido de asientos.'
      },
      fr: {
        title: 'Jeu de Fraises pour Sièges de Soupape à Plaquettes Carbure',
        tagline: 'Fraises haute précision avec plaquettes carbure pour usinage des angles de sièges.'
      },
      de: {
        title: 'Hartmetallbestückter Ventilsitzfräser-Satz',
        tagline: 'Präzisions-Ventilsitzfräser mit Hartmetallschneiden für exakte 3-Winkel-Geometrien.'
      },
      ar: {
        title: 'طقم قواطع مقاعد الصمامات برؤوس كربيدية صلبة',
        tagline: 'قواطع بزوايا متعددة مدعمة برؤوس كربيد التنجستن لقطع مقاعد الصمامات بدقة ميكرونية.'
      },
      ru: {
        title: 'Комплект фрез седел клапанов с твердосплавными пластинами',
        tagline: 'Фрезы с твердосплавными напайками для точного восстановления углов фасок седел.'
      },
      pt: {
        title: 'Jogo de Fresas de Sede de Válvula com Ponta de Metal Duro',
        tagline: 'Fresas angulares com insertos de metal duro para usinagem rápida e precisa de sedes.'
      },
      it: {
        title: 'Set Frese per Sedi Valvole con Inserti in Metallo Duro',
        tagline: 'Frese ad alta precisione con taglienti in metallo duro per il taglio angolare delle sedi.'
      },
      tr: {
        title: 'Karbür Uçlu Subap Yuvası Freze Seti',
        tagline: 'Hassas açı geometrisi ve ayna finişi için tungsten karbür uçlu subap yuvası frezeleri.'
      },
      hi: {
        title: 'कार्बाइड टिप वाल्व सीट कटर सेट',
        tagline: 'सटीक 3-कोण वाल्व सीट कटिंग और मिरर फिनिश के लिए टंगस्टन कार्बाइड टिप कटर।'
      },
      'zh-CN': {
        title: '硬质合金镶齿气门座精密成套铣刀组',
        tagline: '配备优质微晶碳化钨合金刀片，高效率精密成形进排气门座圈三角度密封带。'
      }
    },
    vscs: {
      es: {
        title: 'Juego de Cortadores de Asiento de Válvula para Autos y Motos',
        tagline: 'Kit completo de corte de asientos en acero rápido HSS y acero HCS para talleres mecánicos.'
      },
      fr: {
        title: 'Jeu de Fraises pour Sièges de Soupape Autos & Motos',
        tagline: "Kit complet d'usinage de sièges en HSS et acier haute teneur en carbone pour ateliers."
      },
      de: {
        title: 'Ventilsitzfräser-Satz für Pkw- und Motorradmotoren',
        tagline: 'Kompletter HSS/HCS-Satz zur Ventilsitzüberholung in Motoreninstandsetzungsbetrieben.'
      },
      ar: {
        title: 'طقم قواطع مقاعد الصمامات لمحركات السيارات والدراجات',
        tagline: 'مجموعة شاملة من فولاذ السرعات العالية HSS والفولاذ الكربوني لورش صيانة المحركات.'
      },
      ru: {
        title: 'Комплект фрез седел клапанов для авто- и мотодвигателей',
        tagline: 'Универсальный комплект из быстрорежущей стали HSS и HCS для ремонта клапанного механизма.'
      },
      pt: {
        title: 'Jogo de Fresas de Sede de Válvula para Carros e Motos',
        tagline: 'Kit completo em aço rápido HSS e HCS para retífica de sedes em oficinas automotivas.'
      },
      it: {
        title: 'Set Frese per Sedi Valvole per Motori Auto e Moto',
        tagline: 'Kit completo in acciaio super rapido HSS e HCS per la manutenzione delle sedi valvole.'
      },
      tr: {
        title: 'Otomobil ve Motosiklet Subap Yuvası Rayba Seti',
        tagline: 'Oto ve motosiklet tamir atölyeleri için HSS ve HCS yüksek kaliteli subap yuvası bıçak seti.'
      },
      hi: {
        title: 'कार और बाइक इंजन वाल्व सीट कटर सेट',
        tagline: 'कार और मोटरसाइकिल इंजनों की वाल्व सीट मरम्मत के लिए सम्पूर्ण HSS / HCS टूल किट।'
      },
      'zh-CN': {
        title: '汽车与摩托车发动机气门座全套精修铣刀组',
        tagline: '提供 HSS 高速钢与高碳钢规格配置，满足乘用车与两轮机车动力总成综合维修。'
      }
    }
  };

  if (productDb[slug]?.[normLang]) {
    return {
      title: productDb[slug][normLang].title,
      tagline: productDb[slug][normLang].tagline,
      category: cat
    };
  }

  const isKit = slug.includes('vgkp') || slug.includes('kit');
  const hasStand = slug.includes('heavy-stand') || slug.includes('stand');
  const isReamer = slug.includes('phr') || slug.includes('reamer') || slug.includes('lphr') || slug.includes('ahrep');
  const isGrinder = slug.includes('phsg') || slug.includes('grinder');
  const isDresser = slug.includes('ptd') || slug.includes('pvds') || slug.includes('dresser');
  const isPilot = slug.includes('vp') || slug.includes('pilot');

  if (isKit) {
    const kitTitles: Record<string, string> = {
      es: `${product.modelNo} - Kit Completo de Rectificado de Asientos de Válvula${hasStand ? ' con Soporte Pesado' : ''}`,
      fr: `${product.modelNo} - Kit Complet de Rectification de Sièges de Soupape${hasStand ? ' avec Support Lourd' : ''}`,
      de: `${product.modelNo} - Komplettes Ventilsitz-Schleifset${hasStand ? ' mit Schwerem Ständer' : ''}`,
      ar: `${product.modelNo} - طقم تجليخ مقاعد الصمامات المتكامل${hasStand ? ' مع حامل عمل متين' : ''}`,
      ru: `${product.modelNo} - Полный набор для шлифования седел клапанов${hasStand ? ' с тяжелой стойкой' : ''}`,
      pt: `${product.modelNo} - Kit Completo de Retífica de Sede de Válvula${hasStand ? ' com Suporte Reforçado' : ''}`,
      it: `${product.modelNo} - Kit Completo di Rettifica Sedi Valvole${hasStand ? ' con Supporto Pesante' : ''}`,
      tr: `${product.modelNo} - Komple Subap Yuvası Taşlama Kiti${hasStand ? ' Ağır Standlı' : ''}`,
      hi: `${product.modelNo} - सम्पूर्ण इंजन वाल्व सीट ग्राइंडिंग किट सेट${hasStand ? ' भारी स्टैंड सहित' : ''}`,
      'zh-CN': `${product.modelNo} - 发动机气门座全套精密研磨成组系统${hasStand ? '（附重型修整台工作站）' : ''}`
    };
    return {
      title: kitTitles[normLang] || product.name,
      tagline: SHOWCASE_I18N[normLang]?.defaultFeatures[0] || product.description || 'Precision engine valve reconditioning system.',
      category: cat
    };
  }

  if (isReamer) {
    const reamerTitles: Record<string, string> = {
      es: `${product.modelNo} - Escariador Manual de Guías de Válvula HSS de Alta Precisión`,
      fr: `${product.modelNo} - Alésoir Manuel pour Guides de Soupape HSS Haute Précision`,
      de: `${product.modelNo} - Hochpräzisions-HSS-Handreibahle für Ventilführungen`,
      ar: `${product.modelNo} - بريمة يدوية عالية الدقة لموجهات الصمامات من فولاذ HSS`,
      ru: `${product.modelNo} - Прецизионная ручная развертка направляющих клапанов HSS`,
      pt: `${product.modelNo} - Alargador Manual HSS de Alta Precisão para Guias de Válvula`,
      it: `${product.modelNo} - Alesatore Manuale di Alta Precisione HSS per Guide Valvole`,
      tr: `${product.modelNo} - Yüksek Hassasiyetli HSS El Subap Kılavuz Raybası`,
      hi: `${product.modelNo} - एचएसएस प्रिसिजन वाल्व गाइड हैंड रीमर`,
      'zh-CN': `${product.modelNo} - HSS 高速钢高同心度气门导管精密手用铰刀`
    };
    return {
      title: reamerTitles[normLang] || product.name,
      tagline: SHOWCASE_I18N[normLang]?.defaultFeatures[1] || product.description || 'Precision reaming system for engine rebuilding.',
      category: cat
    };
  }

  if (isGrinder) {
    const grinderTitles: Record<string, string> = {
      es: `${product.modelNo} - Amoladora de Asientos de Válvula de Alta Velocidad con Adaptador`,
      fr: `${product.modelNo} - Meuleuse Haute Vitesse pour Sièges de Soupape avec Adaptateur`,
      de: `${product.modelNo} - Hochgeschwindigkeits-Schleifer mit Adapter für Ventilsitze`,
      ar: `${product.modelNo} - آلة تجليخ عالية السرعة مع مهايئ لمقاعد الصمامات`,
      ru: `${product.modelNo} - Высокоскоростной шлифовальный станок с адаптером для седел клапанов`,
      pt: `${product.modelNo} - Retificadora de Alta Velocidade com Adaptador para Sedes de Válvula`,
      it: `${product.modelNo} - Smerigliatrice ad Alta Velocità con Adattatore per Sedi Valvole`,
      tr: `${product.modelNo} - Adaptörlü Yüksek Devirli Subap Yuvası Taşlama Makinesi`,
      hi: `${product.modelNo} - हाई स्पीड ग्राइंडर एडेप्टर सहित`,
      'zh-CN': `${product.modelNo} - 高速气门座研磨驱动主机（配备专用万向快换接头）`
    };
    return {
      title: grinderTitles[normLang] || product.name,
      tagline: SHOWCASE_I18N[normLang]?.defaultFeatures[2] || product.description || 'High-speed motor spindle system for valve grinding.',
      category: cat
    };
  }

  if (isDresser) {
    const dresserTitles: Record<string, string> = {
      es: `${product.modelNo} - Soporte Rectificador / Diamante para Piedras de Válvula`,
      fr: `${product.modelNo} - Support de Dressage & Pointe Diamantée pour Meules de Soupape`,
      de: `${product.modelNo} - Abrichtständer & Diamantabrichter für Ventilschleifsteine`,
      ar: `${product.modelNo} - حامل ومعدل ماسي لتسوية وتشكيل أحجار تجليخ الصمامات`,
      ru: `${product.modelNo} - Стенд для правки и алмазный карандаш для шлифовальных камней`,
      pt: `${product.modelNo} - Suporte Dressador com Ponta Diamantada para Pedras de Válvula`,
      it: `${product.modelNo} - Supporto Ravvivatore Diamantato per Mole per Valvole`,
      tr: `${product.modelNo} - Subap Taşlama Taşları İçin Elmas Uçlu Bileme Standı`,
      hi: `${product.modelNo} - वाल्व ग्राइंडिंग स्टोन ड्रेसर स्टैंड एवं डायमंड पॉइंट`,
      'zh-CN': `${product.modelNo} - 气门座砂轮金刚石精密修整工作台与修整金刚笔`
    };
    return {
      title: dresserTitles[normLang] || product.name,
      tagline: SHOWCASE_I18N[normLang]?.defaultFeatures[0] || product.description || 'Precision stone dressing and profile trueing bench.',
      category: cat
    };
  }

  if (isPilot) {
    const pilotTitles: Record<string, string> = {
      es: `${product.modelNo} - Pilotos de Rectificado de Válvulas con Portapiedras`,
      fr: `${product.modelNo} - Pilotes de Rectification de Soupapes avec Porte-Meule`,
      de: `${product.modelNo} - Führungsdorne (Pilots) mit Ventilsitz-Steinhalter`,
      ar: `${product.modelNo} - محاور توجيه (بايلوت) دقيقة مع حامل أحجار التجليخ`,
      ru: `${product.modelNo} - Прецизионные направляющие пилоты с камнедержателем`,
      pt: `${product.modelNo} - Pilotos Guia de Retífica com Porta-Pedra de Alta Precisão`,
      it: `${product.modelNo} - Piloti di Guida per Rettifica con Porta-Mola`,
      tr: `${product.modelNo} - Taş Tutuculu Hassas Subap Taşlama Kılavuz Milleri (Pilotlar)`,
      hi: `${product.modelNo} - प्रिसिजन वाल्व ग्राइंडिंग पायलट्स स्टोन होल्डर सहित`,
      'zh-CN': `${product.modelNo} - 高同轴度气门导管定位导向定心轴（含快装砂轮夹具）`
    };
    return {
      title: pilotTitles[normLang] || product.name,
      tagline: SHOWCASE_I18N[normLang]?.defaultFeatures[1] || product.description || 'Rigid guide pilots for valve seat reconditioning.',
      category: cat
    };
  }

  return {
    title: product.name,
    tagline: SHOWCASE_I18N[normLang]?.defaultFeatures[0] || product.description || 'Industrial grade valve reconditioning and precision seat cutting system.',
    category: cat
  };
};

export interface VariantItem {
  title: string;
  subtitle?: string;
  badge?: string;
}

export interface VariantSectionData {
  hasOptions: boolean;
  title: string;
  badgeCount: number;
  layout: 'vgs-grid' | 'cards-4col' | 'cards-3col' | 'cards-2col' | 'cards-1col' | 'chips';
  extraHeader?: 'vgs-formulations';
  footerNote?: string;
  items: VariantItem[];
}

/**
 * Vector helper: Draws Lucide SlidersHorizontal icon.
 */
export const drawSlidersIcon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string = '#5e3e8b'
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  // Slider 1: Line from x to x+16 at y+2, knob circle at x+5
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x + 16, y + 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 5, y + 2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Slider 2: Line from x to x+16 at y + 8, knob circle at x+11
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  ctx.lineTo(x + 16, y + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 11, y + 8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Slider 3: Line from x to x+16 at y + 14, knob circle at x+4
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x + 16, y + 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 4, y + 14, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

/**
 * Vector helper: Draws Lucide BookOpen icon for selection guide.
 */
export const drawBookOpenIcon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string = '#475569'
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x + 7, y + 12);
  ctx.lineTo(x + 1, y + 10);
  ctx.lineTo(x + 1, y + 2);
  ctx.lineTo(x + 7, y + 4);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 7, y + 12);
  ctx.lineTo(x + 13, y + 10);
  ctx.lineTo(x + 13, y + 2);
  ctx.lineTo(x + 7, y + 4);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
};

/**
 * Checks whether a product has variants on its listing page.
 * Exactly mirrors ProductDetailPage.tsx: product.subModels && product.subModels.length > 0.
 */
export const hasProductVariants = (product: Product | null | undefined): boolean => {
  return Boolean(product && Array.isArray(product.subModels) && product.subModels.length > 0);
};

/**
 * Calculates exact container height for the Specification and Variant card,
 * tailored to that specific tool's listing page layout in SubModelSelector.
 */
export const getSpecificationAndVariantCardHeight = (product: Product | null | undefined): number => {
  if (!hasProductVariants(product)) return 0;
  const slug = (product?.slug || '').toLowerCase();
  const count = product?.subModels?.length || 0;

  if (slug === 'vgs1116' || slug === 'vgs916') return 324;
  if (slug === 'vgs716') return 372;
  if (slug === 'vscct') return 256;
  if (slug === 'vscs') return 272;
  if (slug === 'host' || slug === 'dhost') return 272;
  if (slug === 'phsg') return 168;
  if (slug.startsWith('ptd')) return 150;
  if (slug === 'hone') return 198;
  if (slug === 'vgsh') return 166;
  if (slug === 'lphr') return 410;
  if (slug === 'ahrep') return 218;
  if (slug === 'ctbb') return 202;

  // Generic fallback with submodels
  const numRows = Math.ceil(count / 4);
  return Math.min(380, 58 + 20 + numRows * 42 + 24);
};

/**
 * Backward-compatible helper for UsersPage.
 */
export const getToolVariantSectionData = (product: Product | null | undefined): VariantSectionData => {
  const hasOptions = hasProductVariants(product);
  const badgeCount = product?.subModels?.length || 0;
  return {
    hasOptions,
    title: 'Specification and variant',
    badgeCount,
    layout: 'chips',
    items: []
  };
};

export const calculateVariantBoxHeight = (variantData: VariantSectionData): number => {
  return 0;
};

/**
 * Helper to get the canonical initial SubModel for a product,
 * matching ProductDetailPage.tsx initialization logic.
 */
export const getInitialSubModel = (product: Product | null | undefined): SubModel | null => {
  if (!product?.subModels || product.subModels.length === 0) return null;
  const initialSm: any = { ...product.subModels[0] };
  if (['vgs1116', 'vgs916', 'vgs716'].includes(product.slug)) {
    initialSm.stoneColor = 'Pink';
  }
  if (product.slug === 'host') {
    initialSm.sku = initialSm.grit120 || initialSm.sku;
    initialSm.grit = '120 coarse';
  }
  if (product.slug === 'dhost') {
    initialSm.sku = initialSm.grit180 || initialSm.sku;
    initialSm.grade = 'Medium (180)';
  }
  if (product.slug === 'phsg') {
    initialSm.image = '/images/products/phsg-2.jpg';
  }
  return initialSm;
};

/**
 * Captures the exact rendered HTML output of the product's Specification and variant card
 * using html2canvas directly on the DOM element for 100% pixel-perfect identity with the listing page.
 */
export const captureVariantCardElement = async (
  product: Product,
  selectedSubModel?: any,
  providedElement?: HTMLElement | null,
  language: string = 'en'
): Promise<HTMLCanvasElement | null> => {
  if (typeof document === 'undefined' || !hasProductVariants(product)) {
    return null;
  }

  const effectiveSelectedSubModel = selectedSubModel || getInitialSubModel(product);

  // 1. Check if an element was explicitly provided or already exists in the document
  const target = providedElement || document.getElementById('product-showcase-variant-card-1104');
  if (target) {
    const targetSlug = target.getAttribute('data-product-slug');
    if (!targetSlug || targetSlug === product.slug) {
      try {
        // Small pause to allow React state / DOM layout to settle
        await new Promise(r => setTimeout(r, 60));

        const captured = await html2canvas(target, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          windowWidth: 1280,
          onclone: (clonedDoc) => {
            const wrapper = clonedDoc.getElementById('product-showcase-variant-capture-wrapper');
            if (wrapper) {
              wrapper.style.opacity = '1';
              wrapper.style.zIndex = '99999';
              wrapper.style.visibility = 'visible';
            }
            const el = clonedDoc.getElementById('product-showcase-variant-card-1104');
            if (el) {
              el.style.opacity = '1';
              el.style.visibility = 'visible';
              el.style.transform = 'none';
            }
          }
        });
        if (captured && captured.width > 0 && captured.height > 0) {
          return captured;
        }
      } catch (e) {
        console.warn('html2canvas on existing card failed, trying dynamic mount:', e);
      }
    }
  }

  // 2. Fallback: dynamically mount into a temporary host with createRoot
  const tempHost = document.createElement('div');
  tempHost.id = 'temp-variant-card-host';
  tempHost.style.position = 'fixed';
  tempHost.style.top = '0';
  tempHost.style.left = '0';
  tempHost.style.width = '1104px';
  tempHost.style.zIndex = '-99999';
  tempHost.style.opacity = '0.001';
  tempHost.style.pointerEvents = 'none';
  document.body.appendChild(tempHost);

  try {
    const root = createRoot(tempHost);
    await new Promise<void>(resolve => {
      root.render(
        React.createElement(
          'div',
          {
            id: 'dynamic-variant-card-1104',
            className: 'bg-white rounded-xl border border-[#dfd5e8] p-5 space-y-4 shadow-sm',
            style: { width: '1104px', boxSizing: 'border-box' }
          },
          React.createElement(
            'div',
            { className: 'flex items-center justify-between pb-3 border-b border-[#dfd5e8]' },
            React.createElement(
              'div',
              { className: 'flex items-center gap-2' },
              React.createElement(SlidersHorizontal, { className: 'w-3.5 h-3.5 text-[#5e3e8b]' }),
              React.createElement('span', { className: 'font-medium text-xs text-[#2e075d]' }, getShowcaseText('specAndVariant', language))
            ),
            React.createElement(
              'span',
              { className: 'text-[11px] text-industrial-500 font-mono' },
              `${product.subModels?.length || 0} ${getShowcaseText('options', language)}`
            )
          ),
          React.createElement(SubModelSelector, {
            productSlug: product.slug,
            subModels: product.subModels || [],
            selectedSubModel: null,
            onSelect: () => {},
            variantOptionNames: (product as any).variantOptionNames,
            unselected: true
          })
        )
      );

      requestAnimationFrame(() => {
        setTimeout(resolve, 100);
      });
    });

    const targetEl = tempHost.firstElementChild as HTMLElement;
    if (!targetEl) return null;

    const canvas = await html2canvas(targetEl, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: 1280,
      onclone: (clonedDoc) => {
        const host = clonedDoc.getElementById('temp-variant-card-host');
        if (host) {
          host.style.opacity = '1';
          host.style.zIndex = '99999';
          host.style.visibility = 'visible';
        }
        const el = clonedDoc.getElementById('dynamic-variant-card-1104');
        if (el) {
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          el.style.transform = 'none';
        }
      }
    });

    root.unmount();
    return canvas;
  } catch (err) {
    console.error('Failed to capture dynamic variant card:', err);
    return null;
  } finally {
    if (tempHost.parentNode) {
      tempHost.parentNode.removeChild(tempHost);
    }
  }
};

/**
 * Extracts specifications map for Technical Specifications Matrix.
 */
export const getProductSpecsMap = (product: Product): Array<[string, string]> => {
  const specsMap: Array<[string, string]> = [];
  if (product.modelNo) specsMap.push(['Model / Series', product.modelNo]);
  if (product.category) specsMap.push(['Tool Category', product.category]);

  if (product.itemSpecifics) {
    for (const [k, v] of Object.entries(product.itemSpecifics)) {
      if (v && typeof v === 'string') {
        const formattedKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (!specsMap.some(([existing]) => existing.toLowerCase() === formattedKey.toLowerCase())) {
          specsMap.push([formattedKey, v]);
        }
      }
    }
  }

  if (product.subModels && product.subModels.length > 0 && !specsMap.some(([k]) => k.toLowerCase().includes('size') || k.toLowerCase().includes('variant'))) {
    const sms = product.subModels;
    const first = sms[0]?.sizeInches || sms[0]?.sizeMm || sms[0]?.modelNo || sms[0]?.range || 'Standard';
    const last = sms[sms.length - 1]?.sizeInches || sms[sms.length - 1]?.sizeMm || sms[sms.length - 1]?.modelNo || sms[sms.length - 1]?.range || '';
    specsMap.push(['Variant Coverage', `${sms.length} Configurations (${first}${last ? ' to ' + last : ''})`]);
  }

  if (product.sizesDetail && product.sizesDetail.length > 0 && !specsMap.some(([k]) => k.toLowerCase().includes('size'))) {
    specsMap.push(['Sizes Covered', product.sizesDetail.join(', ')]);
  }
  if (product.compatibility && !specsMap.some(([k]) => k.toLowerCase().includes('drive') || k.toLowerCase().includes('compatibility'))) {
    specsMap.push(['Spindle & Drive', product.compatibility]);
  }

  const defaultStandards: Array<[string, string]> = [
    ['Tool Material', 'Micro-grain Tungsten Carbide & Hardened Tool Steel'],
    ['Surface Finish', 'Precision Ground Cylindrical Surfaces (< 0.2 Ra)'],
    ['Concentricity', 'Within ±0.005mm industrial runout tolerance'],
    ['Calibration & Origin', '100% Calibrated & Quality Inspected in India']
  ];
  for (const [dk, dv] of defaultStandards) {
    if (specsMap.length >= 6) break;
    if (!specsMap.some(([k]) => k.toLowerCase() === dk.toLowerCase())) {
      specsMap.push([dk, dv]);
    }
  }

  return specsMap.slice(0, 6);
};

/**
 * Loads an image with crossOrigin fallback.
 */
export const loadCanvasImage = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise(resolve => {
    if (!src || typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without anonymous in case of same-origin or local path issues
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => resolve(null);
      fallback.src = src;
    };
    img.src = src;
  });
};

/**
 * Utility: Draws a rounded rectangle path.
 */
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill?: string,
  stroke?: string,
  strokeWidth: number = 1
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
};

/**
 * Utility: Wraps text within a maximum width and renders line by line.
 */
const renderWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 4
): number => {
  if (!text) return y;
  const str = String(text);
  const hasSpaces = str.includes(' ');
  const tokens = hasSpaces ? str.split(' ') : Array.from(str);
  const sep = hasSpaces ? ' ' : '';
  let line = '';
  let currentY = y;
  let linesDrawn = 0;

  for (let n = 0; n < tokens.length; n++) {
    const testLine = line + tokens[n] + sep;
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = tokens[n] + sep;
      currentY += lineHeight;
      linesDrawn++;
      if (linesDrawn >= maxLines - 1 && n < tokens.length - 1) {
        // Truncate remaining
        ctx.fillText((line + tokens.slice(n + 1).join(sep)).slice(0, 48) + '...', x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
};

/**
 * Draws a stylish checkmark circle icon on canvas.
 */
const drawCheckIcon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  bgColor: string,
  iconColor: string
) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - radius * 0.45, y);
  ctx.lineTo(x - radius * 0.1, y + radius * 0.35);
  ctx.lineTo(x + radius * 0.5, y - radius * 0.35);
  ctx.strokeStyle = iconColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
};

/**
 * Generates an ultra high-resolution Product Overview / Brochure / Showcase Image
 * automatically populated from the product data onto an HTML5 Canvas.
 */
export const generateProductShowcaseCanvas = async (
  config: ProductShowcaseConfig
): Promise<HTMLCanvasElement> => {
  const lang = config.language || 'en';
  const isPortrait = config.aspectRatio !== 'square';
  const showVariants = Boolean(config.includeVariants !== false && hasProductVariants(config.product));

  const margin = 48;
  const width = 1200;
  const contentWidth = width - margin * 2; // ~1104px
  const headerHeight = 110;
  const heroCardHeight = 380;
  const footerHeight = 110;

  // Pre-capture the exact HTML variant card canvas so its height and layout are 100% identical to the listing page
  let variantCanvas: HTMLCanvasElement | null = null;
  let varBoxHeight = 0;
  if (showVariants) {
    variantCanvas = await captureVariantCardElement(
      config.product,
      null, // flyers always display variants in pure unselected catalog form
      config.variantCardElement,
      lang
    );
    if (variantCanvas && variantCanvas.width > 0) {
      varBoxHeight = Math.round(variantCanvas.height * (contentWidth / variantCanvas.width));
    } else {
      varBoxHeight = getSpecificationAndVariantCardHeight(config.product);
    }
  }

  // Technical Specs Height
  const specCols = 2;
  const displaySpecs = getProductSpecsMap(config.product);
  const numSpecRows = Math.ceil(displaySpecs.length / specCols);
  const specBoxH = 72;
  const specsBoxHeight = config.includeSpecs ? (56 + numSpecRows * (specBoxH + 12)) : 0;
  const appBoxHeight = (config.includeApplications && isPortrait) ? 150 : 0;

  // Accurately estimate total canvas height needed
  let estimatedHeight = 40 + headerHeight + 25 + 175 + 18 + heroCardHeight + 24;
  if (showVariants) {
    estimatedHeight += varBoxHeight + 24;
  }
  if (config.includeSpecs) {
    estimatedHeight += specsBoxHeight + 24;
  }
  if (config.includeApplications && isPortrait) {
    estimatedHeight += appBoxHeight + 24;
  }
  estimatedHeight += footerHeight + margin + 24;

  const height = Math.max(1620, Math.ceil(estimatedHeight));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Royal Purple Brand Palette (Default & Standard)
  const themeBg = '#fbf9fd';
  const themeHeader = '#2e075d';
  const themeCardBg = '#ffffff';
  const themeCardBorder = '#dfd5e8';
  const themeTextPrimary = '#1a102a';
  const themeTextSecondary = '#5d5469';
  const themeBrand = '#5e3e8b';

  // 1. Overall Background
  ctx.fillStyle = themeBg;
  ctx.fillRect(0, 0, width, height);

  // Load white logo and product photo in parallel
  const logoPromise = loadCanvasImage('/images/logo-white.png');
  const prodImgUrl = config.selectedImageUrl || config.product.images?.[0] || '';
  const prodImgPromise = loadCanvasImage(prodImgUrl);

  const [logoWhiteImg, prodImg] = await Promise.all([logoPromise, prodImgPromise]);

  // 2. Header Banner: Royal Purple Background with White Company Logo
  drawRoundedRect(ctx, margin, 40, contentWidth, headerHeight, 16, themeHeader, undefined);

  // Draw white logo directly onto purple background
  if (logoWhiteImg) {
    const logoH = 54;
    const logoW = Math.round(logoH * (logoWhiteImg.width / logoWhiteImg.height || 5.216));
    const logoY = 40 + Math.round((headerHeight - logoH) / 2);
    ctx.drawImage(logoWhiteImg, margin + 28, logoY, logoW, logoH);
  } else {
    // Fallback crisp white text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px ' + SHOWCASE_FONT_FAMILY;
    ctx.fillText('PRAZTECH®', margin + 30, 92);
    ctx.font = '600 13px ' + SHOWCASE_FONT_FAMILY;
    ctx.fillStyle = '#dfd5e8';
    ctx.fillText(getShowcaseText('headerSubtitle', lang), margin + 30, 116);
  }

  // Header Right Side Contact Info
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px ' + SHOWCASE_FONT_FAMILY;
  ctx.fillText(getShowcaseText('headerSubtitle', lang), width - margin - 28, 80);

  ctx.font = '13px ' + SHOWCASE_FONT_FAMILY;
  ctx.fillStyle = '#dfd5e8';
  ctx.fillText(getShowcaseText('headerContact', lang), width - margin - 28, 108);
  ctx.textAlign = 'left';

  // 3. Product Title & Hero Identity Strip
  let curY = 175;
  const catText = (config.categoryBadge || getTranslatedCategory(config.product.category, lang)).toUpperCase();
  ctx.font = 'bold 11px ' + SHOWCASE_FONT_FAMILY;
  const catWidth = ctx.measureText(catText).width + 24;
  drawRoundedRect(ctx, margin, curY, catWidth, 26, 6, themeBrand);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(catText, margin + 12, curY + 17);

  if (config.highlightBadge && config.highlightBadge.trim()) {
    const highlightText = config.highlightBadge.trim().toUpperCase();
    const hlX = margin + catWidth + 12;
    const hlWidth = ctx.measureText(highlightText).width + 24;
    drawRoundedRect(ctx, hlX, curY, hlWidth, 26, 6, '#fef3c7', '#fde68a');
    ctx.fillStyle = '#92400e';
    ctx.fillText(highlightText, hlX + 12, curY + 17);
  }

  // Model Number on its own clear row
  curY = 224;
  ctx.fillStyle = themeBrand;
  ctx.font = 'bold 15px ' + SHOWCASE_FONT_FAMILY;
  const rawModel = config.headline || config.product.modelNo;
  const modelPrefix = getShowcaseText('modelPrefix', lang);
  const modelNoText = rawModel.toUpperCase().startsWith('MODEL') ? rawModel : `${modelPrefix} ${rawModel}`;
  ctx.fillText(modelNoText, margin, curY);

  // Full Product Title on its own prominent row below Model Number
  curY += 6;
  ctx.fillStyle = '#2e075d';
  ctx.font = 'bold 26px ' + SHOWCASE_FONT_FAMILY;
  const translatedCopy = getProductTranslatedCopy(config.product, lang);
  const titleText = config.productTitle || translatedCopy.title;
  curY = renderWrappedText(ctx, titleText, margin, curY + 24, contentWidth, 34, 2);

  // Overview / Tagline Description below Product Title
  const tagline = config.tagline || translatedCopy.tagline;
  ctx.fillStyle = '#4a4058';
  ctx.font = '500 17px ' + SHOWCASE_FONT_FAMILY;
  curY = renderWrappedText(ctx, tagline, margin, curY + 8, contentWidth, 25, 3);

  curY += 18;

  // 4. Hero Section: Product Photo + Optional Key Engineering Advantages
  const showFeatures = config.includeFeatures !== false;

  if (showFeatures) {
    // Two-Column Hero: Product Photo (Left) + Key Advantages (Right)
    const colWidth = (contentWidth - 24) / 2; // ~540px each

    // Left Column: Product Photo Frame
    drawRoundedRect(ctx, margin, curY, colWidth, heroCardHeight, 16, themeCardBg, themeCardBorder, 1.5);

    const imgPad = 20;
    const imgBoxW = colWidth - imgPad * 2;
    const imgBoxH = heroCardHeight - imgPad * 2;

    if (prodImg) {
      const scale = Math.min(imgBoxW / prodImg.width, imgBoxH / prodImg.height);
      const drawW = prodImg.width * scale;
      const drawH = prodImg.height * scale;
      const drawX = margin + imgPad + (imgBoxW - drawW) / 2;
      const drawY = curY + imgPad + (imgBoxH - drawH) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      ctx.drawImage(prodImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = themeTextSecondary;
      ctx.font = 'bold 16px ' + SHOWCASE_FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillText(getShowcaseText('photoFallback', lang) + ' ' + config.product.modelNo, margin + colWidth / 2, curY + heroCardHeight / 2);
      ctx.textAlign = 'left';
    }

    // Corner Authentic Badge on Photo
    const genuineText = getShowcaseText('genuineBadge', lang);
    ctx.font = 'bold 11px ' + SHOWCASE_FONT_FAMILY;
    const genuineBadgeW = ctx.measureText(genuineText).width + 24;
    drawRoundedRect(ctx, margin + 14, curY + 14, genuineBadgeW, 26, 6, 'rgba(46, 7, 93, 0.92)');
    ctx.fillStyle = '#ffffff';
    ctx.fillText(genuineText, margin + 24, curY + 31);

    // Right Column: Key Features & Engineering Advantages Card
    const rightColX = margin + colWidth + 24;
    drawRoundedRect(ctx, rightColX, curY, colWidth, heroCardHeight, 16, themeCardBg, themeCardBorder, 1.5);

    ctx.fillStyle = themeBrand;
    ctx.font = 'bold 15px ' + SHOWCASE_FONT_FAMILY;
    ctx.fillText(getShowcaseText('keyAdvantages', lang), rightColX + 24, curY + 34);

    ctx.strokeStyle = themeCardBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightColX + 24, curY + 46);
    ctx.lineTo(rightColX + colWidth - 24, curY + 46);
    ctx.stroke();

    const rawFeatures = config.product.keyFeatures && config.product.keyFeatures.length > 0 && normalizeShowcaseLang(lang) === 'en'
      ? config.product.keyFeatures
      : (getShowcaseText('defaultFeatures', lang) as string[]);

    const featuresToDisplay: string[] = (rawFeatures as string[]).slice(0, 5);
    let featY = curY + 76;

    for (const feat of featuresToDisplay) {
      drawCheckIcon(ctx, rightColX + 36, featY - 4, 10, themeBrand, '#ffffff');
      ctx.fillStyle = themeTextPrimary;
      ctx.font = '500 13.5px ' + SHOWCASE_FONT_FAMILY;
      featY = renderWrappedText(ctx, feat, rightColX + 58, featY, colWidth - 85, 20, 2);
      featY += 10;
    }
  } else {
    // Single Full-Width Photo Showcase Frame (when Key Advantages is unchecked)
    drawRoundedRect(ctx, margin, curY, contentWidth, heroCardHeight, 16, themeCardBg, themeCardBorder, 1.5);

    const imgPad = 24;
    const imgBoxW = contentWidth - imgPad * 2;
    const imgBoxH = heroCardHeight - imgPad * 2;

    if (prodImg) {
      const scale = Math.min(imgBoxW / prodImg.width, imgBoxH / prodImg.height);
      const drawW = prodImg.width * scale;
      const drawH = prodImg.height * scale;
      const drawX = margin + imgPad + (imgBoxW - drawW) / 2;
      const drawY = curY + imgPad + (imgBoxH - drawH) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(prodImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = themeTextSecondary;
      ctx.font = 'bold 16px ' + SHOWCASE_FONT_FAMILY;
      ctx.textAlign = 'center';
      ctx.fillText(getShowcaseText('photoFallback', lang) + ' ' + config.product.modelNo, margin + contentWidth / 2, curY + heroCardHeight / 2);
      ctx.textAlign = 'left';
    }

    // Corner Authentic Badge on Photo
    const genuineText = getShowcaseText('genuineBadge', lang);
    ctx.font = 'bold 11px ' + SHOWCASE_FONT_FAMILY;
    const genuineBadgeW = ctx.measureText(genuineText).width + 24;
    drawRoundedRect(ctx, margin + 18, curY + 18, genuineBadgeW, 28, 6, 'rgba(46, 7, 93, 0.92)');
    ctx.fillStyle = '#ffffff';
    ctx.fillText(genuineText, margin + 28, curY + 36);
  }

  curY += heroCardHeight + 24;

  // 5. Specification & Variant Section (Exact rendered HTML output from listing page)
  if (showVariants && varBoxHeight > 0) {
    if (variantCanvas) {
      ctx.drawImage(variantCanvas, margin, curY, contentWidth, varBoxHeight);
    } else {
      drawRoundedRect(ctx, margin, curY, contentWidth, varBoxHeight, 14, '#ffffff', '#dfd5e8', 1.5);
      drawSlidersIcon(ctx, margin + 20, curY + 16, '#5e3e8b');
      ctx.fillStyle = '#2e075d';
      ctx.font = '600 13px ' + SHOWCASE_FONT_FAMILY;
      ctx.fillText(getShowcaseText('specAndVariant', lang), margin + 44, curY + 28);
    }

    curY += varBoxHeight + 24;
  }

  // 6. Technical Specifications Matrix (2 wide columns, wrapped text, rich data extraction)
  if (config.includeSpecs) {
    const specCols = 2;
    const specColW = (contentWidth - 48 - 18) / specCols; // ~519px wide each
    const boxH = 72; // Increased comfortable height
    const numRows = Math.ceil(displaySpecs.length / specCols);
    const specsBoxHeight = 56 + numRows * (boxH + 12);

    drawRoundedRect(ctx, margin, curY, contentWidth, specsBoxHeight, 16, themeCardBg, themeCardBorder, 1.5);

    ctx.fillStyle = themeBrand;
    ctx.font = 'bold 15px ' + SHOWCASE_FONT_FAMILY;
    ctx.fillText(getShowcaseText('techSpecsMatrix', lang), margin + 24, curY + 30);

    ctx.strokeStyle = themeCardBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin + 24, curY + 42);
    ctx.lineTo(margin + contentWidth - 24, curY + 42);
    ctx.stroke();

    displaySpecs.forEach((spec, idx) => {
      const colIdx = idx % specCols;
      const rowIdx = Math.floor(idx / specCols);
      const cellX = margin + 24 + colIdx * (specColW + 18);
      const cellY = curY + 54 + rowIdx * (boxH + 12);

      drawRoundedRect(ctx, cellX, cellY, specColW, boxH, 8, themeBg, themeCardBorder, 0.9);

      // Spec Label
      ctx.fillStyle = themeBrand;
      ctx.font = 'bold 11px ' + SHOWCASE_FONT_FAMILY;
      ctx.fillText(getTranslatedSpecLabel(spec[0], lang).toUpperCase(), cellX + 16, cellY + 22);

      // Spec Value with multi-line wrapping - NEVER CUT OFF
      ctx.fillStyle = themeTextPrimary;
      ctx.font = 'bold 13px ' + SHOWCASE_FONT_FAMILY;
      renderWrappedText(ctx, getTranslatedSpecValue(spec[1], lang), cellX + 16, cellY + 42, specColW - 32, 17, 2);
    });

    curY += specsBoxHeight + 24;
  }

  // 7. Applications & Compatibility Strip
  if (config.includeApplications && isPortrait) {
    const appBoxHeight = 150;
    drawRoundedRect(ctx, margin, curY, contentWidth, appBoxHeight, 16, themeCardBg, themeCardBorder, 1.5);

    ctx.fillStyle = themeBrand;
    ctx.font = 'bold 15px ' + SHOWCASE_FONT_FAMILY;
    ctx.fillText(getShowcaseText('targetApps', lang), margin + 24, curY + 28);

    const apps = config.product.applications && config.product.applications.length > 0 && normalizeShowcaseLang(lang) === 'en'
      ? config.product.applications
      : (getShowcaseText('defaultApps', lang) as string[]);

    const appY = curY + 58;
    const appColW = (contentWidth - 48) / 2;

    (apps as string[]).slice(0, 4).forEach((app: string, idx: number) => {
      const c = idx % 2;
      const r = Math.floor(idx / 2);
      const aX = margin + 24 + c * appColW;
      const aY = appY + r * 36;

      drawCheckIcon(ctx, aX + 10, aY + 4, 8, '#10b981', '#ffffff');
      ctx.fillStyle = themeTextPrimary;
      ctx.font = '500 13px ' + SHOWCASE_FONT_FAMILY;
      ctx.fillText(app, aX + 28, aY + 9);
    });

    if (config.customNotes) {
      ctx.fillStyle = '#b45309';
      ctx.font = 'italic 12px ' + SHOWCASE_FONT_FAMILY;
      ctx.fillText(`* Note: ${config.customNotes.slice(0, 95)}`, margin + 24, curY + 135);
    }

    curY += appBoxHeight + 24;
  }

  // 8. Footer Official Contacts & Guarantee Banner (Requirement 6: NO ISO LINE)
  const footerY = height - margin - footerHeight;

  drawRoundedRect(ctx, margin, footerY, contentWidth, footerHeight, 16, themeHeader, undefined);

  // Left side: Guarantee and contact info without ANY ISO mention
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px ' + SHOWCASE_FONT_FAMILY;
  ctx.fillText(getShowcaseText('footerFactory', lang), margin + 28, footerY + 36);

  ctx.fillStyle = '#dfd5e8';
  ctx.font = '13px ' + SHOWCASE_FONT_FAMILY;
  // Explicitly NO ISO line
  ctx.fillText(getShowcaseText('footerQuality', lang), margin + 28, footerY + 62);
  ctx.fillText(getShowcaseText('footerExport', lang), margin + 28, footerY + 84);

  // Right side: Official Product Overview Stamp
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fef08a'; // gold badge
  ctx.font = 'bold 14px ' + SHOWCASE_FONT_FAMILY;
  ctx.fillText(getShowcaseText('officialOverview', lang), width - margin - 28, footerY + 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px ' + SHOWCASE_FONT_FAMILY;
  ctx.fillText('www.praztechtools.com', width - margin - 28, footerY + 62);

  ctx.fillStyle = '#dfd5e8';
  ctx.font = '12px ' + SHOWCASE_FONT_FAMILY;
  ctx.fillText('+91 8744020102', width - margin - 28, footerY + 84);
  ctx.textAlign = 'left';

  return canvas;
};

/**
 * Generates and returns a PNG Data URL for direct display or download.
 */
export const generateProductShowcaseDataUrl = async (
  config: ProductShowcaseConfig,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality: number = 0.95
): Promise<string> => {
  const canvas = await generateProductShowcaseCanvas(config);
  return canvas.toDataURL(format, quality);
};

/**
 * Triggers a browser file download of the generated showcase canvas.
 */
export const downloadShowcaseImage = (
  canvas: HTMLCanvasElement,
  filename: string = 'PRAZTECH_Product_Showcase.png'
): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copies the canvas image directly to the system clipboard for instant paste into WhatsApp, Slack, etc.
 */
export const copyCanvasImageToClipboard = async (canvas: HTMLCanvasElement): Promise<boolean> => {
  if (typeof window === 'undefined' || !navigator.clipboard || !window.ClipboardItem) {
    return false;
  }
  return new Promise(resolve => {
    canvas.toBlob(async blob => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        await navigator.clipboard.write([
          new window.ClipboardItem({ 'image/png': blob })
        ]);
        resolve(true);
      } catch (err) {
        console.error('Failed to copy canvas to clipboard:', err);
        resolve(false);
      }
    }, 'image/png');
  });
};
