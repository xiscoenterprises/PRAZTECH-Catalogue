import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-[#24064a] to-[#1a0436] text-[#dcd5e4] border-t border-[#381c59] mt-20">
      {/* Top CTA Banner: Rich Indigo Surface */}
      <div className="bg-[#2e075d] border-b border-[#381c59] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg sm:text-xl font-medium text-white">
              Need custom engine tooling or non-standard dimensions?
            </h3>
            <p className="text-[#dcd5e4] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              PRAZTECH® manufactures custom valve seat cutters, expanding pilots, and diamond honing sticks to customer specifications.
            </p>
          </div>
          <Link
            to="/custom-enquiry"
            className="inline-flex items-center space-x-2 bg-[#5e3e8b] hover:bg-[#6e568b] text-white px-5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shadow-md border border-[#b5a8c8]/40"
          >
            <span>Custom tooling enquiry</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#dcd5e4]" />
          </Link>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div>
              <img
                src="/images/logo-white.png"
                alt="PRAZTECH® Engineering"
                className="h-8 w-auto inline-block"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
            <p className="text-xs text-[#dcd5e4] leading-relaxed">
              Precision tooling for internal combustion engine rebuilders, automotive machine workshops, and cylinder head overhaul facilities.
            </p>
            <div className="text-xs text-[#b5a8c8] pt-1">
              <span>Standard manufacturing programme • Edition 2026</span>
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="text-[#b5a8c8] font-semibold text-xs uppercase tracking-wider mb-3">
              Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/catalogue?category=valve-seat-grinding-tools" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Valve seat grinding tools (33)
                </Link>
              </li>
              <li>
                <Link to="/catalogue?category=honing-and-boring-tools" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Honing and boring tools (4)
                </Link>
              </li>
              <li>
                <Link to="/catalogue?category=valve-seat-cutting-tools" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Valve seat cutting tools (2)
                </Link>
              </li>
              <li>
                <Link to="/catalogue?category=kingpin-reaming-tools" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Kingpin reaming tools (2)
                </Link>
              </li>
              <li className="pt-1">
                <Link to="/catalogue" className="text-[#b5a8c8] hover:text-white flex items-center space-x-1">
                  <span>View all 41 products</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-[#b5a8c8] font-semibold text-xs uppercase tracking-wider mb-3">
              Service
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/enquiry" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Quotation enquiry list
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Tool comparison
                </Link>
              </li>
              <li>
                <Link to="/custom-enquiry" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Custom tooling requests
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#dcd5e4] hover:text-white transition-colors">
                  About PRAZTECH®
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Contact support
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Terms & conditions
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Refund & cancellations
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Cookie policy
                </Link>
              </li>
              <li>
                <Link to="/executive" className="text-[#dcd5e4] hover:text-white transition-colors">
                  Executive portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-[#b5a8c8] font-semibold text-xs uppercase tracking-wider mb-3">
              Contact
            </h4>
            <ul className="space-y-2.5 text-xs text-[#dcd5e4]">
              <li className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#b5a8c8] shrink-0 mt-0.5" />
                <span>Asaf Ali Rd, Delhi, 110002, India</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#b5a8c8] shrink-0" />
                <a href="mailto:xiscoenterprises@gmail.com" className="hover:text-white transition-colors">
                  xiscoenterprises@gmail.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#b5a8c8] shrink-0" />
                <a href="tel:+918744020102" className="hover:text-white transition-colors">
                  +91 8744020102
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 text-emerald-400 shrink-0 text-center font-bold text-[10px]">
                  WA
                </span>
                <a
                  href="https://wa.me/918744020102?text=Hello%20PRAZTECH%C2%AE%20Engineering%2C%20I%20would%20like%20to%20enquire%20about%20your%20tooling%20catalogue."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  +91 8744020102
                </a>
              </li>
            </ul>

            <div className="mt-4 p-2.5 rounded bg-[#1e053d] border border-[#381c59] text-[11px] text-[#dcd5e4]">
              Commercial quotations are issued following technical review of order quantities and specifications.
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-[#381c59] flex flex-col md:flex-row items-center justify-between text-xs text-[#b5a8c8] gap-3">
          <p>© {new Date().getFullYear()} PRAZTECH® Engineering. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <span>•</span>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            <span>•</span>
            <Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
            <span>•</span>
            <Link to="/executive" className="hover:text-white transition-colors">Executive Portal</Link>
            <span>•</span>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
              className="hover:text-white transition-colors underline cursor-pointer"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
