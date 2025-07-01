import React, { useEffect, useRef, useState } from 'react';
import { ZIM } from 'zego-zim-web';
import bg from "./assets/bg.jpg";

function App() {
  const [zimInstance, setZimInstance] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState("Kashish");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [typingStatus, setTypingStatus] = useState(false);
  const [readReceipts, setReadReceipts] = useState({});

  const messageEndRef = useRef(null);
  const typingTimeout = useRef(null);

  const appId = 48774116;
  const tokenA = "04AAAAAGhlZeMADPqNmxJ6rqWMnG9gigCvpL9hVwmYpbYR+lIRtRPNvP27F7slR+irhJ6MTkzmwzIZpdurttCylEtvr4IIKMhfm3xNomxlbGlbx31hJCFmHZGgmNB772wCiakyt7kSkcb8IhrI+Ab5EOo9ahY22cnKc3eSA1kKCIKoWbFlGoTCVLeeK84/oajI0z2YCbk5fqHZBFrzbPe+G9Iy4DlUJRHe/pKRwZ4fonE8rsSbMgaFsOpPIRwW2UMe84HWUytZRgE=";
  const tokenB = "04AAAAAGhlZfsADD0aMGtnkLsMtdqWYQCsQgqYFP1Dj37T7YPmmmvcwQ2S+3gdjEiNdcVU+/ozxG4OTnNeL8YOzm+g+sAFqyj3vBFdjdITnqPetKNQiAbG6zKTqM55fkgxtg7YUMDwI0qeuiaQShDX5y2qN7xDE8bU3EIb+gRNZ+3rks068JoK+M4S3UKu9/WbRwp7/wwNRRDXkfOltTg7FT3Zfrfvno44uCZKmdcR0QNdxMRgX2YeRVRLzDgpTVmxJ98MnAE=";

  useEffect(() => {
    const instance = ZIM.create(appId);
    setZimInstance(instance);

    instance.on("error", (zim, errorInfo) => {
      console.error("ZIM Error:", errorInfo);
    });

    instance.on("connectionStateChanged", (zim, { state, event }) => {
      console.log("Connection state changed:", state, event);
    });

    instance.on("peerMessageReceived", (zim, { messageList }) => {
      messageList.forEach((msg) => {
        if (msg.message === "__typing__") {
          setTypingStatus(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setTypingStatus(false), 3000);
        } else {
          const data = msg.extendedData ? JSON.parse(msg.extendedData) : {};
          const customMessageId = data.customMessageId;
          setMessages(prev => [...prev, msg]);
          if (customMessageId) {
            setReadReceipts(prev => ({ ...prev, [customMessageId]: "Read" }));
          }
        }
      });
    });

    instance.on("tokenWillExpire", (zim, { second }) => {
      const newToken = selectedUser === "Kashish" ? tokenA : tokenB;
      zim.renewToken(newToken)
        .then(() => console.log("Token renewed"))
        .catch(err => console.error("Token renew failed:", err));
    });

    return () => instance.destroy();
  }, []);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleLogin = () => {
    const info = { userID: selectedUser, userName: selectedUser };
    setUserInfo(info);
    const loginToken = selectedUser === "Kashish" ? tokenA : tokenB;

    if (zimInstance) {
      zimInstance.login(info, loginToken)
        .then(() => {
          setIsLoggedIn(true);
          console.log("✅ Logged in");
        })
        .catch(err => {
          console.error("❌ Login failed:", err);
        });
    }
  };

  const handleSendMessage = () => {
    if (!isLoggedIn || messageText.trim() === "") return;

    const toConversationID = selectedUser === "Kashish" ? "You" : "Kashish";
    const customMessageId = `${userInfo.userID}_${Date.now()}`;
    const extendedData = JSON.stringify({ customMessageId });

    const messageTextObj = {
      type: 1,
      message: messageText,
      extendedData
    };

    zimInstance.sendMessage(messageTextObj, toConversationID, 0, { priority: 1 })
      .then(({ message }) => {
        setMessages(prev => [...prev, message]);
        setReadReceipts(prev => ({ ...prev, [customMessageId]: "Sent" }));
        setMessageText("");
      })
      .catch(err => {
        console.error("Send message error:", err);
      });
  };

  const handleTyping = () => {
    if (!zimInstance || !isLoggedIn) return;

    const toConversationID = selectedUser === "Kashish" ? "You" : "Kashish";
    const typingMessage = {
      type: 1,
      message: "__typing__",
      extendedData: ""
    };

    zimInstance.sendMessage(typingMessage, toConversationID, 0, { priority: 1 }).catch(() => {});
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <h1 className="text-white font-bold text-4xl mb-6 drop-shadow-lg">Chatty</h1>

      {!isLoggedIn ? (
        <div className="backdrop-blur-md bg-white/10 border border-white/30 text-white p-6 rounded-2xl shadow-xl w-[300px] transition-transform hover:scale-105">
          <h2 className="text-xl font-semibold mb-4 text-center">Login</h2>
          <label className="block mb-2 text-sm">Select User</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full mb-4 p-2 rounded-xl text-black border border-white/30 focus:outline-none"
          >
            <option value="Kashish">Kashish</option>
            <option value="You">You</option>
          </select>
          <button
            onClick={handleLogin}
            className="w-full py-2 px-4 rounded bg-purple-500 hover:bg-purple-600 transition-colors text-white font-medium cursor-pointer"
          >
            Login
          </button>
        </div>
      ) : (
        <div className="bg-white/20 backdrop-blur-lg w-full max-w-md h-[80vh] flex flex-col rounded-xl border border-white/30 shadow-xl overflow-hidden">
          <h2 className="text-white text-lg font-semibold text-center p-2">
            {userInfo.userName} chatting with {selectedUser === "Kashish" ? "You" : "Kashish"}
          </h2>
          <div className="flex-1 overflow-y-auto p-4 text-black">
            {messages.map((msg, index) => {
              const isOwnMessage = msg.senderUserID === userInfo.userID;
              const data = msg.extendedData ? JSON.parse(msg.extendedData) : {};
              const customMessageId = data.customMessageId;
              const status = readReceipts[customMessageId] || "";

              return (
                <div
                  key={index}
                  className={`mb-3 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div className={`px-4 py-2 rounded-xl max-w-[75%] text-white shadow-md ${
                    isOwnMessage
                      ? "bg-blue-600 rounded-br-none"
                      : "bg-gray-700 rounded-bl-none"
                  }`}>
                    <p>{msg.message}</p>
                    <p className="text-xs text-gray-300 mt-1 text-right">
                      {formatTime(msg.timestamp)}
                      {isOwnMessage && <span className="ml-2">({status})</span>}
                    </p>
                  </div>
                </div>
              );
            })}

            {typingStatus && (
              <div className="mb-3 flex justify-start">
                <div className="px-4 py-2 rounded-xl max-w-[75%] bg-gray-500 text-white shadow-md rounded-bl-none animate-pulse">
                  <p className="italic">Typing...</p>
                </div>
              </div>
            )}
            <div ref={messageEndRef}></div>
          </div>

          <div className="p-3 border-t bg-white/30 flex items-center backdrop-blur-md">
            <input
              type="text"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 mr-2 focus:outline-none"
              placeholder="Type your message..."
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className={`px-4 py-2 rounded-lg text-white transition ${
                messageText.trim()
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
