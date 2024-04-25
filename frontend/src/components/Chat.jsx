import React, { useState, useEffect, useRef } from 'react';

function ChatHistory({ messages }) {
  return (
    <div className="grid grid-cols-new1 gap-4">
        {messages.map((message, index) => (
          <div key={index} className={`text-center rounded-lg p-4 ${
            message.user ? 'bg-indigo-700 text-white justify-self-end' 
                        : 'bg-gray-100 text-black justify-self-start'
          }`}>
            {message.message}
          </div>
        ))}
    </div>
  );
}

function UserInput({ onSubmit }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(input);
    setInput(''); 
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        className="resize-y overflow-y-auto w-5/6 p-2 h-auto border border-gray-300 rounded-md focus:ring focus:ring-indigo-200 focus:border-indigo-500"
        type="text" 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
      />
      <button type="submit" className="rounded-md w-1/6 p-2 bg-indigo-700 text-white">Send</button>
    </form>
  );
}

export default function ChatInterface() {
    const [chatHistory, setChatHistory] = useState([]);
    const [botResponse, setBotResponse] = useState(''); 
  
    const handleUserInput = async (userInput) => {
      setChatHistory([...chatHistory, { user: true, message: userInput }]); // Add user's message

      try {
        // Make your API call
        setBotResponse("This is a bot response!"); 
      } catch (error) {
        console.error("Error fetching bot response:", error); 
      }
    }

    useEffect(() => {
      if (botResponse) {  
        setChatHistory([...chatHistory, { user: false, message: botResponse }]);
        setBotResponse(''); // Reset botResponse after it's added
      }
    }, [botResponse]);

    const chatContainerRef = useRef(null); // Create a ref
    useEffect(() => {
      // Scroll to the bottom whenever the chat history updates
      const chatContainer = chatContainerRef.current;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, [chatHistory]); 
  

    return (
      <div className="grid grid-col-1 gap-4">
        {/* Display chat history */}
        <div className="h-scren max-h-screen overflow-y-scroll snap-y" ref={chatContainerRef}>
          <ChatHistory messages={chatHistory} />
        </div>
          
        {/* User input field */}
        <div>
          <UserInput onSubmit={handleUserInput} />
        </div>
      </div>
    );
  }