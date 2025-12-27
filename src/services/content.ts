import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.scrapiz.in';

export interface CarouselImage {
  id: number;
  title: string;
  image_url: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCarouselImageRequest {
  title: string;
  image_url: string;
  order: number;
  is_active: boolean;
}

export interface UpdateCarouselImageRequest {
  title?: string;
  image_url?: string;
  order?: number;
  is_active?: boolean;
}

export class ContentService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('adminAuthToken');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all carousel images (admin view - includes inactive)
   */
  static async getCarouselImages(): Promise<CarouselImage[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/content/carousel/`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch carousel images');
    }
  }

  /**
   * Get active carousel images only (public endpoint)
   */
  static async getActiveCarouselImages(): Promise<CarouselImage[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/content/carousel/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active carousel images');
    }
  }

  /**
   * Create a new carousel image
   */
  static async createCarouselImage(data: CreateCarouselImageRequest): Promise<CarouselImage> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/content/carousel/`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create carousel image');
    }
  }

  /**
   * Update a carousel image
   */
  static async updateCarouselImage(
    id: number,
    data: UpdateCarouselImageRequest
  ): Promise<CarouselImage> {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/content/carousel/${id}/`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update carousel image');
    }
  }

  /**
   * Delete a carousel image
   */
  static async deleteCarouselImage(id: number): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/content/carousel/${id}/`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete carousel image');
    }
  }

  /**
   * Reorder carousel images
   */
  static async reorderCarouselImages(
    orders: Array<{ id: number; order: number }>
  ): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/content/carousel/reorder/`,
        { orders },
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reorder carousel images');
    }
  }
}
