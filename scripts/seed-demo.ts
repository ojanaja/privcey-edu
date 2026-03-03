import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

if (typeof globalThis.fetch === 'undefined') {
    try {
        // @ts-ignore
        const undici = require('undici');
        // @ts-ignore
        globalThis.fetch = undici.fetch;
        // @ts-ignore
        globalThis.Headers = undici.Headers;
        // @ts-ignore
        globalThis.Request = undici.Request;
        // @ts-ignore
        globalThis.Response = undici.Response;
    } catch {
        console.error('❌ Node.js 18+ required, or install undici: npm i undici');
        process.exit(1);
    }
}

function loadEnv() {
    try {
        const envPath = resolve(process.cwd(), '.env.local');
        const envContent = readFileSync(envPath, 'utf-8');
        for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key && value && !process.env[key]) {
                process.env[key] = value;
            }
        }
    } catch (err) {
        console.warn('.env.local file not found or failed to load. Make sure to set environment variables properly.');
    }
}

function randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
}

function daysFromNow(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString();
}

function hoursFromNow(n: number): string {
    const d = new Date();
    d.setHours(d.getHours() + n);
    return d.toISOString();
}


const DEMO_STUDENTS = [
    { email: 'budi@demo.com', name: 'Budi Santoso', password: 'demo123' },
    { email: 'siti@demo.com', name: 'Siti Nurhaliza', password: 'demo123' },
    { email: 'andi@demo.com', name: 'Andi Pratama', password: 'demo123' },
    { email: 'dewi@demo.com', name: 'Dewi Lestari', password: 'demo123' },
    { email: 'riko@demo.com', name: 'Riko Firmansyah', password: 'demo123' },
    { email: 'maya@demo.com', name: 'Maya Sari', password: 'demo123' },
    { email: 'fajar@demo.com', name: 'Fajar Nugroho', password: 'demo123' },
    { email: 'putri@demo.com', name: 'Putri Handayani', password: 'demo123' },
    { email: 'dimas@demo.com', name: 'Dimas Prasetyo', password: 'demo123' },
    { email: 'anisa@demo.com', name: 'Anisa Rahma', password: 'demo123' },
    { email: 'rizki@demo.com', name: 'Rizki Ramadhan', password: 'demo123' },
    { email: 'sarah@demo.com', name: 'Sarah Amelia', password: 'demo123' },
];

const DEMO_TUTORS = [
    { email: 'tutor1@demo.com', name: 'Pak Ahmad Fauzi', password: 'demo123' },
    { email: 'tutor2@demo.com', name: 'Bu Ratna Dewi', password: 'demo123' },
];

const DEMO_ADMIN = { email: 'admin@demo.com', name: 'Admin Demo', password: 'demo123' };


const MTK_QUESTIONS = [
    {
        question_text: 'Berapakah hasil dari 15 × 12 + 30?',
        option_a: '180', option_b: '210', option_c: '200', option_d: '220', option_e: '190',
        correct_answer: 'B' as const, explanation: '15 × 12 = 180, kemudian 180 + 30 = 210', difficulty: 'easy' as const,
    },
    {
        question_text: 'Jika x + 5 = 12, maka nilai x adalah...',
        option_a: '5', option_b: '6', option_c: '7', option_d: '8', option_e: '9',
        correct_answer: 'C' as const, explanation: 'x = 12 - 5 = 7', difficulty: 'easy' as const,
    },
    {
        question_text: 'Luas segitiga dengan alas 10 cm dan tinggi 8 cm adalah...',
        option_a: '80 cm²', option_b: '40 cm²', option_c: '60 cm²', option_d: '20 cm²', option_e: '50 cm²',
        correct_answer: 'B' as const, explanation: 'L = ½ × a × t = ½ × 10 × 8 = 40 cm²', difficulty: 'easy' as const,
    },
    {
        question_text: 'Nilai dari √144 adalah...',
        option_a: '10', option_b: '11', option_c: '12', option_d: '13', option_e: '14',
        correct_answer: 'C' as const, explanation: '12 × 12 = 144, maka √144 = 12', difficulty: 'easy' as const,
    },
    {
        question_text: 'Jika 2x - 3 = 11, maka nilai x adalah...',
        option_a: '5', option_b: '6', option_c: '7', option_d: '8', option_e: '4',
        correct_answer: 'C' as const, explanation: '2x = 14, x = 7', difficulty: 'medium' as const,
    },
    {
        question_text: 'Keliling lingkaran dengan jari-jari 7 cm adalah... (π = 22/7)',
        option_a: '22 cm', option_b: '44 cm', option_c: '88 cm', option_d: '154 cm', option_e: '66 cm',
        correct_answer: 'B' as const, explanation: 'K = 2πr = 2 × 22/7 × 7 = 44 cm', difficulty: 'medium' as const,
    },
    {
        question_text: 'Diketahui barisan aritmetika: 3, 7, 11, 15, ... Suku ke-10 adalah...',
        option_a: '39', option_b: '37', option_c: '41', option_d: '43', option_e: '35',
        correct_answer: 'A' as const, explanation: 'a=3, b=4, U10 = 3 + (10-1)×4 = 3 + 36 = 39', difficulty: 'medium' as const,
    },
    {
        question_text: 'Hasil dari 2³ × 3² adalah...',
        option_a: '48', option_b: '72', option_c: '36', option_d: '54', option_e: '64',
        correct_answer: 'B' as const, explanation: '2³ = 8, 3² = 9, 8 × 9 = 72', difficulty: 'medium' as const,
    },
    {
        question_text: 'Volume balok dengan panjang 5 cm, lebar 4 cm, dan tinggi 3 cm adalah...',
        option_a: '12 cm³', option_b: '60 cm³', option_c: '45 cm³', option_d: '30 cm³', option_e: '50 cm³',
        correct_answer: 'B' as const, explanation: 'V = p × l × t = 5 × 4 × 3 = 60 cm³', difficulty: 'easy' as const,
    },
    {
        question_text: 'Gradien garis yang melalui titik (2, 3) dan (4, 7) adalah...',
        option_a: '1', option_b: '2', option_c: '3', option_d: '4', option_e: '½',
        correct_answer: 'B' as const, explanation: 'm = (7-3)/(4-2) = 4/2 = 2', difficulty: 'hard' as const,
    },
];

