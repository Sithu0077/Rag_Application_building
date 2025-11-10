import React, { useState, useRef, useEffect } from "react";

function Chat({ uploadedFiles }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ----------------------------
  // Send Message Handler
  // ----------------------------
  const handleSend = async () => {
    if (!input.trim()) {
      alert("Please enter a question.");
      return;
    }

    if (uploadedFiles.length === 0) {
      alert("Please upload at least one document before asking questions.");
      return;
    }

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("question", input);

      // ✅ Connect to FastAPI /query endpoint
      const response = await fetch("http://127.0.0.1:8000/query", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // ✅ Include AI Answer + Sources
      const answerText = data.answer
        ? data.answer.trim()
        : "No relevant information found in your uploaded documents.";

      const botMessage = {
        role: "assistant",
        content: `${answerText}\n\n${
          data.sources?.length
            ? `📚 Sources: ${data.sources.join(", ")}`
            : ""
        }`,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "assistant",
        content: "⚠️ Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Send on Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="flex flex-col h-[600px]">
      {/* ----------- Chat Window ----------- */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-gray-100">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="text-6xl animate-bounce">🤖</div>
            <div className="space-y-2">
              <p className="text-gray-600 font-semibold text-lg">
                No messages yet
              </p>
              <p className="text-gray-400 text-sm max-w-md">
                Upload your documents and start asking questions about them!
              </p>
            </div>

            {/* Suggestion buttons */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-6">
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Summarize this document",
                    "What are the key points?",
                    "Explain the main topic",
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(suggestion)}
                      className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm rounded-full transition-all duration-200 hover:scale-105"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Chat messages */}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-slide-up`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    msg.role === "user"
                      ? "flex-row-reverse space-x-reverse"
                      : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-purple-500 to-pink-500"
                        : "bg-gradient-to-br from-blue-500 to-cyan-400"
                    }`}
                  >
                    <span className="text-white text-sm">
                      {msg.role === "user" ? "👤" : "🤖"}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-md whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "bg-white border-2 border-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm leading-relaxed font-medium tracking-wide">
                      {msg.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading (typing dots) */}
            {loading && (
              <div className="flex justify-start animate-slide-up">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                  <div className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 shadow-md">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ----------- Input Area ----------- */}
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              uploadedFiles.length === 0
                ? "📁 Upload files first..."
                : "💬 Ask me anything about your documents..."
            }
            disabled={uploadedFiles.length === 0 || loading}
            rows="3"
            className="w-full px-4 py-3 border-2 border-gray-200 text-gray-800 placeholder-gray-400 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 resize-none disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-200"
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            Press Enter to send
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={!input.trim() || uploadedFiles.length === 0 || loading}
          className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold p-4 rounded-2xl transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          title="Send message"
        >
          <span className="text-2xl">🚀</span>
        </button>
      </div>
    </div>
  );
}

export default Chat;
