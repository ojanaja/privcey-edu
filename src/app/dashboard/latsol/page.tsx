import { createClient } from '@/lib/supabase/server';
import { LatsolClientPage } from './latsol-client';
import type { DailyExercise } from '@/types/database';

export const revalidate = 300;

export default async function LatsolPage() {
    const supabase = await createClient();

    const { data } = await supabase
        .from('daily_exercises')
        .select('*, subject:subjects(*)')
        .eq('is_active', true)
        .order('date', { ascending: false })
        .limit(20);

    return <LatsolClientPage initialExercises={(data as DailyExercise[]) || []} />;
}
