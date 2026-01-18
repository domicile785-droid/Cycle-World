
import { supabaseAdmin } from '../lib/supabaseAdmin';

export async function uploadProductImagesHandler(files: File[]): Promise<string[]> {
  const imageUrls: string[] = [];

  const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
  if (bucketError) {
    const msg = bucketError.message || JSON.stringify(bucketError);
    console.error('Critical: Could not access Storage buckets with Service Role key.', msg);
    throw new Error(`Admin Access Error: ${msg}`);
  }

  const bucketExists = buckets.some(b => b.name === 'product_images');
  if (!bucketExists) {
    throw new Error("Bucket 'product_images' does not exist in your Supabase project.");
  }

  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName;

    console.log(`Backend uploading: ${fileName}...`);

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('product_images')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      const msg = uploadError.message || JSON.stringify(uploadError);
      console.error('Admin Storage Upload Failure:', msg);
      throw new Error(`Storage Upload Failed: ${msg}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product_images')
      .getPublicUrl(filePath);
    
    imageUrls.push(publicUrl);
  }

  return imageUrls;
}