const BIND_QUESTIONS = [
    {
        question_text: 'Kalimat utama pada paragraf deduktif terletak di...',
        option_a: 'Awal paragraf', option_b: 'Tengah paragraf', option_c: 'Akhir paragraf', option_d: 'Awal dan akhir', option_e: 'Tidak ada kalimat utama',
        correct_answer: 'A' as const, explanation: 'Paragraf deduktif memiliki kalimat utama di awal paragraf', difficulty: 'easy' as const,
    },
    {
        question_text: 'Kata baku dari "aktifitas" adalah...',
        option_a: 'Aktifitas', option_b: 'Aktivitas', option_c: 'Aktipitas', option_d: 'Aktibitas', option_e: 'Aktivtas',
        correct_answer: 'B' as const, explanation: 'Berdasarkan KBBI, penulisan yang benar adalah "aktivitas"', difficulty: 'easy' as const,
    },
    {
        question_text: 'Majas yang membandingkan dua hal secara langsung menggunakan kata "seperti" disebut...',
        option_a: 'Metafora', option_b: 'Simile', option_c: 'Personifikasi', option_d: 'Hiperbola', option_e: 'Litotes',
        correct_answer: 'B' as const, explanation: 'Simile/perumpamaan menggunakan kata pembanding seperti, bagai, laksana', difficulty: 'medium' as const,
    },
    {
        question_text: 'Unsur intrinsik cerpen yang berkaitan dengan pesan moral adalah...',
        option_a: 'Tema', option_b: 'Alur', option_c: 'Amanat', option_d: 'Latar', option_e: 'Tokoh',
        correct_answer: 'C' as const, explanation: 'Amanat adalah pesan moral yang ingin disampaikan pengarang', difficulty: 'easy' as const,
    },
    {
        question_text: 'Jenis kata "berlari" termasuk dalam...',
        option_a: 'Kata benda', option_b: 'Kata kerja', option_c: 'Kata sifat', option_d: 'Kata keterangan', option_e: 'Kata ganti',
        correct_answer: 'B' as const, explanation: '"Berlari" adalah kata kerja (verba) karena menunjukkan tindakan/aksi', difficulty: 'easy' as const,
    },
    {
        question_text: '"Angin berbisik di telinga" merupakan contoh majas...',
        option_a: 'Metafora', option_b: 'Simile', option_c: 'Personifikasi', option_d: 'Hiperbola', option_e: 'Ironi',
        correct_answer: 'C' as const, explanation: 'Personifikasi memberikan sifat manusia pada benda mati', difficulty: 'medium' as const,
    },
    {
        question_text: 'Tanda baca yang tepat untuk kalimat langsung adalah...',
        option_a: 'Tanda kurung', option_b: 'Tanda petik', option_c: 'Tanda seru', option_d: 'Tanda titik dua', option_e: 'Tanda pisah',
        correct_answer: 'B' as const, explanation: 'Kalimat langsung menggunakan tanda petik ("...")', difficulty: 'easy' as const,
    },
    {
        question_text: 'Konjungsi "namun" termasuk dalam jenis...',
        option_a: 'Konjungsi koordinatif', option_b: 'Konjungsi subordinatif', option_c: 'Konjungsi korelatif', option_d: 'Konjungsi temporal', option_e: 'Konjungsi kausal',
        correct_answer: 'A' as const, explanation: '"Namun" adalah konjungsi koordinatif yang menyatakan pertentangan', difficulty: 'medium' as const,
    },
    {
        question_text: 'Struktur teks eksposisi yang benar adalah...',
        option_a: 'Orientasi - Komplikasi - Resolusi', option_b: 'Tesis - Argumentasi - Penegasan Ulang', option_c: 'Abstraksi - Orientasi - Krisis', option_d: 'Pernyataan umum - Deretan penjelas', option_e: 'Identifikasi - Deskripsi',
        correct_answer: 'B' as const, explanation: 'Teks eksposisi: Tesis → Argumentasi → Penegasan Ulang', difficulty: 'hard' as const,
    },
    {
        question_text: 'Afiks "me-" pada kata "memukul" berfungsi sebagai...',
        option_a: 'Prefiks', option_b: 'Sufiks', option_c: 'Infiks', option_d: 'Konfiks', option_e: 'Klitika',
        correct_answer: 'A' as const, explanation: 'Prefiks (awalan) adalah imbuhan yang ditambahkan di awal kata', difficulty: 'easy' as const,
    },
];

