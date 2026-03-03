import { createClient } from '@/lib/supabase/server';
import { VodClientPage } from './vod-client';
import type { VodContent } from '@/types/database';

export const revalidate = 300;

export default async function VodPage() {
    const supabase = await createClient();

    const { data } = await supabase
        .from('vod_content')
        .select('*, subject:subjects(name, icon)')
        .eq('is_active', true)
        .order('order');

    return <VodClientPage initialVods={(data as VodContent[]) || []} />;
}
