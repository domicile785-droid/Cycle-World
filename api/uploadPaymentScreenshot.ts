
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * Privileged handler to upload payment screenshots using the service_role key.
 * This bypasses RLS policies to allow customers to submit proof of payment
 * securely without exposing the storage bucket to public write access.
 */
export async function uploadPaymentScreenshotHandler(file: File, orderId: string): Promise<string> {
  const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
  
  if (bucketError) {
    throw new Error(`Admin Storage Access Error: ${bucketError.message}`);
  }

  const bucketExists = buckets.some(b => b.name === 'payment_screenshots');
  if (!bucketExists) {
    // Attempt to create the bucket if it doesn't exist (Admin privilege)
    const { error: createError } = await supabaseAdmin.storage.createBucket('payment_screenshots', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    if (createError) throw new Error("Could not initialize payment_screenshots bucket.");
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `pay_${orderId}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('payment_screenshots')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Secure Upload Failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('payment_screenshots')
    .getPublicUrl(fileName);
  
  return publicUrl;
}
