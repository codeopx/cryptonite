import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Chat from '@/components/Chat';
import Header from '@/components/header'

const ChatPage = () => {
  const router = useRouter();
  const { receiverId } = router.query;
  const [isReceiverIdLoaded, setIsReceiverIdLoaded] = useState(false);

  useEffect(() => {
    if (receiverId) {
      setIsReceiverIdLoaded(true);
    }
  }, [receiverId]);

  if (!isReceiverIdLoaded) {
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
