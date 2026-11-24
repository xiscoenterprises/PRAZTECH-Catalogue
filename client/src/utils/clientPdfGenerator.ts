import jsPDF from 'jspdf';
import { EnquiryResponseData } from '../types';
import { formatDateDDMMYY } from './dateFormat';

/**
 * Generates an official PRAZTECH® Engineering Quotation Enquiry PDF client-side
 * with industrial branding, customer details, and itemized tabular layout.
 */
export const generateClientSideEnquiryPDF = (
  enquiryData: EnquiryResponseData | any,
  refNumber?: string
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const ref = refNumber || enquiryData?.referenceNumber || `ENQ-${Date.now()}`;
  const cust = enquiryData?.customer || enquiryData?.customerSnapshot || {};
  const catItems = enquiryData?.catalogueItems || [];
  const custItems = enquiryData?.customItems || [];
  const submittedDate = formatDateDDMMYY(enquiryData?.submittedAt || Date.now());

  const brandPrimary = [46, 7, 93]; // #2e075d
  const brandAccent = [94, 62, 139]; // #5e3e8b
  const textDark = [30, 30, 30];
  const textMuted = [100, 100, 100];
  const bgLight = [247, 245, 250]; // #f7f5fa
  const borderLight = [223, 213, 232]; // #dfd5e8

  // Margins & Dimensions
  const startX = 14;
  const contentWidth = 182; // 210 - 28

  // 1. Header Banner
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PRAZTECH® ENGINEERING', startX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Automotive Valve Rebuilding & Precision Tooling Manufacturer', startX, 23);

  // Business Contacts (Right aligned)
  doc.setFontSize(8);
  doc.text('Asaf Ali Rd, Delhi, 110002, India', 210 - startX, 15, { align: 'right' });
  doc.text('Email: xiscoenterprises@gmail.com', 210 - startX, 19.5, { align: 'right' });
  doc.text('Phone: +91 8744020102', 210 - startX, 24, { align: 'right' });
  doc.text('Web: https://www.praztechtools.com', 210 - startX, 28.5, { align: 'right' });

  // Header Divider Line
  doc.setDrawColor(brandAccent[0], brandAccent[1], brandAccent[2]);
  doc.setLineWidth(0.5);
  doc.line(startX, 32, 210 - startX, 32);

  // 2. Document Title Banner
  doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.rect(startX, 35, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('PRODUCT ENQUIRY / REQUEST FOR QUOTATION', 105, 40.5, { align: 'center' });

  // 3. Reference Strip
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.rect(startX, 45, contentWidth, 8, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Enquiry Reference: ', startX + 3, 50.2);

  doc.setTextColor(brandAccent[0], brandAccent[1], brandAccent[2]);
  doc.text(ref, startX + 34, 50.2);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Date Submitted: ', 135, 50.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(submittedDate, 160, 50.2);

  // 4. Customer Details Box
  let y = 57;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('CUSTOMER & BUSINESS INFORMATION', startX, y);

  y += 3;
  const custBoxHeight = 26;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.rect(startX, y, contentWidth, custBoxHeight, 'D');

  doc.setFontSize(8);
  const col1LabelX = startX + 3;
  const col1ValX = startX + 26;
  const col2LabelX = startX + 95;
  const col2ValX = startX + 115;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Contact Name:', col1LabelX, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(cust.fullName || '—', col1ValX, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Email:', col2LabelX, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(cust.email || '—', col2ValX, y + 6);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Company:', col1LabelX, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(cust.company || 'Individual / Workshop', col1ValX, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Phone:', col2LabelX, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(cust.phone || '—', col2ValX, y + 12);

  // Row 3
  const locationStr = [cust.city, cust.state, cust.country].filter(Boolean).join(', ') || 'India';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Location:', col1LabelX, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(locationStr, col1ValX, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('GSTIN:', col2LabelX, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(cust.gstin || '—', col2ValX, y + 18);

  // 5. Items Table
  y += custBoxHeight + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('ENQUIRED TOOLING ITEMS & SPECIFICATIONS', startX, y);

  y += 3;
  const thHeight = 7;
  doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.rect(startX, y, contentWidth, thHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  const colNoX = startX + 3;
  const colModelX = startX + 12;
  const colDescX = startX + 46;
  const colQtyX = startX + 168;

  doc.text('#', colNoX, y + 4.8);
  doc.text('Model / SKU', colModelX, y + 4.8);
  doc.text('Description & Variants', colDescX, y + 4.8);
  doc.text('Qty', colQtyX, y + 4.8, { align: 'center' });

  y += thHeight;

  // Table Body Rows
  let itemIndex = 1;
  const allItems = [
    ...catItems.map((it: any) => ({ ...it, isCustom: false })),
    ...custItems.map((it: any) => ({ ...it, isCustom: true }))
  ];

  doc.setFontSize(8);

  allItems.forEach((it: any) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    const rowHeight = 10;
    const isEven = itemIndex % 2 === 0;

    if (isEven) {
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.rect(startX, y, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(startX, y + rowHeight, startX + contentWidth, y + rowHeight);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(String(itemIndex), colNoX, y + 6);

    doc.setFont('helvetica', 'bold');
    const sku = it.modelNo || (it.isCustom ? 'CUSTOM-ITEM' : 'STANDARD');
    doc.text(sku.slice(0, 18), colModelX, y + 6);

    doc.setFont('helvetica', 'normal');
    let descText = it.name || it.productName || 'Tooling unit';
    if (it.selectedSubModel) {
      const sm = it.selectedSubModel;
      const opts = Object.entries(sm.options || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (opts) descText += ` (${opts})`;
      else if (sm.label) descText += ` (${sm.label})`;
    }
    if (it.notes) descText += ` • Notes: ${it.notes}`;

    doc.text(descText.slice(0, 75), colDescX, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text(String(it.quantity || 1), colQtyX, y + 6, { align: 'center' });

    y += rowHeight;
    itemIndex++;
  });

  // General Notes Box
  if (enquiryData?.generalNotes && y < 255) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text('Customer Special Notes:', startX, y);
    y += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(enquiryData.generalNotes.slice(0, 200), startX, y);
    y += 6;
  }

  // Footer Disclaimer
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(startX, 278, startX + contentWidth, 278);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'This is an official computer-generated quotation request summary issued by PRAZTECH® Engineering. Formal pricing, blueprint assessments, and freight lead times will be provided by sales engineers within 24 business hours. • Official Website: www.praztechtools.com',
    105,
    283,
    { align: 'center', maxWidth: contentWidth }
  );

  doc.save(`PRAZTECH_Enquiry_${ref}.pdf`);
};

export interface QuotationLineItem {
  id: string;
  isCustom: boolean;
  modelNo: string;
  name: string;
  category?: string;
  selectedVariant?: string;
  notes?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  gstRate: number;
  lineTotal: number;
  image?: string;
}

export interface QuotationDetails {
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  currency: string;
  currencySymbol: string;
  customer: {
    fullName: string;
    company?: string;
    email: string;
    phone: string;
    whatsapp?: string;
    address?: string;
    city: string;
    state: string;
    country: string;
    gstin?: string;
  };
  items: QuotationLineItem[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  freightCharges: number;
  grandTotal: number;
  paymentTerms: string;
  deliveryTimeline: string;
  generalNotes?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
  authorizedSignatory?: string;
}

const imageCache = new Map<string, string>();

/**
 * Loads an image URL and converts it to a base64 Data URL (JPEG or PNG) for reliable embedding in jsPDF.
 */
export const loadBase64Image = async (
  url: string,
  format: 'PNG' | 'JPEG' = 'JPEG'
): Promise<string | null> => {
  if (!url || typeof window === 'undefined') return null;
  const cacheKey = `${format}:${url}`;
  if (url.startsWith('data:image/')) return url;
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!;

  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 120;
        canvas.height = img.naturalHeight || img.height || 120;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        if (format === 'JPEG') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        const mimeType = format === 'PNG' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, format === 'PNG' ? undefined : 0.85);
        imageCache.set(cacheKey, dataUrl);
        resolve(dataUrl);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export function amountToWords(num: number, currency: string = 'INR'): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n >= 10000000) {
      str += inWords(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += inWords(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += inWords(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += inWords(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) str += a[n] + ' ';
      else str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] + ' ' : ' ');
    }
    return str.trim();
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  const prefix =
    currency === 'INR'
      ? 'Rupees '
      : currency === 'USD'
      ? 'US Dollars '
      : currency === 'EUR'
      ? 'Euros '
      : 'Pounds ';
  let result = prefix + inWords(integerPart);
  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart) + (currency === 'INR' ? ' Paise' : ' Cents');
  }
  return result + ' Only';
}

/**
 * Generates an official PRAZTECH® Engineering Commercial Quotation PDF client-side
 * with formal pricing, product photos, itemized discounts, tax calculations, bank details, and website URL.
 */
export const generateClientSideQuotationPDF = async (quote: QuotationDetails): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const brandPrimary = [46, 7, 93]; // #2e075d
  const brandAccent = [94, 62, 139]; // #5e3e8b
  const textDark = [30, 30, 30];
  const textMuted = [100, 100, 100];
  const bgLight = [247, 245, 250]; // #f7f5fa
  const borderLight = [223, 213, 232]; // #dfd5e8

  const startX = 14;
  const contentWidth = 182; // 210 - 28

  // Safe currency symbol representation:
  // jsPDF standard fonts only support Latin-1 / WinAnsi.
  // The unicode Rupee symbol '₹' (U+20B9) corrupts to '¹' (0xB9) in WinAnsi.
  // We use 'Rs. ' for INR to ensure 100% clean, professional rendering without character artifacts.
  const isINR = quote.currency === 'INR' || quote.currencySymbol === '₹';
  const currencySym = isINR ? 'Rs. ' : (quote.currencySymbol || '$ ');

  // Pre-load company logo and product photos asynchronously
  const [logoData, ...itemImages] = await Promise.all([
    loadBase64Image('/images/logo-black.png', 'PNG'),
    ...quote.items.map(it => (it.image ? loadBase64Image(it.image) : Promise.resolve(null)))
  ]);

  // 1. Header Banner (Black Company Logo image)
  if (logoData) {
    try {
      // /images/logo-black.png is 918x176 (aspect ratio ~5.216:1)
      // width: 52mm, height: 10mm
      doc.addImage(logoData, 'PNG', startX, 13, 52, 10);
    } catch {
      doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('PRAZTECH® ENGINEERING', startX, 18);
    }
  } else {
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PRAZTECH® ENGINEERING', startX, 18);
  }

  // Business Contacts (Right aligned - Identical to Quotations & RFQs PDF)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Asaf Ali Rd, Delhi, 110002, India', 210 - startX, 15, { align: 'right' });
  doc.text('Email: xiscoenterprises@gmail.com', 210 - startX, 19.5, { align: 'right' });
  doc.text('Phone: +91 8744020102', 210 - startX, 24, { align: 'right' });
  doc.text('Web: https://www.praztechtools.com', 210 - startX, 28.5, { align: 'right' });

  // Header Divider Line (Identical to Quotations & RFQs PDF)
  doc.setDrawColor(brandAccent[0], brandAccent[1], brandAccent[2]);
  doc.setLineWidth(0.5);
  doc.line(startX, 32, 210 - startX, 32);

  // 2. Document Title Banner (Identical to Quotations & RFQs PDF)
  doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.rect(startX, 35, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('OFFICIAL COMMERCIAL PROFORMA QUOTATION', 105, 40.5, { align: 'center' });

  // 3. Reference Strip (Identical to Quotations & RFQs PDF)
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.rect(startX, 45, contentWidth, 8, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Quotation Ref: ', startX + 3, 50.2);

  doc.setTextColor(brandAccent[0], brandAccent[1], brandAccent[2]);
  doc.text(quote.quoteNumber || 'PRZ-QT-PENDING', startX + 28, 50.2);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Date: ', 88, 50.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(quote.quoteDate || formatDateDDMMYY(Date.now()), 98, 50.2);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Valid: ', 128, 50.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(quote.validUntil || '30 Days', 138, 50.2);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Currency: ', 166, 50.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text(`${quote.currency || 'INR'}`, 181, 50.2);

  // 4. Buyer / Consignee Details Box (Zero overlap with Reference Strip above)
  let y = 58;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('BUYER / CONSIGNEE DETAILS', startX, y);

  y += 3;
  const custBoxHeight = 25;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.rect(startX, y, contentWidth, custBoxHeight, 'D');

  doc.setFontSize(7.8);
  const col1LabelX = startX + 3;
  const col1ValX = startX + 24;
  const col2LabelX = startX + 96;
  const col2ValX = startX + 114;

  const cust = quote.customer || ({} as any);

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Customer:', col1LabelX, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(cust.fullName || '—', col1ValX, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Email:', col2LabelX, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(cust.email || '—', col2ValX, y + 5.5);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Company:', col1LabelX, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(cust.company || 'Direct Workshop / Individual', col1ValX, y + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Phone:', col2LabelX, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(cust.phone || cust.whatsapp || '—', col2ValX, y + 11.5);

  // Row 3
  const locationStr = [cust.address, cust.city, cust.state, cust.country].filter(Boolean).join(', ') || 'India';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Address:', col1LabelX, y + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(locationStr.slice(0, 52), col1ValX, y + 17.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('GSTIN:', col2LabelX, y + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(cust.gstin || 'Unregistered / Not Provided', col2ValX, y + 17.5);

  // 5. Items Table with Product Photos
  y += custBoxHeight + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('SCHEDULE OF TOOLING PRODUCTS & RATES', startX, y);

  y += 3;
  const thHeight = 6.5;

  const colNo = startX + 2;        // 16
  const colPhoto = startX + 8;     // 22
  const colModel = startX + 24;    // 38
  const colDesc = startX + 48;     // 62
  const colQty = startX + 104;     // 118
  const colRate = startX + 128;    // 142
  const colDisc = startX + 142;    // 156
  const colGst = startX + 156;     // 170
  const colAmount = startX + 180;  // 194

  const drawTableHeader = (curY: number) => {
    doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.rect(startX, curY, contentWidth, thHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    doc.text('#', colNo, curY + 4.5);
    doc.text('Photo', colPhoto + 1, curY + 4.5);
    doc.text('Model / SKU', colModel, curY + 4.5);
    doc.text('Description & Technical Details', colDesc, curY + 4.5);
    doc.text('Qty', colQty, curY + 4.5, { align: 'center' });
    doc.text(`Unit Rate (${currencySym.trim()})`, colRate, curY + 4.5, { align: 'right' });
    doc.text('Disc %', colDisc, curY + 4.5, { align: 'center' });
    doc.text('GST %', colGst, curY + 4.5, { align: 'center' });
    doc.text(`Total (${currencySym.trim()})`, colAmount, curY + 4.5, { align: 'right' });
  };

  drawTableHeader(y);
  y += thHeight;

  // Table Body Rows
  const rowHeight = 15;
  const photoSize = 12;

  for (let idx = 0; idx < quote.items.length; idx++) {
    const it = quote.items[idx];
    const imgData = itemImages[idx];

    if (y + rowHeight > 220) {
      doc.addPage();
      y = 20;
      drawTableHeader(y);
      y += thHeight;
    }

    const isEven = (idx + 1) % 2 === 0;
    if (isEven) {
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.rect(startX, y, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(startX, y + rowHeight, startX + contentWidth, y + rowHeight);

    // Index
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(String(idx + 1), colNo, y + 8);

    // Product Photo Box
    const pX = colPhoto - 1;
    const pY = y + 1.5;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.rect(pX, pY, photoSize, photoSize, 'FD');

    if (imgData) {
      try {
        doc.addImage(imgData, 'JPEG', pX + 0.5, pY + 0.5, photoSize - 1, photoSize - 1);
      } catch {
        doc.setFontSize(6);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text('Photo', pX + photoSize / 2, pY + 7, { align: 'center' });
      }
    } else {
      doc.setFontSize(6);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(it.isCustom ? 'Custom' : 'Tool', pX + photoSize / 2, pY + 7, { align: 'center' });
    }

    // Model / SKU
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const sku = it.modelNo || (it.isCustom ? 'CUSTOM-TOOL' : 'STANDARD');
    doc.text(sku.slice(0, 16), colModel, y + 6);

    // Description & Technical Details
    doc.setFont('helvetica', 'normal');
    let desc = it.name || 'Industrial Tooling Unit';
    if (it.selectedVariant) desc += ` (${it.selectedVariant})`;
    if (it.notes) desc += ` • ${it.notes}`;
    doc.text(desc.slice(0, 44), colDesc, y + 6, { maxWidth: 50 });

    // Quantity
    doc.setFont('helvetica', 'bold');
    doc.text(String(it.quantity || 1), colQty, y + 8, { align: 'center' });

    // Unit Rate
    doc.setFont('helvetica', 'normal');
    doc.text(Number(it.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), colRate, y + 8, { align: 'right' });

    // Discount %
    doc.text(it.discountPercent ? `${it.discountPercent}%` : '—', colDisc, y + 8, { align: 'center' });

    // GST %
    doc.text(it.gstRate ? `${it.gstRate}%` : '0%', colGst, y + 8, { align: 'center' });

    // Total Amount
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text(Number(it.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), colAmount, y + 8, { align: 'right' });

    y += rowHeight;
  }

  // 6. Summary Totals & Commercial Terms Section
  if (y > 210) {
    doc.addPage();
    y = 20;
  }

  y += 4;
  const summaryBoxWidth = 75;
  const summaryBoxX = startX + contentWidth - summaryBoxWidth;
  const termsBoxWidth = contentWidth - summaryBoxWidth - 6;

  // Left Side: Terms, Bank Details, and Amount in Words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('AMOUNT IN WORDS:', startX, y + 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const wordsText = amountToWords(quote.grandTotal, quote.currency);
  doc.text(wordsText, startX, y + 7.5, { maxWidth: termsBoxWidth });

  // Bank Transfer Details Box
  const bankY = y + 14;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.rect(startX, bankY, termsBoxWidth, 23, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('BANK DETAILS FOR DIRECT REMITTANCE / RTGS / NEFT:', startX + 3, bankY + 4.5);

  const bank = quote.bankDetails || {
    bankName: 'HDFC Bank Ltd',
    accountName: 'PRAZTECH ENGINEERING',
    accountNumber: '50200084729103',
    ifscCode: 'HDFC0000123',
    branch: 'New Delhi Branch'
  };

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Bank: ${bank.bankName} | Branch: ${bank.branch}`, startX + 3, bankY + 9.5);
  doc.text(`A/C Name: ${bank.accountName}`, startX + 3, bankY + 14);
  doc.text(`A/C No: ${bank.accountNumber} | IFSC Code: ${bank.ifscCode}`, startX + 3, bankY + 18.5);

  // Terms & Conditions below Bank Details
  const termsY = bankY + 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('COMMERCIAL TERMS & NOTES:', startX, termsY + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`• Payment Terms: ${quote.paymentTerms || '50% advance, balance against dispatch invoice'}`, startX, termsY + 8);
  doc.text(`• Delivery / Lead Time: ${quote.deliveryTimeline || 'Ex-stock / 3-5 business days from order confirmation'}`, startX, termsY + 12);
  doc.text('• Freight & Insurance: Borne by consignee unless explicitly itemized above.', startX, termsY + 16);
  if (quote.generalNotes) {
    doc.text(`• Note: ${quote.generalNotes.slice(0, 95)}`, startX, termsY + 20);
  }

  // Right Side: Financial Breakdown Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.rect(summaryBoxX, y, summaryBoxWidth, 48, 'D');

  const sumLabelX = summaryBoxX + 4;
  const sumValX = summaryBoxX + summaryBoxWidth - 4;
  let sumY = y + 5;

  const drawSummaryRow = (label: string, value: number, isMinus = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(label, sumLabelX, sumY);

    const valStr = `${isMinus ? '- ' : ''}${currencySym}${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    doc.text(valStr, sumValX, sumY, { align: 'right' });
    sumY += 5.5;
  };

  drawSummaryRow('Items Subtotal:', quote.subtotal);
  if (quote.discountTotal > 0) {
    drawSummaryRow('Total Discount:', quote.discountTotal, true);
  }
  drawSummaryRow('Taxable Amount:', quote.taxableAmount);
  drawSummaryRow('GST / Tax Amount:', quote.taxTotal);
  if (quote.freightCharges > 0) {
    drawSummaryRow('Freight & Packaging:', quote.freightCharges);
  }

  // Grand Total Highlight Bar
  sumY += 1;
  doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.rect(summaryBoxX, sumY - 3, summaryBoxWidth, 9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('GRAND TOTAL:', sumLabelX, sumY + 2.8);
  doc.text(
    `${currencySym}${Number(quote.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    sumValX,
    sumY + 2.8,
    { align: 'right' }
  );

  // Authorized Signatory Box on Right
  const signY = sumY + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('For PRAZTECH® ENGINEERING', sumLabelX + 8, signY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('[ Authorized Signatory ]', sumLabelX + 15, signY + 12);
  doc.text('Commercial Sales Desk', sumLabelX + 14, signY + 16);

  // Footer Disclaimer - Explicitly mentioning the official website
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(startX, 280, startX + contentWidth, 280);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'This is an official computer-generated commercial quotation issued by PRAZTECH® Engineering. All prices are subject to stated terms and validity period. • Official Website: www.praztechtools.com',
    105,
    284.5,
    { align: 'center', maxWidth: contentWidth }
  );

  doc.save(`PRAZTECH_Quotation_${quote.quoteNumber || 'Draft'}.pdf`);
};
