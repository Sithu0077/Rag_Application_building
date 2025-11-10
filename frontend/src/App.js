import React, { useState } from 'react';
import Upload from './Upload';
import Chat from './chat';

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-block mb-4">
            <div className="flex items-center justify-center space-x-3 bg-white/20 backdrop-blur-lg rounded-2xl px-8 py-4 shadow-2xl border border-white/30">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-md opacity-75 animate-pulse"></div>
                <span className="relative text-5xl">🧠</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                DocuMind
              </h1>
            </div>
          </div>
          <p className="text-white/90 text-lg md:text-xl font-medium">
            Chat with Your Documents Using AI
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Upload Section */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl border border-white/50">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl p-3 shadow-lg">
                <span className="text-3xl">📤</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Upload Your Documents
              </h2>
            </div>
            <Upload 
              uploadedFiles={uploadedFiles} 
              setUploadedFiles={setUploadedFiles} 
            />
            
            {/* File count indicator */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✅</span>
                  <p className="text-green-700 font-semibold">
                    {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} ready for chat!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl border border-white/50">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl p-3 shadow-lg">
                <span className="text-3xl">💬</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Ask Questions
              </h2>
            </div>
            <Chat uploadedFiles={uploadedFiles} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
            <p className="text-white/80 text-sm font-medium">
              Powered by AI • Secure & Private
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;