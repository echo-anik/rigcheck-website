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

  const hasMissingPrices = (): boolean => {
    return Object.values(selectedComponents).some(
      component => component !== null && !component.lowest_price_bdt
    );
  };

  const totalPrice = calculateTotalPrice();
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

      {/* Price Summary - Prominent */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Total Cost</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatPriceBDT(totalPrice)}
            </div>
            <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
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
                    <div className="text-xs font-medium text-muted-foreground dark:text-gray-400">{step.label}</div>
                    {component ? (
                      <div className="text-sm font-medium truncate dark:text-gray-200">
                        {component.name.length > 35 ? component.name.substring(0, 35) + '...' : component.name}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 dark:text-gray-500">Click to select</div>
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
