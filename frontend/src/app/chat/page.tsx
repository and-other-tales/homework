'use client';

import { useState } from "react";
import PageLayout from "@/components/layout/page-layout";
import { ChatInterface } from "@/components/chat/chat-interface";
import { SimpleChat } from "@/components/chat/simple-chat";
import { ExampleCommands } from "@/components/chat/example-commands";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState("simple");
  
  return (
    <PageLayout title="Chat Interface">
      <div className="mx-auto flex max-w-5xl flex-col space-y-4">
        <Tabs defaultValue="simple" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Direct API Chat</TabsTrigger>
            <TabsTrigger value="websocket">WebSocket Chat</TabsTrigger>
          </TabsList>
          <TabsContent value="simple">
            <SimpleChat />
          </TabsContent>
          <TabsContent value="websocket">
            <ChatInterface />
          </TabsContent>
        </Tabs>
        {activeTab === "websocket" && <ExampleCommands />}
      </div>
    </PageLayout>
  );
}