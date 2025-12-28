'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BuildImageGrid } from '@/components/builder/BuildImageGrid';
import { BuildInteractions } from '@/components/build-interactions';
import { formatPriceBDT } from '@/lib/currency';
import { ApiClient, type Build, type Component as BuilderComponent } from '@/lib/api';
import { toast } from 'sonner';

type BuildSource = 'shared' | 'standard';

interface SharedBuildComponentResponse {
  category?: string;
  product_id?: string;
  id?: string | number;
  name?: string;
  component_name?: string;
  brand?: string | null;
  brand_name?: string | null;
  price?: number | string | null;
  price_bdt?: number | string | null;
  price_at_selection_bdt?: number | string | null;
  lowest_price_bdt?: number | string | null;
  primary_image_url?: string | null;
  image?: string | null;
  image_url?: string | null;
  specs?: Record<string, unknown>;
}

interface SharedBuildCompatibilityResponse {
  is_compatible?: boolean;
  valid?: boolean;
  warnings?: unknown;
  errors?: unknown;
}

interface SharedBuildResponse {
  id?: string | number;
  share_id?: string | null;
  name?: string;
  created_at?: string;
  total_price?: number | string | null;
  total_price_bdt?: number | string | null;
  components?: SharedBuildComponentResponse[];
  compatibility?: SharedBuildCompatibilityResponse;
  share_url?: string | null;
}

interface DisplayComponent {
  category: string;
  product_id: string;
  name: string;
  brand: string | null;
  price_bdt: number | null;
  image?: string | null;
  specs?: Record<string, unknown>;
}

