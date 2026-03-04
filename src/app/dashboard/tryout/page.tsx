import { createClient } from '@/lib/supabase/server';
import { TryoutClientPage } from './tryout-client';
import type { TryOut } from '@/types/database';

export const revalidate = 300;

export default async function TryOutListPage() {
    const supabase = await createClient();

    const { data } = await supabase
        .from('tryouts')
        .select('*, subject:subjects(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    return <TryoutClientPage initialTryouts={(data as TryOut[]) || []} />;
}
