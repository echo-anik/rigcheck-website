'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient, Build, Component } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BuildImageGrid } from '@/components/builder/BuildImageGrid';
import { BuildInteractions } from '@/components/build-interactions';
import { Eye, Heart, MessageSquare, Share2, User } from 'lucide-react';
import { toast } from 'sonner';

const api = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1');

export default function FeedPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Require authentication to view feed
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/feed');
      return;
    }
    
    if (isAuthenticated) {
      fetchSharedBuilds();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchSharedBuilds = async () => {
    setLoading(true);
    try {
      // Fetch all public builds
      const response = await api.getBuilds({ 
        per_page: 50,
        is_public: true,
      });
      // Sort by most recent
      const sortedBuilds = response.data.sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      setBuilds(sortedBuilds);
    } catch (error) {
      console.error('Failed to fetch builds:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (!price) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `৳${numPrice.toLocaleString('en-BD')}`;
  };

  const getCompatibilityBadge = (status?: string) => {
    if (!status || status === 'valid') {
      return <Badge className="bg-green-500">Compatible</Badge>;
    } else if (status === 'warnings') {
      return <Badge className="bg-yellow-500">Warnings</Badge>;
    } else {
      return <Badge className="bg-red-500">Errors</Badge>;
    }
  };

  const handleCloneBuild = useCallback((build: Build) => {
    const componentsForBuilder: Record<string, Partial<Component>> = {};

    (build.components || []).forEach((component) => {
      const productId = component.product_id || component.id;
      if (!productId) {
        return;
      }

      componentsForBuilder[component.category] = {
        id: productId,
        product_id: productId,
        name: component.name,
        category: component.category,
        brand: component.brand ?? 'Unknown',
        model: component.name,
        specs: component.specs ?? {},
        lowest_price_bdt: component.lowest_price_bdt ?? null,
        image_urls: component.image_urls || (component.primary_image_url ? [component.primary_image_url] : []),
        primary_image_url: component.primary_image_url ?? null,
      };
    });

    if (Object.keys(componentsForBuilder).length === 0) {
      toast.error('Unable to clone build', {
        description: 'No components available to load.',
      });
      return;
    }

    sessionStorage.setItem('pendingBuild', JSON.stringify(componentsForBuilder));
    sessionStorage.setItem('clonedBuildName', `${build.name || 'Unnamed Build'} (Copy)`);

    router.push('/builder');
    toast.success('Build loaded! You can modify and save it.');
  }, [router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading shared builds...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Community Builds Feed</h1>
          <p className="text-gray-600">Discover PC builds shared by the RigCheck community</p>
        </div>

        {/* Shared Builds Feed */}
        {builds.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Share2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Shared Builds Yet</h2>
              <p className="text-muted-foreground mb-4">
                Be the first to share your PC build with the community!
              </p>
              <Button asChild>
                <Link href="/builder">Create a Build</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {builds.map((build) => (
              <Card key={build.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        <Link 
                          href={`/builds/${build.id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {build.name || 'Unnamed Build'}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="h-4 w-4" />
                        <span>Shared by user</span>
                      </div>
                    </div>
                    {getCompatibilityBadge(build.compatibility_status)}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  {/* Build Component Images */}
                  <BuildImageGrid
                    components={(build.components || []).map(comp => ({
                      ...comp,
                      primary_image_url: comp.primary_image_url ?? undefined
                    }))}
                    className="mb-4"
                  />

                  {build.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {build.description}
                    </p>
                  )}

                  {/* Build Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(build.total_price)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Components</div>
                      <div className="text-lg font-bold">
                        {build.components?.length || 0}
                      </div>
                    </div>
                  </div>

                  {/* Social Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{build.view_count || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{build.like_count || 0} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{build.comment_count || 0} comments</span>
                    </div>
                  </div>

                  {/* Build Interactions - Likes and Comments */}
                  <div className="mb-4 border-t pt-4">
                    <BuildInteractions 
                      buildId={typeof build.id === 'string' ? parseInt(build.id, 10) : build.id}
                      canClone={true}
                      canEdit={false}
                      canDelete={false}
                      initialLikeCount={build.like_count || 0}
                      onClone={() => handleCloneBuild(build)}
                    />
                  </div>

                  {/* Use Case Badge */}
                  {build.use_case && (
                    <div className="mb-4">
                      <Badge variant="outline" className="capitalize">
                        {build.use_case}
                      </Badge>
                    </div>
                  )}

                  {/* View Details Button */}
                  <Button asChild className="w-full mt-auto">
                    <Link href={`/builds/${build.id}`}>
                      View Build Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