const BING_QUESTIONS = [
    {
        question_text: 'Choose the correct sentence:',
        option_a: 'She don\'t like coffee', option_b: 'She doesn\'t likes coffee', option_c: 'She doesn\'t like coffee', option_d: 'She not like coffee', option_e: 'She isn\'t like coffee',
        correct_answer: 'C' as const, explanation: 'Subject "She" uses "doesn\'t" + base verb', difficulty: 'easy' as const,
    },
    {
        question_text: 'What is the past tense of "go"?',
        option_a: 'Goed', option_b: 'Gone', option_c: 'Went', option_d: 'Going', option_e: 'Goes',
        correct_answer: 'C' as const, explanation: '"Go" is an irregular verb. Past tense = "went"', difficulty: 'easy' as const,
    },
    {
        question_text: '"I ___ studying when the phone rang." Fill in the blank:',
        option_a: 'am', option_b: 'was', option_c: 'were', option_d: 'is', option_e: 'be',
        correct_answer: 'B' as const, explanation: 'Past continuous: Subject "I" + "was" + V-ing', difficulty: 'medium' as const,
    },
    {
        question_text: 'Which word is a synonym of "happy"?',
        option_a: 'Sad', option_b: 'Angry', option_c: 'Joyful', option_d: 'Tired', option_e: 'Bored',
        correct_answer: 'C' as const, explanation: '"Joyful" means feeling or expressing great happiness', difficulty: 'easy' as const,
    },
    {
        question_text: '"If I ___ rich, I would travel the world." (Second Conditional)',
        option_a: 'am', option_b: 'was', option_c: 'were', option_d: 'will be', option_e: 'would be',
        correct_answer: 'C' as const, explanation: 'Second conditional uses "were" for all subjects', difficulty: 'medium' as const,
    },
    {
        question_text: 'The book ___ on the table since morning.',
        option_a: 'is', option_b: 'was', option_c: 'has been', option_d: 'have been', option_e: 'had been',
        correct_answer: 'C' as const, explanation: 'Present perfect continuous/perfect with "since" → "has been"', difficulty: 'medium' as const,
    },
    {
        question_text: 'Which sentence uses the correct article?',
        option_a: 'She is a honest person', option_b: 'She is an honest person', option_c: 'She is the honest person', option_d: 'She is honest person', option_e: 'She is one honest person',
        correct_answer: 'B' as const, explanation: '"Honest" starts with a silent "h", so we use "an"', difficulty: 'medium' as const,
    },
    {
        question_text: '"She asked me where I ___." (Reported Speech)',
        option_a: 'live', option_b: 'lived', option_c: 'living', option_d: 'lives', option_e: 'am living',
        correct_answer: 'B' as const, explanation: 'Reported speech shifts tense back: "live" → "lived"', difficulty: 'hard' as const,
    },
    {
        question_text: 'The meaning of "postpone" is...',
        option_a: 'Cancel', option_b: 'Delay', option_c: 'Start', option_d: 'Finish', option_e: 'Continue',
        correct_answer: 'B' as const, explanation: '"Postpone" means to delay or put off to a later time', difficulty: 'easy' as const,
    },
    {
        question_text: 'Which is the correct passive voice of "They built this house in 2020"?',
        option_a: 'This house was built by them in 2020', option_b: 'This house built by them in 2020', option_c: 'This house is built by them in 2020', option_d: 'This house has built by them in 2020', option_e: 'This house were built by them in 2020',
        correct_answer: 'A' as const, explanation: 'Passive: Object + was/were + V3 + by + Subject', difficulty: 'hard' as const,
    },
];

const IPA_QUESTIONS = [
    {
        question_text: 'Satuan SI untuk gaya adalah...',
        option_a: 'Joule', option_b: 'Watt', option_c: 'Newton', option_d: 'Pascal', option_e: 'Volt',
        correct_answer: 'C' as const, explanation: 'Newton (N) adalah satuan SI untuk gaya (F = m × a)', difficulty: 'easy' as const,
    },
    {
        question_text: 'Organ pernapasan utama pada manusia adalah...',
        option_a: 'Jantung', option_b: 'Hati', option_c: 'Ginjal', option_d: 'Paru-paru', option_e: 'Lambung',
        correct_answer: 'D' as const, explanation: 'Paru-paru adalah organ utama dalam sistem pernapasan', difficulty: 'easy' as const,
    },
    {
        question_text: 'Fotosintesis menghasilkan...',
        option_a: 'Oksigen dan air', option_b: 'Glukosa dan oksigen', option_c: 'Karbondioksida dan air', option_d: 'Protein dan lemak', option_e: 'Glukosa dan karbondioksida',
        correct_answer: 'B' as const, explanation: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (Glukosa + Oksigen)', difficulty: 'medium' as const,
    },
    {
        question_text: 'Planet terbesar di tata surya adalah...',
        option_a: 'Saturnus', option_b: 'Uranus', option_c: 'Neptunus', option_d: 'Jupiter', option_e: 'Mars',
        correct_answer: 'D' as const, explanation: 'Jupiter adalah planet terbesar dengan diameter ~139.820 km', difficulty: 'easy' as const,
    },
    {
        question_text: 'Hukum III Newton menyatakan tentang...',
        option_a: 'Kelembaman', option_b: 'F = m × a', option_c: 'Aksi-Reaksi', option_d: 'Gravitasi', option_e: 'Kekekalan energi',
        correct_answer: 'C' as const, explanation: 'Hukum III Newton: Setiap aksi memiliki reaksi yang sama besar dan berlawanan arah', difficulty: 'medium' as const,
    },
    {
        question_text: 'Unsur kimia dengan simbol "Fe" adalah...',
        option_a: 'Fluor', option_b: 'Fermium', option_c: 'Besi', option_d: 'Fosfor', option_e: 'Francium',
        correct_answer: 'C' as const, explanation: 'Fe (Ferrum) adalah simbol kimia untuk unsur Besi', difficulty: 'easy' as const,
    },
    {
        question_text: 'Jika sebuah benda bermassa 5 kg diberi gaya 20 N, percepatan benda tersebut adalah...',
        option_a: '2 m/s²', option_b: '4 m/s²', option_c: '5 m/s²', option_d: '10 m/s²', option_e: '100 m/s²',
        correct_answer: 'B' as const, explanation: 'F = m × a → a = F/m = 20/5 = 4 m/s²', difficulty: 'medium' as const,
    },
    {
        question_text: 'Mitosis menghasilkan...',
        option_a: '4 sel anak identik', option_b: '2 sel anak identik', option_c: '4 sel anak berbeda', option_d: '2 sel anak berbeda', option_e: '1 sel anak',
        correct_answer: 'B' as const, explanation: 'Mitosis menghasilkan 2 sel anak yang identik dengan sel induk', difficulty: 'medium' as const,
    },
    {
        question_text: 'Perubahan wujud dari gas menjadi cair disebut...',
        option_a: 'Menguap', option_b: 'Menyublim', option_c: 'Mengkristal', option_d: 'Mengembun', option_e: 'Mencair',
        correct_answer: 'D' as const, explanation: 'Mengembun (kondensasi) adalah perubahan wujud dari gas ke cair', difficulty: 'easy' as const,
    },
    {
        question_text: 'pH larutan asam kuat adalah...',
        option_a: 'Lebih dari 7', option_b: 'Sama dengan 7', option_c: 'Kurang dari 7', option_d: 'Sama dengan 14', option_e: 'Tidak dapat ditentukan',
        correct_answer: 'C' as const, explanation: 'Larutan asam memiliki pH < 7, basa > 7, netral = 7', difficulty: 'medium' as const,
    },
];

