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

// Used in socket event
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
    const checkChatAccess = () => {
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
        navigate('/unauthorized');
        return;
      }

      setUserRole(result.role);
      if (result.chatAccess) {
        setChatAccess(result.chatAccess);
      }

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

    socket.on("typing", (data: TypingStatus) => {
      if (data.typing && roomId !== data.room) {
        setTypingStatus(`${data.room} is typing...`);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingStatus(null);
        }, 3000);
      } else {
        setTypingStatus(null);
      }
    });

    // Initial access check
    checkChatAccess();

    return () => {
      socket.off("message");
      socket.off('chat_access_result');
      socket.off("typing");
    };
  }, [roomId, navigate]);

  // Validate if a message is from an allowed participant
  const isMessageAllowed = (message: Message): boolean => {
    if (!chatAccess) return false;
    
    return message.sender === chatAccess.owner || 
           chatAccess.allowedUsers.includes(message.sender);
  };

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

  // Handle input change and typing status
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(event.target.value);
    if (roomId) {
      socket.emit("typing", { room: roomId, user: getCurrentUserId(), typing: true });
    }
  };

  // Handle key down for sending message
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && (messageInput.trim() !== "" || selectedImage)) {
      sendMessage();
    }
  };

  // Placeholder function to get current user ID
  const getCurrentUserId = (): string => {
    // In a real app, this would come from authentication
    return userRole === 'owner' ? 'owner1' : 'guest1';
  };

  // Handle image upload
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

  // Handle image download
  const handleDownloadImage = (imageData: string, timestamp: string) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `image_${timestamp}.png`;
    link.click();
  };

  // Delete chat history
  const deleteChatHistory = () => {
    setMessages([]); 
    if (roomId) {
      socket.emit('clear_history', roomId);
    }
  };

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
                </>
              )}
              
              {/* Image preview */}
              {selectedImage && (
                <div className="mb-2 text-muted">
                  Image ready to be sent
                </div>
              )}

              {/* Typing Status */}
              {typingStatus && <div className="typing-status">{typingStatus}</div>}
              
              {/* Chat Window */}
              <div className="chat-window cw mt-3" ref={scrollableDiv}>
                {messages.map((msg, index) => (
                  <div key={index} className="message-container">
                    <h6>
                      <span className="badge bg-secondary">
                        {msg.room} @{msg.timestamp}{" "}
                      </span>
                      &nbsp;{msg.text}
                    </h6>
                    {msg.image && (
                      <div className="image-container">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleDownloadImage(msg.image!, msg.timestamp)}
                        >
                          Download Image
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Delete Chat History Button */}
              <div className="mt-3">
                <button 
                  className="btn btn-danger" 
                  onClick={deleteChatHistory}
                >
                  Clear Chat History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FloatingIcon />
    </div>
  );
}

export default App;
