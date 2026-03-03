export type UserRole = 'student' | 'tutor' | 'admin';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    class_id: string | null;
    avatar_url: string | null;
    is_active: boolean;
    payment_status: 'active' | 'expired' | 'pending';
    payment_expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ClassGroup {
    id: string;
    name: string;
    description: string | null;
    tutor_id: string | null;
    max_students: number;
    created_at: string;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    description: string | null;
    icon: string | null;
}

export interface TryOut {
    id: string;
    title: string;
    subject_id: string;
    class_id: string | null;
    description: string | null;
    duration_minutes: number;
    passing_grade: number;
    is_active: boolean;
    start_time: string | null;
    end_time: string | null;
    created_by: string;
    created_at: string;
    subject?: Subject;
}

export interface Question {
    id: string;
    tryout_id: string;
    question_text: string;
    question_image_url: string | null;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    option_e: string | null;
    correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
    explanation: string | null;
    difficulty: 'easy' | 'medium' | 'hard';
    order_number: number;
}

export interface TryOutAttempt {
    id: string;
    tryout_id: string;
    student_id: string;
    started_at: string;
    finished_at: string | null;
    score: number | null;
    total_correct: number;
    total_wrong: number;
    total_unanswered: number;
    is_submitted: boolean;
    tryout?: TryOut;
    student?: Profile;
}

export interface StudentAnswer {
    id: string;
    attempt_id: string;
    question_id: string;
    selected_answer: 'A' | 'B' | 'C' | 'D' | 'E' | null;
    is_correct: boolean | null;
    answered_at: string | null;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    is_active: boolean;
    target_class_id: string | null;
    created_by: string;
    created_at: string;
    expires_at: string | null;
}

export interface AttendanceLog {
    id: string;
    student_id: string;
    activity_type: 'vod_watch' | 'live_class' | 'tryout' | 'emod_access';
    activity_id: string | null;
    activity_title: string | null;
    timestamp: string;
    duration_seconds: number | null;
    student?: Profile;
}

export interface StrengthensModule {
    id: string;
    title: string;
    subject_id: string;
    tryout_id: string;
    content_url: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    subject?: Subject;
    tryout?: TryOut;
}

export interface DailyExercise {
    id: string;
    title: string;
    subject_id: string;
    class_id: string | null;
    date: string;
    is_active: boolean;
    created_at: string;
    subject?: Subject;
    questions?: Question[];
}

export interface ScoreHistory {
    id: string;
    student_id: string;
    tryout_id: string;
    score: number;
    recorded_at: string;
    tryout?: TryOut;
}

export interface VodContent {
    id: string;
    title: string;
    description: string | null;
    youtube_url: string;
    youtube_id: string;
    subject_id: string | null;
    duration: string | null;
    thumbnail_url: string | null;
    order: number;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    subject?: Subject;
}

export interface EmodContent {
    id: string;
    title: string;
    description: string | null;
    drive_url: string;
    subject_id: string | null;
    chapter: string | null;
    order: number;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    subject?: Subject;
}

export interface LiveClass {
    id: string;
    title: string;
    description: string | null;
    meet_url: string;
    scheduled_at: string;
    subject_id: string | null;
    tutor_id: string | null;
    class_id: string | null;
    is_active: boolean;
    created_at: string;
    subject?: Subject;
    tutor?: Profile;
}
