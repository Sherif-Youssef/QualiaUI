import { TopNav } from '@/components/TopNav';

interface TestSuiteLayoutProps {
    header: React.ReactNode;
    searchBar: React.ReactNode;
    content: React.ReactNode;
    pagination?: React.ReactNode;
    modals: React.ReactNode;
    error?: React.ReactNode;
}

export const TestSuiteLayout: React.FC<TestSuiteLayoutProps> = ({
    header,
    searchBar,
    content,
    pagination,
    modals,
    error
}) => {
    return (
        <div className="min-h-screen bg-gray-50 text-left">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="space-y-6">
                    {error}
                    {header}
                    {searchBar}
                    {content}
                    {pagination}
                </div>
            </main>
            {modals}
        </div>
    );
};
