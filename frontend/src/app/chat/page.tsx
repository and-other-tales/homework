'use client';

import PageLayout from "@/components/layout/page-layout";
import { SimpleChat } from "@/components/chat/simple-chat";

export default function ChatPage() {
  return (
    <PageLayout title="Chat Interface">
      <div className="mx-auto flex max-w-5xl flex-col space-y-4">
        <SimpleChat />
      </div>
    </PageLayout>
  );
}