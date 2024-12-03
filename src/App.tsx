import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import "./App.css";
import NavTab from "./NavTab";
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import FloatingIcon from "./FloatingIcon";

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

function App(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const [allowChat, setAllowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [typingStatus, setTypingStatus] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollableDiv = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Parse query parameters
    const params = new URLSearchParams(location.search);
    const allowChatParam = params.get("allowChat");
    setAllowChat(allowChatParam === "true");
  }, [location.search]);

  useEffect(() => {
    if (!allowChat || !roomId) {
      return;
    }

    socket.emit("join", roomId);

    socket.on("message", (data: Message) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      scrollToBottom();
    });

    socket.on("typing", (data: TypingStatus) => {
      if (data.typing && roomId === data.room) {
        setTypingStatus(`${data.user} is typing...`);
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
  }, [allowChat, roomId]);

  const sendMessage = (): void => {
    if (!allowChat || !roomId || (messageInput.trim() === "" && !selectedImage)) return;

    const newMessage: Message = {
      text: messageInput,
      room: roomId,
      sender: "You",
      timestamp: new Date().toLocaleString(),
      image: selectedImage || undefined,
    };

    socket.emit("message", newMessage);
    setMessageInput("");
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
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
    if (allowChat && roomId) {
      socket.emit("typing", { room: roomId, user: "You", typing: true });
    }
  };

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

  const handleDownloadImage = (imageData: string, timestamp: string) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `image_${timestamp}.png`;
    link.click();
  };

  const deleteChatHistory = () => {
    setMessages([]);
    if (allowChat && roomId) {
      socket.emit("clear_history", roomId);
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

  if (!allowChat) {
    return (
      <div className="container">
        <h2>Chat is not allowed.</h2>
      </div>
    );
  }

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
                  style={{ display: "none" }}
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
              {selectedImage && (
                <div className="mb-2 text-muted">Image ready to be sent</div>
              )}
              {typingStatus && <div className="typing-status">{typingStatus}</div>}
              <div className="chat-window cw mt-3" ref={scrollableDiv}>
                {messages.map((msg, index) => (
                  <div key={index} className="message-container">
                    <h6>
                      <span className="badge bg-secondary">
                        {msg.room} @{msg.timestamp}
                      </span>
                      &nbsp;{msg.text}
                    </h6>
                    {msg.image && (
                      <div className="image-container">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            handleDownloadImage(msg.image!, msg.timestamp)
                          }
                        >
                          Download Image
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button className="btn btn-danger" onClick={deleteChatHistory}>
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
