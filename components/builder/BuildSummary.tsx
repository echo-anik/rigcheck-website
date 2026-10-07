'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Save, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Component } from '@/lib/api';
import { formatPriceBDT, convertBDTtoUSD } from '@/lib/currency';
import { buildSteps } from './BuildWizard';
import { ShareBuildDialog } from './ShareBuildDialog';
import { exportBuildToPDF, exportBuildToExcel } from '@/lib/export-build';

interface BuildSummaryProps {
  selectedComponents: Record<string, Component | null>;
  buildName: string;
  onBuildNameChange: (name: string) => void;
  onSave: () => void;
  onShare?: () => Promise<{ buildId: string; buildUrl: string } | null>;
  onShareToFeed?: () => void;
  onEdit: (category: string) => void;
  compatibility: {
    is_compatible: boolean;
    warnings: string[];
    errors: string[];
  } | null;
  saving: boolean;
}

export function BuildSummary({
  selectedComponents,
  buildName,
  onBuildNameChange,
  onSave,
  onShare,
  onShareToFeed,
  onEdit,
  compatibility,
  saving
}: BuildSummaryProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareData, setShareData] = useState<{ buildId: string; buildUrl: string } | null>(null);
  const [sharing, setSharing] = useState(false);

  const calculateTotalPrice = (): number => {
    return Object.values(selectedComponents).reduce((total, component) => {
      if (component && component.lowest_price_bdt) {
        const price = typeof component.lowest_price_bdt === 'string'
          ? parseFloat(component.lowest_price_bdt)
          : component.lowest_price_bdt;
        return total + price;
      }
      return total;
    }, 0);
  };

  const calculatePowerDraw = (): { totalWattage: number; psuWattage: number | null; percentage: number; recommendedPsu: number | null } => {
    let totalWattage = 0;
    
    // Calculate power consumption for each component
    const cpu = selectedComponents['cpu'];
    const gpu = selectedComponents['gpu'];
    const ram = selectedComponents['ram'];
    const storage = selectedComponents['storage'];
    const motherboard = selectedComponents['motherboard'];
    const cooler = selectedComponents['cooler'];
    
    
    Object.values(selectedComponents).forEach(component => {
      if (component) {
        const specs = component.specs as Record<string, unknown>;
        const tdp = specs?.tdp || specs?.power_consumption || specs?.base_tdp || 0;
        if (tdp) {
          totalWattage += parseFloat(String(tdp).replace(/[^0-9.]/g, ''));
        }
      }
    });
    
    // Get PSU wattage
    const psu = selectedComponents['psu'];
    let psuWattage: number | null = null;
    if (psu?.specs?.wattage) {
      psuWattage = parseFloat(String(psu.specs.wattage));
    }
    
    const percentage = psuWattage ? (totalWattage / psuWattage) * 100 : 0;
    
    // Match backend compatibility logic for recommended PSU wattage
    const recommendedPsu = Math.ceil((totalWattage + 150) * 1.2);
    
    return { totalWattage: Math.round(totalWattage), psuWattage, percentage, recommendedPsu };
  };

  const hasMissingPrices = (): boolean => {
    return Object.values(selectedComponents).some(
      component => component !== null && !component.lowest_price_bdt
    );
  };

  const totalPrice = calculateTotalPrice();
  const powerDraw = calculatePowerDraw();
  const selectedCount = Object.values(selectedComponents).filter(c => c !== null).length;

  return (
    <div className="space-y-4">
      {/* Build Name - Compact */}
      <Card>
        <CardContent className="p-4">
          <Input
            id="buildName"
            placeholder="Enter build name..."
            value={buildName}
            onChange={(e) => onBuildNameChange(e.target.value)}
            className="text-base font-medium h-10"
          />
        </CardContent>
      </Card>

      {/* Power Draw Monitor - Critical Info */}
      {powerDraw.totalWattage > 0 && (
        <Card className={
          !powerDraw.psuWattage
            ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
            : powerDraw.percentage > 100 || (powerDraw.recommendedPsu && powerDraw.psuWattage < powerDraw.recommendedPsu)
            ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
            : powerDraw.percentage > 80
            ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
            : 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
        }>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">⚡ Power Consumption</span>
                <span className={`text-lg font-bold ${
                  !powerDraw.psuWattage || powerDraw.percentage > 100 || (powerDraw.recommendedPsu && powerDraw.psuWattage < powerDraw.recommendedPsu)
                    ? 'text-red-600 dark:text-red-400'
                    : powerDraw.percentage > 80
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {powerDraw.totalWattage}W
                </span>
              </div>
              
              {powerDraw.psuWattage && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>PSU Capacity</span>
                    <span className="font-semibold">{powerDraw.psuWattage}W</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        powerDraw.percentage > 100
                          ? 'bg-red-600'
                          : powerDraw.percentage > 80
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(powerDraw.percentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-center font-medium mt-2">
                    {powerDraw.percentage > 100 ? (
                      <span className="text-red-600 dark:text-red-400 flex flex-col gap-1">
                        <span>⚠️ OVER CAPACITY by {Math.round(powerDraw.percentage - 100)}%! Upgrade PSU!</span>
                        {powerDraw.recommendedPsu && <span>System Requires at least {powerDraw.recommendedPsu}W</span>}
                      </span>
                    ) : powerDraw.recommendedPsu && powerDraw.psuWattage < powerDraw.recommendedPsu ? (
                      <span className="text-red-600 dark:text-red-400 flex flex-col gap-1">
                        <span>⚠️ PSU ({powerDraw.psuWattage}W) is below system recommended ({powerDraw.recommendedPsu}W)!</span>
                      </span>
                    ) : powerDraw.percentage > 80 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 flex flex-col gap-1">
                        <span>⚠️ {Math.round(powerDraw.percentage)}% load - Consider higher wattage PSU</span>
                        {powerDraw.recommendedPsu && <span>System Recommended: {powerDraw.recommendedPsu}W</span>}
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 flex flex-col gap-1">
                        <span>✓ {Math.round(powerDraw.percentage)}% load - Good headroom</span>
                        {powerDraw.recommendedPsu && <span>System Recommended: {powerDraw.recommendedPsu}W (Met)</span>}
                      </span>
                    )}
                  </div>
                </>
              )}
              
              {!powerDraw.psuWattage && (
                <div className="text-xs text-center text-yellow-600 dark:text-yellow-400 font-medium">
                  ⚠️ Select a PSU to verify power compatibility
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Summary - Prominent */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Total Cost</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatPriceBDT(totalPrice)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              ~${convertBDTtoUSD(totalPrice)?.toFixed(0) || '0'}
            </div>
            {hasMissingPrices() && (
              <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                * Some components missing prices
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compatibility Status - Compact */}
      {(compatibility?.errors && compatibility.errors.length > 0) || (compatibility?.warnings && compatibility.warnings.length > 0) ? (
        <Card className={
          compatibility?.errors && compatibility.errors.length > 0
            ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
            : 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
        }>
          <CardContent className="p-4 space-y-2">
            {compatibility?.errors && compatibility.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Critical Issues</span>
                </div>
                {compatibility.errors.map((error, index) => (
                  <div key={index} className="text-xs text-red-600 dark:text-red-400 pl-6">
                    • {error}
                  </div>
                ))}
              </div>
            )}
            
            {compatibility?.warnings && compatibility.warnings.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-medium text-yellow-600 dark:text-yellow-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Warnings</span>
                </div>
                {compatibility.warnings.map((warning, index) => (
                  <div key={index} className="text-xs text-yellow-600 dark:text-yellow-400 pl-6">
                    • {warning}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : compatibility?.is_compatible ? (
        <Card className="border-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>All Compatible!</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Component List - Compact & Scrollable */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Components ({selectedCount}/{buildSteps.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-80 overflow-y-auto">
          {buildSteps.map((step) => {
            const component = selectedComponents[step.category];
            
            return (
              <div
                key={step.id}
                className={`p-2.5 rounded border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  component
                    ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/10'
                    : step.required
                    ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => onEdit(step.category)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground">{step.label}</div>
                    {component ? (
                      <div className="text-sm font-medium truncate">
                        {component.name.length > 35 ? component.name.substring(0, 35) + '...' : component.name}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground/70">Click to select</div>
                    )}
                  </div>
                  {component && component.lowest_price_bdt && (
                    <div className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                      {formatPriceBDT(component.lowest_price_bdt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Action Buttons - Compact */}
      <div className="space-y-2">
        <Button
          onClick={onSave}
          disabled={saving || selectedCount === 0 || !buildName.trim()}
          className="w-full"
          size="default"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Build'}
        </Button>
        
        {onShareToFeed && (
          <Button
            onClick={onShareToFeed}
            disabled={saving || selectedCount === 0 || !buildName.trim()}
            className="w-full"
            size="default"
            variant="default"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share to Feed
          </Button>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            className="w-full"
            size="sm"
            disabled={saving || sharing || selectedCount === 0 || !buildName.trim()}
            onClick={async () => {
              if (onShare) {
                setSharing(true);
                const result = await onShare();
                setSharing(false);
                if (result) {
                  setShareData(result);
                  setShareDialogOpen(true);
                }
              }
            }}
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            {sharing ? 'Wait...' : 'Share Link'}
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            size="sm"
            disabled={selectedCount === 0}
            onClick={() => {
              const exportData = {
                buildName,
                components: buildSteps.map(step => ({
                  category: step.label,
                  component: selectedComponents[step.category]
                })),
                totalPrice: calculateTotalPrice(),
                compatibility
              };
              exportBuildToPDF(exportData);
            }}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      {shareDialogOpen && shareData && (
        <ShareBuildDialog
          buildId={shareData.buildId}
          buildName={buildName}
          buildUrl={shareData.buildUrl}
          onClose={() => setShareDialogOpen(false)}
          onExportPDF={() => {
            const exportData = {
              buildName,
              components: buildSteps.map(step => ({
                category: step.label,
                component: selectedComponents[step.category]
              })),
              totalPrice: calculateTotalPrice(),
              compatibility
            };
            exportBuildToPDF(exportData);
          }}
          onExportExcel={() => {
            const exportData = {
              buildName,
              components: buildSteps.map(step => ({
                category: step.label,
                component: selectedComponents[step.category]
              })),
              totalPrice: calculateTotalPrice(),
              compatibility
            };
            exportBuildToExcel(exportData);
          }}
        />
      )}
    </div>
  );
}
