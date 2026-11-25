import React, { useState } from 'react';
import { SubModel } from '../types';
import { Check, BookOpen, X } from 'lucide-react';

interface SubModelSelectorProps {
  productSlug: string;
  subModels: SubModel[];
  selectedSubModel: SubModel | null;
  onSelect: (subModel: SubModel) => void;
  variantOptionNames?: string[];
  unselected?: boolean;
}

export const SubModelSelector: React.FC<SubModelSelectorProps> = ({
  productSlug,
  subModels,
  selectedSubModel,
  onSelect,
  variantOptionNames,
  unselected = false
}) => {
  const [guideOpen, setGuideOpen] = useState(false);

  if (!subModels || subModels.length === 0) return null;

  // 1. VSCCT (Valve Seat Cutter Sets - 14 Models)
  if (productSlug === 'vscct') {
    const activeModel = unselected ? null : (selectedSubModel || subModels[0]);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-industrial-700">
            Cutter set model
          </span>
          <span className="text-xs text-industrial-500 font-mono">
            {subModels.length} application sets
          </span>
        </div>

        {/* Model SKU Pills */}
        <div className="flex flex-wrap gap-1.5">
          {subModels.map((m, idx) => {
            const isSelected = !unselected && activeModel?.modelNo === m.modelNo;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelect(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-industrial-900 text-white border-industrial-900 font-medium'
                    : 'bg-industrial-50 text-industrial-700 border-industrial-200 hover:border-industrial-400 hover:bg-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-brand-mauve shrink-0" />}
                <span>{m.modelNo}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Set Breakdown Card */}
        {!unselected && activeModel && (
          <div className="bg-industrial-50 border border-industrial-200 rounded-lg p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-industrial-200">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-industrial-900 bg-white px-2 py-0.5 rounded border border-industrial-200">
                  {activeModel.modelNo}
                </span>
                <span className="font-medium text-industrial-800">{activeModel.compatibility}</span>
              </div>
              <span className="text-[11px] text-industrial-500 bg-white px-2 py-0.5 rounded border border-industrial-200">
                {activeModel.angles}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-industrial-600 text-[11.5px]">
              <div>
                <strong className="text-industrial-900 block font-medium">Cutters included:</strong>
                <p className="leading-relaxed">{activeModel.cutters}</p>
              </div>
              <div className="space-y-1">
                <div>
                  <strong className="text-industrial-900 font-medium">Pilots: </strong>
                  <span>{activeModel.pilots || 'Standard'}</span>
                </div>
                {activeModel.reamers && activeModel.reamers !== '-' && (
                  <div>
                    <strong className="text-industrial-900 font-medium">Reamers: </strong>
                    <span>{activeModel.reamers}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. VSCS (Car & Bike Engine Cutter Sets - 5 Sizes)
  if (productSlug === 'vscs') {
    const isHSS = !unselected && Boolean(selectedSubModel?.material?.includes('HSS') || selectedSubModel?.modelNo?.includes('HSS'));
    const selectedIdx = unselected ? -1 : subModels.findIndex(m => m.modelHCS === selectedSubModel?.modelNo || m.modelHSS === selectedSubModel?.modelNo);
    const activeIndex = selectedIdx !== -1 ? selectedIdx : (unselected ? -1 : 0);
    const activeSet = unselected ? null : (subModels[activeIndex !== -1 ? activeIndex : 0] || subModels[0]);

    const handleSetSelect = (idx: number) => {
      const set = subModels[idx];
      const modelNo = isHSS ? set.modelHSS : set.modelHCS;
      const material = isHSS ? 'High Speed Steel (HSS)' : 'High Carbon Steel (HCS)';
      onSelect({ ...set, modelNo, material });
    };

    const handleMaterialSelect = (materialType: 'HCS' | 'HSS') => {
      const set = activeSet || subModels[0];
      const modelNo = materialType === 'HSS' ? set.modelHSS : set.modelHCS;
      const material = materialType === 'HSS' ? 'High Speed Steel (HSS)' : 'High Carbon Steel (HCS)';
      onSelect({ ...set, modelNo, material });
    };

    return (
      <div className="space-y-3">
        {/* Step 1: Set Size */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-industrial-700 block">
            1. Cutter set capacity
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {subModels.map((m, idx) => {
              const isSelected = !unselected && idx === activeIndex;
              const count = m.modelHCS ? m.modelHCS.replace('VSCHCS', '') : String(idx + 1);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSetSelect(idx)}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    isSelected
                      ? 'bg-industrial-900 text-white border-industrial-900 font-medium'
                      : 'bg-industrial-50 text-industrial-800 border-industrial-200 hover:border-industrial-400 hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-mono font-medium">{count}-piece set</div>
                  <div className={`text-[10px] ${isSelected ? 'text-industrial-300' : 'text-industrial-500'}`}>
                    {count} cutters
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Material Grade */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-industrial-700 block">
            2. Tool steel material
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleMaterialSelect('HCS')}
              className={`p-2.5 rounded-lg border text-left transition-colors ${
                !unselected && !isHSS
                  ? 'border-industrial-900 bg-industrial-50 font-medium'
                  : 'border-industrial-200 bg-white hover:border-industrial-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-industrial-900">
                <span>High Carbon Steel (HCS)</span>
                {!unselected && !isHSS && <Check className="w-3.5 h-3.5 text-industrial-900" />}
              </div>
              <div className="text-[11px] font-mono text-industrial-500 mt-0.5">{activeSet?.modelHCS || subModels[0]?.modelHCS}</div>
            </button>

            <button
              type="button"
              onClick={() => handleMaterialSelect('HSS')}
              className={`p-2.5 rounded-lg border text-left transition-colors ${
                !unselected && isHSS
                  ? 'border-industrial-900 bg-industrial-50 font-medium'
                  : 'border-industrial-200 bg-white hover:border-industrial-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-industrial-900">
                <span>High Speed Steel (HSS)</span>
                {!unselected && isHSS && <Check className="w-3.5 h-3.5 text-industrial-900" />}
              </div>
              <div className="text-[11px] font-mono text-industrial-500 mt-0.5">{activeSet?.modelHSS || subModels[0]?.modelHSS}</div>
            </button>
          </div>
        </div>

        {/* Specification Details */}
        {!unselected && activeSet && (
          <div className="p-2.5 bg-industrial-50 border border-industrial-200 rounded-lg text-xs space-y-1">
            <strong className="text-industrial-900 block font-medium">Included:</strong>
            <p className="text-industrial-600 leading-relaxed text-[11.5px]">{activeSet.cutters}</p>
            <p className="text-industrial-500 text-[11px]">Pilots: {activeSet.pilots}</p>
          </div>
        )}
      </div>
    );
  }

  // 3. HOST (Silicon Carbide Honing Stones - 4 Grits)
  if (productSlug === 'host') {
    const selectedRange = unselected ? null : (selectedSubModel?.range || subModels[0].range);
    const currentSubModel = unselected ? null : (subModels.find(m => m.range === selectedRange) || subModels[0]);
    const currentGritKey = unselected ? null : (selectedSubModel?.grit ? `grit${selectedSubModel.grit.split(' ')[0]}` : 'grit120');

    const gritOptions = [
      { key: 'grit120', label: '120 coarse', desc: 'Rapid stock removal' },
      { key: 'grit180', label: '180 medium', desc: 'Standard cylinder sizing' },
      { key: 'grit220', label: '220 fine', desc: 'Pre-finishing and crosshatch' },
      { key: 'grit320', label: '320 super fine', desc: 'Plateau finish' },
    ] as const;

    const handleRangeSelect = (m: SubModel) => {
      const gKey = currentGritKey || 'grit120';
      const targetGrit = (gKey in m) ? (m as any)[gKey] : m.grit120;
      const gritLabel = gritOptions.find(g => g.key === gKey)?.label || '120 coarse';
      onSelect({
        ...m,
        sku: targetGrit,
        grit: gritLabel
      });
    };

    const handleGritSelect = (gKey: 'grit120' | 'grit180' | 'grit220' | 'grit320', label: string) => {
      const activeSm = currentSubModel || subModels[0];
      const sku = (activeSm as any)[gKey] || activeSm.grit120;
      onSelect({
        ...activeSm,
        sku,
        grit: label
      });
    };

    return (
      <div className="space-y-3">
        {/* Step 1: Range */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-industrial-700 block">
            1. Honing head bore range
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {subModels.map((m, idx) => {
              const isSelected = !unselected && m.range === selectedRange;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleRangeSelect(m)}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'bg-industrial-900 text-white border-industrial-900 font-medium'
                      : 'bg-industrial-50 text-industrial-800 border-industrial-200 hover:border-industrial-400 hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-mono font-medium">{m.range}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-industrial-300' : 'text-industrial-500'}`}>
                    {m.dimensions}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Grit */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-industrial-700 block">
            2. Abrasive grit grade
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {gritOptions.map(g => {
              const isSelected = !unselected && (selectedSubModel?.grit || '120 coarse') === g.label;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => handleGritSelect(g.key, g.label)}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    isSelected
                      ? 'border-industrial-900 bg-industrial-50 font-medium'
                      : 'border-industrial-200 bg-white hover:border-industrial-300'
                  }`}
                >
                  <div className="text-xs text-industrial-900 font-medium">{g.label}</div>
                  <div className="text-[10px] text-industrial-500 mt-0.5">{g.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Summary */}
        {!unselected && currentSubModel && currentGritKey && (
          <div className="p-2.5 bg-industrial-50 border border-industrial-200 rounded-lg text-xs flex items-center justify-between">
            <div>
              <span className="text-industrial-500">Selected SKU: </span>
              <strong className="font-mono text-industrial-900 font-medium">
                {(currentSubModel as any)[currentGritKey] || currentSubModel.grit120}
              </strong>
            </div>
            <span className="text-[11px] font-mono text-industrial-600 bg-white px-2 py-0.5 rounded border border-industrial-200">
              {currentSubModel.dimensions}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 4. DHOST (Diamond Honing Stones - Medium 180 vs Fine 220)
  if (productSlug === 'dhost') {
    const selectedRange = unselected ? null : (selectedSubModel?.range || subModels[0].range);
    const currentSubModel = unselected ? null : (subModels.find(m => m.range === selectedRange) || subModels[0]);
    const isFine = !unselected && Boolean(selectedSubModel?.grade?.includes('Fine') || selectedSubModel?.grade?.includes('220'));

    const handleRangeSelect = (m: SubModel) => {
      const sku = isFine ? m.grit220 : m.grit180;
      const grade = isFine ? 'Fine (220)' : 'Medium (180)';
      onSelect({ ...m, sku, grade });
    };

    const handleGradeSelect = (gradeType: '180' | '220') => {
      const activeSm = currentSubModel || subModels[0];
      const sku = gradeType === '220' ? activeSm.grit220 : activeSm.grit180;
      const grade = gradeType === '220' ? 'Fine (220)' : 'Medium (180)';
      onSelect({ ...activeSm, sku, grade });
    };

    return (
      <div className="space-y-3">
        {/* Step 1: Range */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-industrial-700 block">
            1. Diamond head bore range
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {subModels.map((m, idx) => {
              const isSelected = !unselected && m.range === selectedRange;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleRangeSelect(m)}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'bg-industrial-900 text-white border-industrial-900 font-medium'
                      : 'bg-industrial-50 text-industrial-800 border-industrial-200 hover:border-industrial-400 hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-medium font-mono">{m.range}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-industrial-300' : 'text-industrial-500'}`}>
                    {m.dimensions}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Diamond Grade */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-industrial-700 block">
            2. Diamond grit grade
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleGradeSelect('180')}
              className={`p-2.5 rounded-lg border text-left transition-colors ${
                !unselected && !isFine
                  ? 'border-industrial-900 bg-industrial-50 font-medium'
                  : 'border-industrial-200 bg-white hover:border-industrial-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-industrial-900">
                <span>Medium diamond (180 grit)</span>
                {!unselected && !isFine && <Check className="w-3.5 h-3.5 text-industrial-900" />}
              </div>
              <div className="text-[11px] font-mono text-industrial-500 mt-0.5">{currentSubModel?.grit180 || subModels[0]?.grit180}</div>
            </button>

            <button
              type="button"
              onClick={() => handleGradeSelect('220')}
              className={`p-2.5 rounded-lg border text-left transition-colors ${
                !unselected && isFine
                  ? 'border-industrial-900 bg-industrial-50 font-medium'
                  : 'border-industrial-200 bg-white hover:border-industrial-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-industrial-900">
                <span>Fine diamond (220 grit)</span>
                {!unselected && isFine && <Check className="w-3.5 h-3.5 text-industrial-900" />}
              </div>
              <div className="text-[11px] font-mono text-industrial-500 mt-0.5">{currentSubModel?.grit220 || subModels[0]?.grit220}</div>
            </button>
          </div>
        </div>

        {/* Selected Summary */}
        {!unselected && currentSubModel && (
          <div className="p-2.5 bg-industrial-50 border border-industrial-200 rounded-lg text-xs flex items-center justify-between">
            <div>
              <span className="text-industrial-500">Selected SKU: </span>
              <strong className="font-mono text-industrial-900 font-medium">
                {isFine ? currentSubModel.grit220 : currentSubModel.grit180}
              </strong>
            </div>
            <span className="text-[11px] font-mono text-industrial-600 bg-white px-2 py-0.5 rounded border border-industrial-200">
              {currentSubModel.dimensions}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 5. Valve Seat Grinding Stones (vgs1116, vgs916, vgs716)
  if (productSlug === 'vgs1116' || productSlug === 'vgs916' || productSlug === 'vgs716') {
    const currentColor = unselected ? null : ((selectedSubModel?.stoneColor || 'Pink') as 'Black' | 'Pink' | 'White');

    const colorProfiles = {
      Black: {
        name: 'Black',
        material: 'Silicon carbide (SiC)',
        swatchBg: 'bg-zinc-800 border-zinc-700',
        suited: 'Cast iron, aluminium, brass, copper, stone.'
      },
      Pink: {
        name: 'Pink',
        material: 'Pink aluminium oxide (Al₂O₃ + Cr)',
        swatchBg: 'bg-pink-400 border-pink-300',
        suited: 'Alloy steels, HSS tool steel, engine valve seats.'
      },
      White: {
        name: 'White',
        material: 'High-purity aluminium oxide (Al₂O₃)',
        swatchBg: 'bg-white border-zinc-300',
        suited: 'Hardened and heat-sensitive precision steel tools.'
      }
    };

    const handleColorChange = (newColor: 'Black' | 'Pink' | 'White') => {
      const base = selectedSubModel || subModels[0];
      onSelect({
        ...base,
        stoneColor: newColor
      });
    };

    const handleSizeSelect = (sm: SubModel) => {
      onSelect({
        ...sm,
        stoneColor: currentColor || 'Pink'
      });
    };

    return (
      <div className="space-y-3">
        {/* 1. Color Picker */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-industrial-700">
              1. Abrasive formulation
            </span>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="text-xs text-industrial-600 hover:text-industrial-900 underline flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Selection guide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['Black', 'Pink', 'White'] as const).map(colorKey => {
              const profile = colorProfiles[colorKey];
              const isSelected = !unselected && currentColor === colorKey;
              return (
                <button
                  key={colorKey}
                  type="button"
                  onClick={() => handleColorChange(colorKey)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-industrial-900 bg-industrial-50 font-medium'
                      : 'border-industrial-200 bg-white hover:border-industrial-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full border ${profile.swatchBg}`}></span>
                      <span className="text-xs text-industrial-900">{profile.name} stone</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-industrial-900" />}
                  </div>
                  <div className="text-[11px] text-industrial-500 leading-snug">{profile.material}</div>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-industrial-600 bg-industrial-50 border border-industrial-200 px-3 py-1.5 rounded-lg">
            <strong>Abrasive formulations: </strong>
            {unselected ? 'Available in Silicon Carbide (Black), Pink Aluminium Oxide, and White High-Purity Pure Al₂O₃.' : `Best for: ${colorProfiles[currentColor!].suited}`}
          </div>
        </div>

        {/* 2. Size Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-industrial-700">
              2. Stone diameter
            </span>
            <span className="text-xs font-mono text-industrial-500">
              {subModels.length} sizes
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {subModels.map((m, idx) => {
              const isSelected = !unselected && (selectedSubModel?.sizeInches
                ? selectedSubModel.sizeInches === m.sizeInches
                : (selectedSubModel?.sizeMm ? selectedSubModel.sizeMm === m.sizeMm : idx === 0));

              const mainLabel = m.sizeInches || m.sizeMm;
              const subLabel = m.sizeInches && m.sizeMm ? m.sizeMm : null;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSizeSelect(m)}
                  className={`px-2.5 py-1.5 rounded-lg text-center border transition-colors ${
                    isSelected
                      ? 'bg-industrial-900 text-white border-industrial-900 font-medium'
                      : 'bg-industrial-50 text-industrial-800 border-industrial-200 hover:border-industrial-400 hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-mono font-medium leading-none">{mainLabel}</div>
                  {subLabel && (
                    <div className={`text-[10px] mt-0.5 leading-none ${isSelected ? 'text-industrial-300' : 'text-industrial-400'}`}>
                      {subLabel}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selection Guide Modal */}
        {guideOpen && (
          <div
            onClick={() => setGuideOpen(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-industrial-200 shadow-xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-industrial-200">
                <div>
                  <h3 className="text-base font-medium text-industrial-900">
                    Abrasive stones selection guide
                  </h3>
                  <p className="text-xs text-industrial-500">
                    Silicon carbide vs. pink aluminium oxide vs. white high-purity
                  </p>
                </div>
                <button
                  onClick={() => setGuideOpen(false)}
                  className="p-1.5 rounded-md hover:bg-industrial-100 text-industrial-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comparison Table */}
              <div className="border border-industrial-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-industrial-50 text-industrial-800 font-medium border-b border-industrial-200">
                    <tr>
                      <th className="p-2.5">Property</th>
                      <th className="p-2.5">Black (SiC)</th>
                      <th className="p-2.5">Pink (Al₂O₃ + Cr)</th>
                      <th className="p-2.5">White (Pure Al₂O₃)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-industrial-100 text-industrial-700">
                    <tr>
                      <td className="p-2.5 font-medium bg-industrial-50/50">Grain</td>
                      <td className="p-2.5">Silicon carbide</td>
                      <td className="p-2.5">Pink aluminium oxide</td>
                      <td className="p-2.5">High-purity aluminium oxide</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium bg-industrial-50/50">Cutting action</td>
                      <td className="p-2.5">Aggressive & sharp</td>
                      <td className="p-2.5">Controlled precision</td>
                      <td className="p-2.5">Cool cutting (anti-burn)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium bg-industrial-50/50">Primary use</td>
                      <td className="p-2.5">Cast iron, aluminium, brass</td>
                      <td className="p-2.5">Alloy steels, HSS tools</td>
                      <td className="p-2.5">Hardened tool steels</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-right pt-2 border-t border-industrial-100">
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className="px-4 py-2 bg-industrial-900 hover:bg-industrial-800 text-white rounded-lg text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 6. PHSG (Pilot Holder for Seat Grinder - Star vs Hex Drive)
  if (productSlug === 'phsg') {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-industrial-700">
            Drive adapter coupling
          </span>
          <span className="text-xs text-industrial-500 font-mono">Star vs Hex</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {subModels.map((m, idx) => {
            const isSelected = !unselected && selectedSubModel?.modelNo === m.modelNo;
            const isStar = m.modelNo?.includes('STAR') || m.drive === 'Star Drive';
            const driveTitle = isStar ? 'Star drive adapter' : 'Hex drive adapter';
            const imgSrc = isStar ? '/images/products/phsg-2.jpg' : '/images/products/phsg-3.jpg';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelect({ ...m, image: imgSrc })}
                className={`p-3 rounded-lg border text-left transition-colors flex items-center gap-3 ${
                  isSelected
                    ? 'border-industrial-900 bg-industrial-50'
                    : 'border-industrial-200 bg-white hover:border-industrial-300'
                }`}
              >
                <div className="w-12 h-12 rounded-md overflow-hidden border border-industrial-200 shrink-0 bg-white p-1">
                  <img src={imgSrc} alt={driveTitle} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-industrial-900 bg-industrial-100 px-1.5 py-0.2 rounded">
                      {m.modelNo}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-industrial-900" />}
                  </div>
                  <div className="font-medium text-xs text-industrial-900 mt-1">{driveTitle}</div>
                  <div className="text-[10px] text-industrial-500">Grinding spindle drive</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 7. PTD-38 & PTD-516 (Diamond Stone Dressers - Carats)
  if (productSlug === 'ptd-38' || productSlug === 'ptd-516') {
    const threadLabel = subModels[0]?.thread || (productSlug === 'ptd-38' ? '3/8" × 24 UNF' : '5/16" × 24 TPI');

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-industrial-700">
            Diamond carat size
          </span>
          <span className="text-xs text-industrial-600 font-mono bg-industrial-100 px-2 py-0.5 rounded border border-industrial-200">
            {threadLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {subModels.map((m, idx) => {
            const isSelected = !unselected && selectedSubModel?.modelNo === m.modelNo;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelect(m)}
                className={`p-2.5 rounded-lg border text-center transition-colors ${
                  isSelected
                    ? 'bg-industrial-900 text-white border-industrial-900 font-medium'
                    : 'bg-industrial-50 text-industrial-800 border-industrial-200 hover:border-industrial-400 hover:bg-white'
                }`}
              >
                <div className="text-xs font-mono font-medium">{m.carat || 'Diamond point'}</div>
                <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-industrial-300' : 'text-industrial-500'}`}>
                  {m.modelNo}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 8. LPHR & AHREP (Kingpin Hand Reamers)
  if (productSlug === 'lphr' || productSlug === 'ahrep') {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-industrial-700">
            Reamer size and expansion range
          </span>
          <span className="text-xs text-industrial-500 font-mono">
            {subModels.length} sizes
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {subModels.map((m, idx) => {
            const isSelected = !unselected && selectedSubModel?.modelNo === m.modelNo;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelect(m)}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'bg-industrial-900 text-white border-industrial-900 font-medium'
                    : 'bg-industrial-50 text-industrial-800 border-industrial-200 hover:border-industrial-400 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium">{m.modelNo} ({m.size})</span>
                  {isSelected && <Check className="w-3 h-3 text-brand-mauve" />}
                </div>
                <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-industrial-200' : 'text-industrial-700'}`}>
                  {m.metricRange}
                </div>
                <div className={`text-[10px] ${isSelected ? 'text-industrial-400' : 'text-industrial-500'}`}>
                  {m.inchRange}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 9. HONE (Honing Stone Holders)
  if (productSlug === 'hone') {
    return (
      <div className="space-y-2.5">
        <span className="text-xs font-medium text-industrial-700 block">
          Honing stone holder size
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {subModels.map((m, idx) => {
            const isSelected = !unselected && selectedSubModel?.modelNo === m.modelNo;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelect(m)}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'bg-industrial-900 text-white border-industrial-900 font-medium'
                    : 'bg-industrial-50 text-industrial-800 border-industrial-200 hover:border-industrial-400 hover:bg-white'
                }`}
              >
                <div className="font-mono text-xs font-medium">{m.modelNo}</div>
                <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-industrial-300' : 'text-industrial-600'}`}>
                  Bore: {m.range}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 10. VGSH (Valve Grinding Stone Holders)
  if (productSlug === 'vgsh') {
    return (
      <div className="space-y-2.5">
        <span className="text-xs font-medium text-industrial-700 block">
          Stone holder thread and drive
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {subModels.map((m, idx) => {
            const isSelected = !unselected && selectedSubModel?.modelNo === m.modelNo;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelect(m)}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'border-industrial-900 bg-industrial-50 font-medium'
                    : 'border-industrial-200 bg-white hover:border-industrial-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-industrial-900 bg-industrial-100 px-1.5 py-0.2 rounded">
                    {m.modelNo}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-industrial-900" />}
                </div>
                <div className="text-xs font-medium text-industrial-900">{m.thread}</div>
                <div className="text-[11px] text-industrial-500 mt-0.5">{m.drive}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 11. Generic Sub-models fallback (with Individual Dimension Selection for multi-spec products)
  // Discover dimension names from prop or submodel options
  const dimensionNames: string[] = [];
  if (Array.isArray(variantOptionNames) && variantOptionNames.length > 0) {
    variantOptionNames.forEach(name => {
      const trimmed = String(name).trim();
      if (trimmed && !dimensionNames.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
        dimensionNames.push(trimmed);
      }
    });
  }

  // Also collect any options defined in subModels
  subModels.forEach(m => {
    if (m.options && typeof m.options === 'object') {
      Object.keys(m.options).forEach(k => {
        const trimmed = k.trim();
        if (trimmed && !dimensionNames.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
          dimensionNames.push(trimmed);
        }
      });
    }
  });

  // If subModels define dimensions, render individual dimension selector rows:
  if (dimensionNames.length > 0) {
    const activeModel = unselected ? null : (selectedSubModel || subModels[0]);

    // Build map of dimension -> ordered unique list of values
    const dimensionValuesMap: Record<string, string[]> = {};
    dimensionNames.forEach(dim => {
      const vals: string[] = [];
      subModels.forEach(m => {
        const opts = m.options || {};
        const key = Object.keys(opts).find(k => k.toLowerCase() === dim.toLowerCase());
        const v = key
          ? String(opts[key] ?? '').trim()
          : String((m as any)[dim.toLowerCase()] ?? (dim.toLowerCase() === 'size' ? (m.sizeMm || m.size) : '')).trim();
        if (v && !vals.some(x => x.toLowerCase() === v.toLowerCase())) {
          vals.push(v);
        }
      });
      dimensionValuesMap[dim] = vals;
    });

    // Determine current selected value for each dimension
    const currentSelected: Record<string, string> = {};
    if (!unselected && activeModel) {
      dimensionNames.forEach(dim => {
        const opts = activeModel.options || {};
        const key = Object.keys(opts).find(k => k.toLowerCase() === dim.toLowerCase());
        const v = key
          ? String(opts[key] ?? '').trim()
          : String((activeModel as any)[dim.toLowerCase()] ?? (dim.toLowerCase() === 'size' ? (activeModel.sizeMm || activeModel.size) : '')).trim();
        currentSelected[dim] = v || dimensionValuesMap[dim]?.[0] || '';
      });
    }

    const handleSelectDimensionValue = (dimName: string, chosenVal: string) => {
      const targetOptions = {
        ...currentSelected,
        [dimName]: chosenVal
      };

      // 1. Try exact match on all dimensions
      let match = subModels.find(m => {
        const opts = m.options || {};
        return dimensionNames.every(d => {
          const expected = targetOptions[d];
          if (!expected) return true;
          const k = Object.keys(opts).find(key => key.toLowerCase() === d.toLowerCase());
          const actual = k
            ? String(opts[k] ?? '').trim()
            : String((m as any)[d.toLowerCase()] ?? (d.toLowerCase() === 'size' ? (m.sizeMm || m.size) : '')).trim();
          return actual.toLowerCase() === expected.toLowerCase();
        });
      });

      // 2. If no exact match with other current choices (sparse matrix), find closest submodel that has this chosenVal
      if (!match) {
        match = subModels.find(m => {
          const opts = m.options || {};
          const k = Object.keys(opts).find(key => key.toLowerCase() === dimName.toLowerCase());
          const actual = k
            ? String(opts[k] ?? '').trim()
            : String((m as any)[dimName.toLowerCase()] ?? (dimName.toLowerCase() === 'size' ? (m.sizeMm || m.size) : '')).trim();
          return actual.toLowerCase() === chosenVal.toLowerCase();
        });
      }

      if (match) {
        onSelect(match);
      }
    };

    const getColorDotHex = (colorVal: string) => {
      const c = colorVal.toLowerCase();
      if (c === 'pink') return '#ec4899';
      if (c === 'black') return '#18181b';
      if (c === 'white') return '#ffffff';
      if (c === 'ruby' || c.includes('red')) return '#dc2626';
      if (c === 'blue') return '#2563eb';
      if (c === 'green') return '#16a34a';
      if (c === 'gold' || c.includes('yellow')) return '#eab308';
      if (c === 'silver' || c === 'grey' || c === 'gray') return '#9ca3af';
      if (c === 'bronze' || c === 'copper') return '#b45309';
      return '#a1a1aa';
    };

    return (
      <div className="space-y-4">
        {dimensionNames.map(dimName => {
          const activeVal = currentSelected[dimName];
          const vals = dimensionValuesMap[dimName] || [];
          const isColorDim = dimName.toLowerCase().includes('color') || dimName.toLowerCase().includes('finish');

          return (
            <div key={dimName} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-industrial-800">
                  {dimName}
                  {!unselected && activeVal && (
                    <span className="text-brand-mauve font-mono font-bold ml-1">
                      : {activeVal}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-industrial-500 font-mono">
                  {vals.length} {vals.length === 1 ? 'option' : 'options'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {vals.map(v => {
                  const isSelected = !unselected && Boolean(activeVal && String(activeVal).toLowerCase() === String(v).toLowerCase());

                  // Check if this option is valid in combinations
                  const isCompatible = subModels.some(m => {
                    const opts = m.options || {};
                    return dimensionNames.every(d => {
                      const expected = d === dimName ? v : currentSelected[d];
                      if (!expected) return true;
                      const k = Object.keys(opts).find(key => key.toLowerCase() === d.toLowerCase());
                      const actual = k
                        ? String(opts[k] ?? '').trim()
                        : String((m as any)[d.toLowerCase()] ?? (d.toLowerCase() === 'size' ? (m.sizeMm || m.size) : '')).trim();
                      return actual.toLowerCase() === expected.toLowerCase();
                    });
                  });

                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleSelectDimensionValue(dimName, v)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-industrial-900 text-white border-industrial-900 shadow-2xs font-semibold ring-1 ring-industrial-900'
                          : isCompatible
                          ? 'bg-white text-industrial-800 border-industrial-200 hover:border-industrial-400 hover:bg-industrial-50'
                          : 'bg-industrial-50 text-industrial-400 border-industrial-200 opacity-60'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-mauve shrink-0" />}
                      {isColorDim && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 inline-block"
                          style={{ backgroundColor: getColorDotHex(v) }}
                        />
                      )}
                      <span className="font-mono">{v}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Selected Variant Summary Footer */}
        {!unselected && activeModel && (
          <div className="pt-2.5 border-t border-industrial-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-industrial-500 font-medium">Selected SKU:</span>
              <span className="font-mono font-semibold text-industrial-900 bg-industrial-100 px-2 py-0.5 rounded border border-industrial-200 text-xs">
                {activeModel.modelNo || 'Variant'}
              </span>
              <span className="font-medium text-industrial-800">
                {dimensionNames.map(d => `${d}: ${currentSelected[d]}`).join(' • ')}
              </span>
            </div>
            {activeModel.notes && (
              <span className="text-[11px] text-industrial-500 italic">
                {activeModel.notes}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback for unstructured legacy submodels without options dictionary
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-industrial-700 block">
        Available variants
      </span>
      <div className="flex flex-wrap gap-1.5">
        {subModels.map((m, idx) => {
          const optionsParts = m.options
            ? Object.entries(m.options).map(([_, v]) => String(v).trim()).filter(Boolean)
            : [];
          const hasExplicitOptions = optionsParts.length > 0;
          const explicitColor = m.options?.['Color'] || m.options?.['color'] || m.options?.['Finish'] || m.options?.['finish'] || '';
          const colorName = hasExplicitOptions ? explicitColor : (m.color || m.stoneColor || '');
          const sizeName = m.sizeMm || m.size || m.sizeInches || (m.options?.['Size'] || m.options?.['size'] || '');

          const label = (hasExplicitOptions ? optionsParts.join(' • ') : '') ||
            m.label ||
            ([sizeName, colorName].filter(Boolean).join(' • ')) ||
            (m.carat ? `${m.modelNo || ''} (${m.carat})`.trim() : '') ||
            m.modelNo || sizeName || colorName || m.drive || m.range || `Option #${idx + 1}`;

          const isSelected = !unselected && Boolean(
            (selectedSubModel?.modelNo && selectedSubModel.modelNo === m.modelNo) ||
            (selectedSubModel?.label && selectedSubModel.label === label) ||
            (selectedSubModel?.sizeMm && selectedSubModel.sizeMm === m.sizeMm && selectedSubModel?.color === m.color) ||
            (selectedSubModel && JSON.stringify(selectedSubModel) === JSON.stringify(m))
          );
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect({ ...m, label })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-industrial-900 text-white border-industrial-900'
                  : 'bg-industrial-50 text-industrial-700 border-industrial-200 hover:border-industrial-400 hover:bg-white'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-brand-mauve shrink-0" />}
              {colorName && (
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                  style={{
                    backgroundColor:
                      colorName.toLowerCase() === 'pink' ? '#ec4899' :
                      colorName.toLowerCase() === 'black' ? '#18181b' :
                      colorName.toLowerCase() === 'white' ? '#ffffff' :
                      colorName.toLowerCase() === 'ruby' || colorName.toLowerCase().includes('red') ? '#dc2626' :
                      colorName.toLowerCase() === 'blue' ? '#2563eb' :
                      colorName.toLowerCase() === 'green' ? '#16a34a' :
                      colorName.toLowerCase() === 'gold' || colorName.toLowerCase().includes('yellow') ? '#eab308' :
                      '#a1a1aa'
                  }}
                  title={colorName}
                />
              )}
              {m.image && (
                <img
                  src={m.image}
                  alt={label}
                  className="w-4 h-4 rounded object-contain border border-industrial-200 shrink-0 bg-white"
                  loading="lazy"
                />
              )}
              <span className="font-mono">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