const LATSOL_MTK_QUESTIONS = [
    {
        question_text: 'Hasil dari 25 × 4 - 10 adalah...',
        option_a: '80', option_b: '90', option_c: '100', option_d: '110', option_e: null,
        correct_answer: 'B' as const, explanation: '25 × 4 = 100, lalu 100 - 10 = 90',
    },
    {
        question_text: 'Jika y = 3x + 2, dan x = 4, maka y = ...',
        option_a: '10', option_b: '12', option_c: '14', option_d: '16', option_e: null,
        correct_answer: 'C' as const, explanation: 'y = 3(4) + 2 = 12 + 2 = 14',
    },
    {
        question_text: 'Faktor dari 12 adalah...',
        option_a: '1, 2, 3, 4, 6, 12', option_b: '1, 2, 4, 6, 12', option_c: '2, 3, 4, 6', option_d: '1, 3, 6, 12', option_e: null,
        correct_answer: 'A' as const, explanation: 'Faktor 12: 1, 2, 3, 4, 6, 12',
    },
    {
        question_text: 'Hasil dari 3/4 + 1/2 adalah...',
        option_a: '4/6', option_b: '5/4', option_c: '1', option_d: '7/4', option_e: null,
        correct_answer: 'B' as const, explanation: '3/4 + 1/2 = 3/4 + 2/4 = 5/4',
    },
    {
        question_text: 'Luas persegi dengan sisi 9 cm adalah...',
        option_a: '36 cm²', option_b: '72 cm²', option_c: '81 cm²', option_d: '90 cm²', option_e: null,
        correct_answer: 'C' as const, explanation: 'L = s² = 9² = 81 cm²',
    },
];

const LATSOL_IPA_QUESTIONS = [
    {
        question_text: 'Bagian sel yang berfungsi mengatur seluruh kegiatan sel adalah...',
        option_a: 'Membran sel', option_b: 'Sitoplasma', option_c: 'Inti sel (nukleus)', option_d: 'Mitokondria', option_e: null,
        correct_answer: 'C' as const, explanation: 'Inti sel (nukleus) mengatur seluruh kegiatan sel',
    },
    {
        question_text: 'Energi yang dimiliki benda bergerak disebut...',
        option_a: 'Energi potensial', option_b: 'Energi kinetik', option_c: 'Energi panas', option_d: 'Energi kimia', option_e: null,
        correct_answer: 'B' as const, explanation: 'Energi kinetik = ½mv²',
    },
    {
        question_text: 'Air mendidih pada suhu...',
        option_a: '90°C', option_b: '100°C', option_c: '110°C', option_d: '120°C', option_e: null,
        correct_answer: 'B' as const, explanation: 'Air mendidih pada 100°C (pada tekanan 1 atm)',
    },
    {
        question_text: 'Alat yang digunakan untuk mengukur arus listrik adalah...',
        option_a: 'Voltmeter', option_b: 'Amperemeter', option_c: 'Ohmmeter', option_d: 'Wattmeter', option_e: null,
        correct_answer: 'B' as const, explanation: 'Amperemeter digunakan untuk mengukur kuat arus listrik',
    },
    {
        question_text: 'Reaksi kimia yang memerlukan energi panas disebut...',
        option_a: 'Eksoterm', option_b: 'Endoterm', option_c: 'Redoks', option_d: 'Netralisasi', option_e: null,
        correct_answer: 'B' as const, explanation: 'Endoterm: reaksi yang menyerap/memerlukan energi panas',
    },
];


