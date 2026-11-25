import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SubModelSelector } from '../components/SubModelSelector';
import { SlidersHorizontal } from 'lucide-react';
import { Product, SubModel } from '../types';

export interface ProductShowcaseConfig {
  product: Product;
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
  providedElement?: HTMLElement | null
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
              React.createElement('span', { className: 'font-medium text-xs text-[#2e075d]' }, 'Specification and variant')
            ),
            React.createElement(
              'span',
              { className: 'text-[11px] text-industrial-500 font-mono' },
              `${product.subModels?.length || 0} ${(product.subModels?.length || 0) === 1 ? 'option' : 'options'}`
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
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let linesDrawn = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      linesDrawn++;
      if (linesDrawn >= maxLines - 1 && n < words.length - 1) {
        // Truncate remaining
        ctx.fillText((line + words.slice(n + 1).join(' ')).slice(0, 50) + '...', x, currentY);
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
      config.variantCardElement
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
  // 1. "use the white logo on purple background"
  const logoPromise = loadCanvasImage('/images/logo-white.png');
  const prodImgUrl = config.selectedImageUrl || config.product.images?.[0] || '';
  const prodImgPromise = loadCanvasImage(prodImgUrl);

  const [logoWhiteImg, prodImg] = await Promise.all([logoPromise, prodImgPromise]);

  // 2. Header Banner: Royal Purple Background with White Company Logo
  drawRoundedRect(ctx, margin, 40, contentWidth, headerHeight, 16, themeHeader, undefined);

  // Draw white logo directly onto purple background (no white pill)
  if (logoWhiteImg) {
    // logo-white.png is 918x176 (aspect ratio ~5.216:1)
    const logoH = 54;
    const logoW = Math.round(logoH * (logoWhiteImg.width / logoWhiteImg.height || 5.216));
    const logoY = 40 + Math.round((headerHeight - logoH) / 2);
    ctx.drawImage(logoWhiteImg, margin + 28, logoY, logoW, logoH);
  } else {
    // Fallback crisp white text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.fillText('PRAZTECH®', margin + 30, 92);
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#dfd5e8';
    ctx.fillText('PRECISION ENGINEERING TOOLS', margin + 30, 116);
  }

  // Header Right Side Contact Info
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText('AUTOMOTIVE VALVE REBUILDING & PRECISION TOOLING', width - margin - 28, 80);

  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#dfd5e8';
  ctx.fillText('Web: www.praztechtools.com  |  Phone: +91 8744020102  |  Asaf Ali Rd, Delhi', width - margin - 28, 108);
  ctx.textAlign = 'left';

  // 3. Product Title & Hero Identity Strip (Zero Overlap Guaranteed)
  // Badges Line
  let curY = 175;
  const catText = (config.categoryBadge || config.product.category || 'PRECISION TOOLING').toUpperCase();
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
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

  // Model Number on its own clear row (balanced, clean secondary identifier)
  curY = 224;
  ctx.fillStyle = themeBrand;
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  const rawModel = config.headline || config.product.modelNo;
  const modelNoText = rawModel.toUpperCase().startsWith('MODEL') ? rawModel.toUpperCase() : `MODEL: ${rawModel}`;
  ctx.fillText(modelNoText, margin, curY);

  // Full Product Title on its own prominent row below Model Number (balanced, bold primary title)
  curY += 6;
  ctx.fillStyle = '#2e075d';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  const titleText = config.productTitle || config.product.name;
  curY = renderWrappedText(ctx, titleText, margin, curY + 24, contentWidth, 34, 2);

  // Overview / Tagline Description below Product Title (balanced, readable medium body)
  const tagline = config.tagline || config.product.description || 'Industrial grade valve reconditioning and precision seat cutting system.';
  ctx.fillStyle = '#4a4058';
  ctx.font = '500 17px system-ui, -apple-system, sans-serif';
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
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Product Photo: ' + config.product.modelNo, margin + colWidth / 2, curY + heroCardHeight / 2);
      ctx.textAlign = 'left';
    }

    // Corner Authentic Badge on Photo
    drawRoundedRect(ctx, margin + 14, curY + 14, 180, 26, 6, 'rgba(46, 7, 93, 0.92)');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('GENUINE PRAZTECH® TOOL', margin + 24, curY + 31);

    // Right Column: Key Features & Engineering Advantages Card
    const rightColX = margin + colWidth + 24;
    drawRoundedRect(ctx, rightColX, curY, colWidth, heroCardHeight, 16, themeCardBg, themeCardBorder, 1.5);

    ctx.fillStyle = themeBrand;
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('KEY ENGINEERING ADVANTAGES', rightColX + 24, curY + 34);

    ctx.strokeStyle = themeCardBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightColX + 24, curY + 46);
    ctx.lineTo(rightColX + colWidth - 24, curY + 46);
    ctx.stroke();

    const rawFeatures = config.product.keyFeatures && config.product.keyFeatures.length > 0
      ? config.product.keyFeatures
      : [
          'Tungsten carbide precision tooling for mirror seat finish',
          'Rigid vibration-free pilot alignment for micron repeatability',
          'Hardened & tempered industrial alloy body construction',
          'Compatible with standard workshop drive spindles & hand handles',
          '100% factory inspection with certificate of accuracy'
        ];

    const featuresToDisplay = rawFeatures.slice(0, 5);
    let featY = curY + 76;

    for (const feat of featuresToDisplay) {
      drawCheckIcon(ctx, rightColX + 36, featY - 4, 10, themeBrand, '#ffffff');
      ctx.fillStyle = themeTextPrimary;
      ctx.font = '500 13.5px system-ui, -apple-system, sans-serif';
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
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Product Photo: ' + config.product.modelNo, margin + contentWidth / 2, curY + heroCardHeight / 2);
      ctx.textAlign = 'left';
    }

    // Corner Authentic Badge on Photo
    drawRoundedRect(ctx, margin + 18, curY + 18, 190, 28, 6, 'rgba(46, 7, 93, 0.92)');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('GENUINE PRAZTECH® TOOL', margin + 28, curY + 36);
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
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.fillText('Specification and variant', margin + 44, curY + 28);
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
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('TECHNICAL SPECIFICATIONS MATRIX', margin + 24, curY + 30);

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
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(spec[0].toUpperCase(), cellX + 16, cellY + 22);

      // Spec Value with multi-line wrapping - NEVER CUT OFF
      ctx.fillStyle = themeTextPrimary;
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      renderWrappedText(ctx, spec[1], cellX + 16, cellY + 42, specColW - 32, 17, 2);
    });

    curY += specsBoxHeight + 24;
  }

  // 7. Applications & Compatibility Strip
  if (config.includeApplications && isPortrait) {
    const appBoxHeight = 150;
    drawRoundedRect(ctx, margin, curY, contentWidth, appBoxHeight, 16, themeCardBg, themeCardBorder, 1.5);

    ctx.fillStyle = themeBrand;
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('TARGET APPLICATIONS & MACHINE SHOP COMPATIBILITY', margin + 24, curY + 28);

    const apps = config.product.applications && config.product.applications.length > 0
      ? config.product.applications
      : [
          'Motorcycles & Scooters (2-Wheeler)',
          'Passenger Cars & SUV Engines',
          'Commercial Heavy Diesel & Trucks',
          'Agricultural Tractors & Stationary Gensets',
          'Precision CNC & Manual Rebuilding Benches'
        ];

    const appY = curY + 58;
    const appColW = (contentWidth - 48) / 2;

    apps.slice(0, 4).forEach((app, idx) => {
      const c = idx % 2;
      const r = Math.floor(idx / 2);
      const aX = margin + 24 + c * appColW;
      const aY = appY + r * 36;

      drawCheckIcon(ctx, aX + 10, aY + 4, 8, '#10b981', '#ffffff');
      ctx.fillStyle = themeTextPrimary;
      ctx.font = '500 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(app, aX + 28, aY + 9);
    });

    if (config.customNotes) {
      ctx.fillStyle = '#b45309';
      ctx.font = 'italic 12px system-ui, -apple-system, sans-serif';
      ctx.fillText(`* Note: ${config.customNotes.slice(0, 95)}`, margin + 24, curY + 135);
    }

    curY += appBoxHeight + 24;
  }

  // 8. Footer Official Contacts & Guarantee Banner (Requirement 6: NO ISO LINE)
  const footerY = height - margin - footerHeight;

  drawRoundedRect(ctx, margin, footerY, contentWidth, footerHeight, 16, themeHeader, undefined);

  // Left side: Guarantee and contact info without ANY ISO mention
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText('PRAZTECH® ENGINEERING • FACTORY DIRECT PRECISION', margin + 28, footerY + 36);

  ctx.fillStyle = '#dfd5e8';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  // Explicitly NO ISO line
  ctx.fillText('Precision Factory Calibrated Tooling • 100% Quality Inspected • Made in India', margin + 28, footerY + 62);
  ctx.fillText('Export Inquiries & Workshop Enquiries: xiscoenterprises@gmail.com', margin + 28, footerY + 84);

  // Right side: Official Product Overview Stamp
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fef08a'; // gold badge
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('OFFICIAL PRODUCT OVERVIEW', width - margin - 28, footerY + 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('www.praztechtools.com', width - margin - 28, footerY + 62);

  ctx.fillStyle = '#dfd5e8';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
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
