import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import "./App.css";
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";

const socket = io("https://silky-melisa-my-hobbie-3320ee00.koyeb.app"); // Update with your backend URL

interface Message {
  text: string;
  room: string;
  sender: string;
  timestamp: string;
}

function App(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const scrollableDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId) {
      socket.emit("join", roomId);
    }

    socket.on("message", (data: Message) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      scrollToBottom();
    });

    return () => {
      socket.off("message");
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
      // Check for Enter and non-empty input
      sendMessage();
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
    <div className="container mt-5">
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
                  onChange={(e) => setMessageInput(e.target.value)}
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
              <div className="chat-window cw" ref={scrollableDiv}>
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
    </div>
  );
}

export default App;
