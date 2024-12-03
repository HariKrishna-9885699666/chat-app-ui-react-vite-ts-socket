import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
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
  image?: string; // Base64 encoded image
}

interface TypingStatus {
  room: string;
  user: string;
  typing: boolean;
}

function App(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [typingStatus, setTypingStatus] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollableDiv = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ensure we're listening to the correct room
    if (roomId) {
      socket.emit("join", roomId);
    }

    // Listen for messages, including those with images
    socket.on("message", (data: Message) => {
      console.log("Received message:", data); // Debug log
      setMessages((prevMessages) => [...prevMessages, data]);
      scrollToBottom();
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

    return () => {
      socket.off("message");
      socket.off("typing");
    };
  }, [roomId]);

  const sendMessage = (): void => {
    if (roomId && (messageInput.trim() !== "" || selectedImage)) {
      const newMessage: Message = {
        text: messageInput,
        room: roomId,
        sender: "You",
        timestamp: new Date().toLocaleString(),
        image: selectedImage || undefined
      };
      
      console.log("Sending message:", newMessage); // Debug log
      socket.emit("message", newMessage);
      
      setMessageInput("");
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
    scrollToBottom();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && (messageInput.trim() !== "" || selectedImage)) {
      sendMessage();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(event.target.value);
    if (roomId) {
      socket.emit("typing", { room: roomId, user: "You", typing: true });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Ensure the image is base64 encoded
        const base64Image = reader.result as string;
        setSelectedImage(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadImage = (imageData: string, timestamp: string) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `image_${timestamp}.png`;
    link.click();
  };

  const deleteChatHistory = () => {
    setMessages([]); // Clear local messages
    if (roomId) {
      socket.emit('clear_history', roomId);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      const scrollableElement = scrollableDiv.current;
      if (scrollableElement) {
        scrollableElement.scrollTop = scrollableElement.scrollHeight;
      }
    }, 100);
  };

  return (
    <div className="container">
      <NavTab />
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card">
            <div className="card-body">
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
              
              {/* Image Preview */}
              {selectedImage && (
                <div className="mb-2">
                  <img 
                    src={selectedImage} 
                    alt="Selected" 
                    style={{ maxWidth: '200px', maxHeight: '200px' }} 
                  />
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
                        <img 
                          src={msg.image} 
                          alt="Message" 
                          style={{ maxWidth: '300px', maxHeight: '300px' }} 
                        />
                        <button 
                          className="btn btn-sm btn-outline-primary ml-2"
                          onClick={() => handleDownloadImage(msg.image!, msg.timestamp)}
                        >
                          Download
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
