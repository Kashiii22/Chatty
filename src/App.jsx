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
  const messageEndRef = useRef(null);

  const appId = 48774116;
  const tokenA = "04AAAAAGhj83sADFGHQBTA5fEJYAL9yQCw6RI723G2la3huT5/VUpXBQBHxRQk1yXRNVvO3GFRMljwRi7GgisgyRqgqZu9er/ETW0EIDOdtSF6/Qsyr3pz6DFUEAj6KiZAC6H/snRq/VCdLH+ZIaXWHE5Fxk5eD8Io/qgqj8Gzp2PAQcM5bWJ7vi4eTYNEBiMQTAsOZ5ilPEM/5Q7hBreatx2mAs57+UOYGT2SnBiugUJKCSZ04C33K8U6W0NjGJ47kA0FJkweJ9wB";
  const tokenB = "04AAAAAGhj86AADMa/b3rSehir5bUDCgCs151+6DtM5WfprmjndO0LOfRUEvVziN+xgZr6jv3BojzDoRMbRP9VzbTjNgkv5h+i34m4a+794i1ShYc3QM69ws064TlgBXWcVx65RoBICxxLu4OB26y7ix1Ti6crJENa8mACeZKi/FGgclpEpjPhx3OELuYkwXYFXGDSUZc7yEdL99fsIB8utU207v5rEp2ugWRtJFqE1q7akzxzqyDdw6XbOyO1+/1Qp5DYsQE=";

  useEffect(() => {
    const instance = ZIM.create(appId);
    setZimInstance(instance);

    instance.on('error', (zim, errorInfo) => {
      console.error('ZIM Error:', errorInfo);
    });

    instance.on('connectionStateChanged', (zim, { state, event }) => {
      console.log('Connection state changed:', state, event);
    });

    instance.on('peerMessageReceived', (zim, { messageList }) => {
      setMessages(prev => [...prev, ...messageList]);
    });

    instance.on('tokenWillExpire', (zim, { second }) => {
      const newToken = selectedUser === "Kashish" ? tokenA : tokenB;
      zim.renewToken(newToken)
        .then(() => console.log("Token renewed"))
        .catch(err => console.error("Token renew failed:", err));
    });

    return () => {
      instance.destroy();
    };
  }, []);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
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

    const toConversationID = selectedUser === "Kashish" ? "Love" : "Kashish";
    const messageTextObj = {
      type: 1,
      message: messageText,
      extendedData: ''
    };

    zimInstance.sendMessage(messageTextObj, toConversationID, 0, { priority: 1 })
      .then(({ message }) => {
        setMessages(prev => [...prev, message]);
        setMessageText("");
      })
      .catch(err => {
        console.error("Send message error:", err);
      });
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
            <option value="Love">Love</option>
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
            {userInfo.userName} chatting with {selectedUser === "Kashish" ? "Love" : "Kashish"}
          </h2>
          <div className="flex-1 overflow-y-auto p-4 text-black">
            {messages.map((msg, index) => {
              const isOwnMessage = msg.senderUserID === userInfo.userID;
              return (
                <div
                  key={index}
                  className={`mb-3 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`px-4 py-2 rounded-xl max-w-[75%] text-white shadow-md ${isOwnMessage ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                    <p>{msg.message}</p>
                    <p className="text-xs text-gray-300 mt-1 text-right">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef}></div>
          </div>
          <div className="p-3 border-t bg-white/30 flex items-center backdrop-blur-md">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 mr-2 focus:outline-none"
              placeholder="Type your message..."
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className={`px-4 py-2 rounded-lg text-white transition ${
                messageText.trim()
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
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
