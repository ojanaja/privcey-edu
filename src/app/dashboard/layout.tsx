import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ErrorBoundary } from '@/components/error-boundary';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <ErrorBoundary>{children}</ErrorBoundary>
        </DashboardLayout>
    );
}