async function main() {
    loadEnv();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log('\n🌱 PRIVCEY EDU — Demo Seed Script\n');
    console.log('━'.repeat(50));

    console.log('\n📚 Fetching subjects...');
    const { data: subjects } = await supabase.from('subjects').select('*');
    if (!subjects || subjects.length === 0) {
        console.error('❌ No subjects found. Run the schema.sql first (includes seed subjects).');
        process.exit(1);
    }
    console.log(`   Found ${subjects.length} subjects: ${subjects.map(s => s.code).join(', ')}`);

    const subjectMap: Record<string, string> = {};
    for (const s of subjects) {
        subjectMap[s.code] = s.id;
    }

    console.log('\n🏫 Fetching class groups...');
    const { data: classes } = await supabase.from('class_groups').select('*');
    if (!classes || classes.length === 0) {
        console.error('❌ No class groups found. Run the schema.sql first.');
        process.exit(1);
    }
    console.log(`   Found ${classes.length} classes: ${classes.map(c => c.name).join(', ')}`);

    console.log('\n👤 Creating demo users...');

    async function createOrGetUser(email: string, password: string, fullName: string, role: string): Promise<string | null> {
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            console.log(`   ⏩ ${email} (already exists)`);
            return existing.id;
        }

        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, role },
        });

        if (error) {
            console.log(`   ⚠️  ${email}: ${error.message}`);
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const found = users?.find(u => u.email === email);
            if (found) return found.id;
            return null;
        }

        console.log(`   ✅ ${email} (${role})`);
        return data.user.id;
    }

    const adminId = await createOrGetUser(DEMO_ADMIN.email, DEMO_ADMIN.password, DEMO_ADMIN.name, 'admin');

    const tutorIds: string[] = [];
    for (const t of DEMO_TUTORS) {
        const id = await createOrGetUser(t.email, t.password, t.name, 'tutor');
        if (id) tutorIds.push(id);
    }

    const studentIds: string[] = [];
    for (const s of DEMO_STUDENTS) {
        const id = await createOrGetUser(s.email, s.password, s.name, 'student');
        if (id) studentIds.push(id);
    }

    console.log('\n📝 Updating profiles...');

    if (adminId) {
        await supabase.from('profiles').update({
            role: 'admin', is_active: true, payment_status: 'active', payment_expires_at: null,
        }).eq('id', adminId);
    }

    for (const tid of tutorIds) {
        await supabase.from('profiles').update({
            role: 'tutor', is_active: true, payment_status: 'active', payment_expires_at: null,
        }).eq('id', tid);
    }

    const paymentStatuses: Array<'active' | 'expired' | 'pending'> = ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'active', 'expired', 'expired', 'pending', 'pending'];
    for (let i = 0; i < studentIds.length; i++) {
        const classIdx = i % classes.length;
        const payStatus = paymentStatuses[i] || 'active';
        await supabase.from('profiles').update({
            role: 'student',
            is_active: true,
            class_id: classes[classIdx].id,
            payment_status: payStatus,
            payment_expires_at: payStatus === 'active' ? daysFromNow(30) : payStatus === 'expired' ? daysAgo(5) : null,
        }).eq('id', studentIds[i]);
    }

    if (tutorIds.length >= 2) {
        await supabase.from('class_groups').update({ tutor_id: tutorIds[0] }).eq('id', classes[0].id);
        await supabase.from('class_groups').update({ tutor_id: tutorIds[0] }).eq('id', classes[1].id);
        await supabase.from('class_groups').update({ tutor_id: tutorIds[1] }).eq('id', classes[2].id);
        await supabase.from('class_groups').update({ tutor_id: tutorIds[1] }).eq('id', classes[3].id);
    }

    console.log('   ✅ Profiles updated');

    const creatorId = adminId || tutorIds[0];
    if (!creatorId) {
        console.error('❌ No admin or tutor ID to use as creator. Aborting.');
        process.exit(1);
    }

    console.log('\n📝 Creating tryouts...');

    const tryoutData = [
        { title: 'Try Out Matematika - Bab 1', subject_code: 'MTK', duration: 60, passing_grade: 70, description: 'Try Out Aljabar dan Aritmetika Dasar', questions: MTK_QUESTIONS },
        { title: 'Try Out Bahasa Indonesia - Bab 1', subject_code: 'BIND', duration: 45, passing_grade: 65, description: 'Try Out Tata Bahasa dan Sastra', questions: BIND_QUESTIONS },
        { title: 'Try Out Bahasa Inggris - Bab 1', subject_code: 'BING', duration: 45, passing_grade: 65, description: 'Try Out Grammar and Vocabulary', questions: BING_QUESTIONS },
        { title: 'Try Out IPA - Bab 1', subject_code: 'IPA', duration: 60, passing_grade: 70, description: 'Try Out Fisika, Kimia, dan Biologi Dasar', questions: IPA_QUESTIONS },
    ];

    const tryoutIds: string[] = [];
    const tryoutQuestionMap: Record<string, string[]> = {};

    for (const t of tryoutData) {
        const { data: tryout, error } = await supabase.from('tryouts').insert({
            title: t.title,
            subject_id: subjectMap[t.subject_code],
            class_id: null,
            description: t.description,
            duration_minutes: t.duration,
            passing_grade: t.passing_grade,
            is_active: true,
            start_time: daysAgo(7),
            end_time: daysFromNow(30),
            created_by: t.subject_code === 'MTK' || t.subject_code === 'IPA' ? (tutorIds[0] || creatorId) : (tutorIds[1] || creatorId),
        }).select('id').single();

        if (error || !tryout) {
            console.log(`   ⚠️  Tryout "${t.title}": ${error?.message}`);
            continue;
        }

        tryoutIds.push(tryout.id);
        console.log(`   ✅ ${t.title} (${t.questions.length} soal)`);

        const questionRows = t.questions.map((q, idx) => ({
            tryout_id: tryout.id,
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            option_e: q.option_e || null,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            order_number: idx + 1,
        }));

        const { data: insertedQs } = await supabase.from('questions').insert(questionRows).select('id');
        if (insertedQs) {
            tryoutQuestionMap[tryout.id] = insertedQs.map(q => q.id);
        }
    }

    console.log('\n📊 Creating tryout attempts & student answers...');

    const activeStudents = studentIds.slice(0, 8);

    for (const studentId of activeStudents) {
        const numAttempts = randomBetween(2, Math.min(4, tryoutIds.length));
        const shuffledTryouts = [...tryoutIds].sort(() => Math.random() - 0.5).slice(0, numAttempts);

        for (const tryoutId of shuffledTryouts) {
            const questionIds = tryoutQuestionMap[tryoutId];
            if (!questionIds || questionIds.length === 0) continue;

            const { data: attempt } = await supabase.from('tryout_attempts').insert({
                tryout_id: tryoutId,
                student_id: studentId,
                started_at: daysAgo(randomBetween(1, 6)),
                is_submitted: false,
            }).select('id').single();

            if (!attempt) continue;

            const answerRows = [];
            const correctRate = 0.4 + Math.random() * 0.5;

            const { data: questions } = await supabase
                .from('questions')
                .select('id, correct_answer, option_a, option_b, option_c, option_d')
                .eq('tryout_id', tryoutId)
                .order('order_number');

            if (!questions) continue;

            const options: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
            for (const q of questions) {
                const isCorrect = Math.random() < correctRate;
                const selectedAnswer = isCorrect
                    ? q.correct_answer
                    : randomPick(options.filter(o => o !== q.correct_answer));

                answerRows.push({
                    attempt_id: attempt.id,
                    question_id: q.id,
                    selected_answer: selectedAnswer,
                    answered_at: new Date().toISOString(),
                });
            }

            if (answerRows.length > 0) {
                await supabase.from('student_answers').insert(answerRows);
            }

            await supabase.from('tryout_attempts')
                .update({ is_submitted: true })
                .eq('id', attempt.id);
        }
    }
    console.log(`   ✅ Created attempts for ${activeStudents.length} students`);

    console.log('\n📢 Creating announcements...');

    const announcementData = [
        { title: '🎉 Selamat Datang di Privcey Edu!', content: 'Platform belajar online untuk persiapan ujian. Selamat belajar!', type: 'success' as const, target_class_id: null },
        { title: '📅 Jadwal Try Out Minggu Ini', content: 'Try Out Matematika dan IPA akan dilaksanakan hari Rabu dan Kamis. Pastikan sudah mempersiapkan diri dengan baik. Selamat mengerjakan!', type: 'info' as const, target_class_id: null },
        { title: '⚠️ Pembayaran Bulan Depan', content: 'Batas pembayaran SPP bulan depan adalah tanggal 10. Silakan hubungi admin jika ada kendala pembayaran.', type: 'warning' as const, target_class_id: null },
        { title: '🔴 Maintenance Server', content: 'Server akan mengalami maintenance pada hari Minggu pukul 02.00-04.00 WIB. Mohon maaf atas ketidaknyamanannya.', type: 'urgent' as const, target_class_id: null },
        { title: '📚 Materi Baru: E-Modul IPA', content: 'E-Modul IPA Bab 3 - Sistem Pencernaan sudah tersedia. Silakan unduh di menu E-Modul.', type: 'info' as const, target_class_id: classes[0].id },
        { title: '🏆 Selamat! Top 3 Leaderboard', content: 'Selamat kepada Budi, Siti, dan Andi yang menduduki peringkat 3 besar leaderboard minggu ini!', type: 'success' as const, target_class_id: null },
    ];

    for (const a of announcementData) {
        await supabase.from('announcements').insert({
            title: a.title,
            content: a.content,
            type: a.type,
            is_active: true,
            target_class_id: a.target_class_id,
            created_by: creatorId,
            expires_at: daysFromNow(30),
        });
    }
    console.log(`   ✅ ${announcementData.length} announcements created`);

    console.log('\n🎬 Creating VOD content...');

    const vodData = [
        { title: 'Pengenalan Aljabar', description: 'Video pembelajaran aljabar dasar untuk pemula', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtube_id: 'dQw4w9WgXcQ', subject_code: 'MTK', duration: '15:30', order: 1 },
        { title: 'Persamaan Linear Satu Variabel', description: 'Cara menyelesaikan persamaan linear satu variabel', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtube_id: 'dQw4w9WgXcQ', subject_code: 'MTK', duration: '20:15', order: 2 },
        { title: 'Geometri Dasar - Luas & Keliling', description: 'Menghitung luas dan keliling bangun datar', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtube_id: 'dQw4w9WgXcQ', subject_code: 'MTK', duration: '25:00', order: 3 },
        { title: 'Teks Eksposisi', description: 'Memahami struktur dan ciri-ciri teks eksposisi', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtube_id: 'dQw4w9WgXcQ', subject_code: 'BIND', duration: '18:45', order: 1 },
        { title: 'Majas dan Gaya Bahasa', description: 'Jenis-jenis majas dan contoh penggunaannya', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtube_id: 'dQw4w9WgXcQ', subject_code: 'BIND', duration: '22:10', order: 2 },
        { title: 'English Grammar: Tenses', description: 'Complete guide to English tenses', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtube_id: 'dQw4w9WgXcQ', subject_code: 'BING', duration: '30:00', order: 1 },
        { title: 'Vocabulary Building', description: 'Tips and tricks to build your English vocabulary', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtube_id: 'dQw4w9WgXcQ', subject_code: 'BING', duration: '16:20', order: 2 },
        { title: 'Hukum Newton I, II, III', description: 'Penjelasan lengkap hukum Newton tentang gerak', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtube_id: 'dQw4w9WgXcQ', subject_code: 'IPA', duration: '28:00', order: 1 },
        { title: 'Sistem Pernapasan Manusia', description: 'Organ dan mekanisme pernapasan manusia', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtube_id: 'dQw4w9WgXcQ', subject_code: 'IPA', duration: '19:30', order: 2 },
        { title: 'Tabel Periodik Unsur', description: 'Mengenal tabel periodik dan sifat-sifat unsur', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', youtube_id: 'dQw4w9WgXcQ', subject_code: 'IPA', duration: '24:15', order: 3 },
    ];

    for (const v of vodData) {
        await supabase.from('vod_content').insert({
            title: v.title,
            description: v.description,
            youtube_url: v.youtube_url,
            youtube_id: v.youtube_id,
            subject_id: subjectMap[v.subject_code],
            duration: v.duration,
            thumbnail_url: `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`,
            order: v.order,
            is_active: true,
            created_by: creatorId,
        });
    }
    console.log(`   ✅ ${vodData.length} VOD items created`);

    console.log('\n📄 Creating E-Modul content...');

    const emodData = [
        { title: 'Modul Aljabar Dasar', description: 'Modul lengkap aljabar dasar untuk SMP', drive_url: 'https://drive.google.com/file/d/demo/view', subject_code: 'MTK', chapter: 'Bab 1 - Aljabar', order: 1 },
        { title: 'Modul Geometri', description: 'Bangun datar dan bangun ruang', drive_url: 'https://drive.google.com/file/d/demo/view', subject_code: 'MTK', chapter: 'Bab 2 - Geometri', order: 2 },
        { title: 'Modul Statistika', description: 'Mean, median, modus dan penyajian data', drive_url: 'https://drive.google.com/file/d/demo/view', subject_code: 'MTK', chapter: 'Bab 3 - Statistika', order: 3 },
        { title: 'Modul Tata Bahasa Indonesia', description: 'Kaidah kebahasaan dan EYD', drive_url: 'https://drive.google.com/file/d/demo/view', subject_code: 'BIND', chapter: 'Bab 1 - Tata Bahasa', order: 1 },
        { title: 'Modul Sastra Indonesia', description: 'Puisi, cerpen, dan novel', drive_url: 'https://drive.google.com/file/d/demo/view', subject_code: 'BIND', chapter: 'Bab 2 - Sastra', order: 2 },
        { title: 'English Grammar Module', description: 'Comprehensive grammar guide', drive_url: 'https://drive.google.com/file/d/demo/view', subject_code: 'BING', chapter: 'Chapter 1 - Grammar', order: 1 },
        { title: 'English Vocabulary Module', description: 'Essential vocabulary for exams', drive_url: 'https://drive.google.com/file/d/demo/view', subject_code: 'BING', chapter: 'Chapter 2 - Vocabulary', order: 2 },
        { title: 'Modul Fisika Dasar', description: 'Gaya, gerak, dan hukum Newton', drive_url: 'https://drive.google.com/file/d/demo/view', subject_code: 'IPA', chapter: 'Bab 1 - Fisika', order: 1 },
        { title: 'Modul Biologi - Sel', description: 'Struktur dan fungsi sel', drive_url: 'https://drive.google.com/file/d/demo/view', subject_code: 'IPA', chapter: 'Bab 2 - Biologi', order: 2 },
        { title: 'Modul Kimia Dasar', description: 'Unsur, senyawa, dan campuran', drive_url: 'https://drive.google.com/file/d/demo/view', subject_code: 'IPA', chapter: 'Bab 3 - Kimia', order: 3 },
    ];

    for (const e of emodData) {
        await supabase.from('emod_content').insert({
            title: e.title,
            description: e.description,
            drive_url: e.drive_url,
            subject_id: subjectMap[e.subject_code],
            chapter: e.chapter,
            order: e.order,
            is_active: true,
            created_by: creatorId,
        });
    }
    console.log(`   ✅ ${emodData.length} E-Modul items created`);

    console.log('\n🎥 Creating live classes...');

    const liveData = [
        { title: 'Live: Pembahasan Soal Matematika', description: 'Pembahasan soal-soal Try Out Matematika Bab 1', meet_url: 'https://meet.google.com/abc-defg-hij', subject_code: 'MTK', tutor_idx: 0, class_idx: 0, hours_from_now: 2 },
        { title: 'Live: Latihan Grammar Inggris', description: 'Interactive grammar practice session', meet_url: 'https://meet.google.com/klm-nopq-rst', subject_code: 'BING', tutor_idx: 1, class_idx: null, hours_from_now: 26 },
        { title: 'Live: Bedah Materi IPA', description: 'Review materi Fisika dan Kimia menjelang ujian', meet_url: 'https://meet.google.com/uvw-xyza-bcd', subject_code: 'IPA', tutor_idx: 0, class_idx: null, hours_from_now: 50 },
        { title: 'Live: Diskusi Teks Eksposisi', description: 'Pembahasan struktur teks eksposisi dan contohnya', meet_url: 'https://meet.google.com/efg-hijk-lmn', subject_code: 'BIND', tutor_idx: 1, class_idx: 2, hours_from_now: 74 },
        { title: 'Live: Q&A Persiapan Ujian', description: 'Sesi tanya jawab bebas semua mata pelajaran', meet_url: 'https://meet.google.com/opq-rstu-vwx', subject_code: 'MTK', tutor_idx: 0, class_idx: null, hours_from_now: -24 },
    ];

    for (const l of liveData) {
        await supabase.from('live_classes').insert({
            title: l.title,
            description: l.description,
            meet_url: l.meet_url,
            scheduled_at: hoursFromNow(l.hours_from_now),
            subject_id: subjectMap[l.subject_code],
            tutor_id: tutorIds[l.tutor_idx] || creatorId,
            class_id: l.class_idx !== null ? classes[l.class_idx]?.id : null,
            is_active: true,
        });
    }
    console.log(`   ✅ ${liveData.length} live classes created`);

    console.log('\n📝 Creating daily exercises (Latsol Harian)...');

    const latsolData = [
        { title: 'Latsol Matematika - Hari Ini', subject_code: 'MTK', date: new Date().toISOString().split('T')[0], questions: LATSOL_MTK_QUESTIONS },
        { title: 'Latsol IPA - Hari Ini', subject_code: 'IPA', date: new Date().toISOString().split('T')[0], questions: LATSOL_IPA_QUESTIONS },
        { title: 'Latsol Matematika - Kemarin', subject_code: 'MTK', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], questions: LATSOL_MTK_QUESTIONS },
    ];

    for (const l of latsolData) {
        const { data: exercise } = await supabase.from('daily_exercises').insert({
            title: l.title,
            subject_id: subjectMap[l.subject_code],
            class_id: null,
            date: l.date,
            is_active: true,
        }).select('id').single();

        if (!exercise) continue;

        const qRows = l.questions.map((q, idx) => ({
            exercise_id: exercise.id,
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            option_e: q.option_e,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            order_number: idx + 1,
        }));

        await supabase.from('daily_exercise_questions').insert(qRows);
    }
    console.log(`   ✅ ${latsolData.length} daily exercises created`);

    console.log('\n💪 Creating STRENGTHENS quiz modules...');

    const strengthensData = [
        { title: 'Quiz: Aljabar & Aritmetika', subject_code: 'MTK', tryout_idx: 0, description: 'Mini game untuk latihan aljabar dan aritmetika dasar' },
        { title: 'Quiz: Tata Bahasa Indonesia', subject_code: 'BIND', tryout_idx: 1, description: 'Quiz interaktif tata bahasa dan sastra Indonesia' },
        { title: 'Quiz: English Grammar', subject_code: 'BING', tryout_idx: 2, description: 'Practice your English grammar skills!' },
        { title: 'Quiz: Sains Dasar', subject_code: 'IPA', tryout_idx: 3, description: 'Mini game fisika, kimia, dan biologi' },
    ];

    for (const s of strengthensData) {
        if (!tryoutIds[s.tryout_idx]) continue;
        await supabase.from('strengthens_modules').insert({
            title: s.title,
            subject_id: subjectMap[s.subject_code],
            tryout_id: tryoutIds[s.tryout_idx],
            content_url: null,
            description: s.description,
            is_active: true,
        });
    }
    console.log(`   ✅ ${strengthensData.length} strengthens modules created`);

    console.log('\n📋 Creating attendance logs...');

    const activityTypes: Array<'vod_watch' | 'live_class' | 'tryout' | 'emod_access'> = ['vod_watch', 'live_class', 'tryout', 'emod_access'];
    const activityTitles: Record<string, string[]> = {
        vod_watch: ['Pengenalan Aljabar', 'Hukum Newton I, II, III', 'English Grammar: Tenses', 'Teks Eksposisi'],
        live_class: ['Live: Pembahasan Soal Matematika', 'Live: Latihan Grammar Inggris', 'Live: Bedah Materi IPA'],
        tryout: ['Try Out Matematika - Bab 1', 'Try Out IPA - Bab 1', 'Try Out Bahasa Inggris - Bab 1'],
        emod_access: ['Modul Aljabar Dasar', 'Modul Fisika Dasar', 'English Grammar Module', 'Modul Tata Bahasa Indonesia'],
    };

    let attendanceCount = 0;
    for (const studentId of activeStudents) {
        const numLogs = randomBetween(3, 8);
        for (let i = 0; i < numLogs; i++) {
            const actType = randomPick(activityTypes);
            const actTitle = randomPick(activityTitles[actType]);
            await supabase.from('attendance_logs').insert({
                student_id: studentId,
                activity_type: actType,
                activity_id: null,
                activity_title: actTitle,
                timestamp: daysAgo(randomBetween(0, 14)),
                duration_seconds: actType === 'vod_watch' ? randomBetween(300, 1800) : actType === 'live_class' ? randomBetween(1800, 5400) : randomBetween(600, 3600),
            });
            attendanceCount++;
        }
    }
    console.log(`   ✅ ${attendanceCount} attendance logs created`);

    console.log('\n' + '━'.repeat(50));
    console.log('\n🎉 Demo seed complete!\n');
    console.log('📋 Demo Accounts:');
    console.log('━'.repeat(50));
    console.log(`   🔴 Admin:   ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`);
    console.log(`              Login: /auth/staff-login`);
    console.log('');
    for (const t of DEMO_TUTORS) {
        console.log(`   🟡 Tutor:   ${t.email} / ${t.password}`);
    }
    console.log(`              Login: /auth/staff-login`);
    console.log('');
    console.log(`   🟢 Student: ${DEMO_STUDENTS[0].email} / ${DEMO_STUDENTS[0].password}`);
    console.log(`              (+ ${DEMO_STUDENTS.length - 1} more students)`);
    console.log(`              Login: /auth/login`);
    console.log('');
    console.log('📊 Data Created:');
    console.log('━'.repeat(50));
    console.log(`   • ${DEMO_STUDENTS.length} students, ${DEMO_TUTORS.length} tutors, 1 admin`);
    console.log(`   • ${tryoutIds.length} tryouts with ${tryoutData.reduce((a, t) => a + t.questions.length, 0)} questions`);
    console.log(`   • Tryout attempts with auto-graded scores`);
    console.log(`   • ${announcementData.length} announcements`);
    console.log(`   • ${vodData.length} VOD videos`);
    console.log(`   • ${emodData.length} E-Moduls`);
    console.log(`   • ${liveData.length} live classes`);
    console.log(`   • ${latsolData.length} daily exercises (latsol)`);
    console.log(`   • ${strengthensData.length} STRENGTHENS quiz modules`);
    console.log(`   • ${attendanceCount} attendance logs`);
    console.log(`   • Score history (auto-generated via triggers)`);
    console.log('');
}

main().catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
