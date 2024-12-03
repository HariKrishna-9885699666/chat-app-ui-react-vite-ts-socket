import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./App.css";
import NavTab from './NavTab';
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import FloatingIcon from './FloatingIcon';

const socket = io("https://silky-melisa-my-hobbie-3320ee00.koyeb.app"); 

interface Message {
  text: string;
  room: string;
  sender: string;
  timestamp: string;
  image?: string; 
}

// Kept for potential future socket event use
interface TypingStatus {
  room: string;
  user: string;
  typing: boolean;
}

interface ChatAccess {
  owner: string;
  allowedUsers: string[];
}

function App(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  // State declarations
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [typingStatus, setTypingStatus] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'guest' | null>(null);
  const [chatAccess, setChatAccess] = useState<ChatAccess | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showJoinOptions, setShowJoinOptions] = useState<boolean>(true);
  
  // Refs
  const scrollableDiv = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Utility function to get current user ID
  const getCurrentUserId = (): string => {
    // In a real app, this would come from authentication
    return userRole === 'owner' ? 'owner1' : 'guest1';
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    setTimeout(() => {
      const scrollableElement = scrollableDiv.current;
      if (scrollableElement) {
        scrollableElement.scrollTop = scrollableElement.scrollHeight;
      }
    }, 100);
  };

  // Input change handler
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(event.target.value);
    if (roomId) {
      socket.emit("typing", { room: roomId, user: getCurrentUserId(), typing: true });
    }
  };

  // Key down handler for sending message
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && (messageInput.trim() !== "" || selectedImage)) {
      sendMessage();
    }
  };

  // Send message function
  const sendMessage = (): void => {
    if (!chatAccess || !roomId) return;

    const currentUserId = getCurrentUserId();
    const isAuthorizedSender = 
      (userRole === 'owner') || 
      chatAccess.allowedUsers.includes(currentUserId);

    if (!isAuthorizedSender) {
      alert("You are not authorized to send messages in this chat.");
      return;
    }

    if (messageInput.trim() !== "" || selectedImage) {
      const newMessage: Message = {
        text: messageInput,
        room: roomId,
        sender: currentUserId,
        timestamp: new Date().toLocaleString(),
        image: selectedImage || undefined
      };
      
      socket.emit("message", newMessage);
      
      setMessageInput("");
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
    scrollToBottom();
  };

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setSelectedImage(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    // Check if user has an existing access token
    const storedAccessToken = localStorage.getItem('chatAccessToken');
    
    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
      setShowJoinOptions(false);
    }
  }, []);

  useEffect(() => {
    const checkChatAccess = () => {
      if (!accessToken) return;

      socket.emit('check_chat_access', { 
        roomId, 
        userId: getCurrentUserId(),
        accessToken 
      });
    };

    socket.on('chat_access_result', (result: { 
      allowed: boolean, 
      role: 'owner' | 'guest', 
      chatAccess?: ChatAccess,
      accessToken?: string
    }) => {
      if (!result.allowed) {
        // Clear any stored token and show join options
        localStorage.removeItem('chatAccessToken');
        setAccessToken(null);
        setShowJoinOptions(true);
        navigate('/unauthorized');
        return;
      }

      // Store new access token if provided
      if (result.accessToken) {
        localStorage.setItem('chatAccessToken', result.accessToken);
        setAccessToken(result.accessToken);
      }

      setUserRole(result.role);
      if (result.chatAccess) {
        setChatAccess(result.chatAccess);
      }

      // Hide join options once access is granted
      setShowJoinOptions(false);

      if (roomId) {
        socket.emit("join", roomId);
      }
    });

    socket.on("message", (data: Message) => {
      if (isMessageAllowed(data)) {
        setMessages((prevMessages) => [...prevMessages, data]);
        scrollToBottom();
      }
    });

    // Initial access check
    checkChatAccess();

    return () => {
      socket.off("message");
      socket.off('chat_access_result');
    };
  }, [roomId, navigate, accessToken]);

  // Validate if a message is from an allowed participant
  const isMessageAllowed = (message: Message): boolean => {
    if (!chatAccess) return false;
    
    return message.sender === chatAccess.owner || 
           chatAccess.allowedUsers.includes(message.sender);
  };

  // Join Room Handler
  const handleJoinRoom = () => {
    socket.emit('request_room_access', { 
      roomId, 
      userId: getCurrentUserId() 
    });
  };

  // Render Join Options
  const renderJoinOptions = () => {
    return (
      <div className="text-center mt-4">
        <h3>Join Chat Room</h3>
        <button 
          className="btn btn-primary" 
          onClick={handleJoinRoom}
        >
          Request Access
        </button>
      </div>
    );
  };

  return (
    <div className="container">
      <NavTab />
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card">
            <div className="card-body">
              {/* Conditionally render join options or chat interface */}
              {showJoinOptions ? (
                renderJoinOptions()
              ) : (
                <>
                  {/* Chat Interface */}
                  {(userRole === 'owner' || 
                    (chatAccess && chatAccess.allowedUsers.length > 0)) && (
                    <div className="input-group mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                      />
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        style={{ display: 'none' }} 
                      />
                      <div className="input-group-append">
                        <button
                          className="btn btn-secondary mr-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📷 Upload
                        </button>
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={sendMessage}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Chat Messages */}
                  <div className="chat-window cw mt-3" ref={scrollableDiv}>
                    {messages.map((msg, index) => (
                      <div key={index} className="message-container">
                        <h6>
                          <span className="badge bg-secondary">
                            {msg.room} @{msg.timestamp}{" "}
                          </span>
                          &nbsp;{msg.text}
                        </h6>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <FloatingIcon />
    </div>
  );
}

export default App;
