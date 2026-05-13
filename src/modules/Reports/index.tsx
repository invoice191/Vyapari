import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReportsSidebar from './ReportsSidebar';
import ReportViewer from './ReportViewer';
import { REPORT_CONFIG } from './reportConfig';
import { useReportData } from './hooks/useReportData';

export default function Reports() {
  const [activeReportId, setActiveReportId] = useState('daily-sales');
  const [filters, setFilters] = useState({
    dateRange: 'today',
    searchQuery: '',
    paymentMode: 'all',
    category: 'all',
    status: 'all',
    minValue: '' as number | '',
    gstSlab: 'all',
    segment: 'all',
    startDate: '',
    endDate: ''
  });

  const { data, cards, recommendations, summary, loading, error, refresh } = useReportData(activeReportId, filters);

  useEffect(() => {
    const handleVoiceSelect = (e: any) => {
      const type = e.detail?.reportType;
      if (type) {
        const found = REPORT_CONFIG.find(r => 
          r.id === type || 
          r.title.toLowerCase().includes(type.toLowerCase())
        );
        if (found) setActiveReportId(found.id);
      }
    };
    window.addEventListener('app:report-select' as any, handleVoiceSelect);
    return () => window.removeEventListener('app:report-select' as any, handleVoiceSelect);
  }, []);

  const activeReport = REPORT_CONFIG.find(r => r.id === activeReportId) || REPORT_CONFIG[0];

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh]">
      {/* Sidebar - Controlled by State */}
      <ReportsSidebar 
        activeReportId={activeReportId} 
        onSelectReport={setActiveReportId} 
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeReportId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <ReportViewer 
              report={activeReport}
              data={data}
              cards={cards}
              recommendations={recommendations}
              summary={summary}
              loading={loading}
              error={error}
              filters={filters}
              onFilterChange={setFilters}
              onRefresh={refresh}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
