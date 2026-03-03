import { createClient } from '@/lib/supabase/server';
import { EmodClientPage } from './emod-client';
import type { EmodContent } from '@/types/database';

export const revalidate = 300;

export default async function EmodPage() {
    const supabase = await createClient();

    const { data } = await supabase
        .from('emod_content')
        .select('*, subject:subjects(name, icon)')
        .eq('is_active', true)
        .order('order');

    return <EmodClientPage initialEmods={(data as EmodContent[]) || []} />;
}
