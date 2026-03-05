import { createClient } from '@/lib/supabase/server';
import { LiveClientPage } from './live-client';
import type { LiveClass } from '@/types/database';

export const revalidate = 300;

export default async function LiveClassPage() {
    const supabase = await createClient();

    const { data } = await supabase
        .from('live_classes')
        .select('*, subject:subjects(name, icon), tutor:profiles(full_name)')
        .eq('is_active', true)
        .order('scheduled_at', { ascending: true });

    return <LiveClientPage initialClasses={(data as LiveClass[]) || []} />;
}
