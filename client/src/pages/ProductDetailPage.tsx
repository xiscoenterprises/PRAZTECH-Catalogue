import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Product, SubModel } from '../types';
import { useCart } from '../context/CartContext';
import { SubModelSelector } from '../components/SubModelSelector';
import { ProductCard } from '../components/ProductCard';
import {
  Plus,
  Minus,
  Check,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  Info,
  Layers,
  Wrench,
  Package,
  ZoomIn,
  Camera,
  X,
  TableProperties,
  Sparkles,
  ArrowRight,
  Factory,
  CheckCircle2,
  Share2
} from 'lucide-react';

type DetailTab = 'features' | 'specs' | 'contents';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart, items, totalItems, addToCompare, removeFromCompare, isInCompare } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [selectedSubModel, setSelectedSubModel] = useState<SubModel | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [detailTab, setDetailTab] = useState<DetailTab>('features');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!slug) return;
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const res = await api.getProductBySlug(slug);
        setProduct(res.product);
        setRelatedProducts(res.relatedProducts);
        setActiveImageIndex(0);
        // Pre-select first sub-model if available
        if (res.product?.subModels && res.product.subModels.length > 0) {
          const initialSm = { ...res.product.subModels[0] };
          if (['vgs1116', 'vgs916', 'vgs716'].includes(res.product.slug)) {
            initialSm.stoneColor = 'Pink';
          }
          if (res.product.slug === 'host') {
            initialSm.sku = initialSm.grit120 || initialSm.sku;
            initialSm.grit = '120 Grit';
          }
          if (res.product.slug === 'dhost') {
            initialSm.sku = initialSm.grit180 || initialSm.sku;
            initialSm.grade = 'Medium (180)';
          }
          if (res.product.slug === 'phsg') {
            initialSm.image = '/images/products/phsg-2.jpg';
          }
          setSelectedSubModel(initialSm);
        } else {
          setSelectedSubModel(null);
        }
        setQuantity(0);
        setAddedSuccess(false);
        setItemNotes('');
      } catch (err) {
        console.error('Failed to load product detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  // Bi-directional synchronization: when activeImageIndex changes, find and select associated variant
  useEffect(() => {
    if (!product || !product.images || !product.subModels || product.subModels.length === 0) return;
    const currentImg = product.images[activeImageIndex];
    if (!currentImg) return;

    // Special reactive binding for PHSG (phsg-2.jpg is star, phsg-3.jpg is hex)
    if (product.slug === 'phsg') {
      if (currentImg.includes('phsg-2')) {
        const starSm = product.subModels.find(sm => sm.modelNo === 'PHSG-STAR');
        if (starSm) {
          setSelectedSubModel(prev => {
            if (prev?.modelNo !== starSm.modelNo) setQuantity(0);
            return starSm;
          });
          return;
        }
      } else if (currentImg.includes('phsg-3')) {
        const hexSm = product.subModels.find(sm => sm.modelNo === 'PHSG-HEX');
        if (hexSm) {
          setSelectedSubModel(prev => {
            if (prev?.modelNo !== hexSm.modelNo) setQuantity(0);
            return hexSm;
          });
          return;
        }
      }
    }

    // 1. Direct match on sm.image or sm.images
    const directMatch = product.subModels.find(sm => {
      if (sm.image && sm.image === currentImg) return true;
      if (sm.images && Array.isArray(sm.images) && sm.images.includes(currentImg)) return true;
      return false;
    });

    if (directMatch) {
      setSelectedSubModel(prev => {
        if (prev?.modelNo === directMatch.modelNo) return prev;
        setQuantity(0);
        if (prev?.stoneColor && !directMatch.stoneColor) {
          return { ...directMatch, stoneColor: prev.stoneColor };
        }
        return directMatch;
      });
      return;
    }

    // 2. Match by submodel SKU or modelNo in image URL
    const cleanImg = currentImg.toLowerCase().replace(/[^a-z0-9]/g, '');
    const sortedSubModels = [...product.subModels].sort((a, b) => {
      const aCode = (a.modelNo || a.sku || a.sizeMm || '').length;
      const bCode = (b.modelNo || b.sku || b.sizeMm || '').length;
      return bCode - aCode;
    });

    for (const sm of sortedSubModels) {
      const code = (sm.modelNo || sm.sku || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (code && code.length >= 3 && cleanImg.includes(code)) {
        setSelectedSubModel(prev => {
          if (prev?.modelNo === sm.modelNo) return prev;
          if (prev?.stoneColor && !sm.stoneColor) {
            return { ...sm, stoneColor: prev.stoneColor };
          }
          return sm;
        });
        return;
      }
    }
  }, [activeImageIndex, product]);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!product || !product.images || product.images.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex(prev => (prev === product.images.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape' && zoomModalOpen) {
        setZoomModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, zoomModalOpen]);

  const handlePrevImage = () => {
    if (!product || !product.images || product.images.length <= 1) return;
    setActiveImageIndex(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!product || !product.images || product.images.length <= 1) return;
    setActiveImageIndex(prev => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  const handleSelectSubModel = (sm: SubModel) => {
    setSelectedSubModel(sm);

    // Reset quantity back to 0 when choosing any variant / grit / size / color / option
    setQuantity(0);
    setAddedSuccess(false);

    if (!product || !product.images || product.images.length === 0) return;

    // Special reactive binding for PHSG (star -> phsg-2, hex -> phsg-3)
    if (product.slug === 'phsg') {
      if (sm.modelNo === 'PHSG-STAR') {
        const idx = product.images.findIndex(img => img.includes('phsg-2'));
        if (idx !== -1) {
          setActiveImageIndex(idx);
          return;
        }
      } else if (sm.modelNo === 'PHSG-HEX') {
        const idx = product.images.findIndex(img => img.includes('phsg-3'));
        if (idx !== -1) {
          setActiveImageIndex(idx);
          return;
        }
      }
    }

    // 1. Check if subModel has explicit image
    const targetImage = sm.image || (sm.images && sm.images[0]);
    if (targetImage) {
      const idx = product.images.findIndex(img => img === targetImage);
      if (idx !== -1) {
        setActiveImageIndex(idx);
        return;
      }
    }

    // 2. Try matching by submodel SKU/code
    const code = sm.modelNo || sm.sku;
    if (code) {
      const cleanCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const idx = product.images.findIndex(img => {
        const cleanImg = img.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanImg.includes(cleanCode);
      });
      if (idx !== -1) {
        setActiveImageIndex(idx);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-2 border-industrial-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium text-industrial-600">Loading PRAZTECH® precision specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-medium text-industrial-900">Product not found</h2>
        <p className="text-sm text-industrial-600">The requested tooling item could not be located in the PRAZTECH® catalogue.</p>
        <Link to="/catalogue" className="inline-block px-4 py-2 bg-industrial-900 text-white font-medium text-xs rounded hover:bg-industrial-800 transition-colors">
          Return to catalogue
        </Link>
      </div>
    );
  }

  const productId = product.id || (product as any)._id || product.slug;
  const inCompare = isInCompare(productId);
  const inCart = items.find(it => (it.product?.id || (it.product as any)?._id || it.product?.slug) === productId);

  const handleAddToCart = () => {
    if (quantity <= 0) return;
    addToCart(product, selectedSubModel, quantity, itemNotes);
    setAddedSuccess(true);
    setQuantity(0);
  };

  const handleQuickAddQty = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
    setAddedSuccess(false);
  };

  const handleShareProduct = async () => {
    try {
      const activeLang = localStorage.getItem('praztech_selected_lang') || 'en';
      const url = new URL(window.location.href);
      if (activeLang && activeLang !== 'en') {
        url.searchParams.set('lang', activeLang);
      }
      const shareUrl = url.toString();
      const shareTitle = `${product?.modelNo || ''} - ${product?.name || ''} | PRAZTECH®`;
      const shareText = `Explore ${product?.modelNo || ''}: ${product?.name || ''} from PRAZTECH® Precision Engineering Tools.`;

      if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
          return;
        } catch {}
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* ── Breadcrumb Navigation ── */}
      <nav className="flex items-center space-x-2 text-xs text-industrial-500 overflow-x-auto whitespace-nowrap pb-1">
        <Link to="/" className="hover:text-industrial-950 transition-colors font-medium">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-industrial-400 shrink-0" />
        <Link to="/catalogue" className="hover:text-industrial-950 transition-colors font-medium">Catalogue</Link>
        <ChevronRight className="w-3.5 h-3.5 text-industrial-400 shrink-0" />
        <Link to={`/catalogue?category=${product.categorySlug}`} className="hover:text-industrial-950 transition-colors font-medium">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-industrial-400 shrink-0" />
        <span className="font-medium text-industrial-900 font-mono">{product.modelNo}</span>
      </nav>

      {/* ── Main Product Stage (2-Column Clean Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: Clean Image Showcase & Gallery (5 of 12 cols on lg) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          
          {/* Main Hero Image Stage */}
          <div className="relative bg-white rounded-2xl border border-industrial-200/90 shadow-sm aspect-square flex items-center justify-center p-6 sm:p-8 select-none group transition-all hover:shadow-md overflow-hidden">
            <img
              src={product.images[activeImageIndex] || product.images[0] || `/images/placeholders/${product.slug}.svg`}
              alt={`${product.name} (${product.modelNo}) - Tooling view ${activeImageIndex + 1}`}
              className="max-h-full max-w-full object-contain drop-shadow-sm"
            />

            {/* Photo Counter Pill (Top-Right, Clean & Minimal) */}
            {product.images.length > 1 && (
              <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md text-industrial-700 text-xs font-mono font-medium px-2.5 py-0.5 rounded border border-industrial-200 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-industrial-600" />
                <span>{activeImageIndex + 1} / {product.images.length}</span>
              </div>
            )}

            {/* Prev / Next Arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-industrial-700 hover:text-industrial-950 border border-industrial-200 backdrop-blur-sm flex items-center justify-center transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-industrial-700 hover:text-industrial-950 border border-industrial-200 backdrop-blur-sm flex items-center justify-center transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Enlarge / Zoom Button */}
            <button
              onClick={() => setZoomModalOpen(true)}
              className="absolute bottom-3.5 right-3.5 px-2.5 py-1.5 bg-white/95 hover:bg-white text-industrial-700 hover:text-industrial-900 border border-industrial-200 rounded backdrop-blur-md transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Enlarge Product Image"
            >
              <ZoomIn className="w-3.5 h-3.5 text-industrial-600" />
              <span>Zoom</span>
            </button>
          </div>

          {/* Thumbnail Gallery Strip */}
          {product.images.length > 1 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-industrial-500 font-medium px-1">
                <span>Tool gallery ({product.images.length} photos)</span>
                <span className="text-[11px] text-industrial-400">Click photo to switch</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-0.5">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border bg-white p-1 transition-colors cursor-pointer ${
                      idx === activeImageIndex
                        ? 'border-[#5e3e8b] ring-2 ring-[#9080a5]/50 shadow-xs'
                        : 'border-[#dfd5e8] opacity-70 hover:opacity-100 hover:border-[#9080a5]'
                    }`}
                    title={`View photo ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.modelNo} thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                    <span className="absolute bottom-1 right-1 bg-[#2e075d]/90 text-[10px] text-white font-mono px-1 rounded">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fast Spec & Factory Assurance Bar */}
          <div className="bg-[#f2ecf7] rounded-lg border border-[#dfd5e8] p-3.5 text-xs text-[#2e075d] grid grid-cols-2 gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5e3e8b] shrink-0" />
              <span className="font-medium">100% factory hardened and ground</span>
            </div>
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-[#6e568b] shrink-0" />
              <span className="font-medium">Direct factory dispatch</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Identity, Configuration & RFQ Card (7 of 12 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header & Meta Pill Strip */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-[#ede5f7] text-[#381c59] font-medium px-2.5 py-0.5 rounded border border-[#dfd5e8]">
                {product.category}
              </span>
              <span className="font-mono text-[#2e075d] bg-[#ede5f7] font-semibold px-2.5 py-0.5 rounded border border-[#dfd5e8]">
                Model: {product.modelNo}
              </span>
              <span className="bg-[#ede5f7] text-[#6e568b] px-2 py-0.5 rounded border border-[#dfd5e8]">
                Catalogue page {product.cataloguePage}
              </span>
              <span className="bg-[#e9f7ee] text-[#1e613b] px-2 py-0.5 rounded border border-[#b8e6ca] flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e613b]"></span>
                Factory calibrated
              </span>
            </div>

            <h1 className="font-sans font-medium text-2xl sm:text-3xl lg:text-4xl text-[#2e075d] tracking-tight leading-snug">
              {product.name}
            </h1>

            <p className="text-sm text-[#665f6e] leading-relaxed pt-1">
              {product.description}
            </p>
          </div>

          {/* Variant / Sub-models Selection Card */}
          {product.subModels && product.subModels.length > 0 && (
            <div className="bg-white rounded-xl border border-[#dfd5e8] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#dfd5e8]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#5e3e8b]" />
                  <span className="font-medium text-xs text-[#2e075d]">
                    Specification and variant
                  </span>
                </div>
                <span className="text-[11px] text-industrial-500 font-mono">
                  {product.subModels.length} {product.subModels.length === 1 ? 'option' : 'options'}
                </span>
              </div>
              <SubModelSelector
                productSlug={product.slug}
                subModels={product.subModels}
                selectedSubModel={selectedSubModel}
                onSelect={(sm) => handleSelectSubModel(sm)}
                variantOptionNames={(product as any).variantOptionNames}
              />
            </div>
          )}

          {/* B2B Factory Quotation Box (Calm, High-Contrast Industrial Card) */}
          <div className="bg-white rounded-xl border border-[#dfd5e8] p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#dfd5e8]">
              <div className="flex items-center space-x-2 text-[#2e075d] font-medium text-sm">
                <FileText className="w-4 h-4 text-[#5e3e8b]" />
                <span>Quotation enquiry</span>
              </div>
              <span className="text-[11px] font-mono text-[#5e3e8b] bg-[#ede5f7] px-2.5 py-0.5 rounded border border-[#dfd5e8] font-medium">
                Direct factory RFQ
              </span>
            </div>

            {/* Selected Configuration Readout */}
            {selectedSubModel && (
              <div className="bg-[#f5effa] border border-[#dfd5e8] rounded-lg px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[#6e568b]">Selected:</span>
                  <strong className="text-[#2e075d] font-mono font-medium">
                    {(() => {
                      if (selectedSubModel.options && Object.keys(selectedSubModel.options).length > 0) {
                        const parts = Object.entries(selectedSubModel.options)
                          .map(([k, v]) => `${k}: ${v}`)
                          .filter(Boolean);
                        if (parts.length > 0) return parts.join(' • ');
                      }
                      return selectedSubModel.label || (
                        [
                          selectedSubModel.modelNo,
                          selectedSubModel.sizeInches || selectedSubModel.sizeMm || selectedSubModel.size,
                          selectedSubModel.color && !selectedSubModel.stoneColor ? `${selectedSubModel.color} Color` : '',
                          selectedSubModel.stoneColor ? `${selectedSubModel.stoneColor} Stone` : '',
                          selectedSubModel.carat,
                          selectedSubModel.drive,
                          selectedSubModel.grit,
                          selectedSubModel.grade
                        ].filter(Boolean).join(' • ') || 'Standard'
                      );
                    })()}
                  </strong>
                </div>
                {selectedSubModel.compatibility && (
                  <span className="text-[11px] text-[#6e568b]">
                    {selectedSubModel.compatibility}
                  </span>
                )}
              </div>
            )}

            {/* Quantity Stepper & Quick Add Preset Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="text-xs font-medium text-[#2e075d] block">
                    Order quantity
                  </label>
                  <span className="text-[11px] text-[#6e568b]">
                    {quantity === 0 ? 'Specify quantity to add to enquiry' : `${quantity} unit(s) selected`}
                  </span>
                </div>

                {/* Stepper Control */}
                <div className="flex items-center border border-[#c5b6d5] rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity(Math.max(0, quantity - 1));
                      setAddedSuccess(false);
                    }}
                    disabled={quantity <= 0}
                    className={`p-2 transition-colors ${quantity <= 0 ? 'text-[#c5b6d5] cursor-not-allowed bg-[#faf7fc]' : 'text-[#5e3e8b] hover:bg-[#ede5f7]'}`}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(Math.max(0, parseInt(e.target.value) || 0));
                      setAddedSuccess(false);
                    }}
                    className="w-14 text-center text-xs font-medium text-[#2e075d] focus:outline-none py-1.5 font-mono tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity(quantity + 1);
                      setAddedSuccess(false);
                    }}
                    className="p-2 text-[#5e3e8b] hover:bg-[#ede5f7] transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Presets for B2B procurement */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-[#6e568b]">Quick add:</span>
                {[1, 5, 10, 25, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAddQty(val)}
                    className="px-2 py-0.5 text-[11px] font-mono rounded bg-[#ede5f7] hover:bg-[#dfd5e8] text-[#381c59] font-medium transition-colors cursor-pointer"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Item Notes */}
            <div>
              <label className="text-xs font-medium text-[#2e075d] block mb-1">
                Custom requirements / notes (optional)
              </label>
              <textarea
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Target engine model, expansion range, custom packaging..."
                rows={2}
                className="w-full text-xs p-2.5 border border-[#c5b6d5] rounded-lg focus:outline-none focus:border-[#5e3e8b] bg-white placeholder-[#9080a5]/70 transition-colors"
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                disabled={quantity === 0 && !addedSuccess}
                onClick={handleAddToCart}
                className={`flex-1 py-3 px-5 rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-colors ${
                  addedSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : quantity === 0
                    ? 'bg-[#efe9f5] text-[#6e568b] border border-[#dfd5e8] cursor-not-allowed'
                    : 'bg-[#381c59] hover:bg-[#5e3e8b] text-white font-medium cursor-pointer shadow-md'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Added to enquiry</span>
                  </>
                ) : quantity === 0 ? (
                  <>
                    <Plus className="w-3.5 h-3.5 text-[#6e568b]" />
                    <span>Specify quantity to add</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Add to enquiry ({quantity} units)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => inCompare ? removeFromCompare(productId) : addToCompare(product)}
                className={`py-3 px-4 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer ${
                  inCompare
                    ? 'bg-[#381c59] text-white border-[#381c59] shadow-xs'
                    : 'bg-white text-[#5e3e8b] border-[#c5b6d5] hover:bg-[#ede5f7]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{inCompare ? 'In comparison' : 'Compare'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareProduct}
                className="py-3 px-3.5 rounded-lg text-xs font-medium border border-[#c5b6d5] bg-white text-[#5e3e8b] hover:bg-[#ede5f7] transition-colors flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                title="Share link with active translation"
              >
                {shareCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>

            {/* Added Success Banner */}
            {addedSuccess && (
              <div className="p-3 bg-industrial-50 border border-industrial-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs text-industrial-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Item added to enquiry list</span>
                </div>
                <Link
                  to="/enquiry"
                  className="w-full sm:w-auto px-3 py-1.5 bg-industrial-900 hover:bg-industrial-800 text-white text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View enquiry ({totalItems})</span>
                </Link>
              </div>
            )}

            {/* In Cart Indicator */}
            {!addedSuccess && inCart && (
              <div className="p-3 bg-industrial-50 border border-industrial-200 rounded-lg flex items-center justify-between text-xs text-industrial-800">
                <span className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  In enquiry list ({inCart.quantity} units requested)
                </span>
                <Link to="/enquiry" className="underline text-industrial-900 hover:text-black font-medium">
                  View enquiry →
                </Link>
              </div>
            )}

            {/* Trust Assurance Footer */}
            <div className="pt-3 border-t border-industrial-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-industrial-500">
              <span>Official quotation within 24 hours</span>
              <span>•</span>
              <span>GST invoice and export documentation</span>
              <span>•</span>
              <span>Direct factory dispatch</span>
            </div>
          </div>

          {/* Compatibility & Notes Alerts */}
          {product.compatibility && (
            <div className="bg-industrial-50 border border-industrial-200 rounded-lg p-3.5 text-xs space-y-1">
              <strong className="text-industrial-900 block font-medium">Application compatibility:</strong>
              <p className="text-industrial-600 leading-relaxed">{product.compatibility}</p>
            </div>
          )}

          {product.notes && (
            <div className="bg-industrial-50 border border-industrial-200 rounded-lg p-3 text-xs text-industrial-700 flex items-start space-x-2">
              <Info className="w-3.5 h-3.5 text-industrial-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{product.notes}</span>
            </div>
          )}
        </div>

      </div>

      {/* ── DETAILED SPECIFICATIONS SECTION (TABBED) ── */}
      <div className="border-t border-[#dfd5e8] pt-10 space-y-0">
        
        {/* Tab Headers */}
        <div className="flex border-b border-[#dfd5e8] bg-[#f0e9f6] rounded-t-xl overflow-hidden">
          {([
            {
              id: 'features' as DetailTab,
              label: 'Engineering features and applications',
              icon: <ShieldCheck className="w-3.5 h-3.5" />,
              show: (product.keyFeatures && product.keyFeatures.length > 0) || (product.applications && product.applications.length > 0)
            },
            {
              id: 'specs' as DetailTab,
              label: 'Technical specifications',
              icon: <TableProperties className="w-3.5 h-3.5" />,
              show: product.itemSpecifics && Object.keys(product.itemSpecifics).length > 0
            },
            {
              id: 'contents' as DetailTab,
              label: 'Set contents and dimensions',
              icon: <Package className="w-3.5 h-3.5" />,
              show: (product.setIncludes && product.setIncludes.length > 0) || (product.sizesDetail && product.sizesDetail.length > 0)
            },
          ].filter(t => t.show)).map(tab => (
            <button
              key={tab.id}
              onClick={() => setDetailTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-medium transition-colors border-b-2 cursor-pointer ${
                detailTab === tab.id
                  ? 'border-[#381c59] text-[#381c59] bg-white font-semibold shadow-xs'
                  : 'border-transparent text-[#6e568b] hover:text-[#381c59] hover:bg-[#f6f2f9]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="bg-white rounded-b-xl border border-t-0 border-[#dfd5e8] p-6 sm:p-8 shadow-sm">

          {/* Tab 1: Engineering Features & Applications */}
          {detailTab === 'features' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {product.keyFeatures && product.keyFeatures.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-[#2e075d] pb-2 border-b border-[#dfd5e8]">
                    Key engineering features
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-[#2e075d]">
                    {product.keyFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9080a5] shrink-0 mt-2"></span>
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.applications && product.applications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-[#2e075d] pb-2 border-b border-[#dfd5e8]">
                    Documented applications
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-[#2e075d]">
                    {product.applications.map((app, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9080a5] shrink-0 mt-2"></span>
                        <span className="leading-relaxed">{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Technical Specifications */}
          {detailTab === 'specs' && product.itemSpecifics && Object.keys(product.itemSpecifics).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-[#2e075d] pb-2 border-b border-[#dfd5e8]">
                Technical specifications
              </h3>
              <div className="border border-[#dfd5e8] rounded-lg overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-[#dfd5e8]">
                    {Object.entries(product.itemSpecifics).map(([key, val], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#faf7fc]'}>
                        <td className="px-4 py-2.5 font-medium text-[#6e568b] w-1/3 bg-[#f3ecf8] border-r border-[#dfd5e8]">
                          {key}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-[#2e075d] font-mono">
                          {String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Set Contents & Dimensions */}
          {detailTab === 'contents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {product.setIncludes && product.setIncludes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-[#2e075d] pb-2 border-b border-[#dfd5e8]">
                    Set contents
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-[#2e075d]">
                    {product.setIncludes.map((inc, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-[#f5effa] border border-[#dfd5e8]">
                        <span className="font-mono text-[#5e3e8b] font-bold shrink-0">{idx + 1}.</span>
                        <span className="leading-relaxed">{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.sizesDetail && product.sizesDetail.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-[#2e075d] pb-2 border-b border-[#dfd5e8]">
                    Sizes and dimensions
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-[#2e075d]">
                    {product.sizesDetail.map((sz, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-[#f5effa] border border-[#dfd5e8] font-mono leading-relaxed text-xs">
                        {sz}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── RELATED PRODUCTS ── */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="border-t border-industrial-200 pt-10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-medium text-lg text-industrial-900">
              Related {product.category.toLowerCase()}
            </h3>
            <Link
              to={`/catalogue?category=${product.categorySlug}`}
              className="text-xs font-medium text-industrial-700 hover:text-industrial-950 hover:underline flex items-center gap-1"
            >
              <span>View full category range</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(rel => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* ── IMAGE ZOOM LIGHTBOX MODAL ── */}
      {zoomModalOpen && (
        <div
          onClick={() => setZoomModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden border border-industrial-200 p-4 sm:p-6 relative flex flex-col items-center shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={() => setZoomModalOpen(false)}
              className="absolute top-4 right-4 text-industrial-500 hover:text-industrial-900 bg-industrial-100 hover:bg-industrial-200 p-2.5 rounded-full text-xs font-bold z-20 transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Image with Navigation Arrows */}
            <div className="relative w-full flex items-center justify-center min-h-[320px] max-h-[72vh] p-4">
              <img
                src={product.images[activeImageIndex] || product.images[0] || `/images/placeholders/${product.slug}.svg`}
                alt={`${product.modelNo} enlarged view ${activeImageIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />

              {product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-industrial-800 border border-industrial-300 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-industrial-800 border border-industrial-300 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer & Thumbnails */}
            <div className="w-full mt-4 pt-4 border-t border-industrial-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <div className="text-sm font-bold text-industrial-900">
                  {product.modelNo} — <span className="font-normal text-industrial-600">{product.name}</span>
                </div>
                {product.images.length > 1 && (
                  <div className="text-xs text-industrial-400 font-mono mt-0.5">
                    Image {activeImageIndex + 1} of {product.images.length}
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
                  {product.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-12 h-12 rounded overflow-hidden border bg-white p-0.5 transition-colors shrink-0 cursor-pointer ${
                        idx === activeImageIndex
                          ? 'border-industrial-950 ring-1 ring-industrial-950'
                          : 'border-industrial-200 opacity-60 hover:opacity-100 hover:border-industrial-400'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
