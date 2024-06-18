import React from 'react';
import { useRouter } from 'next/router';
import Chat from '@/components/Chat';
import Header from '@/components/header';

const ChatPage = () => {
  const router = useRouter();
  const { receiverId } = router.query;

  if (!receiverId) {
    return (
      <Header>
        <div>Please select a user to chat with.</div>
      </Header>
    );
  }

  return (
    <Header>
      <Chat receiverId={receiverId} />
    </Header>
  );
};

export default ChatPage;
