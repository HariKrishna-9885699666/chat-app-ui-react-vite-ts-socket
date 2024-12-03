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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showJoinOptions, setShowJoinOptions] = useState<boolean>(true);
  const scrollableDiv = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    setTimeout(() => {
      const scrollableElement = scrollableDiv.current;
      if (scrollableElement) {
        scrollableElement.scrollTop = scrollableElement.scrollHeight;
      }
    }, 100);
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

    // Rest of the socket event listeners remain the same...

    // Initial access check
    checkChatAccess();

    return () => {
      socket.off("message");
      socket.off('chat_access_result');
      socket.off("typing");
    };
  }, [roomId, navigate, accessToken]);

  // Join Room Handler
  const handleJoinRoom = () => {
    // Implement your join room logic here
    // This might involve:
    // 1. Generating an invite token
    // 2. Verifying user credentials
    // 3. Requesting access from the server
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

  // Rest of the previous component methods remain the same...

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
                  {/* Previous chat interface code */}
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
                        {/* Rest of input group remains the same */}
                      </div>
                    </>
                  )}
                  
                  {/* Rest of the chat interface */}
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
