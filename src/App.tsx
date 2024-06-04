import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "./App.css";
import NavTab from './NavTab';
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import FloatingIcon from './FloatingIcon';

const socket = io("https://silky-melisa-my-hobbie-3320ee00.koyeb.app"); // Update with your backend URL

interface Message {
  text: string;
  room: string;
  sender: string;
  timestamp: string;
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
  const scrollableDiv = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (roomId) {
      socket.emit("join", roomId);
    }

    socket.on("message", (data: Message) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      scrollToBottom();
    });

    socket.on("typing", (data: TypingStatus) => {
      console.log('data', data)
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
    if (roomId) {
      const newMessage: Message = {
        text: messageInput,
        room: roomId,
        sender: "You",
        timestamp: new Date().toLocaleString(),
      };
      socket.emit("message", newMessage);
      setMessageInput("");
    }
    scrollToBottom();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && messageInput.trim() !== "") {
      sendMessage();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(event.target.value);
    if (roomId) {
      socket.emit("typing", { room: roomId, user: "You", typing: true });
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
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                <div className="input-group-append">
                  <button
                    id="scrollButton"
                    className="btn btn-primary"
                    type="button"
                    onClick={sendMessage}
                  >
                    Send
                  </button>
                </div>
              </div>
              {typingStatus && <div className="typing-status">{typingStatus}</div>}
              <div className="chat-window cw mt-3" ref={scrollableDiv}>
                {messages.map((msg, index) => (
                  <h6 key={index}>
                    <span className="badge bg-secondary">
                      {msg.room} @{msg.timestamp}{" "}
                    </span>
                    &nbsp;{msg.text}
                  </h6>
                ))}
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
