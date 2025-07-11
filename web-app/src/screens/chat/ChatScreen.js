import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Card,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Space,
  Badge,
  Divider,
  Dropdown,
  Menu,
  Empty,
  Spin,
  Upload,
  Emoji,
  Tooltip,
  Modal,
  Row,
  Col,
} from 'antd';
import {
  SendOutlined,
  PaperClipOutlined,
  SmileOutlined,
  MoreOutlined,
  SearchOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  FileOutlined,
  PictureOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import './ChatScreen.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const ChatScreen = () => {
  const { chatId } = useParams();
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [chatInfoVisible, setChatInfoVisible] = useState(false);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
    if (chatId) {
      loadChatMessages(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API call
      const mockConversations = [
        {
          id: 1,
          name: 'John Doe',
          avatar: '/api/placeholder/40/40',
          lastMessage: 'Thanks for the event details!',
          lastMessageTime: '2 min ago',
          unreadCount: 2,
          isOnline: true,
          type: 'direct',
        },
        {
          id: 2,
          name: 'Tech Conference 2024',
          avatar: '/api/placeholder/40/40',
          lastMessage: 'Sarah: Looking forward to the event',
          lastMessageTime: '1 hour ago',
          unreadCount: 0,
          isOnline: false,
          type: 'group',
          membersCount: 15,
        },
        {
          id: 3,
          name: 'Event Organizers',
          avatar: '/api/placeholder/40/40',
          lastMessage: 'Mike: Let\'s discuss the schedule',
          lastMessageTime: '3 hours ago',
          unreadCount: 1,
          isOnline: false,
          type: 'group',
          membersCount: 8,
        },
        {
          id: 4,
          name: 'Jane Smith',
          avatar: '/api/placeholder/40/40',
          lastMessage: 'Could you send me the presentation?',
          lastMessageTime: '1 day ago',
          unreadCount: 0,
          isOnline: true,
          type: 'direct',
        },
      ];

      setConversations(mockConversations);

      // Set selected chat if chatId is provided
      if (chatId) {
        const chat = mockConversations.find(c => c.id === parseInt(chatId));
        setSelectedChat(chat);
      } else if (mockConversations.length > 0) {
        setSelectedChat(mockConversations[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      showError('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      setMessageLoading(true);

      // Mock messages data
      const mockMessages = [
        {
          id: 1,
          senderId: 2,
          senderName: 'John Doe',
          senderAvatar: '/api/placeholder/32/32',
          message: 'Hey! How are you doing?',
          timestamp: '2024-01-25T10:30:00Z',
          type: 'text',
        },
        {
          id: 2,
          senderId: user?.id || 1,
          senderName: user?.name || 'You',
          senderAvatar: user?.avatar || '/api/placeholder/32/32',
          message: 'I\'m doing great! Thanks for asking. How about you?',
          timestamp: '2024-01-25T10:32:00Z',
          type: 'text',
        },
        {
          id: 3,
          senderId: 2,
          senderName: 'John Doe',
          senderAvatar: '/api/placeholder/32/32',
          message: 'I\'m excited about the upcoming tech conference!',
          timestamp: '2024-01-25T10:35:00Z',
          type: 'text',
        },
        {
          id: 4,
          senderId: user?.id || 1,
          senderName: user?.name || 'You',
          senderAvatar: user?.avatar || '/api/placeholder/32/32',
          message: 'Yes! It\'s going to be amazing. Have you seen the agenda?',
          timestamp: '2024-01-25T10:37:00Z',
          type: 'text',
        },
        {
          id: 5,
          senderId: 2,
          senderName: 'John Doe',
          senderAvatar: '/api/placeholder/32/32',
          message: 'Thanks for the event details!',
          timestamp: '2024-01-25T10:40:00Z',
          type: 'text',
        },
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      showError('Error', 'Failed to load messages');
    } finally {
      setMessageLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageData = {
      id: messages.length + 1,
      senderId: user?.id || 1,
      senderName: user?.name || 'You',
      senderAvatar: user?.avatar || '/api/placeholder/32/32',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    setMessages([...messages, messageData]);
    setNewMessage('');

    // Update conversation last message
    const updatedConversations = conversations.map(conv =>
      conv.id === selectedChat.id
        ? { ...conv, lastMessage: newMessage, lastMessageTime: 'now' }
        : conv
    );
    setConversations(updatedConversations);

    try {
      // Send message to backend
      // await sendMessageAPI(selectedChat.id, newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Error', 'Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (file) => {
    // Handle file upload
    console.log('File uploaded:', file);
    return false; // Prevent default upload behavior
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    if (chat.id !== parseInt(chatId)) {
      navigate(`/chat/${chat.id}`);
    }
    loadChatMessages(chat.id);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (senderId) => {
    return senderId === (user?.id || 1);
  };

  const renderMessage = (message) => {
    const isOwn = isMyMessage(message.senderId);

    return (
      <div
        key={message.id}
        className={`message ${isOwn ? 'message-own' : 'message-other'}`}
      >
        {!isOwn && (
          <Avatar
            src={message.senderAvatar}
            size={32}
            className="message-avatar"
          />
        )}
        <div className="message-content">
          {!isOwn && (
            <Text className="message-sender">{message.senderName}</Text>
          )}
          <div className={`message-bubble ${isOwn ? 'message-bubble-own' : 'message-bubble-other'}`}>
            <Text className="message-text">{message.message}</Text>
          </div>
          <Text className="message-time">{formatTime(message.timestamp)}</Text>
        </div>
      </div>
    );
  };

  const renderConversationItem = (conversation) => (
    <div
      key={conversation.id}
      className={`conversation-item ${selectedChat?.id === conversation.id ? 'conversation-selected' : ''}`}
      onClick={() => handleChatSelect(conversation)}
    >
      <div className="conversation-avatar">
        <Badge dot={conversation.isOnline} offset={[-8, 8]}>
          <Avatar src={conversation.avatar} size={48} />
        </Badge>
      </div>
      <div className="conversation-info">
        <div className="conversation-header">
          <Text className="conversation-name">{conversation.name}</Text>
          <Text className="conversation-time">{conversation.lastMessageTime}</Text>
        </div>
        <div className="conversation-message">
          <Text className="conversation-last-message" ellipsis>
            {conversation.lastMessage}
          </Text>
          {conversation.unreadCount > 0 && (
            <Badge count={conversation.unreadCount} size="small" />
          )}
        </div>
      </div>
    </div>
  );

  const chatHeaderMenu = (
    <Menu
      items={[
        {
          key: 'info',
          icon: <InfoCircleOutlined />,
          label: 'Chat Info',
          onClick: () => setChatInfoVisible(true),
        },
        {
          key: 'search',
          icon: <SearchOutlined />,
          label: 'Search Messages',
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: 'Delete Chat',
          danger: true,
        },
      ]}
    />
  );

  return (
    <Layout className="chat-layout">
      <Sider
        width={320}
        theme="light"
        className="chat-sidebar"
        collapsible={false}
        collapsed={!sidebarVisible}
      >
        <div className="chat-sidebar-header">
          <Title level={4} className="chat-sidebar-title">
            Messages
          </Title>
          <Button
            type="text"
            icon={<SearchOutlined />}
            className="chat-search-btn"
          />
        </div>

        <div className="chat-sidebar-search">
          <Search
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="conversation-search"
          />
        </div>

        <div className="conversations-list">
          {loading ? (
            <div className="chat-loading">
              <Spin size="large" />
            </div>
          ) : conversations.length === 0 ? (
            <Empty description="No conversations yet" />
          ) : (
            conversations
              .filter(conv =>
                conv.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(renderConversationItem)
          )}
        </div>
      </Sider>

      <Layout className="chat-main">
        {selectedChat ? (
          <>
            <Header className="chat-header">
              <div className="chat-header-info">
                <Avatar src={selectedChat.avatar} size={40} />
                <div className="chat-header-text">
                  <Title level={5} className="chat-header-name">
                    {selectedChat.name}
                  </Title>
                  <Text className="chat-header-status">
                    {selectedChat.isOnline ? 'Online' : 'Last seen recently'}
                  </Text>
                </div>
              </div>
              <div className="chat-header-actions">
                <Button
                  type="text"
                  icon={<PhoneOutlined />}
                  className="chat-action-btn"
                />
                <Button
                  type="text"
                  icon={<VideoCameraOutlined />}
                  className="chat-action-btn"
                />
                <Dropdown overlay={chatHeaderMenu} trigger={['click']}>
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    className="chat-action-btn"
                  />
                </Dropdown>
              </div>
            </Header>

            <Content className="chat-content">
              <div className="messages-container">
                {messageLoading ? (
                  <div className="chat-loading">
                    <Spin size="large" />
                  </div>
                ) : messages.length === 0 ? (
                  <Empty description="No messages yet" />
                ) : (
                  <div className="messages-list">
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="message-input-container">
                <div className="message-input-wrapper">
                  <Upload
                    beforeUpload={handleFileUpload}
                    showUploadList={false}
                    multiple
                  >
                    <Button
                      type="text"
                      icon={<PaperClipOutlined />}
                      className="message-action-btn"
                    />
                  </Upload>

                  <Input.TextArea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="message-input"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                  />

                  <Button
                    type="text"
                    icon={<SmileOutlined />}
                    className="message-action-btn"
                  />

                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="send-btn"
                  />
                </div>
              </div>
            </Content>
          </>
        ) : (
          <div className="chat-empty">
            <Empty
              description="Select a conversation to start messaging"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </Layout>

      {/* Chat Info Modal */}
      <Modal
        title="Chat Information"
        open={chatInfoVisible}
        onCancel={() => setChatInfoVisible(false)}
        footer={null}
        width={400}
      >
        {selectedChat && (
          <div className="chat-info-content">
            <div className="chat-info-header">
              <Avatar src={selectedChat.avatar} size={64} />
              <div className="chat-info-details">
                <Title level={4}>{selectedChat.name}</Title>
                <Text type="secondary">
                  {selectedChat.type === 'group'
                    ? `${selectedChat.membersCount} members`
                    : selectedChat.isOnline ? 'Online' : 'Last seen recently'
                  }
                </Text>
              </div>
            </div>

            <Divider />

            <div className="chat-info-actions">
              <Button block className="chat-info-action">
                <SearchOutlined /> Search Messages
              </Button>
              <Button block className="chat-info-action">
                <FileOutlined /> Shared Files
              </Button>
              <Button block className="chat-info-action">
                <PictureOutlined /> Shared Photos
              </Button>
              <Button block danger className="chat-info-action">
                <DeleteOutlined /> Delete Chat
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default ChatScreen;
