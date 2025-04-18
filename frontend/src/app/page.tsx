'use client';

import PageLayout from "@/components/layout/page-layout";
import { NewTaskModal, NewTaskModalHandle } from "@/components/dashboard/new-task-modal";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { UnifiedTaskManager } from "@/components/dashboard/unified-task-manager";
import { useRef } from "react";

export default function DashboardPage() {
  // This ref allows us to control the modal from outside
  const modalRef = useRef<NewTaskModalHandle>(null);

  return (
    <PageLayout 
      title="Dashboard" 
      showNewTaskButton={true}
      onNewTask={() => {
        // Open the modal using the ref
        if (modalRef.current) {
          modalRef.current.open();
        } else {
          // Fallback - try to click the trigger directly
          const modalTrigger = document.getElementById('new-task-trigger');
          if (modalTrigger) {
            modalTrigger.click();
          }
        }
      }}
    >
      <div className="space-y-6">
        {/* Top row with status cards */}
        <DashboardCards />
        
        {/* Unified task management */}
        <UnifiedTaskManager />
      </div>
      <NewTaskModal ref={modalRef} />
    </PageLayout>
  );
}