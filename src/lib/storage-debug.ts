import { supabase } from "@/integrations/supabase/client";

export async function debugStorageBucket() {
  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('Available buckets:', buckets);
    if (bucketsError) console.error('Error listing buckets:', bucketsError);

    // List files in submission-files bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('submission-files')
      .list('', { limit: 100 });
    console.log('Files in submission-files bucket:', files);
    if (filesError) console.error('Error listing files:', filesError);

    return { buckets, files, bucketsError, filesError };
  } catch (error) {
    console.error('Error debugging storage:', error);
    return { error };
  }
}

export async function checkFileExists(workerId: string, fileName: string) {
  try {
    const filePath = `${workerId}/${fileName}`;
    console.log(`Checking if file exists: ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from('submission-files')
      .list(workerId);
    
    if (error) {
      console.error('Error listing files for worker:', error);
      return false;
    }
    
    const fileExists = data?.some(file => file.name === fileName);
    console.log(`File ${fileName} exists for worker ${workerId}:`, fileExists);
    console.log('Available files for worker:', data);
    
    return fileExists;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}

export async function testSignedUrl(workerId: string, fileName: string) {
  try {
    const filePath = `${workerId}/${fileName}`;
    console.log(`Testing signed URL for: ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from('submission-files')
      .createSignedUrl(filePath, 3600);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return { success: false, error };
    }
    
    console.log('Signed URL created successfully:', data.signedUrl);
    return { success: true, url: data.signedUrl };
  } catch (error) {
    console.error('Error testing signed URL:', error);
    return { success: false, error };
  }
}
