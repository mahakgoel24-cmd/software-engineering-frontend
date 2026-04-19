import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Send,
  MoreVertical,
  Paperclip,
  Circle,
  User,
  CheckCheck,
  X,
  Download,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../supabaseClient";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  attachment_type?: string;
  created_at: string;
  sender_name?: string;
  is_current_user?: boolean;
}

interface Conversation {
  chat_id: string;
  participant_id: string;
  participant_name: string;
  participant_email: string;
  participant_role: string;
  last_message_content: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
  is_typing: boolean;
}

export default function CompanyMessages() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageSubscription, setMessageSubscription] = useState<any>(null);
  const [typingSubscription, setTypingSubscription] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      if (location.state?.recipientId && currentUser) {
        try {
          // Get or create chat between users
          const { data, error } = await supabase.rpc('get_or_create_chat', {
            user1_id: currentUser.id,
            user2_id: location.state.recipientId
          });

          if (error) throw error;

          if (data && data.length > 0) {
            const chatData = data[0];
            
            if (chatData.is_new) {
              // New chat created, refresh conversations list
              const { data: refreshedConversations } = await supabase.rpc('get_user_chats', {
                current_user_id: currentUser.id
              });
              
              if (refreshedConversations) {
                const conversations: Conversation[] = refreshedConversations.map((chat: any) => ({
                  chat_id: chat.chat_id,
                  participant_id: chat.participant_id,
                  participant_name: chat.participant_name,
                  participant_email: chat.participant_email,
                  participant_role: chat.participant_role,
                  last_message_content: chat.last_message_content,
                  last_message_time: chat.last_message_time,
                  unread_count: chat.unread_count,
                  is_online: chat.is_online,
                  is_typing: false,
                }));
                setConversations(conversations);
              }
            }

            // Select the conversation
            const selectedConv = conversations.find(c => c.participant_id === location.state.recipientId);
            if (selectedConv) {
              setSelectedConversation(selectedConv);
            }
          }

          // Clear the navigation state
          navigate(location.pathname, { replace: true, state: null });
        } catch (error) {
          console.error('Error initializing chat:', error);
        }
      }
    };

    initializeChat();
  }, [location.state, currentUser, navigate, conversations]);

  useEffect(() => {
    const loadUserAndConversations = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);

      // Load conversations directly with the user object
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_user_chats', {
          current_user_id: user.id
        });

        if (error) {
          console.error('Error loading conversations:', error);
          setConversations([]);
          return;
        }
        
        const conversations: Conversation[] = data?.map((chat: any) => ({
          chat_id: chat.chat_id,
          participant_id: chat.participant_id,
          participant_name: chat.participant_name,
          participant_email: chat.participant_email,
          participant_role: chat.participant_role,
          last_message_content: chat.last_message_content,
          last_message_time: chat.last_message_time,
          unread_count: chat.unread_count,
          is_online: chat.is_online,
          is_typing: false,
        })) || [];

        setConversations(conversations);

        // Set up real-time subscription for conversation updates
        const conversationSubscription = supabase
          .channel(`conversations:${user.id}`)
          .on('postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'chats'
            },
            async () => {
              // Refresh conversations when there's a change
              const { data: refreshedData } = await supabase.rpc('get_user_chats', {
                current_user_id: user.id
              });
              
              if (refreshedData) {
                const refreshedConversations: Conversation[] = refreshedData.map((chat: any) => ({
                  chat_id: chat.chat_id,
                  participant_id: chat.participant_id,
                  participant_name: chat.participant_name,
                  participant_email: chat.participant_email,
                  participant_role: chat.participant_role,
                  last_message_content: chat.last_message_content,
                  last_message_time: chat.last_message_time,
                  unread_count: chat.unread_count,
                  is_online: chat.is_online,
                  is_typing: false,
                }));
                setConversations(refreshedConversations);
              }
            }
          )
          .subscribe();

        // Cleanup subscription on unmount
        return () => {
          supabase.removeChannel(conversationSubscription);
        };

      } catch (error) {
        console.error('Unexpected error loading conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation && currentUser) {
      // Load messages for the selected conversation
      const loadMessages = async () => {
        try {
          console.log('Loading messages for chat:', selectedConversation.chat_id);
          const { data, error } = await supabase.rpc('get_chat_messages', {
            p_chat_id: selectedConversation.chat_id,
            p_current_user_id: currentUser.id
          });

          if (error) {
            console.error('Error loading messages:', error);
            setMessages([]);
            return;
          }

          console.log('Messages loaded:', data);
          const messages: Message[] = data?.map((msg: any) => ({
            id: msg.id,
            sender_id: msg.sender_id,
            content: msg.content,
            attachment_url: msg.attachment_url,
            attachment_name: msg.attachment_name,
            attachment_size: msg.attachment_size,
            attachment_type: msg.attachment_type,
            created_at: msg.created_at,
            sender_name: msg.sender_name,
            is_current_user: msg.is_current_user,
          })) || [];

          setMessages(messages);
          scrollToBottom();

          // Mark messages as read
          await supabase.rpc('mark_messages_read', {
            p_chat_id: selectedConversation.chat_id,
            p_user_id: currentUser.id
          });

          // Set up polling as fallback for real-time
          const interval = setInterval(async () => {
            try {
              const { data: freshData } = await supabase.rpc('get_chat_messages', {
                p_chat_id: selectedConversation.chat_id,
                p_current_user_id: currentUser.id
              });
              
              if (freshData && freshData.length > messages.length) {
                const freshMessages: Message[] = freshData.map((msg: any) => ({
                  id: msg.id,
                  sender_id: msg.sender_id,
                  content: msg.content,
                  attachment_url: msg.attachment_url,
                  attachment_name: msg.attachment_name,
                  attachment_size: msg.attachment_size,
                  attachment_type: msg.attachment_type,
                  created_at: msg.created_at,
                  sender_name: msg.sender_name,
                  is_current_user: msg.is_current_user,
                }));
                
                setMessages(freshMessages);
                scrollToBottom();
              }
            } catch (error) {
              console.error('Polling error:', error);
            }
          }, 2000); // Poll every 2 seconds
          
          setPollingInterval(interval);
        } catch (error) {
          console.error('Unexpected error loading messages:', error);
          setMessages([]);
        }
      };

      loadMessages();

      // Set up real-time subscription
      console.log('Setting up real-time subscription for chat:', selectedConversation.chat_id);
      
      const subscription = supabase
        .channel(`messages:${selectedConversation.chat_id}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages'
          },
          (payload) => {
            if (payload.new && payload.new.chat_id === selectedConversation.chat_id) {
              const newMessage: Message = {
                id: payload.new.id,
                sender_id: payload.new.sender_id,
                content: payload.new.content,
                attachment_url: payload.new.attachment_url,
                attachment_name: payload.new.attachment_name,
                attachment_size: payload.new.attachment_size,
                attachment_type: payload.new.attachment_type,
                created_at: payload.new.created_at,
                is_current_user: payload.new.sender_id === currentUser.id,
              };
              
              setMessages(prev => {
                if (prev.some(msg => msg.id === newMessage.id)) {
                  return prev; // Don't add duplicate
                }
                return [...prev, newMessage];
              });
              scrollToBottom();
            }
          }
        )
        .subscribe((_, err) => {
          if (err) {
            console.error('Subscription error:', err);
          }
        });

      // Set up typing status subscription
      const typingSubscription = supabase
        .channel(`typing:${selectedConversation.chat_id}`)
        .on('postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'chat_participants',
            filter: `chat_id=eq.${selectedConversation.chat_id}`
          },
          (payload) => {
            if (payload.new && payload.new.user_id !== currentUser.id) {
              setConversations(prev => prev.map(conv => 
                conv.chat_id === selectedConversation.chat_id
                  ? { ...conv, is_typing: payload.new.is_typing }
                  : conv
              ));
            }
          }
        )
        .subscribe();

      setMessageSubscription(subscription);

      // Cleanup subscription when conversation changes
      return () => {
        if (messageSubscription) {
          supabase.removeChannel(messageSubscription);
        }
        supabase.removeChannel(typingSubscription);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      };
    }
  }, [selectedConversation, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadFile = (attachment: { name: string; size: number; type: string; url: string }) => {
    if (!attachment || !attachment.url) return;
    
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !currentUser) return;

    setSendingMessage(true);
    
    try {
      let attachmentUrl = null;
      let attachmentName = null;
      let attachmentSize = null;
      let attachmentType = null;

      // Handle file upload to Supabase Storage if file is selected
      if (selectedFile) {
        const fileName = `${Date.now()}-${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, selectedFile);

        if (uploadError) {
          if (uploadError.message.includes('Bucket not found')) {
            throw new Error('Storage bucket "chat-attachments" not found. Please create it in Supabase dashboard.');
          }
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);

        attachmentUrl = publicUrlData.publicUrl;
        attachmentName = selectedFile.name;
        attachmentSize = selectedFile.size;
        attachmentType = selectedFile.type;
      }

      // Send message using database function
      console.log('Sending message with data:', {
        p_chat_id: selectedConversation.chat_id,
        p_sender_id: currentUser.id,
        p_content: newMessage,
        p_attachment_url: attachmentUrl,
        p_attachment_name: attachmentName,
        p_attachment_size: attachmentSize,
        p_attachment_type: attachmentType,
      });
      const { error } = await supabase.rpc('send_message', {
        p_chat_id: selectedConversation.chat_id,
        p_sender_id: currentUser.id,
        p_content: newMessage,
        p_attachment_url: attachmentUrl,
        p_attachment_name: attachmentName,
        p_attachment_size: attachmentSize,
        p_attachment_type: attachmentType,
      });

      if (error) {
        console.error('Send message error:', error);
        throw error;
      }

      console.log('Message sent successfully, waiting for real-time event...');

      setNewMessage("");
      clearSelectedFile();

      // Update conversation's last message locally for immediate UI update
      const lastMessageText = attachmentName ? `📎 ${attachmentName}` : newMessage;
      setConversations(prev => prev.map(conv => 
        conv.chat_id === selectedConversation.chat_id 
          ? { ...conv, last_message_content: lastMessageText, last_message_time: new Date().toISOString() }
          : conv
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      // You could show an error toast here
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isMessageFromCurrentUser = (message: Message) => {
    return message.is_current_user || message.sender_id === currentUser?.id;
  };

  // Handle typing indicator with debouncing
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = async (isTyping: boolean) => {
    if (!selectedConversation || !currentUser) return;
    
    try {
      await supabase.rpc('update_typing_status', {
        p_chat_id: selectedConversation.chat_id,
        p_user_id: currentUser.id,
        p_is_typing: isTyping
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  // Handle message input change with debouncing
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Show typing immediately when user starts typing
    handleTyping(value.length > 0);
    
    // Hide typing after user stops typing for 1 second
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 1000);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden bg-white">
      <div className="flex h-full">
        {/* Left Panel - Conversations List */}
        <div className="w-1/3 border-r border-zinc-200 flex flex-col">
          {/* Search Header */}
          <div className="p-4 border-b border-zinc-200">
            <h1 className="text-xl font-semibold text-zinc-900 mb-3">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-zinc-500">Loading conversations...</div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                <User className="w-8 h-8 mb-2" />
                <div className="text-sm">No conversations found</div>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.chat_id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`flex items-center gap-3 p-4 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 ${
                    selectedConversation?.chat_id === conversation.chat_id ? 'bg-zinc-100' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-zinc-600" />
                    </div>
                    {conversation.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-zinc-900 truncate">
                        {conversation.participant_name}
                      </h3>
                      <span className="text-xs text-zinc-500">
                        {formatTime(conversation.last_message_time)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-zinc-600 truncate">
                          {conversation.last_message_content}
                        </p>
                      </div>
                      
                      {conversation.unread_count > 0 && (
                        <Badge className="ml-2 bg-zinc-900 text-white text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Chat Interface */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-zinc-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-600" />
                    </div>
                    {selectedConversation.is_online && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-zinc-900">
                      {selectedConversation.participant_name}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {selectedConversation.is_typing ? (
                        <span className="flex items-center gap-1">
                          typing
                          <div className="flex gap-1">
                            <Circle className="w-1 h-1 fill-current animate-pulse" />
                            <Circle className="w-1 h-1 fill-current animate-pulse delay-75" />
                            <Circle className="w-1 h-1 fill-current animate-pulse delay-150" />
                          </div>
                        </span>
                      ) : selectedConversation.is_online ? (
                        "Active now"
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-50">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={`${message.id}-${message.created_at}`}
                    className={`flex ${isMessageFromCurrentUser(message) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isMessageFromCurrentUser(message) ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-lg px-4 py-2 text-sm ${
                          isMessageFromCurrentUser(message)
                            ? 'bg-zinc-900 text-white'
                            : 'bg-white text-zinc-900 border border-zinc-200'
                        }`}
                      >
                        <p>{message.content}</p>
                        {message.attachment_url && (
                          <div className="mt-2">
                            {message.attachment_type?.startsWith('image/') && message.attachment_url ? (
                              <div className="relative group">
                                <img 
                                  src={message.attachment_url} 
                                  alt={message.attachment_name || 'Image'}
                                  className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(message.attachment_url, '_blank')}
                                />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadFile({
                                        name: message.attachment_name || 'file',
                                        size: message.attachment_size || 0,
                                        type: message.attachment_type || '',
                                        url: message.attachment_url!
                                      });
                                    }}
                                    className="bg-white/90 hover:bg-white text-zinc-900 p-2 rounded-full shadow-lg"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-zinc-100 rounded-lg">
                                <Paperclip className="w-4 h-4 text-zinc-600" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-zinc-900 truncate">
                                    {message.attachment_name}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    {message.attachment_size ? `${(message.attachment_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadFile({
                                    name: message.attachment_name || 'file',
                                    size: message.attachment_size || 0,
                                    type: message.attachment_type || '',
                                    url: message.attachment_url!
                                  })}
                                  className="text-zinc-600 hover:text-zinc-900 p-1"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          isMessageFromCurrentUser(message) ? 'text-zinc-400' : 'text-zinc-500'
                        }`}>
                          <span>{formatTime(message.created_at)}</span>
                          {isMessageFromCurrentUser(message) && (
                            <CheckCheck className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-zinc-200 bg-white">
              {/* File Preview */}
              {selectedFile && (
                <div className="p-3 border-t border-zinc-200">
                  <div className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-zinc-200 rounded flex items-center justify-center">
                        <Paperclip className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelectedFile}
                      className="text-zinc-500 hover:text-zinc-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Typing Indicator - Above input field */}
              {conversations.find(conv => conv.chat_id === selectedConversation?.chat_id)?.is_typing && (
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-2 text-zinc-500 text-sm">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="w-full px-4 py-2 bg-zinc-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && !selectedFile) || sendingMessage}
                  size="sm"
                  className="bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-zinc-50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Select a conversation</h3>
              <p className="text-sm text-zinc-500">Choose a conversation from the left to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

