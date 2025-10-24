// T018, T026, T037: Main page component with ChatInterface and ConversationSidebar

import { ChatInterface } from "@/components/chat/chat-interface";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <ConversationSidebar />
      <ChatInterface />
    </div>
  );
}
