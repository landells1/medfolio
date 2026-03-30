import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

// Restrict CORS to the app's own origin. Set SITE_URL in Supabase project secrets.
const allowedOrigin = Deno.env.get('SITE_URL') ?? 'https://medfolio.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization') ?? '';

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !authHeader) {
      return new Response(JSON.stringify({ error: 'Missing function configuration.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: uploads, error: uploadsError } = await adminClient
      .from('uploads')
      .select('file_path')
      .eq('user_id', user.id);

    if (uploadsError) {
      throw uploadsError;
    }

    const filePaths = (uploads ?? [])
      .map((upload) => upload.file_path)
      .filter((filePath): filePath is string => !!filePath);

    if (filePaths.length > 0) {
      const { error: storageError } = await adminClient.storage
        .from('evidence')
        .remove(filePaths);

      if (storageError) {
        throw storageError;
      }
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[delete-user] Error:', error);

    return new Response(JSON.stringify({ error: 'Failed to delete account.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
