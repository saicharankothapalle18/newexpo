import React, { useState, useEffect } from 'react';
import { EmergencyProvider, useEmergency } from './context/EmergencyContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainDashboardView } from './components/MainDashboardView';
import { IncomingQueue } from './components/IncomingQueue';
import { InteractiveMap } from './components/InteractiveMap';
import { DedicatedMapView } from './components/DedicatedMapView';
import { UnifiedIncidentList } from './components/UnifiedIncidentList';
import { IncidentDetailsModal } from './components/IncidentDetailsModal';
import { ReportTriageModal } from './components/ReportTriageModal';
import { ResponseDispatchPanel } from './components/ResponseDispatchPanel';
import { NotificationsView } from './components/NotificationsView';
import { AuditHistoryView } from './components/AuditHistoryView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AdminSettingsPanel } from './components/AdminSettingsPanel';
import { AdminDatasetHub } from './components/AdminDatasetHub';
import { NewIncidentModal } from './components/NewIncidentModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { UnifiedIncident, RawReport } from './types';

const AppLayout: React.FC = () => {
    const {
        currentUser,
        activeTab,
        setActiveTab,
        incidents,
        audioEnabled,
        setAudioEnabled
    } = useEmergency();

    const [selectedIncident, setSelectedIncident] = useState<UnifiedIncident | null>(null);
    const [triagingReport, setTriagingReport] = useState<RawReport | null>(null);
    const [isNewReportModalOpen, setIsNewReportModalOpen] = useState<boolean>(false);
    const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

    const handleInspectReport = (report: RawReport) => {
        setTriagingReport(report);
    };

    // Keyboard Shortcuts Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Do not intercept if user is typing in an input or textarea
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
                if (e.key === 'Escape') {
                    target.blur();
                }
                return;
            }

            if (e.key === 'Escape') {
                setSelectedIncident(null);
                setTriagingReport(null);
                setIsNewReportModalOpen(false);
                setIsShortcutsModalOpen(false);
            } else if (e.key === '1') {
                setActiveTab('DASHBOARD');
            } else if (e.key === '2') {
                setActiveTab('INCOMING_REPORTS');
            } else if (e.key === '3') {
                setActiveTab('ACTIVE_INCIDENTS');
            } else if (e.key === '4') {
                setActiveTab('MAP');
            } else if (e.key === '5') {
                setActiveTab('RESPONSE_TEAMS');
            } else if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                setIsNewReportModalOpen(true);
            } else if (e.key === 'm' || e.key === 'M') {
                setAudioEnabled(!audioEnabled);
            } else if (e.key === '?') {
                setIsShortcutsModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, setActiveTab, audioEnabled, setAudioEnabled]);

    if (!currentUser) {
        return <LoginPage />;
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white bg-grid-pattern text-slate-800 select-none">
            {/* Left Sidebar Navigation */}
            <Sidebar />

            {/* Main Right Content Panel */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Header Bar */}
                <Header
                    onOpenNewReportModal={() => setIsNewReportModalOpen(true)}
                    onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
                />

                {/* Dynamic Main Body Tab Content */}
                <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto">
                    {activeTab === 'DASHBOARD' && (
                        <MainDashboardView
                            onSelectIncident={setSelectedIncident}
                            onInspectReport={handleInspectReport}
                        />
                    )}

                    {activeTab === 'INCOMING_REPORTS' && (
                        <div className="h-[calc(100vh-110px)]">
                            <IncomingQueue onInspectReport={handleInspectReport} />
                        </div>
                    )}

                    {activeTab === 'ACTIVE_INCIDENTS' && (
                        <UnifiedIncidentList onSelectIncident={setSelectedIncident} />
                    )}

                    {activeTab === 'MAP' && (
                        <DedicatedMapView
                            onSelectIncident={setSelectedIncident}
                            onSelectReport={handleInspectReport}
                        />
                    )}

                    {activeTab === 'RESPONSE_TEAMS' && <ResponseDispatchPanel />}

                    {activeTab === 'NOTIFICATIONS' && <NotificationsView />}

                    {activeTab === 'AUDIT' && <AuditHistoryView />}

                    {activeTab === 'ANALYTICS' && <AnalyticsDashboard />}

                    {activeTab === 'SETTINGS' && <AdminSettingsPanel />}

                    {activeTab === 'DATASET_HUB' && <AdminDatasetHub />}
                </div>
            </div>

            {/* Incident Details Modal Hub */}
            {selectedIncident && (
                <IncidentDetailsModal
                    incident={selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                    onInspectReport={handleInspectReport}
                />
            )}

            {/* Operator Report Triage & Linking Modal */}
            {triagingReport && (
                <ReportTriageModal
                    report={triagingReport}
                    onClose={() => setTriagingReport(null)}
                    onOpenIncident={(inc) => {
                        setTriagingReport(null);
                        setSelectedIncident(inc);
                    }}
                />
            )}

            {/* Ingest New Report Modal */}
            {isNewReportModalOpen && (
                <NewIncidentModal
                    onClose={() => setIsNewReportModalOpen(false)}
                    onSelectIncident={(inc) => setSelectedIncident(inc)}
                    onInspectReport={(rep) => setTriagingReport(rep)}
                />
            )}

            {/* Keyboard Shortcuts Cheat Sheet */}
            {isShortcutsModalOpen && (
                <KeyboardShortcutsModal onClose={() => setIsShortcutsModalOpen(false)} />
            )}
        </div>
    );
};

export function App() {
    return (
        <EmergencyProvider>
            <AppLayout />
        </EmergencyProvider>
    );
}

export default App;
