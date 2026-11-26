import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Search,
  ChevronDown,
  FileText,
  Download,
  Mail,
  Phone,
  MapPin,
  Eye,
  X,
  Users,
  RefreshCw,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Filter,
  Plus,
  Trash2,
  Edit3,
  CheckSquare,
  Square,
  MessageCircle,
  FileSpreadsheet,
  Save,
  ArrowLeft,
  UploadCloud,
  Tag,
  Receipt,
  Globe,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Calculator,
  Printer,
  Copy,
  Check,
  Send,
  Image as ImageIcon,
  Share2,
  Palette
} from 'lucide-react';
import { atlasService } from '../services/atlasService';
import { formatDateDDMMYY } from '../utils/dateFormat';
import {
  generateClientSideQuotationPDF,
  amountToWords,
  QuotationDetails,
  QuotationLineItem
} from '../utils/clientPdfGenerator';
import {
  ProductShowcaseConfig,
  generateProductShowcaseCanvas,
  generateProductShowcaseDataUrl,
  downloadShowcaseImage,
  copyCanvasImageToClipboard,
  getToolVariantSectionData,
  getInitialSubModel,
  getShowcaseText,
  getProductTranslatedCopy
} from '../utils/quotationImageGenerator';
import { LANGUAGES } from '../components/LanguageSelector';
import { SubModelSelector } from '../components/SubModelSelector';
import { SubModel } from '../types';
import initialCatalogueData from '../data/products.json';
import initialCategoriesData from '../data/categories.json';
import { ExecutiveAuthGate } from './executive/ExecutiveAuthGate';
import { ExecutiveHeader } from './executive/ExecutiveHeader';
import './UsersPage.css';

// Administrative Session Token Key (Holds signed JWT received from server, never plaintext passwords)
const AUTH_TOKEN_KEY = 'praztech_admin_session_token';

export type EnquiryStatus = 'Review Pending' | 'Quotation Dispatched' | 'Blueprint Review' | 'Order Confirmed' | 'Closed';

export interface PastCommercialQuote {
  id: string;
  quoteNumber: string;
  quoteDate: string;
  customerName: string;
  company: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gstin?: string;
  currency: string;
  currencySymbol: string;
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  freightCharges: number;
  grandTotal: number;
  itemsCount: number;
  items: QuotationLineItem[];
  validityDays: number;
  paymentTerms: string;
  deliveryTimeline: string;
  freightTerms?: string;
  warrantyTerms?: string;
  generalNotes?: string;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
  };
  status: 'Dispatched' | 'Downloaded' | 'Draft';
  createdAt: string;
}

const PAST_QUOTES_STORAGE_KEY = 'praztech_commercial_quotes_history_v1';

export interface UserEnquiryItem {
  productId?: string;
  modelNo: string;
  name: string;
  category: string;
  quantity: number;
  notes?: string;
  selectedSubModel?: any;
}

export interface UserEnquiry {
  _id?: string;
  referenceNumber: string;
  submittedAt: string;
  status: EnquiryStatus;
  customerSnapshot: {
    fullName: string;
    company?: string;
    email: string;
    phone: string;
    whatsapp?: string;
    country: string;
    state: string;
    city: string;
    address?: string;
    gstin?: string;
  };
  catalogueItems: UserEnquiryItem[];
  customItems?: any[];
  generalNotes?: string;
  pdfUrl?: string;
}

export interface B2BCustomer {
  _id?: string;
  id?: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  whatsapp?: string;
  city: string;
  state: string;
  country: string;
  address: string;
  gstin?: string;
  enquiryCount?: number;
  enquiryIds?: string[];
  createdAt?: string;
}

export interface CatalogueProduct {
  id?: string;
  indexNumber?: number;
  modelNo: string;
  name: string;
  category: string;
  categorySlug?: string;
  cataloguePage?: number;
  tag?: string;
  description?: string;
  keyFeatures?: string[];
  applications?: string[];
  setIncludes?: string[];
  sizesDetail?: string[];
  compatibility?: string;
  itemSpecifics?: Record<string, string>;
  subModels?: any[];
  images?: string[];
  slug: string;
  isActive?: boolean;
}

const normalizeStatus = (rawStatus?: string): EnquiryStatus => {
  if (!rawStatus) return 'Review Pending';
  const s = rawStatus.trim();
  if (s === 'New' || s === 'Contacted') return 'Review Pending';
  if (s === 'Quotation Sent') return 'Quotation Dispatched';
  if (s === 'Completed') return 'Order Confirmed';
  return (s as EnquiryStatus) || 'Review Pending';
};

const STATUS_STYLES: Record<string, string> = {
  'Review Pending': 'bg-amber-50 text-amber-900 border-amber-200',
  'Quotation Dispatched': 'bg-emerald-50 text-emerald-900 border-emerald-200',
  'Blueprint Review': 'bg-[#efe7f7] text-[#2e075d] border-[#dfd5e8]',
  'Order Confirmed': 'bg-blue-50 text-blue-900 border-blue-200',
  'Closed': 'bg-gray-100 text-gray-700 border-gray-300',
  'New': 'bg-amber-50 text-amber-900 border-amber-200',
  'Contacted': 'bg-amber-50 text-amber-900 border-amber-200',
  'Quotation Sent': 'bg-emerald-50 text-emerald-900 border-emerald-200',
  'Completed': 'bg-blue-50 text-blue-900 border-blue-200'
};

type TabId = 'quotations' | 'directory' | 'catalogue' | 'new-listing' | 'create-quote' | 'product-showcase';

