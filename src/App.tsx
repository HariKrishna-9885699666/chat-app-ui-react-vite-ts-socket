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
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [typingStatus, setTypingStatus] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'guest' | null>(null);
  const [chatAccess, setChatAccess] = useState<ChatAccess | null>(null);
  const scrollableDiv = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check user's role and chat access when joining the room
    const checkChatAccess = () => {
      // This would typically involve a backend call to verify access
      // For this example, we'll simulate it
      socket.emit('check_chat_access', { 
        roomId, 
        userId: getCurrentUserId() 
      });
    };

    socket.on('chat_access_result', (result: { 
      allowed: boolean, 
      role: 'owner' | 'guest', 
      chatAccess?: ChatAccess 
    }) => {
      if (!result.allowed) {
        // Redirect if not allowed
        navigate('/unauthorized');
        return;
      }

      setUserRole(result.role);
      if (result.chatAccess) {
        setChatAccess(result.chatAccess);
      }

      // Join the room if access is granted
      if (roomId) {
        socket.emit("join", roomId);
      }
    });

    socket.on("message", (data: Message) => {
      // Only add messages from allowed participants
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
  }, [roomId, navigate]);

  // Validate if a message is from an allowed participant
  const isMessageAllowed = (message: Message): boolean => {
    if (!chatAccess) return false;
    
    // Only allow messages from owner or the specific allowed guest
    return message.sender === chatAccess.owner || 
           chatAccess.allowedUsers.includes(message.sender);
  };

  const sendMessage = (): void => {
    if (!chatAccess || !roomId) return;

    // Additional check to prevent unauthorized sending
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

  // Placeholder function to get current user ID
  const getCurrentUserId = (): string => {
    // In a real app, this would come from authentication
    return userRole === 'owner' ? 'owner1' : 'guest1';
  };

  // Rest of the previous component methods remain the same...

  return (
    <div className="container">
      <NavTab />
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card">
            <div className="card-body">
              {/* Conditionally render input only for authorized users */}
              {(userRole === 'owner' || 
                (chatAccess && chatAccess.allowedUsers.length > 0)) && (
                <>
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                    />
                    {/* Rest of the input group remains the same */}
                  </div>
                </>
              )}
              
              {/* Rest of the render method remains the same */}
            </div>
          </div>
        </div>
      </div>
      <FloatingIcon />
    </div>
  );
}

export default App;