interface DisplayBuild {
  id: string;
  name: string;
  created_at: string;
  total_price_bdt: number | null;
  components: DisplayComponent[];
  compatibility: {
    is_compatible: boolean;
    warnings: string[];
    errors: string[];
  } | null;
  share_id?: string | null;
  share_url?: string | null;
  visibility?: 'private' | 'public';
  source: BuildSource;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const priceToNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const mapSharedBuild = (payload: SharedBuildResponse): DisplayBuild => {
  const rawWarnings = payload.compatibility?.warnings;
  const rawErrors = payload.compatibility?.errors;
  const compatibilityWarnings = Array.isArray(rawWarnings) ? rawWarnings.map(String) : [];
  const compatibilityErrors = Array.isArray(rawErrors) ? rawErrors.map(String) : [];

  return {
    id: (payload.id ?? '').toString(),
    name: payload.name ?? 'Untitled Build',
    created_at: payload.created_at ?? new Date().toISOString(),
    total_price_bdt: priceToNumber(payload.total_price ?? payload.total_price_bdt),
    components: Array.isArray(payload.components)
      ? payload.components.map((component) => ({
          category: component.category ?? 'component',
          product_id: (component.product_id ?? component.id ?? '').toString(),
          name: component.name ?? component.component_name ?? 'Component',
          brand: component.brand ?? component.brand_name ?? null,
          price_bdt: priceToNumber(
            component.price ?? component.price_bdt ?? component.price_at_selection_bdt ?? component.lowest_price_bdt
          ),
          image: component.primary_image_url ?? component.image ?? component.image_url ?? null,
          specs: component.specs ?? {},
        }))
      : [],
    compatibility: payload.compatibility
      ? {
          is_compatible: Boolean(payload.compatibility.is_compatible ?? payload.compatibility.valid),
          warnings: compatibilityWarnings,
          errors: compatibilityErrors,
        }
      : null,
    share_id: payload.share_id ?? null,
    share_url: payload.share_url ?? null,
    visibility: 'public',
    source: 'shared',
  };
};

const mapStandardBuild = (payload: Build): DisplayBuild => {
  type CompatibilityIssues = {
    warnings?: unknown[];
    errors?: unknown[];
  };

  const compatibility = (() => {
    const warnings: string[] = [];
    const errors: string[] = [];
    const issues = payload.compatibility_issues as CompatibilityIssues | undefined;

    if (Array.isArray(issues?.warnings)) {
      warnings.push(...issues.warnings.map(String));
    }
    if (Array.isArray(issues?.errors)) {
      errors.push(...issues.errors.map(String));
    }

    if (payload.compatibility_status === 'warnings' && warnings.length === 0) {
      warnings.push('Minor compatibility warnings detected');
    }

    if (payload.compatibility_status === 'errors' && errors.length === 0) {
      errors.push('Compatibility errors detected');
    }

    if (!payload.compatibility_status && warnings.length === 0 && errors.length === 0) {
      return null;
    }

    const isCompatible = payload.compatibility_status
      ? payload.compatibility_status === 'valid' || payload.compatibility_status === 'warnings'
      : errors.length === 0;

    return {
      is_compatible: isCompatible,
      warnings,
      errors,
    };
  })();

  return {
    id: payload.id.toString(),
    name: payload.name,
    created_at: payload.created_at,
    total_price_bdt: priceToNumber(payload.total_price),
    components: Array.isArray(payload.components)
      ? payload.components.map((component) => {
          type ComponentWithPivot = BuilderComponent & {
            pivot?: {
              category?: string;
              price_at_selection_bdt?: number | string | null;
            };
            price_at_selection_bdt?: number | string | null;
          };

          const detailedComponent = component as ComponentWithPivot;
          const pivot = detailedComponent.pivot ?? {};
          const category = pivot.category || detailedComponent.category || 'component';

          return {
            category,
            product_id: detailedComponent.product_id ?? detailedComponent.id ?? '',
            name: detailedComponent.name ?? detailedComponent.model ?? 'Component',
            brand: detailedComponent.brand ?? null,
            price_bdt: priceToNumber(pivot.price_at_selection_bdt ?? detailedComponent.price_at_selection_bdt ?? detailedComponent.lowest_price_bdt),
            image: detailedComponent.primary_image_url ?? detailedComponent.image_urls?.[0] ?? null,
            specs: detailedComponent.specs ?? {},
          };
        })
      : [],
    compatibility,
    share_id: payload.share_id ?? payload.share_token ?? null,
    share_url: payload.share_url ?? null,
    visibility: payload.visibility ?? 'private',
    source: 'standard',
  };
};

const fetchSharedBuild = async (identifier: string): Promise<DisplayBuild> => {
  const response = await fetch(`${apiBaseUrl}/shared-builds/${identifier}`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shared build not found (${response.status})${body ? ` - ${body}` : ''}`);
  }

  const rawResult: unknown = await response.json();
  const payload: SharedBuildResponse | undefined =
    typeof rawResult === 'object' && rawResult !== null && 'data' in rawResult
      ? (rawResult as { data?: SharedBuildResponse }).data
      : (rawResult as SharedBuildResponse | undefined);

  if (!payload) {
    throw new Error('Invalid shared build payload');
  }

  return mapSharedBuild(payload);
};

const fetchStandardBuild = async (identifier: string): Promise<DisplayBuild> => {
  const apiClient = new ApiClient(apiBaseUrl);
  const numericId = Number(identifier);

  if (Number.isNaN(numericId)) {
    throw new Error('Invalid build identifier');
  }

  const response = await apiClient.getBuild(numericId);
  return mapStandardBuild(response.data);
};

export default function BuildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const identifier = params.shareId as string;
  const [build, setBuild] = useState<DisplayBuild | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadBuild = async () => {
      if (!identifier) {
        toast.error('Missing build identifier');
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const numericIdentifier = /^\d+$/.test(identifier);
        let resolvedBuild: DisplayBuild | null = null;

        if (numericIdentifier) {
          try {
            resolvedBuild = await fetchStandardBuild(identifier);
          } catch (standardError) {
            console.warn('Standard build fetch failed, attempting shared build fallback', standardError);
            resolvedBuild = await fetchSharedBuild(identifier);
          }
        } else {
          try {
            resolvedBuild = await fetchSharedBuild(identifier);
          } catch (sharedError) {
            console.warn('Shared build fetch failed, attempting numeric build fallback', sharedError);
            resolvedBuild = await fetchStandardBuild(identifier);
          }
        }

        setBuild(resolvedBuild);
      } catch (error) {
        console.error('Failed to load build:', error);
        const message = error instanceof Error ? error.message : 'Build not found';
        if (message.includes('403')) {
          toast.error('You do not have access to this build');
        } else {
          toast.error(message);
        }
        setBuild(null);
      } finally {
        setLoading(false);
      }
    };

    loadBuild();
  }, [identifier]);

  const handleCopyLink = async () => {
    if (!build) return;
    try {
      const linkToCopy = build.share_url || window.location.href;
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleCloneBuild = () => {
    if (!build) return;

    const componentsForBuilder: Record<string, BuilderComponent> = {};

    build.components.forEach((component) => {
      if (!component.product_id) {
        return;
      }

      componentsForBuilder[component.category] = {
        id: component.product_id,
        product_id: component.product_id,
        name: component.name,
        category: component.category,
        brand: component.brand ?? 'Unknown',
        model: component.name,
        specs: component.specs ?? {},
        lowest_price_bdt: component.price_bdt ?? null,
        image_urls: component.image ? [component.image] : [],
        primary_image_url: component.image ?? null,
      };
    });

    if (Object.keys(componentsForBuilder).length === 0) {
      toast.error('Unable to clone build', {
        description: 'No components available to load.',
      });
      return;
    }

    sessionStorage.setItem('pendingBuild', JSON.stringify(componentsForBuilder));
    sessionStorage.setItem('clonedBuildName', `${build.name} (Copy)`);

    router.push('/builder');
    toast.success('Build loaded! You can modify and save it.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Loading build...</p>
        </div>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Build Not Found</h2>
          <p className="text-muted-foreground mb-6">The build you are looking for does not exist or has been removed.</p>
          <Button asChild>
            <Link href="/builder">Create Your Own Build</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/builder">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Builder
          </Link>
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-3xl mb-2 break-words">{build.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                  <span>{new Date(build.created_at).toLocaleDateString()}</span>
                  {build.visibility && (
                    <Badge variant={build.visibility === 'public' ? 'default' : 'secondary'}>
                      {build.visibility === 'public' ? 'Public Build' : 'Private Build'}
                    </Badge>
                  )}
                  {build.source === 'shared' && <Badge variant="outline">Shared Link</Badge>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
                <p className="text-3xl font-bold text-primary">
                  {build.total_price_bdt !== null ? formatPriceBDT(build.total_price_bdt) : 'N/A'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row mb-6">
              <Button onClick={handleCloneBuild} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Clone & Modify
              </Button>
              <Button variant="outline" onClick={handleCopyLink}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
            
            {/* Build Interactions - Likes, Comments, Actions */}
            <BuildInteractions 
              buildId={parseInt(build.id, 10)}
              canClone={true}
              canEdit={false}
              canDelete={false}
              onClone={handleCloneBuild}
            />
          </CardContent>
        </Card>

        {build.compatibility && (
          <Card
            className={`mb-6 ${
              build.compatibility.errors.length > 0
                ? 'border-red-500'
                : build.compatibility.warnings.length > 0
                ? 'border-yellow-500'
                : build.compatibility.is_compatible
                ? 'border-green-500'
                : ''
            }`}
          >
            <CardHeader>
              <CardTitle>
                {build.compatibility.is_compatible && build.compatibility.errors.length === 0
                  ? '✅ Compatible Build'
                  : '⚠️ Compatibility Issues'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {build.compatibility.errors.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="font-semibold text-red-600">Errors:</p>
                  {build.compatibility.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">• {error}</p>
                  ))}
                </div>
              )}
              {build.compatibility.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-yellow-600">Warnings:</p>
                  {build.compatibility.warnings.map((warning, index) => (
                    <p key={index} className="text-sm text-yellow-600">• {warning}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Build Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Component Images Grid */}
            <div className="mb-6">
              {build.components.length > 0 ? (
                <BuildImageGrid
                  components={build.components.map(comp => ({
                    id: comp.product_id,
                    product_id: comp.product_id,
                    name: comp.name,
                    category: comp.category,
                    brand: comp.brand ?? 'Unknown',
                    model: comp.name,
                    specs: comp.specs ?? {},
                    lowest_price_bdt: comp.price_bdt,
                    image_urls: comp.image ? [comp.image] : [],
                    primary_image_url: comp.image ?? undefined,
                  }))}
                />
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-muted-foreground">No components in this build</p>
                </div>
              )}
            </div>

            {/* Component Details */}
            {build.components.map((component, index) => (
              <div key={`${component.category}-${component.product_id}-${index}`} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-1 truncate">{component.category}</p>
                  <p className="font-semibold break-words">{component.name}</p>
                  {component.brand && (
                    <p className="text-sm text-muted-foreground break-words">{component.brand}</p>
                  )}
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="font-bold text-primary">
                    {component.price_bdt !== null ? formatPriceBDT(component.price_bdt) : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