export const UsersPage: React.FC = () => {
  // Server-Side Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab with URL Search Param sync
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const initialActiveTab: TabId =
    rawTab === 'directory' || rawTab === 'catalogue' || rawTab === 'new-listing' || rawTab === 'create-quote' || rawTab === 'product-showcase'
      ? rawTab
      : 'quotations';
  const [activeTab, setActiveTab] = useState<TabId>(initialActiveTab);

  const handleTabSwitch = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Loading States
  const [loadingData, setLoadingData] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Enquiries State
  const [enquiriesList, setEnquiriesList] = useState<UserEnquiry[]>([]);
  const [enquirySearch, setEnquirySearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEnquiryIds, setSelectedEnquiryIds] = useState<Set<string>>(new Set());
  const [inspectingEnquiry, setInspectingEnquiry] = useState<UserEnquiry | null>(null);
  const [editingEnquiry, setEditingEnquiry] = useState<UserEnquiry | null>(null);
  const [isAddingEnquiry, setIsAddingEnquiry] = useState(false);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

  // Customers State
  const [customersList, setCustomersList] = useState<B2BCustomer[]>([]);
  const [dirSearch, setDirSearch] = useState('');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<B2BCustomer | null>(null);

  // Catalogue State
  const [catalogueList, setCatalogueList] = useState<CatalogueProduct[]>(initialCatalogueData as any);
  const [catSearch, setCatSearch] = useState('');
  const [catCategoryFilter, setCatCategoryFilter] = useState('all');

  // New Listing Template Form State
  const [newListingForm, setNewListingForm] = useState<{
    modelNo: string;
    name: string;
    category: string;
    cataloguePage: number;
    tag: string;
    description: string;
    compatibility: string;
    keyFeatures: string[];
    applications: string[];
    setIncludes: string[];
    variantOptionNames: string[];
    subModels: Array<{
      modelNo?: string;
      options: Record<string, string>;
      sizeMm?: string;
      color?: string;
      specification?: string;
      notes?: string;
      label?: string;
    }>;
  }>({
    modelNo: '',
    name: '',
    category: 'Valve Seat Grinding Tools',
    cataloguePage: 42,
    tag: 'standard',
    description: '',
    compatibility: '',
    keyFeatures: ['Precision ground to DIN industrial standard tolerances', 'High wear resistance formulation'],
    applications: ['Internal combustion engine cylinder head rebuilding'],
    setIncludes: ['Primary tool unit and heavy-duty storage case'],
    variantOptionNames: ['Weight', 'Size'],
    subModels: [
      {
        modelNo: '',
        options: { Weight: '', Size: '' },
        notes: ''
      }
    ]
  });
  const [newListingImageFile, setNewListingImageFile] = useState<File | null>(null);
  const [newListingImagePreview, setNewListingImagePreview] = useState<string>('');
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);
  const [showMatrixHelper, setShowMatrixHelper] = useState(false);
  const [matrixOptionInputs, setMatrixOptionInputs] = useState<Record<string, string>>({
    Weight: '',
    Size: ''
  });
  const [newCustomOptionName, setNewCustomOptionName] = useState('');

  // Manual Customer Form State
  const [manualCustomerForm, setManualCustomerForm] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    country: 'India',
    state: '',
    city: '',
    address: '',
    gstin: ''
  });

  // Manual Enquiry Form State
  const [manualEnquiryForm, setManualEnquiryForm] = useState({
    customerName: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    city: '',
    state: '',
    country: 'India',
    items: [
      { productSlug: 'psh-vgkp-with-heavy-stand', quantity: 1, notes: '' }
    ],
    generalNotes: ''
  });

  // ── COMMERCIAL QUOTE MAKER STATE & HANDLERS ──
  const generateNewQuoteNumber = () => {
    const today = new Date();
    const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PRZ-QT-${ymd}-${rand}`;
  };

  const CURRENCY_SYMBOLS: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const [quoteForm, setQuoteForm] = useState({
    quoteNumber: generateNewQuoteNumber(),
    quoteDate: new Date().toISOString().split('T')[0],
    validityDays: 30,
    currency: 'INR' as 'INR' | 'USD' | 'EUR' | 'GBP',
    currencySymbol: '₹',
    selectedCustomerId: '',
    customerName: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    country: '',
    paymentTerms: '50% advance, balance against Proforma Invoice / dispatch',
    deliveryTimeline: 'Ex-stock / Ready for dispatch within 2-3 business days',
    freightTerms: 'Borne by consignee unless explicitly itemized above.',
    warrantyTerms: '12 months manufacturer warranty against casting & grinding defects.',
    freightCharges: 0,
    generalNotes: 'Standard 1-year manufacturer guarantee on tooling precision and metallurgical integrity.',
    bankName: 'HDFC Bank Ltd',
    accountName: 'PRAZTECH ENGINEERING',
    accountNumber: '50200084729103',
    ifscCode: 'HDFC0000123',
    branch: 'Asaf Ali Road, New Delhi'
  });

  const [quoteItems, setQuoteItems] = useState<QuotationLineItem[]>([
    {
      id: 'quote-item-1',
      isCustom: false,
      modelNo: 'PSH-VGKP-H',
      name: 'All in One 9/16" and 11/16" Valve Seat Grinding Kit',
      category: 'Valve Seat Grinding Tools',
      image: '/images/products/psh-vgkp-with-heavy-stand.jpg',
      selectedVariant: 'Standard Heavy-Duty Set (Dual Arbor)',
      notes: 'Includes precision hex drive arbor, diamond wheel dresser, and heavy-duty case',
      quantity: 1,
      unitPrice: 42500,
      discountPercent: 5,
      gstRate: 18,
      lineTotal: 47642.5
    }
  ]);

  const [isPreviewingQuoteModal, setIsPreviewingQuoteModal] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [quoteCopied, setQuoteCopied] = useState(false);
  const [quoteProductSearchMap, setQuoteProductSearchMap] = useState<Record<string, string>>({});
  const [activeQuoteProductDropdown, setActiveQuoteProductDropdown] = useState<string | null>(null);

  const formatSubModelDetails = (sm: SubModel, idx?: number): string => {
    if (!sm || typeof sm !== 'object') return idx !== undefined ? `Option #${idx + 1}` : 'Standard';
    const parts: string[] = [];
    const seen = new Set<string>();
    const addPart = (label: string, val: any, prefix = '') => {
      if (val === undefined || val === null || val === '' || val === '-') return;
      const str = Array.isArray(val) ? val.filter(Boolean).join(', ') : String(val).trim();
      if (!str || str === '-') return;
      if (!seen.has(label)) {
        seen.add(label);
        parts.push(prefix ? `${prefix}: ${str}` : str);
      }
    };

    addPart('modelNo', sm.modelNo);
    if (sm.sizeInches || sm.sizeMm || sm.inches || sm.mm) {
      const inchStr = sm.sizeInches || sm.inches || '';
      const mmStr = sm.sizeMm || sm.mm || '';
      const combined = inchStr && mmStr ? `${inchStr} (${mmStr})` : (inchStr || mmStr);
      addPart('sizeCombined', combined);
      seen.add('sizeInches'); seen.add('sizeMm'); seen.add('inches'); seen.add('mm');
    }
    addPart('size', sm.size, 'Size');
    addPart('range', sm.range, 'Range');
    addPart('inchRange', sm.inchRange, 'Inch Range');
    addPart('metricRange', sm.metricRange, 'Metric Range');
    addPart('dimensions', sm.dimensions, 'Dimensions');
    addPart('angles', sm.angles, 'Angles');
    addPart('thread', sm.thread, 'Thread');
    addPart('drive', sm.drive, 'Drive');
    addPart('pilots', sm.pilots, 'Pilots');
    addPart('cutters', sm.cutters, 'Cutters');
    addPart('reamers', sm.reamers, 'Reamers');
    addPart('compatibility', sm.compatibility, 'Compatibility');
    addPart('stoneColor', sm.stoneColor, 'Stone');
    addPart('carat', sm.carat, 'Carat');
    addPart('specification', sm.specification, 'Spec');
    addPart('features', sm.features, 'Features');
    addPart('voltage', sm.voltage, 'Voltage');
    addPart('power', sm.power, 'Power');
    addPart('speed', sm.speed, 'Speed');
    addPart('profile', sm.profile, 'Profile');

    // Include any remaining non-empty keys on SubModel
    Object.entries(sm).forEach(([k, v]) => {
      if (seen.has(k)) return;
      addPart(k, v, k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()));
    });

    return parts.length > 0 ? parts.join(' • ') : (idx !== undefined ? `Option #${idx + 1}` : 'Standard');
  };

  // Past Commercial Quotations History
  const [pastQuotes, setPastQuotes] = useState<PastCommercialQuote[]>(() => {
    try {
      const stored = localStorage.getItem(PAST_QUOTES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not load past quotes from storage', e);
    }
    return [
      {
        id: 'PQ-INITIAL-1',
        quoteNumber: 'PRZ-QT-20261124-1014',
        quoteDate: '2026-11-24',
        customerName: 'Anand Kumar',
        company: 'Precision Head Works & Rebuilders',
        email: 'anand@dieselservices.com',
        phone: '+91 9876543210',
        whatsapp: '+91 9876543210',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        address: 'Plot 14, Mayapuri Industrial Area Phase II',
        gstin: '07AAAAA0000A1Z5',
        currency: 'INR',
        currencySymbol: '₹',
        subtotal: 42500,
        discountTotal: 2125,
        taxableAmount: 40375,
        taxTotal: 7267.5,
        freightCharges: 0,
        grandTotal: 47642.5,
        itemsCount: 1,
        items: [
          {
            id: 'quote-item-default',
            isCustom: false,
            modelNo: 'PSH-VGKP-H',
            name: 'All in One 9/16" and 11/16" Valve Seat Grinding Kit',
            category: 'Valve Seat Grinding Tools',
            image: '/images/products/psh-vgkp-with-heavy-stand.jpg',
            selectedVariant: 'Standard Heavy-Duty Set (Dual Arbor)',
            notes: 'Includes precision hex drive arbor, diamond wheel dresser, and heavy-duty case',
            quantity: 1,
            unitPrice: 42500,
            discountPercent: 5,
            gstRate: 18,
            lineTotal: 47642.5
          }
        ],
        validityDays: 30,
        paymentTerms: '50% advance, balance against Proforma Invoice / dispatch',
        deliveryTimeline: 'Ex-stock / Ready for dispatch within 2-3 business days',
        generalNotes: 'Standard 1-year manufacturer guarantee on tooling precision and metallurgical integrity.',
        bankDetails: {
          bankName: 'HDFC Bank Ltd',
          accountName: 'PRAZTECH ENGINEERING',
          accountNumber: '50200084729103',
          ifscCode: 'HDFC0000123',
          branch: 'Asaf Ali Road, New Delhi'
        },
        status: 'Dispatched',
        createdAt: '2026-11-24T10:14:00.000Z'
      }
    ];
  });
  const [pastQuoteSearch, setPastQuoteSearch] = useState<string>('');

  // Product Showcase Image Generator States
  const [showcaseSelectedProductId, setShowcaseSelectedProductId] = useState<string>('');
  const [showcaseLanguage, setShowcaseLanguage] = useState<string>('en');
  const [showcaseSearch, setShowcaseSearch] = useState<string>('');
  const [showcaseDropdownOpen, setShowcaseDropdownOpen] = useState<boolean>(false);
  const [showcaseIsFocused, setShowcaseIsFocused] = useState<boolean>(false);
  const showcaseComboboxRef = useRef<HTMLDivElement>(null);
  const [showcaseCategoryFilter, setShowcaseCategoryFilter] = useState<string>('all');
  const showcaseAspectRatio: 'portrait' = 'portrait';
  const [showcaseIncludeVariants, setShowcaseIncludeVariants] = useState<boolean>(true);
  const [showcaseHeadline, setShowcaseHeadline] = useState<string>('');
  const [showcaseProductTitle, setShowcaseProductTitle] = useState<string>('');
  const [showcaseTagline, setShowcaseTagline] = useState<string>('');
  const [showcaseIncludeFeatures, setShowcaseIncludeFeatures] = useState<boolean>(true);
  const [showcaseIncludeSpecs, setShowcaseIncludeSpecs] = useState<boolean>(true);
  const [showcaseIncludeApplications, setShowcaseIncludeApplications] = useState<boolean>(true);
  const [showcaseCustomNotes, setShowcaseCustomNotes] = useState<string>('');
  const [showcaseSelectedImage, setShowcaseSelectedImage] = useState<string>('');
  const [showcasePreviewDataUrl, setShowcasePreviewDataUrl] = useState<string>('');
  const [isGeneratingShowcase, setIsGeneratingShowcase] = useState<boolean>(false);
  const [showcaseCopySuccess, setShowcaseCopySuccess] = useState<boolean>(false);
  const [showcaseZoomFit, setShowcaseZoomFit] = useState<boolean>(true);
  const [showcaseSelectedSubModel, setShowcaseSelectedSubModel] = useState<SubModel | null>(null);

  const computeItemLineTotal = (
    quantity: number,
    unitPrice: number,
    discountPercent: number,
    gstRate: number
  ) => {
    const qty = Math.max(1, Number(quantity) || 1);
    const rate = Math.max(0, Number(unitPrice) || 0);
    const disc = Math.min(100, Math.max(0, Number(discountPercent) || 0));
    const gst = Math.max(0, Number(gstRate) || 0);

    const base = qty * rate;
    const discountAmt = base * (disc / 100);
    const taxable = base - discountAmt;
    const taxAmt = taxable * (gst / 100);
    return Math.round((taxable + taxAmt) * 100) / 100;
  };

  const quoteFinancials = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxableAmount = 0;
    let taxTotal = 0;

    quoteItems.forEach(it => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const rate = Math.max(0, Number(it.unitPrice) || 0);
      const disc = Math.min(100, Math.max(0, Number(it.discountPercent) || 0));
      const gst = Math.max(0, Number(it.gstRate) || 0);

      const base = qty * rate;
      const discAmt = base * (disc / 100);
      const taxable = base - discAmt;
      const taxAmt = taxable * (gst / 100);

      subtotal += base;
      discountTotal += discAmt;
      taxableAmount += taxable;
      taxTotal += taxAmt;
    });

    const freight = Math.max(0, Number(quoteForm.freightCharges) || 0);
    const grandTotal = Math.round((taxableAmount + taxTotal + freight) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      freightCharges: freight,
      grandTotal
    };
  }, [quoteItems, quoteForm.freightCharges]);

  const handleCustomerAutoFill = (customerId: string) => {
    if (!customerId) return;
    const found = customersList.find(c => (c._id || c.id) === customerId);
    if (found) {
      setQuoteForm(prev => ({
        ...prev,
        selectedCustomerId: customerId,
        customerName: found.fullName || '',
        company: found.company || '',
        email: found.email || '',
        phone: found.phone || '',
        whatsapp: found.whatsapp || found.phone || '',
        gstin: found.gstin || '',
        address: found.address || '',
        city: found.city || '',
        state: found.state || '',
        country: found.country || 'India'
      }));
    }
  };

  const handleAddCatalogueItemToQuote = (productSlug?: string) => {
    const product = (productSlug ? catalogueList.find(p => p.slug === productSlug) : null) || catalogueList[0];
    const newItemId = `quote-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const defaultSubModel = product?.subModels?.[0];
    const variantLabel = defaultSubModel
      ? (defaultSubModel.sizeInches ? `${defaultSubModel.sizeInches} (${defaultSubModel.sizeMm || ''})` : defaultSubModel.modelNo || defaultSubModel.size || '')
      : 'Standard';

    const newItem: QuotationLineItem = {
      id: newItemId,
      isCustom: false,
      modelNo: product?.modelNo || 'PRZ-TOOL',
      name: product?.name || 'Catalogue Tooling Product',
      category: product?.category || 'Precision Tooling',
      image: product?.images?.[0] || '',
      selectedVariant: variantLabel || 'Standard Tooling Unit',
      notes: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      gstRate: quoteForm.currency === 'INR' ? 18 : 0,
      lineTotal: 0
    };

    setQuoteItems(prev => [...prev, newItem]);
  };

  const handleAddCustomItemToQuote = () => {
    const newItemId = `quote-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newItem: QuotationLineItem = {
      id: newItemId,
      isCustom: true,
      modelNo: 'CUSTOM-MACHINING',
      name: 'Custom Machined Tooling / Special Precision Service',
      category: 'Custom Engineering',
      image: '',
      selectedVariant: 'Custom Specification / Technical Drawing',
      notes: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      gstRate: quoteForm.currency === 'INR' ? 18 : 0,
      lineTotal: 0
    };

    setQuoteItems(prev => [...prev, newItem]);
  };

  const handleUpdateQuoteItem = (id: string, updates: Partial<QuotationLineItem>) => {
    setQuoteItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };

        updated.lineTotal = computeItemLineTotal(
          updated.quantity,
          updated.unitPrice,
          updated.discountPercent,
          updated.gstRate
        );
        return updated;
      })
    );
  };

  const handleRemoveQuoteItem = (id: string) => {
    setQuoteItems(prev => prev.filter(it => it.id !== id));
  };

  const handleDuplicateQuoteItem = (id: string) => {
    const target = quoteItems.find(it => it.id === id);
    if (!target) return;
    const copy: QuotationLineItem = {
      ...target,
      id: `quote-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setQuoteItems(prev => [...prev, copy]);
  };

  const getQuotationDataForExport = (): QuotationDetails => {
    let validUntilStr = '';
    if (quoteForm.quoteDate && quoteForm.validityDays) {
      const validUntilDate = new Date(quoteForm.quoteDate);
      if (!isNaN(validUntilDate.getTime())) {
        validUntilDate.setDate(validUntilDate.getDate() + Number(quoteForm.validityDays));
        validUntilStr = `${formatDateDDMMYY(validUntilDate)} (${quoteForm.validityDays} Days)`;
      }
    } else if (quoteForm.validityDays) {
      validUntilStr = `${quoteForm.validityDays} Days`;
    }

    const enrichedItems: QuotationLineItem[] = quoteItems.map(it => {
      const matched = catalogueList.find(p => p.modelNo === it.modelNo || p.name === it.name);
      return {
        ...it,
        image: it.image || matched?.images?.[0] || '',
        productDetails: matched
          ? {
              compatibility: matched.compatibility,
              sizesDetail: matched.sizesDetail,
              itemSpecifics: matched.itemSpecifics,
              setIncludes: matched.setIncludes
            }
          : it.productDetails
      };
    });

    return {
      quoteNumber: quoteForm.quoteNumber,
      quoteDate: quoteForm.quoteDate ? formatDateDDMMYY(quoteForm.quoteDate) : '',
      validUntil: validUntilStr,
      currency: quoteForm.currency,
      currencySymbol: quoteForm.currencySymbol,
      customer: {
        fullName: quoteForm.customerName,
        company: quoteForm.company,
        email: quoteForm.email,
        phone: quoteForm.phone || quoteForm.whatsapp,
        whatsapp: quoteForm.whatsapp,
        address: quoteForm.address,
        city: quoteForm.city,
        state: quoteForm.state,
        country: quoteForm.country,
        gstin: quoteForm.gstin
      },
      items: enrichedItems,
      subtotal: quoteFinancials.subtotal,
      discountTotal: quoteFinancials.discountTotal,
      taxableAmount: quoteFinancials.taxableAmount,
      taxTotal: quoteFinancials.taxTotal,
      freightCharges: quoteFinancials.freightCharges,
      grandTotal: quoteFinancials.grandTotal,
      paymentTerms: quoteForm.paymentTerms,
      deliveryTimeline: quoteForm.deliveryTimeline,
      freightTerms: quoteForm.freightTerms,
      warrantyTerms: quoteForm.warrantyTerms,
      generalNotes: quoteForm.generalNotes,
      bankDetails: {
        bankName: quoteForm.bankName,
        accountName: quoteForm.accountName,
        accountNumber: quoteForm.accountNumber,
        ifscCode: quoteForm.ifscCode,
        branch: quoteForm.branch
      },
      authorizedSignatory: 'Commercial Sales Desk'
    };
  };

  const saveQuotationToHistory = useCallback((customQuoteData?: QuotationDetails, status: 'Dispatched' | 'Downloaded' | 'Draft' = 'Draft') => {
    const data = customQuoteData || getQuotationDataForExport();
    const entry: PastCommercialQuote = {
      id: `PQ-${data.quoteNumber || Date.now()}`,
      quoteNumber: data.quoteNumber || '',
      quoteDate: data.quoteDate || '',
      customerName: data.customer?.fullName ?? quoteForm.customerName ?? '',
      company: data.customer?.company ?? quoteForm.company ?? '',
      email: data.customer?.email ?? quoteForm.email ?? '',
      phone: data.customer?.phone ?? quoteForm.phone ?? '',
      whatsapp: data.customer?.whatsapp ?? quoteForm.whatsapp ?? '',
      address: data.customer?.address ?? quoteForm.address ?? '',
      city: data.customer?.city ?? quoteForm.city ?? '',
      state: data.customer?.state ?? quoteForm.state ?? '',
      country: data.customer?.country ?? quoteForm.country ?? '',
      gstin: data.customer?.gstin ?? quoteForm.gstin ?? '',
      currency: data.currency || quoteForm.currency || 'INR',
      currencySymbol: data.currencySymbol || quoteForm.currencySymbol || '₹',
      subtotal: data.subtotal || 0,
      discountTotal: data.discountTotal || 0,
      taxableAmount: data.taxableAmount || 0,
      taxTotal: data.taxTotal || 0,
      freightCharges: data.freightCharges || 0,
      grandTotal: data.grandTotal || 0,
      itemsCount: data.items?.length || 0,
      items: (data.items || []).map((it, idx) => ({
        id: `quote-item-${idx}-${Date.now()}`,
        isCustom: !!it.isCustom,
        modelNo: it.modelNo,
        name: it.name,
        category: it.category || 'Precision Tooling',
        image: it.image || '',
        selectedVariant: it.selectedVariant || '',
        notes: it.notes || '',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        discountPercent: it.discountPercent || 0,
        gstRate: it.gstRate || 18,
        lineTotal: it.lineTotal || (it.quantity * it.unitPrice)
      })),
      validityDays: quoteForm.validityDays || 30,
      paymentTerms: data.paymentTerms ?? quoteForm.paymentTerms ?? '',
      deliveryTimeline: data.deliveryTimeline ?? quoteForm.deliveryTimeline ?? '',
      freightTerms: data.freightTerms ?? quoteForm.freightTerms ?? '',
      warrantyTerms: data.warrantyTerms ?? quoteForm.warrantyTerms ?? '',
      generalNotes: data.generalNotes ?? quoteForm.generalNotes ?? '',
      bankDetails: data.bankDetails || {
        bankName: quoteForm.bankName,
        accountName: quoteForm.accountName,
        accountNumber: quoteForm.accountNumber,
        ifscCode: quoteForm.ifscCode,
        branch: quoteForm.branch
      },
      status,
      createdAt: new Date().toISOString()
    };

    setPastQuotes(prev => {
      const filtered = prev.filter(p => p.quoteNumber !== entry.quoteNumber);
      const updated = [entry, ...filtered];
      try {
        localStorage.setItem(PAST_QUOTES_STORAGE_KEY, JSON.stringify(updated.slice(0, 50)));
      } catch (err) {
        console.error('Failed to save past quotes to local storage', err);
      }
      return updated;
    });

    return entry;
  }, [quoteForm, quoteFinancials, quoteItems, catalogueList]);

  const handleSaveDraftQuote = () => {
    const quoteData = getQuotationDataForExport();
    saveQuotationToHistory(quoteData, 'Draft');
    setActionSuccessMsg(`Quotation "${quoteData.quoteNumber}" saved to Past Quotations archive as Draft!`);
  };

  const handleDownloadQuotePDF = async () => {
    const quoteData = getQuotationDataForExport();
    saveQuotationToHistory(quoteData, 'Downloaded');
    await generateClientSideQuotationPDF(quoteData);
  };

  const handleLoadPastQuoteIntoEditor = (pq: PastCommercialQuote) => {
    setQuoteForm({
      quoteNumber: pq.quoteNumber,
      quoteDate: pq.quoteDate,
      validityDays: pq.validityDays || 30,
      currency: (pq.currency as 'INR' | 'USD' | 'EUR' | 'GBP') || 'INR',
      currencySymbol: pq.currencySymbol || '₹',
      selectedCustomerId: '',
      customerName: pq.customerName,
      company: pq.company,
      email: pq.email,
      phone: pq.phone,
      whatsapp: pq.whatsapp || pq.phone,
      gstin: pq.gstin || '',
      address: pq.address || '',
      city: pq.city ?? '',
      state: pq.state ?? '',
      country: pq.country ?? '',
      paymentTerms: pq.paymentTerms ?? '',
      deliveryTimeline: pq.deliveryTimeline ?? '',
      freightTerms: pq.freightTerms ?? 'Borne by consignee unless explicitly itemized above.',
      warrantyTerms: pq.warrantyTerms ?? '12 months manufacturer warranty against casting & grinding defects.',
      freightCharges: pq.freightCharges || 0,
      generalNotes: pq.generalNotes ?? '',
      bankName: pq.bankDetails?.bankName ?? '',
      accountName: pq.bankDetails?.accountName ?? '',
      accountNumber: pq.bankDetails?.accountNumber ?? '',
      ifscCode: pq.bankDetails?.ifscCode ?? '',
      branch: pq.bankDetails?.branch ?? ''
    });

    if (pq.items && pq.items.length > 0) {
      setQuoteItems(pq.items.map((it, idx) => ({
        id: `quote-item-reloaded-${idx}-${Date.now()}`,
        isCustom: !!it.isCustom,
        modelNo: it.modelNo,
        name: it.name,
        category: it.category || 'Precision Tooling',
        image: it.image || '',
        selectedVariant: it.selectedVariant || '',
        notes: it.notes || '',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        discountPercent: it.discountPercent || 0,
        gstRate: it.gstRate || 18,
        lineTotal: it.lineTotal || (it.quantity * it.unitPrice)
      })));
    }
    window.scrollTo({ top: 320, behavior: 'smooth' });
    setActionSuccessMsg(`Quotation "${pq.quoteNumber}" loaded into the editor! You can now adjust, re-price, or re-send.`);
  };

  const handleDownloadPastQuotePDF = async (pq: PastCommercialQuote) => {
    const qDetails: QuotationDetails = {
      quoteNumber: pq.quoteNumber,
      quoteDate: pq.quoteDate,
      validUntil: `${pq.validityDays || 30} Days`,
      currency: pq.currency,
      currencySymbol: pq.currencySymbol,
      customer: {
        fullName: pq.customerName,
        company: pq.company,
        email: pq.email,
        phone: pq.phone,
        whatsapp: pq.whatsapp,
        address: pq.address,
        city: pq.city ?? '',
        state: pq.state ?? '',
        country: pq.country ?? '',
        gstin: pq.gstin
      },
      items: (pq.items || []).map(it => {
        const matched = catalogueList.find(p => p.modelNo === it.modelNo || p.name === it.name);
        return {
          ...it,
          image: it.image || matched?.images?.[0] || '',
          productDetails: it.productDetails || (matched
            ? {
                compatibility: matched.compatibility,
                sizesDetail: matched.sizesDetail,
                itemSpecifics: matched.itemSpecifics,
                setIncludes: matched.setIncludes
              }
            : undefined)
        };
      }),
      subtotal: pq.subtotal,
      discountTotal: pq.discountTotal,
      taxableAmount: pq.taxableAmount,
      taxTotal: pq.taxTotal,
      freightCharges: pq.freightCharges,
      grandTotal: pq.grandTotal,
      paymentTerms: pq.paymentTerms,
      deliveryTimeline: pq.deliveryTimeline,
      freightTerms: pq.freightTerms,
      warrantyTerms: pq.warrantyTerms,
      generalNotes: pq.generalNotes,
      bankDetails: pq.bankDetails ? {
        bankName: pq.bankDetails.bankName,
        accountName: pq.bankDetails.accountName,
        accountNumber: pq.bankDetails.accountNumber,
        ifscCode: pq.bankDetails.ifscCode,
        branch: pq.bankDetails.branch
      } : undefined,
      authorizedSignatory: 'Commercial Sales Desk'
    };
    await generateClientSideQuotationPDF(qDetails);
  };

  const handleDeletePastQuote = (id: string, quoteNo: string) => {
    if (confirm(`Are you sure you want to delete quotation "${quoteNo}" from the archive?`)) {
      setPastQuotes(prev => {
        const updated = prev.filter(p => p.id !== id && p.quoteNumber !== quoteNo);
        try {
          localStorage.setItem(PAST_QUOTES_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
      setActionSuccessMsg(`Quotation "${quoteNo}" removed from history.`);
    }
  };

  const filteredPastQuotes = useMemo(() => {
    if (!pastQuoteSearch.trim()) return pastQuotes;
    const term = pastQuoteSearch.toLowerCase();
    return pastQuotes.filter(p =>
      p.quoteNumber?.toLowerCase().includes(term) ||
      p.customerName?.toLowerCase().includes(term) ||
      p.company?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term) ||
      p.city?.toLowerCase().includes(term)
    );
  }, [pastQuotes, pastQuoteSearch]);

  // Active showcase product
  const activeShowcaseProduct = useMemo(() => {
    if (!catalogueList || catalogueList.length === 0) return null;
    if (showcaseSelectedProductId) {
      const found = catalogueList.find(p => (p.id || p.slug || p.modelNo) === showcaseSelectedProductId);
      if (found) return found;
    }
    return catalogueList[0];
  }, [catalogueList, showcaseSelectedProductId]);

  const activeVariantData = useMemo(() => {
    return getToolVariantSectionData(activeShowcaseProduct as any);
  }, [activeShowcaseProduct]);

  const currentShowcaseSubModel = useMemo(() => {
    if (!activeShowcaseProduct) return null;
    return showcaseSelectedSubModel || getInitialSubModel(activeShowcaseProduct as any);
  }, [activeShowcaseProduct, showcaseSelectedSubModel]);

  // Sync defaults when active product changes
  const handleSelectProductForShowcase = useCallback((prod: CatalogueProduct | any) => {
    setShowcaseSelectedProductId(prod.id || prod.slug || prod.modelNo);
    setShowcaseHeadline(prod.modelNo);
    const copy = getProductTranslatedCopy(prod, showcaseLanguage);
    setShowcaseProductTitle(copy.title);
    setShowcaseTagline(copy.tagline);
    setShowcaseSelectedImage(prod.images?.[0] || '');
    setShowcaseSelectedSubModel(getInitialSubModel(prod));
    setShowcaseSearch('');
    setShowcaseDropdownOpen(false);
    setShowcaseIsFocused(false);
  }, [showcaseLanguage]);

  const handleShowcaseLanguageChange = (langCode: string) => {
    setShowcaseLanguage(langCode);
    if (activeShowcaseProduct) {
      const copy = getProductTranslatedCopy(activeShowcaseProduct, langCode);
      setShowcaseProductTitle(copy.title);
      setShowcaseTagline(copy.tagline);
    }
  };

  // Filtered catalogue products for showcase combobox
  const showcaseFilteredProducts = useMemo(() => {
    if (!catalogueList) return [];
    const q = (showcaseSearch || '').trim().toLowerCase();
    if (!q) return catalogueList;
    return catalogueList.filter(p => {
      const m = (p.modelNo || '').toLowerCase();
      const n = (p.name || '').toLowerCase();
      const c = (p.category || '').toLowerCase();
      const d = (p.description || '').toLowerCase();
      return m.includes(q) || n.includes(q) || c.includes(q) || d.includes(q);
    });
  }, [catalogueList, showcaseSearch]);

  // Close showcase combobox on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (showcaseComboboxRef.current && !showcaseComboboxRef.current.contains(event.target as Node)) {
        setShowcaseDropdownOpen(false);
        setShowcaseIsFocused(false);
        setShowcaseSearch('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Auto-init active showcase product on first load
  useEffect(() => {
    if (!showcaseSelectedProductId && catalogueList && catalogueList.length > 0) {
      handleSelectProductForShowcase(catalogueList[0] as any);
    }
  }, [catalogueList, showcaseSelectedProductId, handleSelectProductForShowcase]);

  // Re-render showcase canvas whenever config changes
  useEffect(() => {
    if (!activeShowcaseProduct) return;
    let isCancelled = false;

    const renderShowcase = async () => {
      setIsGeneratingShowcase(true);
      try {
        const config: ProductShowcaseConfig = {
          product: activeShowcaseProduct as any,
          language: showcaseLanguage,
          headline: showcaseHeadline || activeShowcaseProduct.modelNo,
          productTitle: showcaseProductTitle || activeShowcaseProduct.name,
          tagline: showcaseTagline || activeShowcaseProduct.description,
          categoryBadge: activeShowcaseProduct.category || 'PRECISION TOOLING',
          selectedImageUrl: showcaseSelectedImage || activeShowcaseProduct.images?.[0],
          selectedSubModel: null,
          aspectRatio: showcaseAspectRatio,
          includeFeatures: showcaseIncludeFeatures,
          includeSpecs: showcaseIncludeSpecs,
          includeVariants: showcaseIncludeVariants,
          includeApplications: showcaseIncludeApplications,
          customNotes: showcaseCustomNotes
        };

        const dataUrl = await generateProductShowcaseDataUrl(config, 'image/png');
        if (!isCancelled) {
          setShowcasePreviewDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Error rendering product showcase image:', err);
      } finally {
        if (!isCancelled) {
          setIsGeneratingShowcase(false);
        }
      }
    };

    const timer = setTimeout(renderShowcase, 180);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    showcaseLanguage,
    activeShowcaseProduct,
    showcaseHeadline,
    showcaseProductTitle,
    showcaseTagline,
    showcaseSelectedImage,
    showcaseAspectRatio,
    showcaseIncludeFeatures,
    showcaseIncludeSpecs,
    showcaseIncludeVariants,
    showcaseIncludeApplications,
    showcaseCustomNotes
  ]);

  const handleDownloadShowcasePNG = async () => {
    if (!activeShowcaseProduct) return;
    const config: ProductShowcaseConfig = {
      product: activeShowcaseProduct as any,
      language: showcaseLanguage,
      headline: showcaseHeadline || activeShowcaseProduct.modelNo,
      productTitle: showcaseProductTitle || activeShowcaseProduct.name,
      tagline: showcaseTagline || activeShowcaseProduct.description,
      categoryBadge: activeShowcaseProduct.category || 'PRECISION TOOLING',
      selectedImageUrl: showcaseSelectedImage || activeShowcaseProduct.images?.[0],
      selectedSubModel: null,
      aspectRatio: showcaseAspectRatio,
      includeFeatures: showcaseIncludeFeatures,
      includeSpecs: showcaseIncludeSpecs,
      includeVariants: showcaseIncludeVariants,
      includeApplications: showcaseIncludeApplications,
      customNotes: showcaseCustomNotes
    };
    const canvas = await generateProductShowcaseCanvas(config);
    downloadShowcaseImage(canvas, `PRAZTECH_${activeShowcaseProduct.modelNo}_${showcaseLanguage.toUpperCase()}_Showcase.png`);
    setActionSuccessMsg(`Downloaded high-resolution PNG for ${activeShowcaseProduct.modelNo}`);
  };

  const handleDownloadShowcaseJPEG = async () => {
    if (!activeShowcaseProduct) return;
    const config: ProductShowcaseConfig = {
      product: activeShowcaseProduct as any,
      language: showcaseLanguage,
      headline: showcaseHeadline || activeShowcaseProduct.modelNo,
      productTitle: showcaseProductTitle || activeShowcaseProduct.name,
      tagline: showcaseTagline || activeShowcaseProduct.description,
      categoryBadge: activeShowcaseProduct.category || 'PRECISION TOOLING',
      selectedImageUrl: showcaseSelectedImage || activeShowcaseProduct.images?.[0],
      selectedSubModel: null,
      aspectRatio: showcaseAspectRatio,
      includeFeatures: showcaseIncludeFeatures,
      includeSpecs: showcaseIncludeSpecs,
      includeVariants: showcaseIncludeVariants,
      includeApplications: showcaseIncludeApplications,
      customNotes: showcaseCustomNotes
    };
    const canvas = await generateProductShowcaseCanvas(config);
    const link = document.createElement('a');
    link.download = `PRAZTECH_${activeShowcaseProduct.modelNo}_${showcaseLanguage.toUpperCase()}_Showcase.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    setActionSuccessMsg(`Downloaded high-resolution JPEG for ${activeShowcaseProduct.modelNo}`);
  };

  const handleCopyShowcaseToClipboard = async () => {
    if (!activeShowcaseProduct) return;
    const config: ProductShowcaseConfig = {
      product: activeShowcaseProduct as any,
      language: showcaseLanguage,
      headline: showcaseHeadline || activeShowcaseProduct.modelNo,
      productTitle: showcaseProductTitle || activeShowcaseProduct.name,
      tagline: showcaseTagline || activeShowcaseProduct.description,
      categoryBadge: activeShowcaseProduct.category || 'PRECISION TOOLING',
      selectedImageUrl: showcaseSelectedImage || activeShowcaseProduct.images?.[0],
      selectedSubModel: null,
      aspectRatio: showcaseAspectRatio,
      includeFeatures: showcaseIncludeFeatures,
      includeSpecs: showcaseIncludeSpecs,
      includeVariants: showcaseIncludeVariants,
      includeApplications: showcaseIncludeApplications,
      customNotes: showcaseCustomNotes
    };
    const canvas = await generateProductShowcaseCanvas(config);
    const success = await copyCanvasImageToClipboard(canvas);
    if (success) {
      setShowcaseCopySuccess(true);
      setTimeout(() => setShowcaseCopySuccess(false), 2500);
      setActionSuccessMsg('Product showcase image copied to clipboard! You can paste directly into WhatsApp, Slack, or email.');
    } else {
      alert('Direct image clipboard copy is not supported in this browser. Please use the Download button.');
    }
  };

  const handleShareShowcaseWhatsApp = () => {
    if (!activeShowcaseProduct) return;
    const text = encodeURIComponent(
      `*PRAZTECH® ENGINEERING - PRODUCT SHOWCASE*\n` +
      `*Model:* ${activeShowcaseProduct.modelNo}\n` +
      `*Tool:* ${activeShowcaseProduct.name}\n` +
      `*Category:* ${activeShowcaseProduct.category}\n\n` +
      `*Features:*\n${(activeShowcaseProduct.keyFeatures || []).slice(0, 3).map(f => `• ${f}`).join('\n')}\n\n` +
      `Official Overview & Technical Specifications: https://www.praztechtools.com/catalogue/${activeShowcaseProduct.slug}\n\n` +
      `Manufactured by PRAZTECH® Engineering, Delhi, India. Contact: +91 8744020102`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePreviewQuoteModal = () => {
    setIsPreviewingQuoteModal(true);
  };

  const handleWhatsAppQuote = () => {
    const targetPhone = quoteForm.whatsapp || quoteForm.phone;
    if (!targetPhone) {
      alert('Please enter a Customer Phone or WhatsApp number.');
      return;
    }
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const itemsSummary = quoteItems
      .map((it, idx) => `${idx + 1}. ${it.modelNo} (${it.quantity}x @ ${quoteForm.currencySymbol}${Number(it.unitPrice).toLocaleString('en-IN')})`)
      .join('\n');

    const text = encodeURIComponent(
      `*PRAZTECH® ENGINEERING - COMMERCIAL QUOTATION*\n` +
      `Quotation Ref: *${quoteForm.quoteNumber}*\n` +
      `Customer: ${quoteForm.customerName} ${quoteForm.company ? `(${quoteForm.company})` : ''}\n\n` +
      `*Scheduled Tooling Items:*\n${itemsSummary}\n\n` +
      `*Grand Total: ${quoteForm.currencySymbol}${quoteFinancials.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n` +
      `Payment Terms: ${quoteForm.paymentTerms}\n` +
      `Delivery: ${quoteForm.deliveryTimeline}\n` +
      `Validity: ${quoteForm.validityDays} Days\n\n` +
      `An official commercial quotation PDF has been generated. Please let us know if any adjustments or drawings are required.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleCopyQuoteSummary = async () => {
    const itemsSummary = quoteItems
      .map(
        (it, idx) =>
          `${idx + 1}. [${it.modelNo}] ${it.name} | Qty: ${it.quantity} | Rate: ${quoteForm.currencySymbol}${it.unitPrice} | Total: ${quoteForm.currencySymbol}${it.lineTotal}`
      )
      .join('\n');

    const summary =
      `PRAZTECH ENGINEERING - OFFICIAL COMMERCIAL QUOTATION\n` +
      `Quotation No: ${quoteForm.quoteNumber}\n` +
      `Date: ${formatDateDDMMYY(quoteForm.quoteDate)}\n` +
      `Customer: ${quoteForm.customerName} | Company: ${quoteForm.company || 'N/A'}\n` +
      `Email: ${quoteForm.email} | Phone: ${quoteForm.phone}\n` +
      `----------------------------------------\n` +
      `${itemsSummary}\n` +
      `----------------------------------------\n` +
      `Subtotal: ${quoteForm.currencySymbol}${quoteFinancials.subtotal.toFixed(2)}\n` +
      `Discount: -${quoteForm.currencySymbol}${quoteFinancials.discountTotal.toFixed(2)}\n` +
      `Taxable Value: ${quoteForm.currencySymbol}${quoteFinancials.taxableAmount.toFixed(2)}\n` +
      `Tax / GST: +${quoteForm.currencySymbol}${quoteFinancials.taxTotal.toFixed(2)}\n` +
      `Freight Charges: ${quoteForm.currencySymbol}${quoteFinancials.freightCharges.toFixed(2)}\n` +
      `GRAND TOTAL: ${quoteForm.currencySymbol}${quoteFinancials.grandTotal.toFixed(2)}\n` +
      `Amount in Words: ${amountToWords(quoteFinancials.grandTotal, quoteForm.currency)}\n` +
      `Payment Terms: ${quoteForm.paymentTerms}\n` +
      `Lead Time: ${quoteForm.deliveryTimeline}\n`;

    try {
      await navigator.clipboard.writeText(summary);
      setQuoteCopied(true);
      setTimeout(() => setQuoteCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendQuoteToCustomer = async () => {
    setIsSendingQuote(true);

    const safeCur = quoteForm.currency === 'INR' || quoteForm.currencySymbol === '₹' ? 'Rs. ' : (quoteForm.currencySymbol || '$ ');

    const catalogueItems = quoteItems
      .filter(it => !it.isCustom)
      .map(it => ({
        productId: it.modelNo,
        modelNo: it.modelNo,
        name: it.name,
        category: it.category || 'Precision Tooling',
        selectedSubModel: {
          variant: it.selectedVariant,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          gstRate: it.gstRate,
          lineTotal: it.lineTotal
        },
        quantity: it.quantity,
        notes: `[PRICED: ${safeCur}${it.unitPrice} each, Disc ${it.discountPercent}%, GST ${it.gstRate}%, Line Total ${safeCur}${it.lineTotal}] ${it.notes || ''}`.trim(),
        productSnapshot: {
          ...it,
          currency: quoteForm.currency,
          currencySymbol: safeCur
        }
      }));

    const customItems = quoteItems
      .filter(it => it.isCustom)
      .map(it => ({
        productName: it.name,
        specifications: it.selectedVariant || '',
        quantity: it.quantity,
        intendedApplication: 'Custom Machining / Valve Rebuilding',
        notes: `[PRICED: ${safeCur}${it.unitPrice} each, Line Total ${safeCur}${it.lineTotal}] ${it.notes || ''}`.trim()
      }));

    const generalNotesWithCommercials =
      `OFFICIAL COMMERCIAL QUOTATION: ${quoteForm.quoteNumber}\n` +
      `Grand Total: ${safeCur}${quoteFinancials.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${amountToWords(quoteFinancials.grandTotal, quoteForm.currency)})\n` +
      `Subtotal: ${safeCur}${quoteFinancials.subtotal} | Tax: ${safeCur}${quoteFinancials.taxTotal} | Freight: ${safeCur}${quoteFinancials.freightCharges}\n` +
      `Payment Terms: ${quoteForm.paymentTerms}\n` +
      `Delivery: ${quoteForm.deliveryTimeline}\n` +
      `Validity: ${quoteForm.validityDays} Days\n` +
      (quoteForm.generalNotes ? `Notes: ${quoteForm.generalNotes}` : '');

    const payload = {
      customer: {
        fullName: quoteForm.customerName,
        company: quoteForm.company || '',
        email: quoteForm.email,
        phone: quoteForm.phone,
        whatsapp: quoteForm.whatsapp || quoteForm.phone,
        city: quoteForm.city || 'Delhi',
        state: quoteForm.state || 'Delhi',
        country: quoteForm.country || 'India',
        address: quoteForm.address || 'Direct Commercial Quotation',
        gstin: quoteForm.gstin || ''
      },
      catalogueItems,
      customItems,
      generalNotes: generalNotesWithCommercials,
      status: 'Quotation Dispatched',
      consent: { accepted: true, policyVersion: '1.0' }
    };

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const quoteData = getQuotationDataForExport();
        saveQuotationToHistory(quoteData, 'Dispatched');
        await handleDownloadQuotePDF();
        await loadAllData();

        setActionSuccessMsg(
          `Quotation ${quoteForm.quoteNumber} (Reference: ${json.data?.referenceNumber || ''}) saved to database as "Quotation Dispatched"! Customer notification email dispatched.`
        );

        setActiveTab('quotations');
        setEnquirySearch('');
        setSelectedStatus('all');
      } else {
        alert(json.message || 'Could not dispatch quotation.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to quotation server.');
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleResetQuoteForm = () => {
    if (confirm('Are you sure you want to reset the quotation form? All entered items and prices will be cleared.')) {
      setQuoteForm({
        quoteNumber: generateNewQuoteNumber(),
        quoteDate: new Date().toISOString().split('T')[0],
        validityDays: 30,
        currency: 'INR',
        currencySymbol: '₹',
        selectedCustomerId: '',
        customerName: '',
        company: '',
        email: '',
        phone: '',
        whatsapp: '',
        gstin: '',
        address: '',
        city: '',
        state: '',
        country: '',
        paymentTerms: '50% advance, balance against Proforma Invoice / dispatch',
        deliveryTimeline: 'Ex-stock / Ready for dispatch within 2-3 business days',
        freightTerms: 'Borne by consignee unless explicitly itemized above.',
        warrantyTerms: '12 months manufacturer warranty against casting & grinding defects.',
        freightCharges: 0,
        generalNotes: 'Standard 1-year manufacturer guarantee on tooling precision and metallurgical integrity.',
        bankName: 'HDFC Bank Ltd',
        accountName: 'PRAZTECH ENGINEERING',
        accountNumber: '50200084729103',
        ifscCode: 'HDFC0000123',
        branch: 'Asaf Ali Road, New Delhi'
      });
      setQuoteItems([
        {
          id: `quote-item-${Date.now()}`,
          isCustom: false,
          modelNo: 'PSH-VGKP-H',
          name: 'All in One 9/16" and 11/16" Valve Seat Grinding Kit',
          category: 'Valve Seat Grinding Tools',
          image: '/images/products/psh-vgkp-with-heavy-stand.jpg',
          selectedVariant: 'Standard Heavy-Duty Set (Dual Arbor)',
          notes: 'Includes precision hex drive arbor, diamond wheel dresser, and heavy-duty case',
          quantity: 1,
          unitPrice: 42500,
          discountPercent: 5,
          gstRate: 18,
          lineTotal: 47642.5
        }
      ]);
    }
  };

  const handleStartQuoteForCustomer = (cust: B2BCustomer) => {
    handleCustomerAutoFill(cust._id || cust.id || '');
    handleTabSwitch('create-quote');
  };

  // Clear auto-toast
  useEffect(() => {
    if (actionSuccessMsg) {
      const timer = setTimeout(() => setActionSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccessMsg]);

  // Centralized authenticated fetch helper ensuring HTTP-only cookie and Bearer auth
  const adminFetch = useCallback(async (url: string, init: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(init.headers || {});
    if (adminToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${adminToken}`);
    }
    const res = await fetch(url, {
      ...init,
      credentials: 'include',
      headers
    });
    if (res.status === 401) {
      setIsAuthenticated(false);
      setAdminToken(null);
      try { sessionStorage.removeItem(AUTH_TOKEN_KEY); } catch {}
    }
    return res;
  }, [adminToken]);

  // Load live data from server
  const loadAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Enquiries
      try {
        const enqRes = await adminFetch('/api/enquiries');
        if (enqRes.ok) {
          const enqJson = await enqRes.json();
          if (enqJson.success && Array.isArray(enqJson.data)) {
            setEnquiriesList(enqJson.data);
          }
        } else {
          const localEnqs = await atlasService.getEnquiries();
          setEnquiriesList(localEnqs);
        }
      } catch {
        const localEnqs = await atlasService.getEnquiries();
        setEnquiriesList(localEnqs);
      }

      // 2. Fetch Customers
      try {
        const custRes = await adminFetch('/api/customers');
        if (custRes.ok) {
          const custJson = await custRes.json();
          if (custJson.success && Array.isArray(custJson.data)) {
            setCustomersList(custJson.data);
          }
        } else {
          const localCusts = await atlasService.getCustomers();
          setCustomersList(localCusts);
        }
      } catch {
        const localCusts = await atlasService.getCustomers();
        setCustomersList(localCusts);
      }

      // 3. Fetch Catalogue Products
      try {
        const prodRes = await fetch('/api/products?limit=100');
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          if (prodJson.success && Array.isArray(prodJson.data)) {
            setCatalogueList(prodJson.data);
          }
        }
      } catch {
        // Keeps initialCatalogueData from products.json
      }
    } catch (err) {
      console.warn('Backend fetch notice:', err);
    } finally {
      setLoadingData(false);
    }
  }, [adminFetch]);

  // Verify server-side session on mount
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      try {
        const headers: Record<string, string> = {};
        const storedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers
        });
        if (res.ok) {
          let data: any = {};
      try {
        data = await res.json();
      } catch {
        setErrorMsg(`Authentication server returned status ${res.status}. Please check server deployment.`);
        return;
      }
          if (data.authenticated && isMounted) {
            setIsAuthenticated(true);
          }
        } else if (isMounted) {
          setIsAuthenticated(false);
          try { sessionStorage.removeItem(AUTH_TOKEN_KEY); } catch {}
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    };

    verifySession();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  // Server-side login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMsg('Please enter your administrative access key.');
      return;
    }
    setIsLoggingIn(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: passwordInput })
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        setErrorMsg(`Authentication server returned status ${res.status}. Please check server deployment.`);
        return;
      }
      if (res.ok && data.success) {
        if (data.token) {
          setAdminToken(data.token);
          try { sessionStorage.setItem(AUTH_TOKEN_KEY, data.token); } catch {}
        }
        setIsAuthenticated(true);
        setErrorMsg('');
        setPasswordInput('');
        loadAllData();
      } else {
        setErrorMsg(data.message || 'Invalid administrative credentials.');
        setPasswordInput('');
      }
    } catch {
      setErrorMsg('Authentication server unreachable. Please verify server connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Server-side logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {}
    setIsAuthenticated(false);
    setAdminToken(null);
    try { sessionStorage.removeItem(AUTH_TOKEN_KEY); } catch {}
    setPasswordInput('');
    setErrorMsg('');
  };

  // WhatsApp & Email URL Generators
  const getWhatsAppUrl = (phone: string, name: string, reference?: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = reference
      ? `Hello ${name}, this is PRAZTECH® Engineering regarding your tooling quotation enquiry ${reference}.`
      : `Hello ${name}, this is PRAZTECH® Engineering regarding your workshop tooling enquiry.`;
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
  };

  const getEmailUrl = (email: string, name: string, reference?: string) => {
    const subject = reference
      ? `PRAZTECH® Engineering - Quotation Enquiry ${reference}`
      : `PRAZTECH® Engineering - Precision Engine Tooling Enquiry`;
    const body = `Dear ${name},\n\nThank you for reaching out to PRAZTECH® Engineering regarding your engine rebuilding tooling requirements.\n\nBest regards,\nPRAZTECH® Sales Engineering Team\nAsaf Ali Rd, Delhi, 110002\nWhatsApp: +91 8744020102`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Multi-select for Enquiries
  const toggleSelectEnquiry = (ref: string) => {
    setSelectedEnquiryIds(prev => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const selectAllFilteredEnquiries = () => {
    if (selectedEnquiryIds.size === filteredEnquiries.length && filteredEnquiries.length > 0) {
      setSelectedEnquiryIds(new Set());
    } else {
      setSelectedEnquiryIds(new Set(filteredEnquiries.map(e => e.referenceNumber)));
    }
  };

  // Multi-select for Customers
  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFilteredCustomers = () => {
    if (selectedCustomerIds.size === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(filteredCustomers.map(c => c._id || c.email)));
    }
  };

  // Live counts per status category
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: enquiriesList.length,
      'Review Pending': 0,
      'Quotation Dispatched': 0,
      'Blueprint Review': 0,
      'Order Confirmed': 0,
      'Closed': 0
    };
    enquiriesList.forEach(e => {
      const norm = normalizeStatus(e.status);
      if (counts[norm] !== undefined) {
        counts[norm] += 1;
      }
    });
    return counts;
  }, [enquiriesList]);

  // Filtered Enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiriesList.filter(enq => {
      const q = enquirySearch.toLowerCase().trim();
      const c = enq.customerSnapshot || {};
      
      const matchQ =
        !q ||
        (enq.referenceNumber || '').toLowerCase().includes(q) ||
        (c.fullName || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.whatsapp || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.state || '').toLowerCase().includes(q) ||
        (c.country || '').toLowerCase().includes(q) ||
        (enq.generalNotes || '').toLowerCase().includes(q) ||
        (enq.catalogueItems && enq.catalogueItems.some(it =>
          (it.modelNo && it.modelNo.toLowerCase().includes(q)) ||
          (it.name && it.name.toLowerCase().includes(q)) ||
          (it.category && it.category.toLowerCase().includes(q)) ||
          (it.notes && it.notes.toLowerCase().includes(q))
        )) ||
        (enq.customItems && enq.customItems.some((cit: any) =>
          (cit.productName && cit.productName.toLowerCase().includes(q)) ||
          (cit.specifications && cit.specifications.toLowerCase().includes(q)) ||
          (cit.notes && cit.notes.toLowerCase().includes(q))
        ));

      const norm = normalizeStatus(enq.status);
      const matchStatus =
        selectedStatus === 'all' ||
        norm === selectedStatus ||
        enq.status === selectedStatus;

      return matchQ && matchStatus;
    });
  }, [enquiriesList, enquirySearch, selectedStatus]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    // If customersList from API is empty, deduce unique customers from enquiries
    let list = [...customersList];
    if (list.length === 0 && enquiriesList.length > 0) {
      const deducedMap: Record<string, B2BCustomer> = {};
      enquiriesList.forEach(e => {
        const c = e.customerSnapshot;
        if (!c || !c.email) return;
        const key = c.email.toLowerCase().trim();
        if (!deducedMap[key]) {
          deducedMap[key] = {
            id: key,
            fullName: c.fullName || 'Client',
            company: c.company || 'Workshop / Machine Shop',
            email: c.email,
            phone: c.phone || 'N/A',
            whatsapp: c.whatsapp || c.phone || '',
            city: c.city || 'Delhi',
            state: c.state || '',
            country: c.country || 'India',
            address: c.address || '',
            gstin: c.gstin || '',
            enquiryCount: 1,
            enquiryIds: [e.referenceNumber],
            createdAt: e.submittedAt
          };
        } else {
          deducedMap[key].enquiryCount = (deducedMap[key].enquiryCount || 0) + 1;
          if (deducedMap[key].enquiryIds && !deducedMap[key].enquiryIds!.includes(e.referenceNumber)) {
            deducedMap[key].enquiryIds!.push(e.referenceNumber);
          }
        }
      });
      list = Object.values(deducedMap);
    }

    return list.filter(c => {
      const q = dirSearch.toLowerCase().trim();
      return (
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    });
  }, [customersList, enquiriesList, dirSearch]);

  // Filtered Catalogue
  const filteredCatalogue = useMemo(() => {
    return catalogueList.filter(p => {
      const q = catSearch.toLowerCase().trim();
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.modelNo.toLowerCase().includes(q);
      const matchCat = catCategoryFilter === 'all' || p.category === catCategoryFilter;
      return matchQ && matchCat;
    });
  }, [catalogueList, catSearch, catCategoryFilter]);

  // EXCEL EXPORT HANDLERS
  const exportSelectedEnquiriesToExcel = (enquiriesToExport = filteredEnquiries) => {
    const list = selectedEnquiryIds.size > 0
      ? enquiriesList.filter(e => selectedEnquiryIds.has(e.referenceNumber))
      : enquiriesToExport;

    if (list.length === 0) {
      alert('No enquiries available to export.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryRows = list.map((e, idx) => ({
      'Sl. No': idx + 1,
      'Reference ID': e.referenceNumber,
      'Date Submitted': formatDateDDMMYY(e.submittedAt),
      'Status': e.status,
      'Customer Name': e.customerSnapshot?.fullName || 'N/A',
      'Company': e.customerSnapshot?.company || 'N/A',
      'Email': e.customerSnapshot?.email || 'N/A',
      'Phone': e.customerSnapshot?.phone || 'N/A',
      'WhatsApp': e.customerSnapshot?.whatsapp || e.customerSnapshot?.phone || 'N/A',
      'City': e.customerSnapshot?.city || 'N/A',
      'State': e.customerSnapshot?.state || 'N/A',
      'Country': e.customerSnapshot?.country || 'N/A',
      'Total Line Items': e.catalogueItems?.length || 0,
      'General Notes': e.generalNotes || 'None'
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Enquiries');

    // Sheet 2: Itemized Tooling Lines
    const itemRows: any[] = [];
    list.forEach(e => {
      (e.catalogueItems || []).forEach((it, iIdx) => {
        itemRows.push({
          'Enquiry Ref': e.referenceNumber,
          'Item #': iIdx + 1,
          'Model No (SKU)': it.modelNo,
          'Product Name': it.name,
          'Category': it.category,
          'Quantity': it.quantity,
          'Specifications / Grits': it.notes || JSON.stringify(it.selectedSubModel || ''),
          'Customer': e.customerSnapshot?.fullName || 'N/A',
          'Company': e.customerSnapshot?.company || 'N/A'
        });
      });
    });
    const wsItems = XLSX.utils.json_to_sheet(itemRows);
    XLSX.utils.book_append_sheet(wb, wsItems, 'Quotation Line Items');

    XLSX.writeFile(wb, `PRAZTECH_Enquiries_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setActionSuccessMsg(`Exported ${list.length} enquiries to Excel successfully.`);
  };

  const exportSelectedCustomersToExcel = (customersToExport = filteredCustomers) => {
    const list = selectedCustomerIds.size > 0
      ? filteredCustomers.filter(c => selectedCustomerIds.has(c._id || c.email))
      : customersToExport;

    if (list.length === 0) {
      alert('No customers available to export.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const rows = list.map((c, idx) => ({
      'Sl. No': idx + 1,
      'Full Name': c.fullName,
      'Company Name': c.company || 'N/A',
      'Email Address': c.email,
      'Phone Number': c.phone,
      'WhatsApp': c.whatsapp || c.phone,
      'City': c.city,
      'State': c.state,
      'Country': c.country,
      'Workshop Address': c.address || 'N/A',
      'GSTIN / Tax ID': c.gstin || 'N/A',
      'Enquiries Submitted': c.enquiryCount || 0,
      'Enquiry Reference Numbers': (c.enquiryIds || []).join(', ')
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Customers Directory');
    XLSX.writeFile(wb, `PRAZTECH_Customers_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setActionSuccessMsg(`Exported ${list.length} customers to Excel successfully.`);
  };

  // BULK QUERY DOWNLOAD (JSON/Data Package)
  const downloadSelectedQueriesData = () => {
    const list = selectedEnquiryIds.size > 0
      ? enquiriesList.filter(e => selectedEnquiryIds.has(e.referenceNumber))
      : filteredEnquiries;

    if (list.length === 0) {
      alert('No enquiries selected for bulk query download.');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(list, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PRAZTECH_Bulk_Enquiries_${list.length}_Records.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setActionSuccessMsg(`Downloaded bulk package with ${list.length} enquiries.`);
  };

  // ENQUIRY CRUD HANDLERS
  const handleUpdateEnquiryStatus = async (reference: string, newStatus: EnquiryStatus) => {
    try {
      const res = await adminFetch(`/api/enquiries/${reference}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setEnquiriesList(prev => prev.map(e => e.referenceNumber === reference ? { ...e, status: newStatus } : e));
        if (inspectingEnquiry && inspectingEnquiry.referenceNumber === reference) {
          setInspectingEnquiry(prev => prev ? { ...prev, status: newStatus } : null);
        }
        setActionSuccessMsg(`Enquiry ${reference} updated to "${newStatus}".`);
      }
    } catch (err) {
      console.error(err);
      alert('Could not update enquiry status.');
    }
  };

  const handleDeleteEnquiry = async (reference: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete enquiry ${reference}?`)) return;
    try {
      const res = await adminFetch(`/api/enquiries/${reference}`, { method: 'DELETE' });
      if (res.ok) {
        setEnquiriesList(prev => prev.filter(e => e.referenceNumber !== reference));
        setSelectedEnquiryIds(prev => {
          const next = new Set(prev);
          next.delete(reference);
          return next;
        });
        if (inspectingEnquiry?.referenceNumber === reference) setInspectingEnquiry(null);
        setActionSuccessMsg(`Enquiry ${reference} deleted successfully.`);
      }
    } catch (err) {
      console.error(err);
      alert('Could not delete enquiry.');
    }
  };

  const handleSaveEditedEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnquiry) return;
    try {
      const res = await adminFetch(`/api/enquiries/${editingEnquiry.referenceNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingEnquiry.status,
          generalNotes: editingEnquiry.generalNotes,
          catalogueItems: editingEnquiry.catalogueItems
        })
      });
      if (res.ok) {
        setEnquiriesList(prev => prev.map(item => item.referenceNumber === editingEnquiry.referenceNumber ? editingEnquiry : item));
        setEditingEnquiry(null);
        setActionSuccessMsg(`Enquiry ${editingEnquiry.referenceNumber} saved successfully.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save enquiry changes.');
    }
  };

  // CUSTOMER CRUD HANDLERS
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustomerForm.fullName || !manualCustomerForm.email || !manualCustomerForm.phone) {
      alert('Full name, email, and phone are required.');
      return;
    }
    try {
      let savedCust = null;
      try {
        const res = await adminFetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(manualCustomerForm)
        });
        const json = await res.json();
        if (res.ok && json.success) savedCust = json.data;
      } catch {
        // Fallback
      }

      if (!savedCust) {
        savedCust = await atlasService.saveCustomer(manualCustomerForm);
      }

      setCustomersList(prev => [savedCust, ...prev]);
      setIsAddingCustomer(false);
      setManualCustomerForm({
        fullName: '',
        company: '',
        email: '',
        phone: '',
        whatsapp: '',
        country: 'India',
        state: '',
        city: '',
        address: '',
        gstin: ''
      });
      setActionSuccessMsg(`Customer "${savedCust.fullName}" added successfully.`);
    } catch (err) {
      console.error(err);
      alert('Failed to add customer profile.');
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer._id) return;
    try {
      const res = await adminFetch(`/api/customers/${editingCustomer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCustomer)
      });
      if (res.ok) {
        setCustomersList(prev => prev.map(c => c._id === editingCustomer._id ? editingCustomer : c));
        setEditingCustomer(null);
        setActionSuccessMsg(`Customer "${editingCustomer.fullName}" updated successfully.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save customer changes.');
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    try {
      const res = await adminFetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomersList(prev => prev.filter(c => c._id !== id));
        setSelectedCustomerIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setActionSuccessMsg(`Customer "${name}" deleted.`);
      }
    } catch (err) {
      console.error(err);
      alert('Could not delete customer.');
    }
  };

  // MANUAL ENQUIRY SUBMISSION
  const handleAddItemToEnquiry = () => {
    const defaultSlug = catalogueList[0]?.slug || 'psh-vgkp-with-heavy-stand';
    setManualEnquiryForm(prev => ({
      ...prev,
      items: [...prev.items, { productSlug: defaultSlug, quantity: 1, notes: '' }]
    }));
  };

  const handleRemoveItemFromEnquiry = (index: number) => {
    if (manualEnquiryForm.items.length <= 1) return;
    setManualEnquiryForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemFieldChange = (index: number, field: 'productSlug' | 'quantity' | 'notes', val: any) => {
    setManualEnquiryForm(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, items: updated };
    });
  };

  const handleCreateManualEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEnquiryForm.items || manualEnquiryForm.items.length === 0) {
      alert('Please add at least one product to the enquiry.');
      return;
    }

    setIsSubmittingEnquiry(true);

    const catalogueItems = manualEnquiryForm.items.map(it => {
      const product = catalogueList.find(p => p.slug === it.productSlug) || catalogueList[0];
      return {
        productId: product?.id || product?.slug || 'PRZ-ITEM',
        modelNo: product?.modelNo || 'CUSTOM',
        name: product?.name || 'Catalogue Product',
        category: product?.category || 'Valve Seat Grinding',
        quantity: Math.max(1, Number(it.quantity) || 1),
        notes: it.notes || ''
      };
    });

    const payload = {
      customer: {
        fullName: manualEnquiryForm.customerName,
        company: manualEnquiryForm.company,
        email: manualEnquiryForm.email,
        phone: manualEnquiryForm.phone,
        whatsapp: manualEnquiryForm.whatsapp || manualEnquiryForm.phone,
        city: manualEnquiryForm.city || 'Delhi',
        state: manualEnquiryForm.state || 'Delhi',
        country: manualEnquiryForm.country || 'India',
        address: 'Direct Quotation Entry'
      },
      catalogueItems,
      generalNotes: manualEnquiryForm.generalNotes,
      consent: { accepted: true, policyVersion: '1.0' }
    };

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        // 1. Immediately close the popup modal
        setIsAddingEnquiry(false);

        // 2. Clear out manual enquiry form
        setManualEnquiryForm({
          customerName: '',
          company: '',
          email: '',
          phone: '',
          whatsapp: '',
          city: '',
          state: '',
          country: 'India',
          items: [{ productSlug: catalogueList[0]?.slug || 'psh-vgkp-with-heavy-stand', quantity: 1, notes: '' }],
          generalNotes: ''
        });

        // 3. Switch to quotations tab and clear search filter so it is directly visible
        setActiveTab('quotations');
        setEnquirySearch('');
        setSelectedStatus('all');

        // 4. Show success banner
        setActionSuccessMsg(`Enquiry ${json.data.referenceNumber} created successfully! Dashboard refreshed.`);

        // 5. Refresh live data from MongoDB Atlas
        await loadAllData();
      } else {
        alert(json.message || 'Could not create manual enquiry.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating enquiry.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  // NEW PRODUCT LISTING SUBMISSION
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewListingImageFile(file);
      setNewListingImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateNewProductListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListingForm.modelNo || !newListingForm.name || !newListingForm.category) {
      alert('Model No (SKU), Name, and Category are required.');
      return;
    }

    setIsSubmittingListing(true);
    let uploadedImageUrl = '/images/products/psh-vgkp-with-heavy-stand.jpg';

    try {
      // 1. Process image: Convert to Base64 for zero-cloud client/Atlas storage
      if (newListingImageFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('/images/products/psh-vgkp-with-heavy-stand.jpg');
          reader.readAsDataURL(newListingImageFile);
        });
        uploadedImageUrl = await base64Promise;

        // Also attempt upload if local server dev mode is active
        try {
          const formData = new FormData();
          formData.append('image', newListingImageFile);
          const uploadRes = await adminFetch('/api/products/upload-image', {
            method: 'POST',
            body: formData
          });
          const uploadJson = await uploadRes.json();
          if (uploadRes.ok && uploadJson.success && uploadJson.url) {
            uploadedImageUrl = uploadJson.url;
          }
        } catch {
          // Keep Base64 for GitHub Pages direct deployment
        }
      }

      // 2. Submit product listing
      const slug = newListingForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;
      
      const normalizedSubModels = (newListingForm.subModels || []).map((sm: any, idx: number) => {
        const options: Record<string, string> = { ...(sm.options || {}) };
        const activeDimensions = newListingForm.variantOptionNames || ['Size'];
        
        activeDimensions.forEach(dim => {
          if (!options[dim] && sm[dim.toLowerCase()]) {
            options[dim] = sm[dim.toLowerCase()];
          }
        });

        const optionValues = activeDimensions
          .map(dim => options[dim]?.trim() || '')
          .filter(Boolean);

        const sizeVal = options['Size'] || options['size'] || sm.sizeMm || sm.size || '';
        const colorVal = options['Color'] || options['color'] || sm.color || sm.stoneColor || '';
        const weightVal = options['Weight'] || options['weight'] || '';
        const specVal = options['Specification'] || options['Grit'] || options['Material'] || sm.specification || '';
        
        // Priority: always format from actual active option values
        const label = optionValues.length > 0
          ? optionValues.join(' • ')
          : (sm.modelNo || sizeVal || `Variant #${idx + 1}`);

        return {
          modelNo: sm.modelNo?.trim() || `${newListingForm.modelNo}-${idx + 1}`,
          sizeMm: sizeVal,
          size: sizeVal,
          color: colorVal,
          weight: weightVal,
          stoneColor: colorVal,
          specification: specVal,
          notes: sm.notes || '',
          options,
          label
        };
      });

      const payload: any = {
        ...newListingForm,
        slug,
        subModels: normalizedSubModels,
        images: [uploadedImageUrl]
      };

      try {
        const res = await adminFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok && json.success) {
          payload.id = json.data.id || json.data._id || slug;
        }
      } catch {
        payload.id = slug;
      }

      setCatalogueList(prev => [payload, ...prev]);
      setActionSuccessMsg(`Product listing "${payload.modelNo}" created with ${normalizedSubModels.length} variants and published successfully!`);
      setActiveTab('catalogue');
      setNewListingImageFile(null);
      setNewListingImagePreview('');
      setNewListingForm({
        modelNo: '',
        name: '',
        category: 'Valve Seat Grinding Tools',
        cataloguePage: 42,
        tag: 'standard',
        description: '',
        compatibility: '',
        keyFeatures: ['Precision ground to DIN industrial standard tolerances', 'High wear resistance formulation'],
        applications: ['Internal combustion engine cylinder head rebuilding'],
        setIncludes: ['Primary tool unit and heavy-duty storage case'],
        variantOptionNames: ['Weight', 'Size'],
        subModels: [
          {
            modelNo: '',
            options: { Weight: '', Size: '' },
            notes: ''
          }
        ]
      });
      setMatrixOptionInputs({ Weight: '', Size: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to publish product listing.');
    } finally {
      setIsSubmittingListing(false);
    }
  };

  // Helper functions for dynamic variant options
  const handleAddOptionDimension = (dimensionName: string) => {
    const trimmed = dimensionName.trim();
    if (!trimmed) return;
    if (newListingForm.variantOptionNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Option dimension "${trimmed}" is already added.`);
      return;
    }
    const updatedNames = [...newListingForm.variantOptionNames, trimmed];
    const updatedSubModels = newListingForm.subModels.map(sm => ({
      ...sm,
      options: { ...(sm.options || {}), [trimmed]: '' }
    }));
    setNewListingForm(prev => ({
      ...prev,
      variantOptionNames: updatedNames,
      subModels: updatedSubModels
    }));
    setMatrixOptionInputs(prev => ({ ...prev, [trimmed]: '' }));
    setNewCustomOptionName('');
  };

  const handleRemoveOptionDimension = (index: number) => {
    if (newListingForm.variantOptionNames.length <= 1) {
      alert('At least one configuration option must remain.');
      return;
    }
    const dimNameToRemove = newListingForm.variantOptionNames[index];
    const updatedNames = newListingForm.variantOptionNames.filter((_, i) => i !== index);
    const updatedSubModels = newListingForm.subModels.map(sm => {
      const copy = { ...(sm.options || {}) };
      delete copy[dimNameToRemove];
      return { ...sm, options: copy };
    });
    setNewListingForm(prev => ({
      ...prev,
      variantOptionNames: updatedNames,
      subModels: updatedSubModels
    }));
  };

  const handleRenameOptionDimension = (index: number, newName: string) => {
    const oldName = newListingForm.variantOptionNames[index];
    const updatedNames = [...newListingForm.variantOptionNames];
    updatedNames[index] = newName;

    const updatedSubModels = newListingForm.subModels.map(sm => {
      const copy = { ...(sm.options || {}) };
      if (oldName && oldName in copy) {
        copy[newName] = copy[oldName];
        if (oldName !== newName) {
          delete copy[oldName];
        }
      }
      return { ...sm, options: copy };
    });

    setNewListingForm(prev => ({
      ...prev,
      variantOptionNames: updatedNames,
      subModels: updatedSubModels
    }));

    setMatrixOptionInputs(prev => {
      const copy = { ...prev };
      if (oldName in copy) {
        copy[newName] = copy[oldName];
        if (oldName !== newName) delete copy[oldName];
      }
      return copy;
    });
  };

  const handleAddVariantRow = () => {
    const initialOptions: Record<string, string> = {};
    newListingForm.variantOptionNames.forEach(name => {
      initialOptions[name] = '';
    });
    setNewListingForm(prev => ({
      ...prev,
      subModels: [
        ...prev.subModels,
        {
          modelNo: '',
          options: initialOptions,
          specification: '',
          notes: ''
        }
      ]
    }));
  };

  const handleGenerateMatrix = () => {
    const activeNames = newListingForm.variantOptionNames;
    const optionArrays: { name: string; values: string[] }[] = activeNames.map(name => {
      const raw = matrixOptionInputs[name] || '';
      const vals = raw.split(',').map(s => s.trim()).filter(Boolean);
      return { name, values: vals.length > 0 ? vals : ['Standard'] };
    });

    let combinations: Record<string, string>[] = [{}];
    for (const opt of optionArrays) {
      const nextCombos: Record<string, string>[] = [];
      for (const current of combinations) {
        for (const val of opt.values) {
          nextCombos.push({ ...current, [opt.name]: val });
        }
      }
      combinations = nextCombos;
    }

    const generatedSubModels = combinations.map((combo, idx) => {
      const activeNames = newListingForm.variantOptionNames;
      const sizeVal = combo['Size'] || combo['size'] || '';
      const hasColor = activeNames.some(d => d.toLowerCase().includes('color') || d.toLowerCase().includes('finish'));
      const colorVal = hasColor ? (combo['Color'] || combo['color'] || '') : '';
      const weightVal = combo['Weight'] || combo['weight'] || '';
      const label = activeNames.map(n => combo[n]?.trim() || '').filter(Boolean).join(' • ');
      return {
        modelNo: newListingForm.modelNo ? `${newListingForm.modelNo}-${idx + 1}` : '',
        options: combo,
        sizeMm: sizeVal,
        size: sizeVal,
        color: colorVal,
        weight: weightVal,
        stoneColor: colorVal,
        specification: 'Standard Specification',
        notes: 'Factory standard stock',
        label
      };
    });

    setNewListingForm(prev => ({
      ...prev,
      subModels: generatedSubModels
    }));
    setShowMatrixHelper(false);
    setActionSuccessMsg(`Generated ${generatedSubModels.length} variant combinations!`);
  };

  const handleDeleteProduct = async (slug: string, modelNo: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete catalogue listing "${modelNo}"?`)) return;
    try {
      const res = await adminFetch(`/api/products/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        setCatalogueList(prev => prev.filter(p => p.slug !== slug));
        setActionSuccessMsg(`Product "${modelNo}" deleted from catalogue.`);
      }
    } catch (err) {
      console.error(err);
      alert('Could not delete product.');
    }
  };

  // Render executive login / checking screen
  if (!isAuthenticated || isAuthChecking) {
    return (
      <ExecutiveAuthGate
        isAuthChecking={isAuthChecking}
        isLoggingIn={isLoggingIn}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        errorMsg={errorMsg}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="executive-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#2e075d] text-white border border-[#5e3e8b] px-4 py-3 rounded-lg shadow-xl text-xs flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top Header Actions Strip */}
      <ExecutiveHeader
        loadingData={loadingData}
        onSync={loadAllData}
        onExportExcel={() => exportSelectedEnquiriesToExcel(enquiriesList)}
        onLogout={handleLogout}
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#dfd5e8] p-5 shadow-xs">
          <div className="text-2xl sm:text-3xl font-medium text-[#2e075d] font-mono tabular-nums">
            {enquiriesList.length}
          </div>
          <div className="text-xs text-[#6e568b] mt-1">Live Enquiries Logged</div>
        </div>

        <div className="bg-white rounded-xl border border-[#dfd5e8] p-5 shadow-xs">
          <div className="text-2xl sm:text-3xl font-medium text-[#2e075d] font-mono tabular-nums">
            {filteredCustomers.length}
          </div>
          <div className="text-xs text-[#6e568b] mt-1">Active Client Profiles</div>
        </div>

        <div className="bg-white rounded-xl border border-[#dfd5e8] p-5 shadow-xs">
          <div className="text-2xl sm:text-3xl font-medium text-[#2e075d] font-mono tabular-nums">
            {enquiriesList.filter(e => normalizeStatus(e.status) === 'Quotation Dispatched').length}
          </div>
          <div className="text-xs text-[#6e568b] mt-1">Quotations Dispatched</div>
        </div>

        <div className="bg-white rounded-xl border border-[#dfd5e8] p-5 shadow-xs">
          <div className="text-2xl sm:text-3xl font-medium text-[#2e075d] font-mono tabular-nums">
            {catalogueList.length}
          </div>
          <div className="text-xs text-[#6e568b] mt-1">Catalogue Products</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-xl border border-[#dfd5e8] overflow-hidden shadow-xs">
        <div className="flex flex-wrap border-b border-[#dfd5e8] bg-[#f7f5fa]">
          <button
            onClick={() => handleTabSwitch('quotations')}
            className={`px-5 py-3.5 text-xs font-medium inline-flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'quotations'
                ? 'border-[#5e3e8b] text-[#2e075d] bg-white font-semibold'
                : 'border-transparent text-[#6e568b] hover:text-[#2e075d]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Quotations & RFQs</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#efe7f7] text-[#5e3e8b]">
              {enquiriesList.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('create-quote')}
            className={`px-5 py-3.5 text-xs font-medium inline-flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'create-quote'
                ? 'border-[#5e3e8b] text-[#2e075d] bg-white font-semibold'
                : 'border-transparent text-[#6e568b] hover:text-[#2e075d]'
            }`}
          >
            <Calculator className="w-4 h-4 text-[#5e3e8b]" />
            <span>Quote Maker</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#efe7f7] text-[#5e3e8b] font-bold">
              {quoteItems.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('directory')}
            className={`px-5 py-3.5 text-xs font-medium inline-flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'directory'
                ? 'border-[#5e3e8b] text-[#2e075d] bg-white'
                : 'border-transparent text-[#6e568b] hover:text-[#2e075d]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Directory</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#efe7f7] text-[#5e3e8b]">
              {filteredCustomers.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('catalogue')}
            className={`px-5 py-3.5 text-xs font-medium inline-flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'catalogue'
                ? 'border-[#5e3e8b] text-[#2e075d] bg-white'
                : 'border-transparent text-[#6e568b] hover:text-[#2e075d]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Catalogue Index</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#efe7f7] text-[#5e3e8b]">
              {catalogueList.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('product-showcase')}
            className={`px-5 py-3.5 text-xs font-medium inline-flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'product-showcase'
                ? 'border-[#5e3e8b] text-[#2e075d] bg-white font-semibold'
                : 'border-transparent text-[#6e568b] hover:text-[#2e075d]'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#5e3e8b]" />
            <span>Product Showcase Generator</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-[#efe7f7] text-[#5e3e8b] font-bold">
              Image
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('new-listing')}
            className={`px-5 py-3.5 text-xs font-medium inline-flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ml-auto ${
              activeTab === 'new-listing'
                ? 'border-[#5e3e8b] text-white bg-[#5e3e8b]'
                : 'border-transparent text-[#5e3e8b] hover:bg-[#efe7f7]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product Listing</span>
          </button>
        </div>

        {/* ── TAB 1: QUOTATIONS & ENQUIRIES ── */}
        {activeTab === 'quotations' && (
          <div className="p-6 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#9080a5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={enquirySearch}
                  onChange={e => setEnquirySearch(e.target.value)}
                  placeholder="Search by ref number, customer, phone, company, tool SKU..."
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none bg-white"
                />
                {enquirySearch && (
                  <button
                    type="button"
                    onClick={() => setEnquirySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9080a5] hover:text-[#2e075d] p-0.5 cursor-pointer"
                    title="Clear search text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="text-xs px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white text-[#2e075d] focus:outline-none focus:border-[#5e3e8b] font-medium cursor-pointer"
                >
                  <option value="all">All Statuses ({statusCounts.all || 0})</option>
                  <option value="Review Pending">Review Pending ({statusCounts['Review Pending'] || 0})</option>
                  <option value="Quotation Dispatched">Quotation Dispatched ({statusCounts['Quotation Dispatched'] || 0})</option>
                  <option value="Blueprint Review">Blueprint Review ({statusCounts['Blueprint Review'] || 0})</option>
                  <option value="Order Confirmed">Order Confirmed ({statusCounts['Order Confirmed'] || 0})</option>
                  <option value="Closed">Closed ({statusCounts['Closed'] || 0})</option>
                </select>

                <button
                  onClick={() => handleTabSwitch('create-quote')}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#2e075d] hover:bg-[#431477] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  title="Create a formal commercial quotation with prices"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Make Commercial Quote</span>
                </button>

                <button
                  onClick={() => setIsAddingEnquiry(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manual Enquiry</span>
                </button>
              </div>
            </div>

            {/* Active Filter Indicator */}
            {(enquirySearch || selectedStatus !== 'all') && (
              <div className="flex items-center justify-between text-xs bg-[#f8f6fb] px-3.5 py-2 rounded-lg border border-[#dfd5e8]">
                <div className="flex items-center space-x-2 text-[#5e3e8b]">
                  <Filter className="w-3.5 h-3.5" />
                  <span>
                    Showing {filteredEnquiries.length} of {enquiriesList.length} enquiries
                    {selectedStatus !== 'all' && ` • Status: "${selectedStatus}"`}
                    {enquirySearch && ` • Matching: "${enquirySearch}"`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEnquirySearch('');
                    setSelectedStatus('all');
                  }}
                  className="text-xs text-[#5e3e8b] hover:text-[#2e075d] font-semibold underline cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Batch Selection Banner */}
            {filteredEnquiries.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#efe7f7] border border-[#dfd5e8] text-xs">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={selectAllFilteredEnquiries}
                    className="flex items-center space-x-1.5 font-medium text-[#2e075d] hover:text-[#5e3e8b] cursor-pointer"
                  >
                    {selectedEnquiryIds.size === filteredEnquiries.length && filteredEnquiries.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#5e3e8b]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#9080a5]" />
                    )}
                    <span>
                      {selectedEnquiryIds.size > 0
                        ? `${selectedEnquiryIds.size} of ${filteredEnquiries.length} selected`
                        : `Select All (${filteredEnquiries.length})`}
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => exportSelectedEnquiriesToExcel()}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-white border border-[#dfd5e8] hover:bg-white text-emerald-800 text-xs font-medium shadow-2xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export {selectedEnquiryIds.size > 0 ? 'Selected' : 'All'} to Excel</span>
                  </button>

                  <button
                    onClick={downloadSelectedQueriesData}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-white border border-[#dfd5e8] hover:bg-white text-[#2e075d] text-xs font-medium shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#5e3e8b]" />
                    <span>Download Bulk Package</span>
                  </button>
                </div>
              </div>
            )}

            {/* Enquiries List */}
            {filteredEnquiries.length === 0 ? (
              <div className="text-center py-16 text-[#9080a5] text-xs space-y-3">
                {loadingData ? (
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#5e3e8b]" />
                    <span>Querying MongoDB Atlas collections...</span>
                  </div>
                ) : enquiriesList.length === 0 ? (
                  <>
                    <p className="font-medium text-[#2e075d]">No quotation enquiries in the database.</p>
                    <p>Customer submissions from `/enquiry`, `/custom-enquiry`, or `/contact` will appear here automatically.</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-[#2e075d]">No quotation enquiries match your filter.</p>
                    <p>There are {enquiriesList.length} enquiries in the database, but none match your search or status selection.</p>
                    <button
                      onClick={() => {
                        setEnquirySearch('');
                        setSelectedStatus('all');
                      }}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#efe7f7] text-[#2e075d] hover:bg-[#dfd5e8] font-medium text-xs cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Clear All Filters</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEnquiries.map(enq => {
                  const isSelected = selectedEnquiryIds.has(enq.referenceNumber);
                  const cust = enq.customerSnapshot || {};
                  return (
                    <div
                      key={enq.referenceNumber}
                      className={`bg-white rounded-xl border transition-colors overflow-hidden ${
                        isSelected ? 'border-[#5e3e8b] ring-1 ring-[#5e3e8b]/40' : 'border-[#dfd5e8] hover:border-[#cfc6d8]'
                      }`}
                    >
                      {/* Header */}
                      <div className="px-5 py-3 bg-[#f7f5fa] border-b border-[#dfd5e8] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleSelectEnquiry(enq.referenceNumber)}
                            className="text-[#5e3e8b] cursor-pointer"
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#9080a5]" />}
                          </button>
                          <span className="font-mono font-medium text-xs text-[#2e075d] bg-white px-2.5 py-0.5 rounded border border-[#dfd5e8]">
                            {enq.referenceNumber}
                          </span>
                          <span className="text-[11px] text-[#9080a5] flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDateDDMMYY(enq.submittedAt)}</span>
                          </span>
                        </div>

                        {/* Status selector & Actions */}
                        <div className="flex items-center space-x-2">
                          <select
                            value={normalizeStatus(enq.status)}
                            onChange={e => handleUpdateEnquiryStatus(enq.referenceNumber, e.target.value as EnquiryStatus)}
                            className={`text-xs font-medium px-2.5 py-1 rounded border cursor-pointer focus:outline-none ${STATUS_STYLES[normalizeStatus(enq.status)] || 'bg-gray-100'}`}
                          >
                            <option value="Review Pending">Review Pending</option>
                            <option value="Quotation Dispatched">Quotation Dispatched</option>
                            <option value="Blueprint Review">Blueprint Review</option>
                            <option value="Order Confirmed">Order Confirmed</option>
                            <option value="Closed">Closed</option>
                          </select>

                          <button
                            onClick={() => setInspectingEnquiry(enq)}
                            className="p-1.5 text-[#6e568b] hover:text-[#2e075d] hover:bg-[#efe7f7] rounded cursor-pointer"
                            title="Inspect enquiry items"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditingEnquiry(enq)}
                            className="p-1.5 text-[#6e568b] hover:text-[#2e075d] hover:bg-[#efe7f7] rounded cursor-pointer"
                            title="Edit enquiry"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteEnquiry(enq.referenceNumber)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete enquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                        {/* Customer Column */}
                        <div className="md:col-span-4 space-y-2.5 border-b md:border-b-0 md:border-r border-[#dfd5e8] pb-4 md:pb-0 md:pr-4">
                          <div>
                            <div className="font-medium text-sm text-[#2e075d]">{cust.fullName || 'Client'}</div>
                            <div className="text-[#6e568b]">{cust.company || 'Workshop / Machine Shop'}</div>
                          </div>

                          <div className="space-y-1 text-[#6e568b]">
                            <div className="flex items-center space-x-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#9080a5]" />
                              <span>{[cust.city, cust.state, cust.country].filter(Boolean).join(', ')}</span>
                            </div>
                            {cust.gstin && (
                              <div className="font-mono text-[11px] text-[#9080a5]">GST: {cust.gstin}</div>
                            )}
                          </div>

                          {/* Quick Communication Buttons */}
                          <div className="pt-2 flex flex-wrap gap-2">
                            {cust.phone && (
                              <a
                                href={getWhatsAppUrl(cust.whatsapp || cust.phone, cust.fullName, enq.referenceNumber)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors font-medium text-[11px]"
                                title="Chat on WhatsApp with enquiry greeting"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>
                            )}

                            {cust.email && (
                              <a
                                href={getEmailUrl(cust.email, cust.fullName, enq.referenceNumber)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#efe7f7] text-[#5e3e8b] border border-[#dfd5e8] hover:bg-[#e4d8f0] transition-colors font-medium text-[11px]"
                                title="Send Email"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Email</span>
                              </a>
                            )}

                            <a
                              href={`/api/enquiries/${enq.referenceNumber}/download`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white text-[#2e075d] border border-[#dfd5e8] hover:bg-[#f7f5fa] transition-colors text-[11px]"
                              title="Download Quotation PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-[#9080a5]" />
                              <span>PDF</span>
                            </a>
                          </div>
                        </div>

                        {/* Items Column */}
                        <div className="md:col-span-8 space-y-3">
                          <div className="font-medium text-[#2e075d] flex items-center justify-between">
                            <span>Quotation Tooling List ({enq.catalogueItems?.length || 0} line items)</span>
                            {enq.generalNotes && (
                              <span className="text-[11px] text-[#9080a5] italic max-w-xs truncate">
                                Note: {enq.generalNotes}
                              </span>
                            )}
                          </div>

                          <div className="divide-y divide-[#f0ebf5] border border-[#f0ebf5] rounded-lg overflow-hidden">
                            {(enq.catalogueItems || []).map((it, idx) => (
                              <div key={idx} className="p-2.5 flex items-center justify-between bg-white text-xs">
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono font-medium text-[#5e3e8b]">{it.modelNo}</span>
                                    <span className="text-[#2e075d] font-medium">{it.name}</span>
                                  </div>
                                  {it.notes && (
                                    <div className="text-[11px] text-[#6e568b]">{it.notes}</div>
                                  )}
                                </div>
                                <div className="font-mono text-[#2e075d] shrink-0 font-medium bg-[#f7f5fa] px-2 py-0.5 rounded border border-[#dfd5e8]">
                                  Qty: {it.quantity}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: CUSTOMER DIRECTORY ── */}
        {activeTab === 'directory' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#9080a5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dirSearch}
                  onChange={e => setDirSearch(e.target.value)}
                  placeholder="Search customers by name, company, email, city, phone..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsAddingCustomer(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>

            {/* Batch Selection Banner */}
            {filteredCustomers.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#efe7f7] border border-[#dfd5e8] text-xs">
                <button
                  onClick={selectAllFilteredCustomers}
                  className="flex items-center space-x-1.5 font-medium text-[#2e075d] hover:text-[#5e3e8b] cursor-pointer"
                >
                  {selectedCustomerIds.size === filteredCustomers.length && filteredCustomers.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-[#5e3e8b]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#9080a5]" />
                  )}
                  <span>
                    {selectedCustomerIds.size > 0
                      ? `${selectedCustomerIds.size} of ${filteredCustomers.length} customers selected`
                      : `Select All Customers (${filteredCustomers.length})`}
                  </span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportSelectedCustomersToExcel()}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-white border border-[#dfd5e8] hover:bg-white text-emerald-800 text-xs font-medium shadow-2xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export {selectedCustomerIds.size > 0 ? 'Selected' : 'All'} Customers to Excel</span>
                  </button>
                </div>
              </div>
            )}

            {filteredCustomers.length === 0 ? (
              <div className="text-center py-16 text-[#9080a5] text-xs space-y-2">
                <p className="font-medium text-[#2e075d]">No customer records in the database.</p>
                <p>Click "Add Customer" to manually create customer profiles or wait for live RFQs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCustomers.map(cust => {
                  const keyId = cust._id || cust.email;
                  const isSelected = selectedCustomerIds.has(keyId);
                  return (
                    <div
                      key={keyId}
                      className={`bg-white rounded-xl border p-5 transition-colors space-y-4 ${
                        isSelected ? 'border-[#5e3e8b] ring-1 ring-[#5e3e8b]/40' : 'border-[#dfd5e8] hover:border-[#cfc6d8]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleSelectCustomer(keyId)}
                            className="text-[#5e3e8b] cursor-pointer"
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#9080a5]" />}
                          </button>
                          <div className="w-9 h-9 rounded-lg bg-[#2e075d] text-white flex items-center justify-center font-medium text-xs shrink-0">
                            {cust.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-heading font-medium text-sm text-[#2e075d]">{cust.fullName}</h3>
                            <p className="text-xs text-[#6e568b]">{cust.company || 'Direct Workshop Client'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleStartQuoteForCustomer(cust)}
                            className="p-1.5 text-[#5e3e8b] hover:text-[#2e075d] hover:bg-[#efe7f7] rounded cursor-pointer"
                            title="Make Commercial Quote for this Customer"
                          >
                            <Calculator className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingCustomer(cust)}
                            className="p-1.5 text-[#6e568b] hover:text-[#2e075d] hover:bg-[#efe7f7] rounded cursor-pointer"
                            title="Edit customer details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {cust._id && (
                            <button
                              onClick={() => handleDeleteCustomer(cust._id!, cust.fullName)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                              title="Delete customer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-[#6e568b] border-t border-[#f0ebf5] pt-3">
                        <div className="flex items-center justify-between">
                          <span>Email:</span>
                          <span className="font-mono text-[#2e075d]">{cust.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Phone:</span>
                          <span className="font-mono text-[#2e075d]">{cust.phone}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Location:</span>
                          <span className="text-[#2e075d]">{[cust.city, cust.state, cust.country].filter(Boolean).join(', ')}</span>
                        </div>
                        {cust.gstin && (
                          <div className="flex items-center justify-between">
                            <span>GSTIN:</span>
                            <span className="font-mono text-[#2e075d]">{cust.gstin}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>Enquiry Requests:</span>
                          <span className="font-mono text-[#5e3e8b] font-medium">{cust.enquiryCount || 0}</span>
                        </div>
                      </div>

                      {/* Direct Action Buttons */}
                      <div className="pt-2 flex flex-wrap gap-2 border-t border-[#f0ebf5]">
                        <a
                          href={getWhatsAppUrl(cust.whatsapp || cust.phone, cust.fullName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors text-xs font-medium"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={getEmailUrl(cust.email, cust.fullName)}
                          className="flex-1 inline-flex items-center justify-center space-x-1 px-3 py-1.5 rounded bg-[#efe7f7] text-[#5e3e8b] border border-[#dfd5e8] hover:bg-[#e4d8f0] transition-colors text-xs font-medium"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: CATALOGUE INDEX & PRODUCT MANAGEMENT ── */}
        {activeTab === 'catalogue' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#9080a5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catSearch}
                  onChange={e => setCatSearch(e.target.value)}
                  placeholder="Filter catalogue by tool name or model SKU..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={catCategoryFilter}
                  onChange={e => setCatCategoryFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white text-[#2e075d] focus:outline-none"
                >
                  <option value="all">All Tooling Categories</option>
                  {(initialCategoriesData as any[]).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(catalogueList, null, 2));
                    const a = document.createElement('a');
                    a.href = dataStr;
                    a.download = 'products.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setActionSuccessMsg('Catalogue exported as products.json (ready to commit to Git!)');
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-[#dfd5e8] hover:bg-[#efe7f7] text-[#2e075d] text-xs font-medium transition-colors cursor-pointer"
                  title="Export all catalogue products as products.json"
                >
                  <Download className="w-3.5 h-3.5 text-[#5e3e8b]" />
                  <span>Export products.json</span>
                </button>

                <button
                  onClick={() => setActiveTab('new-listing')}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Listing</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="border border-[#dfd5e8] rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f7f5fa] border-b border-[#dfd5e8] text-[#6e568b] font-medium">
                    <th className="px-4 py-3 text-center">Image</th>
                    <th className="px-4 py-3">Model No (SKU)</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">Catalogue Page</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ebf5]">
                  {filteredCatalogue.map(prod => (
                    <tr key={prod.slug} className="hover:bg-[#faf8fc] transition-colors">
                      <td className="px-4 py-2 text-center">
                        <img
                          src={prod.images?.[0] || '/images/products/psh-vgkp-with-heavy-stand.jpg'}
                          alt={prod.name}
                          className="w-10 h-10 object-contain mx-auto rounded border border-[#dfd5e8] bg-white"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-[#5e3e8b]">
                        {prod.modelNo}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#2e075d] max-w-xs truncate">
                        {prod.name}
                      </td>
                      <td className="px-4 py-3 text-[#6e568b]">
                        {prod.category}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[#9080a5]">
                        Page {prod.cataloguePage || prod.indexNumber || 1}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Link
                          to={`/products/${prod.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-[#5e3e8b] hover:text-[#2e075d] p-1"
                          title="View on Storefront"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(prod.slug, prod.modelNo)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: MAKE NEW PRODUCT LISTING (WHOLE TEMPLATE) ── */}
        {activeTab === 'new-listing' && (
          <div className="p-6 sm:p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-[#dfd5e8] pb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('catalogue')}
                  className="p-1.5 rounded-lg border border-[#dfd5e8] text-[#6e568b] hover:text-[#2e075d] hover:bg-[#efe7f7] transition-colors cursor-pointer"
                  title="Back to catalogue"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="font-heading font-medium text-lg sm:text-xl text-[#2e075d]">
                    Create New Product Listing • Catalogue Edition 2026
                  </h2>
                  <p className="text-xs text-[#6e568b]">
                    Follow the standardized PRAZTECH® technical schema. Listings are committed to MongoDB Atlas and local catalogue files.
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-[#5e3e8b] bg-[#efe7f7] border border-[#dfd5e8] px-2.5 py-1 rounded">
                Product Template v1.0
              </span>
            </div>

            {/* Clear Image Storage Location Notice */}
            <div className="bg-[#f7f5fa] border-l-4 border-[#5e3e8b] p-4 rounded-r-lg text-xs text-[#2e075d] space-y-1">
              <div className="font-medium flex items-center space-x-1.5">
                <UploadCloud className="w-4 h-4 text-[#5e3e8b]" />
                <span>Product Image Storage Destination</span>
              </div>
              <p className="text-[#6e568b] leading-relaxed">
                When you upload an image, it is automatically saved to <code className="bg-white px-1.5 py-0.5 rounded border border-[#dfd5e8] font-mono text-[#2e075d]">client/public/images/products/&lt;filename&gt;.jpg</code> and mirrored to <code className="bg-white px-1.5 py-0.5 rounded border border-[#dfd5e8] font-mono text-[#2e075d]">product_images/</code>.
                When deployed to <strong>GitHub Pages</strong>, images are bundled into <code className="bg-white px-1.5 py-0.5 rounded border border-[#dfd5e8] font-mono">dist/images/products/</code> and served instantly over Fastly's edge CDN.
              </p>
            </div>

            <form onSubmit={handleCreateNewProductListing} className="space-y-6">
              {/* Row 1: Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#2e075d] mb-1">
                    Model No / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={newListingForm.modelNo}
                    onChange={e => setNewListingForm({ ...newListingForm, modelNo: e.target.value })}
                    placeholder="e.g. VGSCT-PRO"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2e075d] mb-1">
                    Catalogue Tooling Category *
                  </label>
                  <select
                    value={newListingForm.category}
                    onChange={e => setNewListingForm({ ...newListingForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  >
                    {(initialCategoriesData as any[]).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2e075d] mb-1">
                    Catalogue Page Number
                  </label>
                  <input
                    type="number"
                    value={newListingForm.cataloguePage}
                    onChange={e => setNewListingForm({ ...newListingForm, cataloguePage: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2e075d] mb-1">
                    Product Showcase Tag
                  </label>
                  <select
                    value={newListingForm.tag}
                    onChange={e => setNewListingForm({ ...newListingForm, tag: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  >
                    <option value="standard">Standard Product</option>
                    <option value="bestseller">Bestseller</option>
                    <option value="featured">Featured Master Kit</option>
                    <option value="popular">Popular Workshop Choice</option>
                  </select>
                </div>
              </div>

              {/* Full Product Name */}
              <div>
                <label className="block text-xs font-medium text-[#2e075d] mb-1">
                  Full Technical Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={newListingForm.name}
                  onChange={e => setNewListingForm({ ...newListingForm, name: e.target.value })}
                  placeholder="e.g. Multi-Angle Tungsten Carbide Valve Seat Cutter Set (Multi-Angle 30° / 45° / 70°)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                />
              </div>

              {/* Image Upload Box with Live Preview */}
              <div className="border border-[#dfd5e8] rounded-xl p-5 bg-[#faf8fc] space-y-3">
                <div className="font-medium text-xs text-[#2e075d] flex items-center justify-between">
                  <span>Product Photographic Asset</span>
                  <span className="text-[11px] text-[#9080a5]">JPG, PNG, or WebP (Max 10MB)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-28 h-28 rounded-lg border border-[#dfd5e8] bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {newListingImagePreview ? (
                      <img
                        src={newListingImagePreview}
                        alt="Listing Preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center p-2 text-[11px] text-[#9080a5]">
                        No image chosen
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageFileChange}
                      className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-[#dfd5e8] file:text-xs file:font-medium file:bg-[#efe7f7] file:text-[#5e3e8b] hover:file:bg-[#e4d8f0] cursor-pointer"
                    />
                    <p className="text-[11px] text-[#6e568b]">
                      The file will be saved with a clean kebab-case slug and linked directly in the catalogue.
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#2e075d] mb-1">
                  Product Overview & Technical Description
                </label>
                <textarea
                  rows={3}
                  value={newListingForm.description}
                  onChange={e => setNewListingForm({ ...newListingForm, description: e.target.value })}
                  placeholder="Comprehensive technical overview describing material formulation, drive system, and engine application scope..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                />
              </div>

              {/* Key Features (Dynamic List) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#2e075d]">Key Features Bullet Points</label>
                  <button
                    type="button"
                    onClick={() => setNewListingForm({
                      ...newListingForm,
                      keyFeatures: [...newListingForm.keyFeatures, '']
                    })}
                    className="text-xs text-[#5e3e8b] hover:text-[#2e075d] font-medium inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Feature</span>
                  </button>
                </div>
                {newListingForm.keyFeatures.map((kf, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={kf}
                      onChange={e => {
                        const updated = [...newListingForm.keyFeatures];
                        updated[idx] = e.target.value;
                        setNewListingForm({ ...newListingForm, keyFeatures: updated });
                      }}
                      placeholder={`Feature #${idx + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = newListingForm.keyFeatures.filter((_, i) => i !== idx);
                        setNewListingForm({ ...newListingForm, keyFeatures: updated });
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Applications & Set Includes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#2e075d]">Workshop Applications</label>
                    <button
                      type="button"
                      onClick={() => setNewListingForm({
                        ...newListingForm,
                        applications: [...newListingForm.applications, '']
                      })}
                      className="text-xs text-[#5e3e8b] hover:text-[#2e075d] font-medium inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                  {newListingForm.applications.map((app, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={app}
                        onChange={e => {
                          const updated = [...newListingForm.applications];
                          updated[idx] = e.target.value;
                          setNewListingForm({ ...newListingForm, applications: updated });
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newListingForm.applications.filter((_, i) => i !== idx);
                          setNewListingForm({ ...newListingForm, applications: updated });
                        }}
                        className="p-1 text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#2e075d]">Kit Set Includes</label>
                    <button
                      type="button"
                      onClick={() => setNewListingForm({
                        ...newListingForm,
                        setIncludes: [...newListingForm.setIncludes, '']
                      })}
                      className="text-xs text-[#5e3e8b] hover:text-[#2e075d] font-medium inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                  {newListingForm.setIncludes.map((inc, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={inc}
                        onChange={e => {
                          const updated = [...newListingForm.setIncludes];
                          updated[idx] = e.target.value;
                          setNewListingForm({ ...newListingForm, setIncludes: updated });
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newListingForm.setIncludes.filter((_, i) => i !== idx);
                          setNewListingForm({ ...newListingForm, setIncludes: updated });
                        }}
                        className="p-1 text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── SUB-MODELS & MULTI-ATTRIBUTE VARIANT CONFIGURATOR ── */}
              <div className="space-y-4 border border-[#dfd5e8] rounded-xl p-5 bg-white shadow-2xs">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0ebf5] pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-[#5e3e8b]" />
                      <h3 className="text-sm font-semibold text-[#2e075d]">
                        Sub-Models & Multi-Attribute Configurations
                      </h3>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#efe7f7] text-[#5e3e8b]">
                        {newListingForm.subModels.length} {newListingForm.subModels.length === 1 ? 'Variant' : 'Variants'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6e568b] mt-0.5">
                      Configure multiple variant options (e.g. <strong>Size</strong>, <strong>Color</strong>, <strong>Material</strong>, <strong>Grit</strong>) and manage SKU combinations.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowMatrixHelper(prev => !prev)}
                      className={`text-xs px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                        showMatrixHelper
                          ? 'bg-[#5e3e8b] text-white border-[#5e3e8b]'
                          : 'bg-[#faf8fc] text-[#5e3e8b] border-[#dfd5e8] hover:bg-[#efe7f7]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{showMatrixHelper ? 'Hide Matrix Generator' : 'Auto Matrix Generator'}</span>
                    </button>
                  </div>
                </div>

                {/* Option Dimensions Definition Bar */}
                <div className="bg-[#faf9fc] rounded-lg border border-[#dfd5e8] p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#2e075d] uppercase tracking-wider">
                      Active Variant Options ({newListingForm.variantOptionNames.length}):
                    </span>
                    <span className="text-[10px] text-[#806f94]">Click option name to edit / rename</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {newListingForm.variantOptionNames.map((optName, oIdx) => (
                      <div
                        key={oIdx}
                        className="inline-flex items-center space-x-1.5 bg-white border border-[#dfd5e8] rounded-lg px-2.5 py-1 text-xs shadow-2xs group focus-within:border-[#5e3e8b]"
                      >
                        <span className="text-[10px] text-[#806f94] font-medium">#{oIdx + 1}</span>
                        <input
                          type="text"
                          value={optName}
                          onChange={e => handleRenameOptionDimension(oIdx, e.target.value)}
                          className="w-20 sm:w-24 text-xs font-semibold text-[#2e075d] bg-transparent focus:outline-none"
                          placeholder="Option Name"
                          title="Click to rename this option (e.g. Weight, Size, Color, Grit)"
                        />
                        {newListingForm.variantOptionNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionDimension(oIdx)}
                            className="p-0.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title={`Remove "${optName}" option dimension`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Quick Add Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pl-1">
                      {[
                        { label: '+ Weight', name: 'Weight' },
                        { label: '+ Size', name: 'Size' },
                        { label: '+ Color', name: 'Color' },
                        { label: '+ Material', name: 'Material' },
                        { label: '+ Grit', name: 'Grit' },
                        { label: '+ Drive', name: 'Drive Type' },
                        { label: '+ Thread', name: 'Thread' }
                      ]
                        .filter(preset => !newListingForm.variantOptionNames.some(n => n.toLowerCase() === preset.name.toLowerCase()))
                        .map(preset => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleAddOptionDimension(preset.name)}
                            className="px-2 py-1 text-[11px] rounded bg-white hover:bg-[#efe7f7] border border-dashed border-[#dfd5e8] text-[#5e3e8b] font-medium transition-colors cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}

                      {/* Custom Option Adder Input */}
                      <div className="inline-flex items-center space-x-1">
                        <input
                          type="text"
                          value={newCustomOptionName}
                          onChange={e => setNewCustomOptionName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOptionDimension(newCustomOptionName);
                            }
                          }}
                          placeholder="Custom Option..."
                          className="w-24 px-2 py-1 text-[11px] rounded border border-[#dfd5e8] bg-white focus:outline-none focus:border-[#5e3e8b]"
                        />
                        {newCustomOptionName.trim() && (
                          <button
                            type="button"
                            onClick={() => handleAddOptionDimension(newCustomOptionName)}
                            className="px-2 py-1 text-[11px] rounded bg-[#5e3e8b] text-white hover:bg-[#6e568b] font-medium transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✨ Auto Matrix Combinations Generator Helper */}
                {showMatrixHelper && (
                  <div className="bg-[#fcfaff] border border-[#d6c4eb] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#ebdff5]">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-[#5e3e8b]" />
                        <span className="text-xs font-semibold text-[#2e075d]">
                          Bulk Matrix Combination Generator
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6e568b]">
                        Enter comma-separated values for each option to automatically generate every combination.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {newListingForm.variantOptionNames.map(optName => (
                        <div key={optName}>
                          <label className="block text-[11px] font-semibold text-[#2e075d] mb-1">
                            {optName} Values (comma-separated):
                          </label>
                          <input
                            type="text"
                            value={matrixOptionInputs[optName] || ''}
                            onChange={e => setMatrixOptionInputs(prev => ({ ...prev, [optName]: e.target.value }))}
                            placeholder={
                              optName.toLowerCase() === 'size' ? 'e.g. 18 mm, 21 mm, 25 mm' :
                              optName.toLowerCase() === 'color' ? 'e.g. Pink, Black, White' :
                              optName.toLowerCase() === 'grit' ? 'e.g. 120, 180, 220' :
                              'e.g. Value 1, Value 2'
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-[#dfd5e8] bg-white focus:outline-none focus:border-[#5e3e8b]"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-[#6e568b]">
                        Will generate combination rows for all selected attributes.
                      </span>
                      <button
                        type="button"
                        onClick={handleGenerateMatrix}
                        className="px-4 py-1.5 bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate All Combinations</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── VARIANTS TABLE ── */}
                <div className="overflow-x-auto border border-[#dfd5e8] rounded-xl bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f7f5fa] border-b border-[#dfd5e8] text-[#2e075d] font-semibold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        {newListingForm.variantOptionNames.map(optName => (
                          <th key={optName} className="py-2.5 px-3">
                            <span className="flex items-center space-x-1">
                              <span>{optName}</span>
                              <span className="text-red-500 font-bold">*</span>
                            </span>
                          </th>
                        ))}
                        <th className="py-2.5 px-3">Model / SKU (Optional)</th>
                        <th className="py-2.5 px-3">Workshop Notes</th>
                        <th className="py-2.5 px-3 w-28">Preview</th>
                        <th className="py-2.5 px-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0ebf5]">
                      {newListingForm.subModels.map((sm, idx) => {
                        const optValues = newListingForm.variantOptionNames
                          .map(n => sm.options?.[n]?.trim() || '')
                          .filter(Boolean);
                        const labelPreview = optValues.length > 0 ? optValues.join(' • ') : 'Enter values...';
                        const hasColorOption = newListingForm.variantOptionNames.some(
                          n => n.toLowerCase().includes('color') || n.toLowerCase().includes('finish')
                        );
                        const colorVal = hasColorOption ? (sm.options?.['Color'] || sm.options?.['color'] || '') : '';
                        const isRecognizedColor = Boolean(
                          colorVal && ['pink', 'black', 'white', 'ruby', 'red', 'blue', 'green', 'gold', 'yellow', 'grey', 'gray']
                            .some(c => colorVal.toLowerCase().includes(c))
                        );

                        return (
                          <tr key={idx} className="hover:bg-[#faf9fc] transition-colors">
                            <td className="py-2 px-3 text-center text-[#806f94] font-mono text-[11px]">
                              {idx + 1}
                            </td>

                            {newListingForm.variantOptionNames.map(optName => (
                              <td key={optName} className="py-2 px-3">
                                <input
                                  type="text"
                                  value={sm.options?.[optName] || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    const updated = [...newListingForm.subModels];
                                    const updatedOpts = { ...(updated[idx].options || {}), [optName]: val };
                                    updated[idx] = {
                                      ...updated[idx],
                                      options: updatedOpts,
                                      ...(optName.toLowerCase() === 'size' ? { sizeMm: val, size: val } : {}),
                                      ...(optName.toLowerCase() === 'color' ? { color: val, stoneColor: val } : {}),
                                      ...(optName.toLowerCase() === 'weight' ? { weight: val } : {})
                                    };
                                    setNewListingForm({ ...newListingForm, subModels: updated });
                                  }}
                                  placeholder={
                                    optName.toLowerCase() === 'size' ? 'e.g. 18 mm' :
                                    optName.toLowerCase() === 'weight' ? 'e.g. 500g' :
                                    optName.toLowerCase() === 'color' ? 'e.g. Pink' :
                                    optName.toLowerCase() === 'grit' ? 'e.g. 120 Grit' :
                                    `e.g. ${optName}`
                                  }
                                  className="w-full px-2.5 py-1 text-xs rounded border border-[#dfd5e8] bg-white focus:outline-none focus:border-[#5e3e8b]"
                                />
                              </td>
                            ))}

                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={sm.modelNo || ''}
                                onChange={e => {
                                  const updated = [...newListingForm.subModels];
                                  updated[idx] = { ...updated[idx], modelNo: e.target.value };
                                  setNewListingForm({ ...newListingForm, subModels: updated });
                                }}
                                placeholder={newListingForm.modelNo ? `${newListingForm.modelNo}-${idx + 1}` : 'e.g. VGS-18-PNK'}
                                className="w-full px-2.5 py-1 text-xs font-mono rounded border border-[#dfd5e8] bg-white focus:outline-none focus:border-[#5e3e8b]"
                              />
                            </td>

                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={sm.notes || ''}
                                onChange={e => {
                                  const updated = [...newListingForm.subModels];
                                  updated[idx] = { ...updated[idx], notes: e.target.value };
                                  setNewListingForm({ ...newListingForm, subModels: updated });
                                }}
                                placeholder="e.g. Factory standard stock"
                                className="w-full px-2.5 py-1 text-xs rounded border border-[#dfd5e8] bg-white focus:outline-none focus:border-[#5e3e8b]"
                              />
                            </td>

                            <td className="py-2 px-3">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#f5effa] text-[#2e075d] border border-[#dfd5e8] max-w-full truncate">
                                {isRecognizedColor && (
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 border border-black/20"
                                    style={{
                                      backgroundColor:
                                        colorVal.toLowerCase() === 'pink' ? '#ec4899' :
                                        colorVal.toLowerCase() === 'black' ? '#18181b' :
                                        colorVal.toLowerCase() === 'white' ? '#ffffff' :
                                        colorVal.toLowerCase() === 'ruby' || colorVal.toLowerCase().includes('red') ? '#dc2626' :
                                        colorVal.toLowerCase() === 'blue' ? '#2563eb' :
                                        colorVal.toLowerCase() === 'green' ? '#16a34a' :
                                        colorVal.toLowerCase() === 'gold' || colorVal.toLowerCase().includes('yellow') ? '#eab308' :
                                        '#a1a1aa'
                                    }}
                                  />
                                )}
                                <span className="truncate">{labelPreview}</span>
                              </span>
                            </td>

                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (newListingForm.subModels.length <= 1) {
                                    alert('A product listing must contain at least one configuration.');
                                    return;
                                  }
                                  const updated = newListingForm.subModels.filter((_, i) => i !== idx);
                                  setNewListingForm({ ...newListingForm, subModels: updated });
                                }}
                                className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                                title="Delete this variant row"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#efe7f7] hover:bg-[#e2d5ee] text-[#2e075d] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Variant Row</span>
                    </button>

                    {newListingForm.subModels.length > 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Clear all variant rows and reset to a single empty row?')) {
                            const initialOpts: Record<string, string> = {};
                            newListingForm.variantOptionNames.forEach(n => { initialOpts[n] = ''; });
                            setNewListingForm(prev => ({
                              ...prev,
                              subModels: [{ modelNo: '', options: initialOpts, notes: '' }]
                            }));
                          }
                        }}
                        className="px-2.5 py-1.5 text-[11px] text-[#806f94] hover:text-red-600 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-[#6e568b]">
                    Configuring <strong>{newListingForm.subModels.length}</strong> variants across{' '}
                    <strong>{newListingForm.variantOptionNames.join(' & ')}</strong>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[#dfd5e8]">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalogue')}
                  className="px-4 py-2.5 rounded-lg border border-[#dfd5e8] text-xs font-medium text-[#6e568b] hover:bg-[#f7f5fa] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingListing}
                  className="px-6 py-2.5 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium transition-colors shadow-md cursor-pointer flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmittingListing ? 'Publishing Listing...' : 'Publish Product to Catalogue'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 5: COMMERCIAL QUOTE MAKER ── */}
        {activeTab === 'create-quote' && (
          <div className="p-6 sm:p-8 space-y-8">
            {/* Top Toolbar & Summary Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#dfd5e8] pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-heading font-medium text-lg text-[#2e075d] flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-[#5e3e8b]" />
                    <span>Commercial Quotation Maker</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#efe7f7] text-[#5e3e8b] border border-[#dfd5e8]">
                    Executive Pro
                  </span>
                </div>
                <p className="text-xs text-[#6e568b] mt-1">
                  Build custom quotations with exact pricing, tiered discounts, GST taxes, live PDF preview, and direct dispatch to customer via email & WhatsApp.
                </p>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviewQuoteModal}
                  className="px-3.5 py-2 rounded-lg border border-[#dfd5e8] bg-white text-[#2e075d] hover:bg-[#faf8fc] text-xs font-medium flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Open on-screen printable A4 quotation preview"
                >
                  <Eye className="w-4 h-4 text-[#5e3e8b]" />
                  <span>Preview PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQuotePDF}
                  className="px-3.5 py-2 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Download vector PDF quote directly"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendQuoteToCustomer}
                  disabled={isSendingQuote}
                  className="px-4 py-2 rounded-lg bg-[#2e075d] hover:bg-[#431477] text-white text-xs font-medium flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Save quote in database as 'Quotation Dispatched' and email PDF to buyer"
                >
                  {isSendingQuote ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Quote...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Quote to Customer</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppQuote}
                  className="px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Open prefilled WhatsApp message with quote summary"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyQuoteSummary}
                  className="p-2 rounded-lg border border-[#dfd5e8] bg-white text-[#6e568b] hover:text-[#2e075d] hover:bg-[#faf8fc] text-xs transition-colors cursor-pointer"
                  title="Copy plain-text summary to clipboard"
                >
                  {quoteCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleResetQuoteForm}
                  className="p-2 rounded-lg border border-[#dfd5e8] bg-white text-[#9080a5] hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors cursor-pointer"
                  title="Reset quotation form"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SECTION 1: CUSTOMER & QUOTATION METADATA */}
            <div className="bg-[#fcfbfe] border border-[#dfd5e8] rounded-xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h4 className="font-heading font-medium text-xs text-[#2e075d] uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-[#5e3e8b]" />
                  <span>1. Customer & Commercial Quotation Details</span>
                </h4>

                {/* Optional Customer Auto-Fill */}
                {customersList.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-medium text-[#6e568b]">Auto-fill:</span>
                    <select
                      value={quoteForm.selectedCustomerId}
                      onChange={e => handleCustomerAutoFill(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-[#dfd5e8] bg-white text-[#2e075d] focus:border-[#5e3e8b] focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Choose registered customer --</option>
                      {customersList.map(c => (
                        <option key={c._id || c.id} value={c._id || c.id}>
                          {c.fullName} {c.company ? `(${c.company})` : ''} — {c.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Customer Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Customer / Buyer Name</label>
                  <input
                    type="text"
                    value={quoteForm.customerName}
                    onChange={e => setQuoteForm({ ...quoteForm, customerName: e.target.value })}
                    placeholder="e.g. Anand Patel"
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Company / Workshop Name</label>
                  <input
                    type="text"
                    value={quoteForm.company}
                    onChange={e => setQuoteForm({ ...quoteForm, company: e.target.value })}
                    placeholder="e.g. Precision Cylinder Head Works"
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={quoteForm.email}
                    onChange={e => setQuoteForm({ ...quoteForm, email: e.target.value })}
                    placeholder="buyer@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Mobile / Phone</label>
                  <input
                    type="tel"
                    value={quoteForm.phone}
                    onChange={e => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={quoteForm.whatsapp}
                    onChange={e => setQuoteForm({ ...quoteForm, whatsapp: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={quoteForm.gstin}
                    onChange={e => setQuoteForm({ ...quoteForm, gstin: e.target.value })}
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">City & State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={quoteForm.city}
                      onChange={e => setQuoteForm({ ...quoteForm, city: e.target.value })}
                      placeholder="Delhi"
                      className="w-full px-2.5 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={quoteForm.state}
                      onChange={e => setQuoteForm({ ...quoteForm, state: e.target.value })}
                      placeholder="Delhi"
                      className="w-full px-2.5 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Country</label>
                  <input
                    type="text"
                    value={quoteForm.country}
                    onChange={e => setQuoteForm({ ...quoteForm, country: e.target.value })}
                    placeholder="India"
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
              </div>

              {/* Quotation Parameters Row */}
              <div className="pt-4 border-t border-[#dfd5e8] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Quotation Reference #</label>
                  <input
                    type="text"
                    value={quoteForm.quoteNumber}
                    onChange={e => setQuoteForm({ ...quoteForm, quoteNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white font-mono text-[#5e3e8b] font-semibold focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Quotation Issue Date</label>
                  <input
                    type="date"
                    value={quoteForm.quoteDate}
                    onChange={e => setQuoteForm({ ...quoteForm, quoteDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Offer Validity Period</label>
                  <select
                    value={quoteForm.validityDays}
                    onChange={e => setQuoteForm({ ...quoteForm, validityDays: Number(e.target.value) || 30 })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none cursor-pointer font-medium"
                  >
                    <option value={15}>15 Days Validity</option>
                    <option value={30}>30 Days Validity (Standard)</option>
                    <option value={45}>45 Days Validity</option>
                    <option value={60}>60 Days Validity</option>
                    <option value={90}>90 Days Validity</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Currency</label>
                  <select
                    value={quoteForm.currency}
                    onChange={e => {
                      const cur = e.target.value as any;
                      setQuoteForm(prev => ({
                        ...prev,
                        currency: cur,
                        currencySymbol: CURRENCY_SYMBOLS[cur] || '₹'
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none cursor-pointer font-medium text-[#5e3e8b]"
                  >
                    <option value="INR">INR (₹) — Indian Rupee</option>
                    <option value="USD">USD ($) — US Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="GBP">GBP (£) — British Pound</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: LINE ITEMS & TOOLING PRODUCTS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#dfd5e8] pb-3">
                <div>
                  <h4 className="font-heading font-medium text-xs text-[#2e075d] uppercase tracking-wider flex items-center space-x-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-[#5e3e8b]" />
                    <span>2. Itemized Tooling Schedule & Pricing ({quoteItems.length} {quoteItems.length === 1 ? 'Item' : 'Items'})</span>
                  </h4>
                  <p className="text-[11px] text-[#9080a5]">Select catalogue products or create custom manufactured items with unit price, discount, and tax.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleAddCatalogueItemToQuote()}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#efe7f7] text-[#2e075d] hover:bg-[#e4d8f0] text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#5e3e8b]" />
                    <span>+ Add Catalogue Tool</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddCustomItemToQuote}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#dfd5e8] bg-white text-[#5e3e8b] hover:bg-[#faf8fc] text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Custom Machining / Tool</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {quoteItems.map((item, idx) => {
                  const matchedProduct = catalogueList.find(p => p.modelNo === item.modelNo || p.name === item.name);
                  const availableSubModels = matchedProduct?.subModels || [];

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-[#dfd5e8] p-4 sm:p-5 space-y-3.5 shadow-2xs relative transition-all hover:border-[#5e3e8b]"
                    >
                      {/* Item Top Bar */}
                      <div className="flex items-center justify-between border-b border-[#f0ebf5] pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-md bg-[#2e075d] text-white flex items-center justify-center font-mono text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            item.isCustom
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {item.isCustom ? 'Custom Machined Tool' : 'Catalogue Product'}
                          </span>
                          <span className="font-mono font-semibold text-xs text-[#2e075d]">
                            {item.modelNo}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateQuoteItem(item.id)}
                            className="p-1.5 text-[#6e568b] hover:text-[#2e075d] hover:bg-[#efe7f7] rounded cursor-pointer"
                            title="Duplicate this line item"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuoteItem(item.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            title="Remove item from quotation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Product Image Preview + Identification Fields */}
                      <div className="flex flex-col sm:flex-row gap-4 text-xs">
                        {/* Live Product Image Preview */}
                        <div className="shrink-0 flex flex-col items-center gap-1.5">
                          {(() => {
                            const displayImage = item.image || matchedProduct?.images?.[0] || '';
                            const extraImages = matchedProduct?.images || [];
                            return (
                              <>
                                <div className="w-20 h-20 rounded-lg border border-[#dfd5e8] bg-[#faf8fc] flex items-center justify-center overflow-hidden p-1">
                                  {displayImage ? (
                                    <img
                                      src={displayImage}
                                      alt={item.name || item.modelNo || 'Product'}
                                      className="w-full h-full object-contain"
                                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <span className="text-[10px] text-[#9080a5] text-center leading-tight">
                                      {item.isCustom ? 'Custom\nTool' : 'No\nImage'}
                                    </span>
                                  )}
                                </div>
                                {extraImages.length > 1 && (
                                  <div className="flex items-center gap-1 flex-wrap max-w-[84px] justify-center">
                                    {extraImages.slice(0, 4).map((imgUrl, imgIdx) => (
                                      <button
                                        key={imgIdx}
                                        type="button"
                                        onClick={() => handleUpdateQuoteItem(item.id, { image: imgUrl })}
                                        className={`w-4 h-4 rounded border overflow-hidden cursor-pointer ${
                                          displayImage === imgUrl ? 'border-[#2e075d] ring-1 ring-[#5e3e8b]' : 'border-[#dfd5e8] opacity-70 hover:opacity-100'
                                        }`}
                                        title={`Use product image #${imgIdx + 1}`}
                                      >
                                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                          {/* Typable Searchable Catalogue Product Combobox (when not custom) */}
                          {!item.isCustom && (
                            <div className="md:col-span-6 relative">
                              <label className="block font-medium text-[#2e075d] mb-1">
                                Select Catalogue Product (Type to search & auto-fill)
                              </label>
                              {(() => {
                                const isDropdownOpen = activeQuoteProductDropdown === item.id;
                                const searchVal = quoteProductSearchMap[item.id] ?? '';
                                const displayVal = isDropdownOpen
                                  ? searchVal
                                  : (matchedProduct ? `${matchedProduct.modelNo} — ${matchedProduct.name}` : searchVal);
                                const q = searchVal.trim().toLowerCase();
                                const filteredProducts = q
                                  ? catalogueList.filter(p =>
                                      (p.modelNo || '').toLowerCase().includes(q) ||
                                      (p.name || '').toLowerCase().includes(q) ||
                                      (p.category || '').toLowerCase().includes(q) ||
                                      (p.slug || '').toLowerCase().includes(q)
                                    )
                                  : catalogueList;

                                const selectProductForItem = (p: CatalogueProduct) => {
                                  const defVariant = p.subModels?.[0]
                                    ? formatSubModelDetails(p.subModels[0], 0)
                                    : (p.sizesDetail?.length ? p.sizesDetail[0] : 'Standard');
                                  handleUpdateQuoteItem(item.id, {
                                    modelNo: p.modelNo,
                                    name: p.name,
                                    category: p.category,
                                    image: p.images?.[0] || '',
                                    selectedVariant: defVariant
                                  });
                                  setQuoteProductSearchMap(prev => ({ ...prev, [item.id]: '' }));
                                  setActiveQuoteProductDropdown(null);
                                };

                                return (
                                  <div className="relative">
                                    <div className="relative flex items-center">
                                      <Search className="w-3.5 h-3.5 text-[#6e568b] absolute left-3 pointer-events-none" />
                                      <input
                                        type="text"
                                        value={displayVal}
                                        placeholder="Type model #, product name, or category..."
                                        onFocus={() => {
                                          setActiveQuoteProductDropdown(item.id);
                                        }}
                                        onBlur={() => {
                                          setTimeout(() => {
                                            setActiveQuoteProductDropdown(prev => (prev === item.id ? null : prev));
                                          }, 180);
                                        }}
                                        onChange={e => {
                                          setQuoteProductSearchMap(prev => ({ ...prev, [item.id]: e.target.value }));
                                          setActiveQuoteProductDropdown(item.id);
                                        }}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (filteredProducts.length > 0) {
                                              selectProductForItem(filteredProducts[0]);
                                            }
                                          } else if (e.key === 'Escape') {
                                            setActiveQuoteProductDropdown(null);
                                          }
                                        }}
                                        className="w-full pl-8 pr-14 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none text-xs"
                                      />
                                      <div className="absolute right-2 flex items-center space-x-1">
                                        {searchVal && (
                                          <button
                                            type="button"
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => {
                                              setQuoteProductSearchMap(prev => ({ ...prev, [item.id]: '' }));
                                              setActiveQuoteProductDropdown(item.id);
                                            }}
                                            className="p-0.5 text-[#9080a5] hover:text-[#5e3e8b] cursor-pointer"
                                            title="Clear search"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onMouseDown={e => e.preventDefault()}
                                          onClick={() => {
                                            setActiveQuoteProductDropdown(prev => (prev === item.id ? null : item.id));
                                          }}
                                          className="p-0.5 text-[#9080a5] hover:text-[#5e3e8b] cursor-pointer"
                                          title="Toggle product list"
                                        >
                                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180 text-[#5e3e8b]' : ''}`} />
                                        </button>
                                      </div>
                                    </div>

                                    {isDropdownOpen && (
                                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#dfd5e8] rounded-xl shadow-xl max-h-64 overflow-y-auto z-40 divide-y divide-[#f5f1f9]">
                                        <div className="px-3 py-1.5 bg-[#faf8fc] text-[10px] font-bold text-[#6e568b] uppercase tracking-wider flex items-center justify-between sticky top-0">
                                          <span>Matching Products ({filteredProducts.length})</span>
                                          {searchVal && <span className="text-[#5e3e8b]">"{searchVal}"</span>}
                                        </div>
                                        {filteredProducts.length === 0 ? (
                                          <div className="px-3 py-4 text-center text-[#9080a5] text-xs">
                                            No products match "{searchVal}"
                                          </div>
                                        ) : (
                                          filteredProducts.map(p => (
                                            <button
                                              key={p.slug}
                                              type="button"
                                              onMouseDown={e => {
                                                e.preventDefault();
                                                selectProductForItem(p);
                                              }}
                                              className={`w-full text-left px-3 py-2 hover:bg-[#efe7f7] flex items-center gap-2.5 transition-colors cursor-pointer ${
                                                matchedProduct?.slug === p.slug ? 'bg-[#f5effa]' : ''
                                              }`}
                                            >
                                              {p.images?.[0] ? (
                                                <img
                                                  src={p.images[0]}
                                                  alt=""
                                                  className="w-8 h-8 rounded border border-[#dfd5e8] object-contain bg-white shrink-0"
                                                />
                                              ) : (
                                                <div className="w-8 h-8 rounded border border-[#dfd5e8] bg-[#faf8fc] shrink-0" />
                                              )}
                                              <div className="min-w-0 flex-1">
                                                <div className="font-mono font-bold text-[#2e075d] text-[11px] truncate">
                                                  {p.modelNo} <span className="font-sans font-normal text-[#6e568b]">• {p.category}</span>
                                                </div>
                                                <div className="text-[#2e075d] truncate text-xs">{p.name}</div>
                                              </div>
                                              {p.subModels && p.subModels.length > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#efe7f7] text-[#5e3e8b] font-medium shrink-0">
                                                  {p.subModels.length} specs
                                                </span>
                                              )}
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Editable Model / SKU */}
                          <div className={item.isCustom ? 'md:col-span-4' : 'md:col-span-6'}>
                            <label className="block font-medium text-[#2e075d] mb-1">
                              Model / SKU
                            </label>
                            <input
                              type="text"
                              value={item.modelNo}
                              onChange={e => handleUpdateQuoteItem(item.id, { modelNo: e.target.value })}
                              placeholder="e.g. PSH-VGKP-H"
                              className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white font-mono focus:border-[#5e3e8b] focus:outline-none"
                            />
                          </div>

                          {/* Editable Product Name / Description */}
                          <div className={item.isCustom ? 'md:col-span-8' : 'md:col-span-6'}>
                            <label className="block font-medium text-[#2e075d] mb-1">
                              {item.isCustom ? 'Custom Tooling Description' : 'Product Name / Description'}
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={e => handleUpdateQuoteItem(item.id, { name: e.target.value })}
                              placeholder="e.g. All in One Valve Seat Grinding Kit"
                              className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                            />
                          </div>

                          {/* Variant / Sub-model / Specific Size (quick-pick + editable input) */}
                          <div className={item.isCustom ? 'md:col-span-12' : 'md:col-span-6'}>
                            <label className="block font-medium text-[#2e075d] mb-1">
                              Selected Variant / Size / Spec Option
                            </label>
                            <div className="space-y-1.5">
                              {!item.isCustom && availableSubModels.length > 0 && (
                                <select
                                  value={
                                    availableSubModels.some((sm, smIdx) => formatSubModelDetails(sm, smIdx) === item.selectedVariant)
                                      ? item.selectedVariant
                                      : ''
                                  }
                                  onChange={e => {
                                    if (e.target.value) {
                                      handleUpdateQuoteItem(item.id, { selectedVariant: e.target.value });
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg border border-[#dfd5e8] bg-[#faf8fc] text-[#5e3e8b] focus:border-[#5e3e8b] focus:outline-none cursor-pointer"
                                >
                                  <option value="">-- Quick-pick variant (or edit below) --</option>
                                  <option value="Standard Model">Standard Unit</option>
                                  {availableSubModels.map((sm, smIdx) => {
                                    const label = formatSubModelDetails(sm, smIdx);
                                    return (
                                      <option key={smIdx} value={label}>
                                        {label}
                                      </option>
                                    );
                                  })}
                                </select>
                              )}
                              <input
                                type="text"
                                value={item.selectedVariant || ''}
                                onChange={e => handleUpdateQuoteItem(item.id, { selectedVariant: e.target.value })}
                                placeholder="e.g. 5.5mm pilot, 45 degree angle, red ruby stone"
                                className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full Product Sizes, Specifications & Variants Reference Panel */}
                      {matchedProduct && (
                        <div className="bg-[#faf8fc] border border-[#dfd5e8] rounded-lg p-3.5 text-[11px] space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8dff2] pb-2">
                            <span className="font-bold uppercase tracking-wider text-[#5e3e8b] text-[10px]">
                              Product Sizes & Specifications ({matchedProduct.modelNo})
                            </span>
                            {matchedProduct.compatibility && (
                              <span className="text-[#6e568b]">
                                <strong className="text-[#2e075d]">Compatibility:</strong> {matchedProduct.compatibility}
                              </span>
                            )}
                          </div>

                          {matchedProduct.sizesDetail && matchedProduct.sizesDetail.length > 0 && (
                            <div>
                              <span className="font-semibold text-[#2e075d] block mb-1">Available Sizes:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {matchedProduct.sizesDetail.map((sz, szIdx) => (
                                  <button
                                    key={szIdx}
                                    type="button"
                                    onClick={() => handleUpdateQuoteItem(item.id, { selectedVariant: sz })}
                                    className="px-2 py-0.5 rounded bg-white border border-[#dfd5e8] text-[#2e075d] hover:border-[#5e3e8b] hover:bg-[#efe7f7] transition-colors cursor-pointer"
                                    title="Click to apply as Selected Variant"
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {matchedProduct.itemSpecifics && Object.keys(matchedProduct.itemSpecifics).length > 0 && (
                            <div>
                              <span className="font-semibold text-[#2e075d] block mb-1">Technical Specifications:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                {Object.entries(matchedProduct.itemSpecifics).map(([specKey, specVal]) => (
                                  <div key={specKey} className="bg-white border border-[#e8dff2] rounded px-2 py-1">
                                    <span className="font-medium text-[#6e568b]">{specKey}: </span>
                                    <span className="text-[#2e075d] font-medium">{specVal}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {matchedProduct.setIncludes && matchedProduct.setIncludes.length > 0 && (
                            <div>
                              <span className="font-semibold text-[#2e075d]">Set Includes: </span>
                              <span className="text-[#6e568b]">{matchedProduct.setIncludes.join(' • ')}</span>
                            </div>
                          )}

                          {availableSubModels.length > 0 && (
                            <div>
                              <span className="font-semibold text-[#2e075d] block mb-1">
                                Variant / Sub-Model Breakdown ({availableSubModels.length} options — click any to apply):
                              </span>
                              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                {availableSubModels.map((sm, smIdx) => {
                                  const summary = formatSubModelDetails(sm, smIdx);
                                  const isSelected = item.selectedVariant === summary;
                                  return (
                                    <button
                                      key={smIdx}
                                      type="button"
                                      onClick={() =>
                                        handleUpdateQuoteItem(item.id, {
                                          selectedVariant: summary,
                                          ...(sm.modelNo ? { modelNo: sm.modelNo } : {})
                                        })
                                      }
                                      className={`w-full text-left px-2.5 py-1.5 rounded border transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#efe7f7] border-[#5e3e8b] text-[#2e075d] font-medium'
                                          : 'bg-white border-[#e8dff2] text-[#6e568b] hover:border-[#5e3e8b] hover:text-[#2e075d]'
                                      }`}
                                    >
                                      {summary}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pricing, Quantity, Discount, GST Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-xs">
                        <div>
                          <label className="block font-medium text-[#2e075d] mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleUpdateQuoteItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white font-medium focus:border-[#5e3e8b] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-medium text-[#2e075d] mb-1">
                            Unit Rate ({quoteForm.currencySymbol})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice || ''}
                            onChange={e => handleUpdateQuoteItem(item.id, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                            placeholder="0.00"
                            className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white font-mono font-medium focus:border-[#5e3e8b] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-medium text-[#2e075d] mb-1">Discount %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={item.discountPercent || ''}
                            onChange={e => handleUpdateQuoteItem(item.id, { discountPercent: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                            placeholder="0"
                            className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white font-mono focus:border-[#5e3e8b] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-medium text-[#2e075d] mb-1">GST / Tax %</label>
                          <select
                            value={item.gstRate}
                            onChange={e => handleUpdateQuoteItem(item.id, { gstRate: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2.5 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none cursor-pointer font-medium"
                          >
                            <option value={0}>0% (Exempt / Export)</option>
                            <option value={5}>5% GST</option>
                            <option value={12}>12% GST</option>
                            <option value={18}>18% GST (Standard Tooling)</option>
                            <option value={28}>28% GST</option>
                          </select>
                        </div>

                        <div className="col-span-2 sm:col-span-1 bg-[#faf8fc] p-2.5 rounded-lg border border-[#dfd5e8] flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-bold text-[#6e568b]">Line Total</span>
                          <span className="font-mono font-bold text-sm text-[#2e075d]">
                            {quoteForm.currencySymbol}
                            {Number(item.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Technical Notes / Line Item Remarks */}
                      <div>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={e => handleUpdateQuoteItem(item.id, { notes: e.target.value })}
                          placeholder="Technical notes (e.g. with Sioux 45° pilot arbor, DIN grade carbide)"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#dfd5e8] bg-white text-xs text-[#6e568b] focus:border-[#5e3e8b] focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Item Bottom Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddCatalogueItemToQuote()}
                  className="flex-1 py-2.5 border border-dashed border-[#5e3e8b] text-[#5e3e8b] hover:bg-[#efe7f7] rounded-xl text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Catalogue Tool</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddCustomItemToQuote}
                  className="flex-1 py-2.5 border border-dashed border-[#dfd5e8] text-[#6e568b] hover:text-[#2e075d] hover:bg-[#faf8fc] rounded-xl text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Custom Machined Tool</span>
                </button>
              </div>
            </div>

            {/* SECTION 3: COMMERCIAL TERMS & BANK DETAILS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Commercial Terms */}
              <div className="bg-[#fcfbfe] border border-[#dfd5e8] rounded-xl p-5 space-y-4 text-xs">
                <h4 className="font-heading font-medium text-xs text-[#2e075d] uppercase tracking-wider flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-[#5e3e8b]" />
                  <span>3. Commercial Conditions & Delivery</span>
                </h4>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Payment Terms</label>
                  <div className="space-y-1.5">
                    <select
                      value=""
                      onChange={e => {
                        if (e.target.value) {
                          setQuoteForm({ ...quoteForm, paymentTerms: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#dfd5e8] bg-[#faf8fc] text-[#5e3e8b] focus:border-[#5e3e8b] focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Quick-pick payment preset (or edit below) --</option>
                      <option value="50% advance, balance against Proforma Invoice / dispatch">
                        50% advance, balance against Proforma Invoice / dispatch (Standard)
                      </option>
                      <option value="100% advance against Proforma Invoice">
                        100% advance against Proforma Invoice
                      </option>
                      <option value="50% advance, balance against B/L copy (International Exports)">
                        50% advance, balance against B/L copy (Exports)
                      </option>
                      <option value="Net 30 days against authorized Purchase Order">
                        Net 30 days against authorized Purchase Order
                      </option>
                      <option value="Immediate settlement upon delivery">
                        Immediate settlement upon delivery
                      </option>
                    </select>
                    <input
                      type="text"
                      value={quoteForm.paymentTerms}
                      onChange={e => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                      placeholder="Enter custom payment terms (or leave empty to omit)"
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Dispatch & Delivery Timeline</label>
                  <input
                    type="text"
                    value={quoteForm.deliveryTimeline}
                    onChange={e => setQuoteForm({ ...quoteForm, deliveryTimeline: e.target.value })}
                    placeholder="e.g. Ex-stock / Ready for dispatch within 2-3 business days"
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Freight & Insurance Terms</label>
                  <input
                    type="text"
                    value={quoteForm.freightTerms}
                    onChange={e => setQuoteForm({ ...quoteForm, freightTerms: e.target.value })}
                    placeholder="e.g. Borne by consignee unless explicitly itemized above."
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Warranty / Guarantee Terms</label>
                  <input
                    type="text"
                    value={quoteForm.warrantyTerms}
                    onChange={e => setQuoteForm({ ...quoteForm, warrantyTerms: e.target.value })}
                    placeholder="e.g. 12 months manufacturer warranty against casting & grinding defects."
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">
                    Freight, Courier & Packaging Charges ({quoteForm.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quoteForm.freightCharges || ''}
                    onChange={e => setQuoteForm({ ...quoteForm, freightCharges: Math.max(0, parseFloat(e.target.value) || 0) })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white font-mono focus:border-[#5e3e8b] focus:outline-none"
                  />
                  <span className="text-[10px] text-[#9080a5] mt-0.5 block">
                    Enter 0 if freight is borne by consignee or included in tool prices.
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Special Customer Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={quoteForm.generalNotes}
                    onChange={e => setQuoteForm({ ...quoteForm, generalNotes: e.target.value })}
                    placeholder="Special terms, dimensional certifications, or workshop instructions..."
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
              </div>

              {/* Bank Remittance Details */}
              <div className="bg-[#fcfbfe] border border-[#dfd5e8] rounded-xl p-5 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-heading font-medium text-xs text-[#2e075d] uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#5e3e8b]" />
                    <span>4. Bank Remittance Details (For Invoice / Wire)</span>
                  </h4>
                  <label className="inline-flex items-center space-x-2 cursor-pointer select-none text-[11px] font-medium text-[#5e3e8b] bg-[#efe7f7] px-2.5 py-1 rounded-lg border border-[#dfd5e8] hover:bg-[#e5d8f2] transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(
                        quoteForm.bankName ||
                        quoteForm.accountName ||
                        quoteForm.accountNumber ||
                        quoteForm.ifscCode ||
                        quoteForm.branch
                      )}
                      onChange={e => {
                        if (e.target.checked) {
                          setQuoteForm(prev => ({
                            ...prev,
                            bankName: 'HDFC Bank Ltd',
                            accountName: 'PRAZTECH ENGINEERING',
                            accountNumber: '50200084729103',
                            ifscCode: 'HDFC0000123',
                            branch: 'Asaf Ali Road, New Delhi'
                          }));
                        } else {
                          setQuoteForm(prev => ({
                            ...prev,
                            bankName: '',
                            accountName: '',
                            accountNumber: '',
                            ifscCode: '',
                            branch: ''
                          }));
                        }
                      }}
                      className="rounded border-[#5e3e8b] text-[#2e075d] focus:ring-[#5e3e8b] cursor-pointer"
                    />
                    <span>Fill Bank Details</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={quoteForm.bankName}
                      onChange={e => setQuoteForm({ ...quoteForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">Branch</label>
                    <input
                      type="text"
                      value={quoteForm.branch}
                      onChange={e => setQuoteForm({ ...quoteForm, branch: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Account Beneficiary Name</label>
                  <input
                    type="text"
                    value={quoteForm.accountName}
                    onChange={e => setQuoteForm({ ...quoteForm, accountName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none font-semibold text-[#2e075d]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">Account Number</label>
                    <input
                      type="text"
                      value={quoteForm.accountNumber}
                      onChange={e => setQuoteForm({ ...quoteForm, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none font-mono font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">IFSC / Routing Code</label>
                    <input
                      type="text"
                      value={quoteForm.ifscCode}
                      onChange={e => setQuoteForm({ ...quoteForm, ifscCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] bg-white focus:border-[#5e3e8b] focus:outline-none font-mono font-medium"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#efe7f7] border border-[#dfd5e8] rounded-lg text-[11px] text-[#5e3e8b] leading-relaxed">
                  <strong>Executive Note:</strong> These bank credentials will appear on the generated commercial quotation PDF so the customer can execute RTGS / NEFT / IMPS wire transfers seamlessly.
                </div>
              </div>
            </div>

            {/* SECTION 4: LIVE FINANCIAL TOTALS SUMMARY BAR */}
            <div className="bg-white border-2 border-[#5e3e8b] rounded-2xl p-6 shadow-md space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dfd5e8] pb-4">
                <div>
                  <h4 className="font-heading font-medium text-base text-[#2e075d]">
                    Quotation Valuation Summary
                  </h4>
                  <p className="text-xs text-[#6e568b]">
                    Reference: <span className="font-mono font-semibold text-[#5e3e8b]">{quoteForm.quoteNumber}</span> • Customer: <span className="font-medium text-[#2e075d]">{quoteForm.customerName || 'Pending'}</span>
                  </p>
                </div>

                <div className="text-xs text-[#6e568b] bg-[#faf8fc] px-3.5 py-1.5 rounded-lg border border-[#dfd5e8]">
                  Amount in Words: <span className="font-medium text-[#2e075d] italic">{amountToWords(quoteFinancials.grandTotal, quoteForm.currency)}</span>
                </div>
              </div>

              {/* Totals Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="bg-[#fcfbfe] p-3 rounded-lg border border-[#dfd5e8]">
                  <span className="text-[10px] uppercase font-bold text-[#6e568b] block">Items Subtotal</span>
                  <span className="font-mono font-bold text-sm text-[#2e075d]">
                    {quoteForm.currencySymbol}{quoteFinancials.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-[#fcfbfe] p-3 rounded-lg border border-[#dfd5e8]">
                  <span className="text-[10px] uppercase font-bold text-[#6e568b] block">Total Discount</span>
                  <span className="font-mono font-bold text-sm text-rose-600">
                    - {quoteForm.currencySymbol}{quoteFinancials.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-[#fcfbfe] p-3 rounded-lg border border-[#dfd5e8]">
                  <span className="text-[10px] uppercase font-bold text-[#6e568b] block">Taxable Value</span>
                  <span className="font-mono font-bold text-sm text-[#2e075d]">
                    {quoteForm.currencySymbol}{quoteFinancials.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-[#fcfbfe] p-3 rounded-lg border border-[#dfd5e8]">
                  <span className="text-[10px] uppercase font-bold text-[#6e568b] block">GST / Tax Amount</span>
                  <span className="font-mono font-bold text-sm text-emerald-700">
                    + {quoteForm.currencySymbol}{quoteFinancials.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-[#fcfbfe] p-3 rounded-lg border border-[#dfd5e8]">
                  <span className="text-[10px] uppercase font-bold text-[#6e568b] block">Freight / Shipping</span>
                  <span className="font-mono font-bold text-sm text-[#2e075d]">
                    {quoteForm.currencySymbol}{quoteFinancials.freightCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-[#2e075d] text-white p-3 rounded-lg border border-[#2e075d] flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-purple-200 block">Grand Total</span>
                  <span className="font-mono font-bold text-base sm:text-lg text-white">
                    {quoteForm.currencySymbol}{quoteFinancials.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#dfd5e8]">
                <div className="flex items-center space-x-2 text-xs text-[#6e568b]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Authorized for PRAZTECH® Commercial Dispatches</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraftQuote}
                    className="px-4 py-2.5 rounded-lg border border-[#dfd5e8] bg-white text-[#2e075d] hover:bg-[#faf8fc] text-xs font-medium flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Save current quote to Past Quotations archive as Draft"
                  >
                    <Save className="w-4 h-4 text-[#5e3e8b]" />
                    <span>Save Draft to Archive</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePreviewQuoteModal}
                    className="px-4 py-2.5 rounded-lg border border-[#dfd5e8] bg-white text-[#2e075d] hover:bg-[#faf8fc] text-xs font-medium flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-[#5e3e8b]" />
                    <span>Preview PDF Quote</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQuotePDF}
                    className="px-4 py-2.5 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendQuoteToCustomer}
                    disabled={isSendingQuote}
                    className="px-5 py-2.5 rounded-lg bg-[#2e075d] hover:bg-[#431477] text-white text-xs font-semibold flex items-center space-x-2 shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSendingQuote ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Quote...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Quote to Customer & Save in Portal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── SECTION: PAST COMMERCIAL QUOTATION ENTRIES & ARCHIVE ── */}
            <div className="border border-[#dfd5e8] rounded-xl bg-white overflow-hidden shadow-xs">
              <div className="bg-[#faf8fc] border-b border-[#dfd5e8] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <ClipboardList className="w-5 h-5 text-[#5e3e8b]" />
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#2e075d]">
                      Past Commercial Quotation Entries
                    </h4>
                    <p className="text-[11px] text-[#6e568b]">
                      Historical archive of commercial quotations generated. Re-load into editor, preview, or re-download PDF anytime.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#9080a5] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search quote #, customer, company..."
                      value={pastQuoteSearch}
                      onChange={e => setPastQuoteSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-[#dfd5e8] text-xs bg-white focus:outline-none focus:border-[#5e3e8b] w-52 sm:w-64"
                    />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#efe7f7] text-[#5e3e8b] font-bold border border-[#dfd5e8]">
                    {filteredPastQuotes.length} Quotes
                  </span>
                </div>
              </div>

              {filteredPastQuotes.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <FileText className="w-8 h-8 text-[#9080a5] mx-auto opacity-50" />
                  <p className="text-xs font-medium text-[#2e075d]">No past quotation entries found</p>
                  <p className="text-[11px] text-[#6e568b]">
                    {pastQuoteSearch ? 'Try a different search keyword.' : 'Generate or save your first quotation above to archive it here.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f7f5fa] text-[#5e3e8b] uppercase text-[10px] tracking-wider border-b border-[#dfd5e8]">
                      <tr>
                        <th className="py-3 px-4 font-bold">Quote Ref</th>
                        <th className="py-3 px-4 font-bold">Date / Validity</th>
                        <th className="py-3 px-4 font-bold">Customer & Company</th>
                        <th className="py-3 px-4 font-bold">Items Quoted</th>
                        <th className="py-3 px-4 font-bold text-right">Grand Total</th>
                        <th className="py-3 px-4 font-bold text-center">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0eaf7]">
                      {filteredPastQuotes.map(pq => {
                        const statusBadge =
                          pq.status === 'Dispatched'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : pq.status === 'Downloaded'
                            ? 'bg-[#efe7f7] text-[#5e3e8b] border-[#dfd5e8]'
                            : 'bg-amber-50 text-amber-800 border-amber-200';

                        return (
                          <tr key={pq.id} className="hover:bg-[#faf8fc] transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-[#5e3e8b]">{pq.quoteNumber}</div>
                              <div className="text-[10px] text-[#9080a5]">{pq.currency} Quote</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-[#2e075d] font-medium">{formatDateDDMMYY(pq.quoteDate)}</div>
                              <div className="text-[10px] text-[#6e568b]">{pq.validityDays} Days Validity</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#2e075d]">{pq.customerName}</div>
                              <div className="text-[11px] text-[#6e568b]">{pq.company || 'Direct Workshop'}</div>
                              <div className="text-[10px] text-[#9080a5]">{pq.phone || pq.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-[#2e075d]">
                                {pq.itemsCount || pq.items?.length || 1} Tooling Item(s)
                              </div>
                              <div className="text-[10px] text-[#6e568b] truncate max-w-xs">
                                {pq.items?.map(it => it.modelNo).filter(Boolean).slice(0, 2).join(', ')}
                                {(pq.items?.length || 0) > 2 ? ' ...' : ''}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="font-mono font-bold text-sm text-[#2e075d]">
                                {pq.currencySymbol || '₹'}{Number(pq.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-[10px] text-[#6e568b]">
                                Tax: {pq.currencySymbol || '₹'}{Number(pq.taxTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusBadge}`}>
                                {pq.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleLoadPastQuoteIntoEditor(pq)}
                                  className="px-2.5 py-1 rounded bg-[#efe7f7] hover:bg-[#dfd5e8] text-[#5e3e8b] font-medium text-xs transition-colors cursor-pointer flex items-center space-x-1"
                                  title="Load this quotation back into the editor to re-price, edit, or re-send"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit / Re-Quote</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadPastQuotePDF(pq)}
                                  className="p-1.5 rounded border border-[#dfd5e8] hover:bg-white text-[#5e3e8b] transition-colors cursor-pointer"
                                  title="Download official PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePastQuote(pq.id, pq.quoteNumber)}
                                  className="p-1.5 rounded border border-[#dfd5e8] hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                                  title="Delete from history"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 6: PRODUCT SHOWCASE & OVERVIEW IMAGE GENERATOR ── */}
        {activeTab === 'product-showcase' && (
          <div className="p-6 sm:p-8 space-y-8">
            {/* Header & Subtitle */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#dfd5e8] pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-heading font-medium text-lg text-[#2e075d] flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5 text-[#5e3e8b]" />
                    <span>Product Showcase & Overview Image Generator</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#efe7f7] text-[#5e3e8b] border border-[#dfd5e8]">
                    High-Res Graphic Maker
                  </span>
                </div>
                <p className="text-xs text-[#6e568b] mt-1">
                  Select any catalog product to automatically populate a branded, high-resolution overview brochure/flyer image. Perfect for WhatsApp dispatches, customer email attachments, technical datasheets, and social media.
                </p>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyShowcaseToClipboard}
                  className="px-3.5 py-2 rounded-lg border border-[#dfd5e8] bg-white text-[#2e075d] hover:bg-[#faf8fc] text-xs font-medium flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Copy image to clipboard to paste into WhatsApp, Slack, or email"
                >
                  {showcaseCopySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#5e3e8b]" />}
                  <span>{showcaseCopySuccess ? 'Copied Image!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareShowcaseWhatsApp}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Share product specs on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadShowcasePNG}
                  className="px-4 py-2 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Download ultra high-resolution PNG image"
                >
                  <Download className="w-4 h-4" />
                  <span>Download HD PNG</span>
                </button>
              </div>
            </div>

            {/* Main Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Configuration Controls (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* 1. Product Selection */}
                <div className="border border-[#dfd5e8] rounded-xl p-5 bg-[#faf8fc] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs uppercase text-[#5e3e8b] tracking-wider flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>1. Select Tooling Product</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => activeShowcaseProduct && handleSelectProductForShowcase(activeShowcaseProduct)}
                      className="text-[11px] text-[#5e3e8b] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset to Defaults</span>
                    </button>
                  </div>

                  {/* Single Unified Searchable Product Combobox */}
                  <div ref={showcaseComboboxRef} className="relative">
                    <div className="relative flex items-center">
                      <div className="absolute left-3 pointer-events-none text-[#6e568b]">
                        <Search className="w-4 h-4" />
                      </div>

                      <input
                        type="text"
                        value={
                          showcaseIsFocused
                            ? showcaseSearch
                            : (activeShowcaseProduct ? `${activeShowcaseProduct.modelNo} — ${activeShowcaseProduct.name}` : '')
                        }
                        placeholder={
                          activeShowcaseProduct
                            ? `${activeShowcaseProduct.modelNo} — ${activeShowcaseProduct.name}`
                            : 'Type to search or select a tooling product...'
                        }
                        onFocus={() => {
                          setShowcaseIsFocused(true);
                          setShowcaseDropdownOpen(true);
                        }}
                        onChange={e => {
                          setShowcaseSearch(e.target.value);
                          setShowcaseDropdownOpen(true);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (showcaseFilteredProducts.length > 0) {
                              handleSelectProductForShowcase(showcaseFilteredProducts[0]);
                            }
                          } else if (e.key === 'Escape') {
                            setShowcaseDropdownOpen(false);
                            setShowcaseIsFocused(false);
                            setShowcaseSearch('');
                          }
                        }}
                        className="w-full pl-9 pr-16 py-2.5 text-xs font-medium border border-[#dfd5e8] rounded-lg bg-white focus:outline-none focus:border-[#5e3e8b] focus:ring-1 focus:ring-[#5e3e8b] text-[#2e075d] placeholder:text-[#9080a5]"
                      />

                      <div className="absolute right-2 flex items-center space-x-1">
                        {showcaseSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowcaseSearch('');
                              setShowcaseDropdownOpen(true);
                            }}
                            className="p-1 text-[#9080a5] hover:text-[#5e3e8b] rounded-full transition-colors cursor-pointer"
                            title="Clear search query"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowcaseDropdownOpen(prev => !prev);
                            setShowcaseIsFocused(true);
                          }}
                          className="p-1 text-[#9080a5] hover:text-[#5e3e8b] rounded transition-colors cursor-pointer"
                          title="Browse all products"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${showcaseDropdownOpen ? 'rotate-180 text-[#5e3e8b]' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Dropdown Results List */}
                    {showcaseDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#dfd5e8] rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-[#f5f1f9]">
                        <div className="px-3 py-1.5 bg-[#fbf9fd] text-[10px] font-bold text-[#6e568b] uppercase tracking-wider flex items-center justify-between">
                          <span>PRAZTECH® Catalog Tools ({showcaseFilteredProducts.length})</span>
                          {showcaseSearch && (
                            <span className="text-[#5e3e8b]">Filter: "{showcaseSearch}"</span>
                          )}
                        </div>

                        {showcaseFilteredProducts.length > 0 ? (
                          showcaseFilteredProducts.map(p => {
                            const isSelected = activeShowcaseProduct && (activeShowcaseProduct.id || activeShowcaseProduct.slug || activeShowcaseProduct.modelNo) === (p.id || p.slug || p.modelNo);
                            return (
                              <button
                                key={p.id || p.slug || p.modelNo}
                                type="button"
                                onClick={() => handleSelectProductForShowcase(p)}
                                className={`w-full px-3 py-2.5 flex items-center space-x-3 text-left transition-colors cursor-pointer ${
                                  isSelected ? 'bg-[#efe7f7]' : 'hover:bg-[#faf7fd]'
                                }`}
                              >
                                <img
                                  src={p.images?.[0] || '/images/placeholder.png'}
                                  alt={p.modelNo}
                                  className="w-9 h-9 rounded object-contain border border-[#dfd5e8] bg-[#f8f6fc] p-0.5 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-xs text-[#2e075d]">{p.modelNo}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#f0eaf6] text-[#5e3e8b] font-medium truncate max-w-[140px]">
                                      {p.category}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#5d5469] truncate mt-0.5">{p.name}</div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#5e3e8b] shrink-0" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-xs text-[#5d5469]">No tooling products match "{showcaseSearch}"</p>
                            <button
                              type="button"
                              onClick={() => setShowcaseSearch('')}
                              className="mt-1 text-xs text-[#5e3e8b] font-semibold hover:underline cursor-pointer"
                            >
                              Show all {catalogueList.length} products
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Active Product Quick Info */}
                  {activeShowcaseProduct && (
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-[#dfd5e8]">
                      <img
                        src={showcaseSelectedImage || activeShowcaseProduct.images?.[0] || '/images/placeholder.png'}
                        alt={activeShowcaseProduct.modelNo}
                        className="w-12 h-12 rounded object-contain border border-[#dfd5e8] bg-[#f8f6fc] p-1 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[#2e075d] truncate">{activeShowcaseProduct.modelNo}</div>
                        <div className="text-[11px] text-[#6e568b] truncate">{activeShowcaseProduct.name}</div>
                        <div className="text-[10px] text-[#9080a5]">{activeShowcaseProduct.category}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo Content Language */}
                <div className="border border-[#dfd5e8] rounded-xl p-5 bg-white space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs uppercase text-[#5e3e8b] tracking-wider flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Photo Content Language</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#efe7f7] text-[#5e3e8b] border border-[#dfd5e8]">
                      {LANGUAGES.find(l => l.code === showcaseLanguage)?.nativeName || 'English'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6e568b]">
                    Translate all graphic elements, headers, specifications, and brochure stamps directly onto the generated image.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGES.map(lang => {
                      const isSelected = showcaseLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleShowcaseLanguageChange(lang.code)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#5e3e8b] text-white border-[#5e3e8b] shadow-2xs font-semibold'
                              : 'bg-[#faf8fc] text-[#4a4058] border-[#dfd5e8] hover:bg-white hover:border-[#5e3e8b]'
                          }`}
                          title={`Generate graphic flyer in ${lang.name} (${lang.nativeName})`}
                        >
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Text & Copy Customization */}
                <div className="border border-[#dfd5e8] rounded-xl p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-xs uppercase text-[#5e3e8b] tracking-wider block">
                      2. Text & Copy Customization
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeShowcaseProduct) {
                          const copy = getProductTranslatedCopy(activeShowcaseProduct, showcaseLanguage);
                          setShowcaseProductTitle(copy.title);
                          setShowcaseTagline(copy.tagline);
                        }
                      }}
                      className="text-[11px] text-[#5e3e8b] hover:underline flex items-center space-x-1 cursor-pointer font-medium"
                      title="Re-populate title and tagline in selected language"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Auto-Translate Copy</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[#6e568b] block mb-1">Model Number (Smaller)</label>
                        <input
                          type="text"
                          value={showcaseHeadline}
                          onChange={e => setShowcaseHeadline(e.target.value)}
                          placeholder="e.g. VGS-1116"
                          className="w-full px-3 py-2 border border-[#dfd5e8] rounded-lg bg-white focus:outline-none focus:border-[#5e3e8b] font-bold text-[#5e3e8b]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-[#6e568b] block mb-1">Product Title (Bigger Headline)</label>
                        <input
                          type="text"
                          value={showcaseProductTitle}
                          onChange={e => setShowcaseProductTitle(e.target.value)}
                          placeholder="e.g. Valve Guide & Seat Reconditioning System"
                          className="w-full px-3 py-2 border border-[#dfd5e8] rounded-lg bg-white focus:outline-none focus:border-[#5e3e8b] font-extrabold text-[#2e075d]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#6e568b] block mb-1">Overview / Tagline</label>
                      <textarea
                        rows={3}
                        value={showcaseTagline}
                        onChange={e => setShowcaseTagline(e.target.value)}
                        className="w-full px-3 py-2 border border-[#dfd5e8] rounded-lg bg-white focus:outline-none focus:border-[#5e3e8b] resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#6e568b] block mb-1">Custom Promotional Note / Special Offer</label>
                      <input
                        type="text"
                        value={showcaseCustomNotes}
                        onChange={e => setShowcaseCustomNotes(e.target.value)}
                        placeholder="e.g. Includes complimentary diamond dresser & 1-year factory warranty"
                        className="w-full px-3 py-2 border border-[#dfd5e8] rounded-lg bg-white focus:outline-none focus:border-[#5e3e8b]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Content Modules */}
                <div className="border border-[#dfd5e8] rounded-xl p-5 bg-white space-y-3">
                  <span className="font-heading font-bold text-xs uppercase text-[#5e3e8b] tracking-wider block">
                    3. Content Modules
                  </span>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showcaseIncludeFeatures}
                        onChange={e => setShowcaseIncludeFeatures(e.target.checked)}
                        className="rounded border-[#dfd5e8] text-[#5e3e8b] focus:ring-[#5e3e8b]"
                      />
                      <span className="text-[#2e075d] font-medium">Include Key Engineering Advantages</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showcaseIncludeSpecs}
                        onChange={e => setShowcaseIncludeSpecs(e.target.checked)}
                        className="rounded border-[#dfd5e8] text-[#5e3e8b] focus:ring-[#5e3e8b]"
                      />
                      <span className="text-[#2e075d] font-medium">Include Technical Specifications Matrix</span>
                    </label>

                    {activeVariantData.hasOptions && (
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showcaseIncludeVariants}
                          onChange={e => setShowcaseIncludeVariants(e.target.checked)}
                          className="rounded border-[#dfd5e8] text-[#5e3e8b] focus:ring-[#5e3e8b]"
                        />
                        <span className="text-[#2e075d] font-medium">
                          Include Specification & Variant Card ({activeVariantData.badgeCount} {activeVariantData.badgeCount === 1 ? 'Option' : 'Options'})
                        </span>
                      </label>
                    )}

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showcaseIncludeApplications}
                        onChange={e => setShowcaseIncludeApplications(e.target.checked)}
                        className="rounded border-[#dfd5e8] text-[#5e3e8b] focus:ring-[#5e3e8b]"
                      />
                      <span className="text-[#2e075d] font-medium">Include Target Applications & Sectors</span>
                    </label>
                  </div>
                </div>

                {/* Quick Action Export Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadShowcasePNG}
                    className="flex-1 px-4 py-3 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-md transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download HD PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadShowcaseJPEG}
                    className="px-4 py-3 rounded-lg border border-[#dfd5e8] bg-white text-[#2e075d] hover:bg-[#faf8fc] text-xs font-medium flex items-center justify-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#5e3e8b]" />
                    <span>Download JPEG</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Interactive Preview (7 Cols) */}
              <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-6">
                <div className="border border-[#dfd5e8] rounded-xl bg-white overflow-hidden shadow-md">
                  {/* Preview Top Toolbar */}
                  <div className="bg-[#faf8fc] border-b border-[#dfd5e8] px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-xs text-[#2e075d]">Live Canvas Output</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#efe7f7] text-[#5e3e8b] font-bold">
                        {showcaseAspectRatio === 'portrait' ? '1200 x 1600 px (Portrait Flyer)' : '1200 x 1200 px (Square Card)'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowcaseZoomFit(!showcaseZoomFit)}
                        className="text-[11px] text-[#5e3e8b] hover:underline cursor-pointer"
                      >
                        {showcaseZoomFit ? 'Actual Size (100%)' : 'Fit Container'}
                      </button>
                    </div>
                  </div>

                  {/* Preview Canvas / Image Container */}
                  <div className="p-4 sm:p-6 bg-[#f3edf7] flex items-center justify-center min-h-[480px] overflow-auto">
                    {isGeneratingShowcase && !showcasePreviewDataUrl ? (
                      <div className="flex flex-col items-center justify-center p-12 space-y-3">
                        <RefreshCw className="w-8 h-8 text-[#5e3e8b] animate-spin" />
                        <span className="text-xs text-[#6e568b]">Generating high-resolution showcase image...</span>
                      </div>
                    ) : showcasePreviewDataUrl ? (
                      <div className={`relative transition-all duration-200 ${showcaseZoomFit ? 'w-full max-w-lg' : 'w-auto'}`}>
                        <img
                          src={showcasePreviewDataUrl}
                          alt="Product Showcase Preview"
                          className="w-full h-auto rounded-lg shadow-xl border border-[#dfd5e8] object-contain bg-white"
                        />
                        {isGeneratingShowcase && (
                          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                            <div className="bg-[#2e075d] text-white px-3 py-1.5 rounded-full text-xs flex items-center space-x-2 shadow-lg">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating Preview...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-12 text-[#9080a5] text-xs">
                        Select a product on the left to render the showcase preview.
                      </div>
                    )}
                  </div>

                  {/* Preview Footer Strip */}
                  <div className="p-4 bg-white border-t border-[#dfd5e8] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2 text-[#6e568b] text-[11px]">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Ready for commercial WhatsApp sharing, brochures & flyers</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleCopyShowcaseToClipboard}
                        className="px-3 py-1.5 rounded-lg border border-[#dfd5e8] text-[#5e3e8b] hover:bg-[#faf8fc] text-xs font-medium flex items-center space-x-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadShowcasePNG}
                        className="px-3.5 py-1.5 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium flex items-center space-x-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PNG</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Offscreen 1104px DOM node for pixel-perfect HTML card capture */}
            {activeShowcaseProduct?.subModels && activeShowcaseProduct.subModels.length > 0 && (
              <div
                id="product-showcase-variant-capture-wrapper"
                style={{
                  position: 'fixed',
                  left: '0px',
                  top: '0px',
                  width: '1104px',
                  zIndex: -9999,
                  opacity: 0.001,
                  pointerEvents: 'none',
                  overflow: 'hidden'
                }}
              >
                <div
                  id="product-showcase-variant-card-1104"
                  data-product-slug={activeShowcaseProduct.slug}
                  className="bg-white rounded-xl border border-[#dfd5e8] p-5 space-y-4 shadow-sm"
                  style={{ width: '1104px', boxSizing: 'border-box' }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#dfd5e8]">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#5e3e8b]" />
                      <span className="font-medium text-xs text-[#2e075d]">
                        {getShowcaseText('specAndVariant', showcaseLanguage)}
                      </span>
                    </div>
                    <span className="text-[11px] text-industrial-500 font-mono">
                      {activeShowcaseProduct.subModels.length} {getShowcaseText('options', showcaseLanguage)}
                    </span>
                  </div>
                  <SubModelSelector
                    productSlug={activeShowcaseProduct.slug}
                    subModels={activeShowcaseProduct.subModels}
                    selectedSubModel={null}
                    onSelect={() => {}}
                    variantOptionNames={(activeShowcaseProduct as any).variantOptionNames}
                    unselected={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: PREVIEW COMMERCIAL QUOTATION ── */}
      {isPreviewingQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-[#dfd5e8] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b border-[#dfd5e8] px-6 py-4 bg-[#faf8fc]">
              <div className="flex items-center space-x-2.5">
                <span className="font-heading font-medium text-base text-[#2e075d]">
                  Official Commercial Quotation Preview
                </span>
                <span className="font-mono text-xs bg-[#efe7f7] text-[#5e3e8b] px-2.5 py-0.5 rounded border border-[#dfd5e8] font-bold">
                  {quoteForm.quoteNumber}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDownloadQuotePDF}
                  className="px-3 py-1.5 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg border border-[#dfd5e8] text-[#6e568b] hover:text-[#2e075d] hover:bg-white text-xs cursor-pointer"
                  title="Print Quotation"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewingQuoteModal(false)}
                  className="p-1.5 text-[#9080a5] hover:text-[#2e075d] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Rendered Letterhead Quotation Sheet */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#f5f3f8]">
              <div className="bg-white rounded-xl border border-[#dfd5e8] p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl mx-auto text-xs text-[#2e075d]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-[#5e3e8b]">
                  <div className="flex flex-col justify-center">
                    <img
                      src="/images/logo-black.png"
                      alt="PRAZTECH® Engineering"
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                  <div className="text-right text-[11px] text-[#6e568b] space-y-0.5">
                    <div>Asaf Ali Rd, Delhi, 110002, India</div>
                    <div>Email: <span className="text-[#2e075d] font-medium">xiscoenterprises@gmail.com</span></div>
                    <div>Phone: <span className="text-[#2e075d] font-medium">+91 8744020102</span></div>
                    <div>Web: <span className="text-[#5e3e8b] font-medium">https://www.praztechtools.com</span></div>
                  </div>
                </div>

                {/* Quotation Title Banner */}
                <div className="bg-[#2e075d] text-white py-2 text-center rounded font-heading font-bold text-sm tracking-wide">
                  OFFICIAL COMMERCIAL PROFORMA QUOTATION
                </div>

                {/* Metadata Strip */}
                {(quoteForm.quoteNumber?.trim() || quoteForm.quoteDate?.trim() || quoteForm.validityDays || quoteForm.currency?.trim()) && (
                  <div className="bg-[#faf8fc] border border-[#dfd5e8] p-3 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {quoteForm.quoteNumber?.trim() && (
                      <div>
                        <span className="text-[10px] text-[#6e568b] uppercase font-bold block">Quotation No</span>
                        <span className="font-mono font-bold text-[#5e3e8b]">{quoteForm.quoteNumber}</span>
                      </div>
                    )}
                    {quoteForm.quoteDate?.trim() && (
                      <div>
                        <span className="text-[10px] text-[#6e568b] uppercase font-bold block">Quotation Date</span>
                        <span className="font-medium text-[#2e075d]">{formatDateDDMMYY(quoteForm.quoteDate)}</span>
                      </div>
                    )}
                    {quoteForm.quoteDate?.trim() && quoteForm.validityDays > 0 && (
                      <div>
                        <span className="text-[10px] text-[#6e568b] uppercase font-bold block">Valid Until</span>
                        <span className="font-medium text-[#2e075d]">
                          {formatDateDDMMYY(new Date(new Date(quoteForm.quoteDate).getTime() + quoteForm.validityDays * 86400000))} ({quoteForm.validityDays} Days)
                        </span>
                      </div>
                    )}
                    {quoteForm.currency?.trim() && (
                      <div>
                        <span className="text-[10px] text-[#6e568b] uppercase font-bold block">Currency</span>
                        <span className="font-bold text-[#2e075d]">{quoteForm.currency} ({quoteForm.currencySymbol})</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Buyer / Consignee Details */}
                {(() => {
                  const addrStr = [quoteForm.address, quoteForm.city, quoteForm.state, quoteForm.country]
                    .map(s => (s || '').trim())
                    .filter(Boolean)
                    .join(', ');
                  const phoneStr = (quoteForm.phone || quoteForm.whatsapp || '').trim();
                  const hasCustomer = !!(
                    quoteForm.customerName?.trim() ||
                    quoteForm.company?.trim() ||
                    addrStr ||
                    quoteForm.email?.trim() ||
                    phoneStr ||
                    quoteForm.gstin?.trim()
                  );
                  if (!hasCustomer) return null;
                  return (
                    <div className="border border-[#dfd5e8] rounded-lg p-4 space-y-2">
                      <div className="text-[11px] font-bold uppercase text-[#5e3e8b] tracking-wider">
                        Buyer / Consignee Details
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          {quoteForm.customerName?.trim() && (
                            <div className="font-bold text-sm text-[#2e075d]">{quoteForm.customerName}</div>
                          )}
                          {quoteForm.company?.trim() && (
                            <div className="text-[#6e568b]">{quoteForm.company}</div>
                          )}
                          {addrStr && (
                            <div className="text-[#6e568b] mt-1">{addrStr}</div>
                          )}
                        </div>
                        <div className="space-y-1 text-right sm:text-right">
                          {quoteForm.email?.trim() && (
                            <div><span className="text-[#6e568b]">Email: </span><span className="font-mono font-medium">{quoteForm.email}</span></div>
                          )}
                          {phoneStr && (
                            <div><span className="text-[#6e568b]">Phone: </span><span className="font-mono font-medium">{phoneStr}</span></div>
                          )}
                          {quoteForm.gstin?.trim() && (
                            <div><span className="text-[#6e568b]">GSTIN: </span><span className="font-mono font-medium">{quoteForm.gstin}</span></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Itemized Table */}
                {quoteItems.some(it => it.modelNo?.trim() || it.name?.trim() || it.selectedVariant?.trim() || it.notes?.trim() || Number(it.unitPrice) > 0) && (
                <div className="overflow-x-auto border border-[#dfd5e8] rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#2e075d] text-white text-[11px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Photo</th>
                        <th className="py-2.5 px-3">Model / SKU</th>
                        <th className="py-2.5 px-3">Description & Specifications</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate ({quoteForm.currencySymbol})</th>
                        <th className="py-2.5 px-3 text-center">Disc %</th>
                        <th className="py-2.5 px-3 text-center">GST %</th>
                        <th className="py-2.5 px-3 text-right">Total ({quoteForm.currencySymbol})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dfd5e8]">
                      {quoteItems.map((it, idx) => {
                        const matchedProduct = catalogueList.find(p => p.modelNo === it.modelNo || p.name === it.name);
                        const photoUrl = it.image || matchedProduct?.images?.[0];
                        return (
                          <tr key={it.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8fc]'}>
                            <td className="py-2.5 px-3 font-medium text-[#6e568b]">{idx + 1}</td>
                            <td className="py-2 px-3">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={it.name}
                                  className="w-10 h-10 object-contain rounded border border-[#dfd5e8] bg-white p-0.5"
                                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded border border-dashed border-[#dfd5e8] bg-[#f5f3f8] flex items-center justify-center text-[9px] text-[#9080a5]">
                                  {it.isCustom ? 'Custom' : 'Tool'}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#2e075d]">{it.modelNo}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-[#2e075d]">{it.name}</div>
                              {it.selectedVariant && (
                                <div className="text-[11px] text-[#5e3e8b]">Option: {it.selectedVariant}</div>
                              )}
                              {it.notes && (
                                <div className="text-[10px] text-[#6e568b] italic">Note: {it.notes}</div>
                              )}
                              {matchedProduct && (
                                <div className="mt-1 space-y-0.5 text-[10px] text-[#6e568b]">
                                  {matchedProduct.compatibility && (
                                    <div><strong>Compatibility:</strong> {matchedProduct.compatibility}</div>
                                  )}
                                  {matchedProduct.sizesDetail && matchedProduct.sizesDetail.length > 0 && (
                                    <div><strong>Sizes:</strong> {matchedProduct.sizesDetail.join(', ')}</div>
                                  )}
                                  {matchedProduct.itemSpecifics && Object.keys(matchedProduct.itemSpecifics).length > 0 && (
                                    <div>
                                      <strong>Specs:</strong>{' '}
                                      {Object.entries(matchedProduct.itemSpecifics).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                    </div>
                                  )}
                                  {matchedProduct.setIncludes && matchedProduct.setIncludes.length > 0 && (
                                    <div><strong>Includes:</strong> {matchedProduct.setIncludes.join(', ')}</div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-[#2e075d]">{it.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {Number(it.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center text-[#6e568b]">
                              {it.discountPercent ? `${it.discountPercent}%` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center text-[#6e568b]">{it.gstRate ? `${it.gstRate}%` : '0%'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2e075d]">
                              {Number(it.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}

                {/* Summary & Terms Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                  {/* Left Column: Words, Bank Details, Terms */}
                  <div className="md:col-span-7 space-y-4">
                    {quoteFinancials.grandTotal > 0 && (
                      <div className="bg-[#fcfbfe] border border-[#dfd5e8] p-3 rounded-lg">
                        <div className="text-[10px] uppercase font-bold text-[#6e568b]">Amount Chargeable (in words)</div>
                        <div className="font-semibold text-xs text-[#2e075d] italic mt-0.5">
                          {amountToWords(quoteFinancials.grandTotal, quoteForm.currency)}
                        </div>
                      </div>
                    )}

                    {(quoteForm.bankName?.trim() || quoteForm.branch?.trim() || quoteForm.accountName?.trim() || quoteForm.accountNumber?.trim() || quoteForm.ifscCode?.trim()) && (
                      <div className="bg-[#faf8fc] border border-[#dfd5e8] p-3 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-[#5e3e8b] text-[11px] uppercase tracking-wide">
                          Direct Bank Wire Transfer (NEFT / RTGS / IMPS)
                        </div>
                        {(quoteForm.bankName?.trim() || quoteForm.branch?.trim()) && (
                          <div className="text-[#2e075d]">
                            {quoteForm.bankName?.trim() && <>Bank: <span className="font-semibold">{quoteForm.bankName}</span></>}
                            {quoteForm.bankName?.trim() && quoteForm.branch?.trim() && ' • '}
                            {quoteForm.branch?.trim() && <>Branch: <span className="font-medium">{quoteForm.branch}</span></>}
                          </div>
                        )}
                        {quoteForm.accountName?.trim() && (
                          <div className="text-[#2e075d]">
                            Beneficiary: <span className="font-bold">{quoteForm.accountName}</span>
                          </div>
                        )}
                        {(quoteForm.accountNumber?.trim() || quoteForm.ifscCode?.trim()) && (
                          <div className="font-mono text-[#2e075d]">
                            {quoteForm.accountNumber?.trim() && <>A/C No: <span className="font-bold text-[#5e3e8b]">{quoteForm.accountNumber}</span></>}
                            {quoteForm.accountNumber?.trim() && quoteForm.ifscCode?.trim() && ' • '}
                            {quoteForm.ifscCode?.trim() && <>IFSC: <span className="font-bold text-[#5e3e8b]">{quoteForm.ifscCode}</span></>}
                          </div>
                        )}
                      </div>
                    )}

                    {(quoteForm.paymentTerms?.trim() || quoteForm.deliveryTimeline?.trim() || quoteForm.freightTerms?.trim() || quoteForm.warrantyTerms?.trim() || quoteForm.generalNotes?.trim()) && (
                      <div className="text-[11px] text-[#6e568b] space-y-1">
                        {quoteForm.paymentTerms?.trim() && <div>• <strong>Payment Terms:</strong> {quoteForm.paymentTerms}</div>}
                        {quoteForm.deliveryTimeline?.trim() && <div>• <strong>Delivery Lead Time:</strong> {quoteForm.deliveryTimeline}</div>}
                        {quoteForm.freightTerms?.trim() && <div>• <strong>Freight & Insurance:</strong> {quoteForm.freightTerms}</div>}
                        {quoteForm.warrantyTerms?.trim() && <div>• <strong>Guarantee:</strong> {quoteForm.warrantyTerms}</div>}
                        {quoteForm.generalNotes?.trim() && (
                          <div className="whitespace-pre-wrap break-words">• <strong>Remarks:</strong> {quoteForm.generalNotes}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Financial Figures */}
                  <div className="md:col-span-5 space-y-2 border border-[#dfd5e8] p-4 rounded-lg bg-[#fcfbfe] text-xs">
                    {(quoteFinancials.subtotal > 0 || quoteFinancials.discountTotal > 0 || quoteFinancials.taxableAmount > 0 || quoteFinancials.taxTotal > 0 || quoteFinancials.freightCharges > 0 || quoteFinancials.grandTotal > 0) && (
                      <>
                        <div className="flex justify-between text-[#6e568b]">
                          <span>Items Subtotal:</span>
                          <span className="font-mono font-medium text-[#2e075d]">
                            {quoteForm.currencySymbol}{quoteFinancials.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {quoteFinancials.discountTotal > 0 && (
                          <div className="flex justify-between text-rose-600">
                            <span>Total Discount:</span>
                            <span className="font-mono font-medium">
                              - {quoteForm.currencySymbol}{quoteFinancials.discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between text-[#6e568b]">
                          <span>Taxable Value:</span>
                          <span className="font-mono font-medium text-[#2e075d]">
                            {quoteForm.currencySymbol}{quoteFinancials.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex justify-between text-emerald-700">
                          <span>GST / Taxes:</span>
                          <span className="font-mono font-medium">
                            + {quoteForm.currencySymbol}{quoteFinancials.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {quoteFinancials.freightCharges > 0 && (
                          <div className="flex justify-between text-[#6e568b]">
                            <span>Freight & Handling:</span>
                            <span className="font-mono font-medium text-[#2e075d]">
                              {quoteForm.currencySymbol}{quoteFinancials.freightCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#dfd5e8] flex justify-between items-center text-sm font-bold text-[#2e075d] bg-[#efe7f7] p-2.5 rounded">
                          <span>TOTAL PAYABLE:</span>
                          <span className="font-mono text-base text-[#5e3e8b]">
                            {quoteForm.currencySymbol}{quoteFinancials.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="pt-6 text-center text-xs text-[#6e568b]">
                      <div className="font-semibold text-[#2e075d]">For PRAZTECH® ENGINEERING</div>
                      <div className="h-10"></div>
                      <div className="border-t border-dashed border-[#dfd5e8] pt-1 text-[10px] text-[#9080a5]">
                        Authorized Signatory • Commercial Sales Desk
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="pt-4 border-t border-[#dfd5e8] text-center text-[10px] text-[#9080a5]">
                  This is an official computer-generated commercial quotation issued electronically by PRAZTECH® Engineering.
                  All prices and terms are valid as stated. • Official Website: www.praztechtools.com
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="border-t border-[#dfd5e8] px-6 py-4 bg-white flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPreviewingQuoteModal(false)}
                className="px-4 py-2 rounded-lg border border-[#dfd5e8] text-xs font-medium text-[#6e568b] hover:bg-[#faf8fc] cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleDownloadQuotePDF}
                  className="px-4 py-2 rounded-lg bg-[#5e3e8b] hover:bg-[#6e568b] text-white text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Quote</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendQuoteToCustomer}
                  disabled={isSendingQuote}
                  className="px-5 py-2 rounded-lg bg-[#2e075d] hover:bg-[#431477] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingQuote ? 'Sending Quote...' : 'Send Quote & Record in Portal'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: INSPECT ENQUIRY DETAILS ── */}
      {inspectingEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-[#dfd5e8] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dfd5e8] pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-medium text-xs text-[#2e075d] bg-[#efe7f7] px-2.5 py-1 rounded border border-[#dfd5e8]">
                  {inspectingEnquiry.referenceNumber}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${STATUS_STYLES[inspectingEnquiry.status]}`}>
                  {inspectingEnquiry.status}
                </span>
              </div>
              <button onClick={() => setInspectingEnquiry(null)} className="p-1 text-[#9080a5] hover:text-[#2e075d]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[#f7f5fa] p-3.5 rounded-lg border border-[#dfd5e8] space-y-1.5">
                <div className="font-medium text-sm text-[#2e075d]">{inspectingEnquiry.customerSnapshot?.fullName}</div>
                <div className="text-[#6e568b]">{inspectingEnquiry.customerSnapshot?.company || 'Direct Workshop Client'}</div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[#6e568b]">
                  <div>Email: <span className="font-mono text-[#2e075d]">{inspectingEnquiry.customerSnapshot?.email}</span></div>
                  <div>Phone: <span className="font-mono text-[#2e075d]">{inspectingEnquiry.customerSnapshot?.phone}</span></div>
                  <div>Location: <span className="text-[#2e075d]">{inspectingEnquiry.customerSnapshot?.city}, {inspectingEnquiry.customerSnapshot?.country}</span></div>
                  <div>Submitted: <span className="text-[#2e075d]">{formatDateDDMMYY(inspectingEnquiry.submittedAt)}</span></div>
                </div>
              </div>

              <div>
                <div className="font-medium text-[#2e075d] mb-2">Itemized Products & Quantities:</div>
                <div className="divide-y divide-[#f0ebf5] border border-[#dfd5e8] rounded-lg overflow-hidden">
                  {(inspectingEnquiry.catalogueItems || []).map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-medium text-[#5e3e8b]">{it.modelNo}</div>
                        <div className="font-medium text-[#2e075d]">{it.name}</div>
                        {it.notes && <div className="text-[#6e568b] text-[11px] mt-0.5">{it.notes}</div>}
                      </div>
                      <div className="font-mono text-sm font-medium bg-[#efe7f7] text-[#2e075d] px-2.5 py-1 rounded">
                        Qty: {it.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {inspectingEnquiry.generalNotes && (
                <div className="p-3 bg-[#faf8fc] border border-[#dfd5e8] rounded-lg">
                  <div className="font-medium text-[#2e075d] mb-0.5">Workshop Requirement Notes:</div>
                  <div className="text-[#6e568b] leading-relaxed">{inspectingEnquiry.generalNotes}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#dfd5e8]">
              <div className="flex items-center space-x-2">
                <a
                  href={getWhatsAppUrl(
                    inspectingEnquiry.customerSnapshot?.whatsapp || inspectingEnquiry.customerSnapshot?.phone || '',
                    inspectingEnquiry.customerSnapshot?.fullName || '',
                    inspectingEnquiry.referenceNumber
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Chat</span>
                </a>

                <a
                  href={getEmailUrl(
                    inspectingEnquiry.customerSnapshot?.email || '',
                    inspectingEnquiry.customerSnapshot?.fullName || '',
                    inspectingEnquiry.referenceNumber
                  )}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#efe7f7] text-[#5e3e8b] border border-[#dfd5e8] hover:bg-[#e4d8f0] text-xs font-medium"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </a>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`/api/enquiries/${inspectingEnquiry.referenceNumber}/download`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#5e3e8b] text-white hover:bg-[#6e568b] text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Quote</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT ENQUIRY ── */}
      {editingEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full border border-[#dfd5e8] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dfd5e8] pb-3">
              <h3 className="font-heading font-medium text-base text-[#2e075d]">
                Edit Enquiry • {editingEnquiry.referenceNumber}
              </h3>
              <button onClick={() => setEditingEnquiry(null)} className="p-1 text-[#9080a5] hover:text-[#2e075d]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedEnquiry} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#2e075d] mb-1">Status Workflow Stage</label>
                <select
                  value={normalizeStatus(editingEnquiry.status)}
                  onChange={e => setEditingEnquiry({ ...editingEnquiry, status: e.target.value as EnquiryStatus })}
                  className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none bg-white font-medium"
                >
                  <option value="Review Pending">Review Pending</option>
                  <option value="Quotation Dispatched">Quotation Dispatched</option>
                  <option value="Blueprint Review">Blueprint Review</option>
                  <option value="Order Confirmed">Order Confirmed</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#2e075d] mb-1">General Workshop Notes</label>
                <textarea
                  rows={3}
                  value={editingEnquiry.generalNotes || ''}
                  onChange={e => setEditingEnquiry({ ...editingEnquiry, generalNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#dfd5e8]">
                <button
                  type="button"
                  onClick={() => setEditingEnquiry(null)}
                  className="px-3.5 py-2 rounded-lg border border-[#dfd5e8] text-[#6e568b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#5e3e8b] text-white hover:bg-[#6e568b] font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD MANUAL CUSTOMER ── */}
      {isAddingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full border border-[#dfd5e8] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dfd5e8] pb-3">
              <h3 className="font-heading font-medium text-base text-[#2e075d]">
                Add New Customer Profile
              </h3>
              <button onClick={() => setIsAddingCustomer(false)} className="p-1 text-[#9080a5] hover:text-[#2e075d]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={manualCustomerForm.fullName}
                    onChange={e => setManualCustomerForm({ ...manualCustomerForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Company / Workshop Name</label>
                  <input
                    type="text"
                    value={manualCustomerForm.company}
                    onChange={e => setManualCustomerForm({ ...manualCustomerForm, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={manualCustomerForm.email}
                    onChange={e => setManualCustomerForm({ ...manualCustomerForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={manualCustomerForm.phone}
                    onChange={e => setManualCustomerForm({ ...manualCustomerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">City</label>
                  <input
                    type="text"
                    value={manualCustomerForm.city}
                    onChange={e => setManualCustomerForm({ ...manualCustomerForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">State</label>
                  <input
                    type="text"
                    value={manualCustomerForm.state}
                    onChange={e => setManualCustomerForm({ ...manualCustomerForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Country</label>
                  <input
                    type="text"
                    value={manualCustomerForm.country}
                    onChange={e => setManualCustomerForm({ ...manualCustomerForm, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2e075d] mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={manualCustomerForm.gstin}
                  onChange={e => setManualCustomerForm({ ...manualCustomerForm, gstin: e.target.value })}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#dfd5e8]">
                <button
                  type="button"
                  onClick={() => setIsAddingCustomer(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#dfd5e8] text-[#6e568b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#5e3e8b] text-white hover:bg-[#6e568b] font-medium"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT CUSTOMER ── */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full border border-[#dfd5e8] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dfd5e8] pb-3">
              <h3 className="font-heading font-medium text-base text-[#2e075d]">
                Edit Customer Details
              </h3>
              <button onClick={() => setEditingCustomer(null)} className="p-1 text-[#9080a5] hover:text-[#2e075d]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.fullName}
                    onChange={e => setEditingCustomer({ ...editingCustomer, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Company</label>
                  <input
                    type="text"
                    value={editingCustomer.company}
                    onChange={e => setEditingCustomer({ ...editingCustomer, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingCustomer.email}
                    onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={editingCustomer.phone}
                    onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">City</label>
                  <input
                    type="text"
                    value={editingCustomer.city}
                    onChange={e => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">State</label>
                  <input
                    type="text"
                    value={editingCustomer.state}
                    onChange={e => setEditingCustomer({ ...editingCustomer, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2e075d] mb-1">Country</label>
                  <input
                    type="text"
                    value={editingCustomer.country}
                    onChange={e => setEditingCustomer({ ...editingCustomer, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#dfd5e8]">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-3.5 py-2 rounded-lg border border-[#dfd5e8] text-[#6e568b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#5e3e8b] text-white hover:bg-[#6e568b] font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD MANUAL ENQUIRY ── */}
      {isAddingEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#dfd5e8] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#dfd5e8] px-6 py-4 bg-[#faf8fc]">
              <div>
                <h3 className="font-heading font-medium text-base text-[#2e075d]">
                  Log Manual Quotation Enquiry
                </h3>
                <p className="text-xs text-[#9080a5]">Direct executive entry for phone, walk-in, or email RFQs</p>
              </div>
              <button onClick={() => setIsAddingEnquiry(false)} className="p-1 text-[#9080a5] hover:text-[#2e075d]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualEnquiry} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Optional Customer Autofill */}
              {customersList.length > 0 && (
                <div className="bg-[#f5effb] p-3 rounded-lg border border-[#dfd5e8]">
                  <label className="block text-[11px] font-semibold text-[#2e075d] mb-1">
                    Autofill from Registered Customer (Optional)
                  </label>
                  <select
                    onChange={e => {
                      const selected = customersList.find(c => (c._id || c.id) === e.target.value);
                      if (selected) {
                        setManualEnquiryForm(prev => ({
                          ...prev,
                          customerName: selected.fullName || '',
                          company: selected.company || '',
                          email: selected.email || '',
                          phone: selected.phone || '',
                          whatsapp: selected.whatsapp || selected.phone || '',
                          city: selected.city || '',
                          state: selected.state || '',
                          country: selected.country || 'India'
                        }));
                      }
                    }}
                    defaultValue=""
                    className="w-full px-2.5 py-1.5 rounded-md border border-[#dfd5e8] bg-white text-xs text-[#2e075d] focus:border-[#5e3e8b] focus:outline-none"
                  >
                    <option value="">-- Choose an existing customer to auto-fill --</option>
                    {customersList.map(c => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.fullName} {c.company ? `(${c.company})` : ''} — {c.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Details */}
              <div className="space-y-3">
                <h4 className="font-heading font-medium text-xs text-[#2e075d] uppercase tracking-wider">
                  Customer & Buyer Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={manualEnquiryForm.customerName}
                      onChange={e => setManualEnquiryForm({ ...manualEnquiryForm, customerName: e.target.value })}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">Company</label>
                    <input
                      type="text"
                      value={manualEnquiryForm.company}
                      onChange={e => setManualEnquiryForm({ ...manualEnquiryForm, company: e.target.value })}
                      placeholder="e.g. Gujarat Head Rebuilders"
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={manualEnquiryForm.email}
                      onChange={e => setManualEnquiryForm({ ...manualEnquiryForm, email: e.target.value })}
                      placeholder="buyer@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">Phone / Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={manualEnquiryForm.phone}
                      onChange={e => setManualEnquiryForm({ ...manualEnquiryForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      value={manualEnquiryForm.whatsapp}
                      onChange={e => setManualEnquiryForm({ ...manualEnquiryForm, whatsapp: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">City</label>
                    <input
                      type="text"
                      value={manualEnquiryForm.city}
                      onChange={e => setManualEnquiryForm({ ...manualEnquiryForm, city: e.target.value })}
                      placeholder="Ahmedabad"
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#2e075d] mb-1">State</label>
                    <input
                      type="text"
                      value={manualEnquiryForm.state}
                      onChange={e => setManualEnquiryForm({ ...manualEnquiryForm, state: e.target.value })}
                      placeholder="Gujarat"
                      className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Tool / Product Selection */}
              <div className="space-y-3 pt-3 border-t border-[#dfd5e8]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-medium text-xs text-[#2e075d] uppercase tracking-wider">
                      Enquired Products & Tools ({manualEnquiryForm.items.length})
                    </h4>
                    <p className="text-[11px] text-[#9080a5]">Add all products requested in this RFQ with individual quantities and notes</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemToEnquiry}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs rounded-md bg-[#efe7f7] text-[#2e075d] hover:bg-[#dfd5e8] font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tool</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {manualEnquiryForm.items.map((item, idx) => (
                    <div key={idx} className="bg-[#faf8fc] p-3 rounded-lg border border-[#dfd5e8] space-y-2 relative">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#5e3e8b]">
                        <span>Item #{idx + 1}</span>
                        {manualEnquiryForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromEnquiry(idx)}
                            className="text-red-500 hover:text-red-700 inline-flex items-center space-x-1"
                            title="Remove this item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-medium text-[#2e075d] mb-1">Catalogue Product *</label>
                          <select
                            value={item.productSlug}
                            onChange={e => handleItemFieldChange(idx, 'productSlug', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#dfd5e8] bg-white text-xs focus:border-[#5e3e8b] focus:outline-none"
                          >
                            {catalogueList.map(p => (
                              <option key={p.slug} value={p.slug}>
                                {p.modelNo} — {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[#2e075d] mb-1">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => handleItemFieldChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#dfd5e8] text-xs focus:border-[#5e3e8b] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#2e075d] mb-1">
                          Tool Specification / Size / Custom Requirements
                        </label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={e => handleItemFieldChange(idx, 'notes', e.target.value)}
                          placeholder="e.g. Star drive holder with Sioux 45° ruby stone, pilot size 7.0mm"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#dfd5e8] text-xs focus:border-[#5e3e8b] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToEnquiry}
                  className="w-full py-2 border border-dashed border-[#5e3e8b] text-[#5e3e8b] hover:bg-[#efe7f7] rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Product to this Quotation</span>
                </button>
              </div>

              {/* General Quotation Notes */}
              <div className="pt-2 border-t border-[#dfd5e8]">
                <label className="block font-medium text-[#2e075d] mb-1">General Commercial Notes / Terms</label>
                <textarea
                  rows={2}
                  value={manualEnquiryForm.generalNotes}
                  onChange={e => setManualEnquiryForm({ ...manualEnquiryForm, generalNotes: e.target.value })}
                  placeholder="e.g. Client requested urgent dispatch by courier; 50% advance invoice required."
                  className="w-full px-3 py-2 rounded-lg border border-[#dfd5e8] focus:border-[#5e3e8b] focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#dfd5e8]">
                <button
                  type="button"
                  onClick={() => setIsAddingEnquiry(false)}
                  className="px-4 py-2 rounded-lg border border-[#dfd5e8] text-[#6e568b] hover:bg-[#faf8fc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEnquiry}
                  className="px-5 py-2 rounded-lg bg-[#5e3e8b] text-white hover:bg-[#6e568b] font-medium shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingEnquiry ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Enquiry...</span>
                    </>
                  ) : (
                    <span>Create Quotation Enquiry ({manualEnquiryForm.items.length} {manualEnquiryForm.items.length === 1 ? 'Tool' : 'Tools'})</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
