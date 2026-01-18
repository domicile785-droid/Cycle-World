
import { supabase } from './supabaseClient';
import { Product } from '../types';
import { uploadProductImagesHandler } from '../api/uploadProductImages';
import { serializeError } from '../utils/errorUtils';

// Explicitly define the columns we want to fetch to avoid 42703 errors with non-existent columns
const PRODUCT_COLUMNS = 'id, name, description, price, stock, images, created_at';

export const productService = {
  async addProduct(productData: { name: string; description: string; price: number; stock: number }, imageFiles: File[]) {
    try {
      console.log('Initiating secure product creation flow...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required. Please log in again.');
      }

      let imageUrls: string[] = [];
      try {
        imageUrls = await uploadProductImagesHandler(imageFiles);
      } catch (uploadErr: any) {
        const msg = serializeError(uploadErr);
        console.error('Backend Upload Failed Trace:', msg);
        throw new Error(`Image Upload Failed: ${msg}`);
      }

      const { data, error: dbError } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          images: imageUrls,
        }])
        .select(PRODUCT_COLUMNS)
        .single();

      if (dbError) {
        const msg = serializeError(dbError);
        console.error('Database Insertion Error Detail:', msg);
        throw new Error(`Database Error: ${msg}`);
      }

      return { data: data as Product, error: null };
    } catch (err: any) {
      const detailedErrorMessage = serializeError(err);
      console.error('Secure Add Product Failed Trace:', detailedErrorMessage);
      return { data: null, error: { message: detailedErrorMessage } };
    }
  },

  async updateProduct(id: string, productData: Partial<Product>, newImageFiles: File[], existingImageUrls: string[]) {
    try {
      let uploadedUrls: string[] = [];
      if (newImageFiles.length > 0) {
        uploadedUrls = await uploadProductImagesHandler(newImageFiles);
      }

      const finalImages = [...existingImageUrls, ...uploadedUrls];
      
      const { data, error: dbError } = await supabase
        .from('products')
        .update({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          images: finalImages,
        })
        .eq('id', id)
        .select(PRODUCT_COLUMNS)
        .single();

      if (dbError) {
        const msg = serializeError(dbError);
        console.error('Database Update Error Detail:', msg);
        throw new Error(`Database Error: ${msg}`);
      }
      return { data: data as Product, error: null };
    } catch (err: any) {
      const detailedErrorMessage = serializeError(err);
      console.error('Secure Update Product Failed Trace:', detailedErrorMessage);
      return { data: null, error: { message: detailedErrorMessage } };
    }
  },

  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .order('created_at', { ascending: false });
    return { data: data as Product[], error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('id', id)
      .single();
    return { data: data as Product, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    return { error };
  }
};
