import React, { useState, useEffect } from 'react';

function ChatHistory({ messages }) {
  return (
    <div className="flex flex-col space-y-12">
        <ul className="container">
        {messages.map((message, index) => (
          <li key={index}>
            <div className={`rounded-lg p-3 ${
                message.user ? 'bg-indigo-700 text-white text-right' 
                            : 'bg-gray-100 text-black text-left'
              }`}> 
              {message.message} 
            </div>
          </li>
        ))}
      </ul>
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
    <form onSubmit={handleSubmit} className="">
      <input 
        type="text" 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
      />
      <button type="submit">Send</button>
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
    
    return (
      <div className="container">
        {/* Display chat history */}
        <div>
          <ChatHistory messages={chatHistory} />
        </div>
          
        {/* User input field */}
        <div>
          <UserInput onSubmit={handleUserInput} />
        </div>
      </div>
    );
  }