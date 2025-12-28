const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface BuildInteraction {
  id: number;
  build_id: number;
  type: 'like' | 'comment';
  user_id: number;
  content?: string;
  created_at: string;
}

export interface BuildLike {
  id: number;
  build_id: number;
  user_id: number;
  created_at: string;
}

export interface BuildComment {
  id: number;
  build_id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  content: string;
  created_at: string;
  updated_at: string;
}

export class InteractionsService {
  // Like/Unlike a build
  static async toggleLikeBuild(buildId: number, token: string): Promise<{ liked: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/builds/${buildId}/toggle-like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle like: ${response.statusText}`);
      }

      const data = await response.json();
      return { liked: data.data?.liked || data.liked || false };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Get build likes count
  static async getBuildLikes(buildId: number): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/builds/${buildId}/likes`);

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.data?.count || data.count || 0;
    } catch (error) {
      console.error('Error getting likes:', error);
      return 0;
    }
  }

  // Check if user liked a build
  static async checkUserLike(buildId: number, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/builds/${buildId}/check-like`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.data?.liked || data.liked || false;
    } catch (error) {
      console.error('Error checking like:', error);
      return false;
    }
  }

  // Add comment to build
  static async addComment(buildId: number, content: string, token: string): Promise<BuildComment> {
    try {
      const response = await fetch(`${API_BASE_URL}/builds/${buildId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get build comments
  static async getBuildComments(buildId: number): Promise<BuildComment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/builds/${buildId}/comments`);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  // Delete comment
  static async deleteComment(buildId: number, commentId: number, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/builds/${buildId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete comment: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Edit build (admin/owner only)
  static async editBuild(
    buildId: number,
    buildData: {
      name?: string;
      description?: string;
      is_public?: boolean;
    },
    token: string
  ): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${API_BASE_URL}/builds/${buildId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildData),
      });

      if (!response.ok) {
        throw new Error(`Failed to edit build: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error editing build:', error);
      throw error;
    }
  }

  // Delete build (admin/owner only)
  static async deleteBuild(buildId: number, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/builds/${buildId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete build: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting build:', error);
      throw error;
    }
  }
}
