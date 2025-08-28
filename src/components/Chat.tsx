import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { 
  Send, 
  Brain, 
  Settings, 
  History, 
  Zap, 
  Cpu, 
  Sparkles,
  MessageCircle,
  User,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI assistant. I'm here to help answer your questions and have conversations with you. How can I assist you today?",
      isAI: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "I understand your question. Let me think about this and provide you with a helpful response.",
        "That's an interesting point! I'm processing your request to give you the best possible answer.",
        "Thanks for your message. Based on what you've asked, here's my response to help you.",
        "I've analyzed your question and I'm ready to assist you with a comprehensive answer."
      ];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        isAI: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen neural-bg flex">
      {/* Sidebar */}
      <div className="w-64 bg-card/80 backdrop-blur-xl border-r border-primary/20 flex flex-col">
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-neural rounded-full flex items-center justify-center hologram">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">AI Chatbot</h2>
              <p className="text-xs text-muted-foreground">v1.0</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => navigate('/agents')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Agents
          </Button>

          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10">
            <MessageCircle className="w-4 h-4" />
            New Conversation
          </Button>
          
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10">
            <History className="w-4 h-4" />
            Chat History
          </Button>
          
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10">
            <Settings className="w-4 h-4" />
            Neural Settings
          </Button>
        </div>

        <div className="p-4 border-t border-primary/20">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-primary flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ai-pulse" />
                Active
              </span>
            </div>
            <div className="flex justify-between">
              <span>Neural Load:</span>
              <span className="text-neural">47%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-primary/20 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-neural rounded-full flex items-center justify-center animate-hologram-shift">
              <Cpu className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">AI Assistant</h1>
              <p className="text-xs text-muted-foreground">Online and ready to help</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-primary rounded-full animate-ai-pulse" />
              <div className="w-1 h-1 bg-neural rounded-full animate-ai-pulse" style={{animationDelay: '0.2s'}} />
              <div className="w-1 h-1 bg-accent rounded-full animate-ai-pulse" style={{animationDelay: '0.4s'}} />
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.isAI ? 'justify-start' : 'justify-end'}`}
              >
                {message.isAI && (
                  <div className="w-8 h-8 bg-gradient-neural rounded-full flex items-center justify-center hologram flex-shrink-0">
                    <Brain className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                
                <Card className={`max-w-md p-4 ${
                  message.isAI 
                    ? 'message-ai bg-gradient-message' 
                    : 'bg-muted/80 border-muted-foreground/20'
                }`}>
                  <p className="text-sm text-foreground">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </Card>

                {!message.isAI && (
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 bg-gradient-neural rounded-full flex items-center justify-center hologram flex-shrink-0">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
                <Card className="message-ai bg-gradient-message p-4">
                  <div className="flex items-center gap-2">
                    <div className="typing-dots">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                    <span className="text-xs text-muted-foreground">AI is processing...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-primary/20 bg-card/80 backdrop-blur-xl p-6">
          <div className="max-w-4xl mx-auto flex gap-4">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="pr-12 bg-input/50 border-primary/20 focus:border-primary focus:ring-primary/20 ai-glow"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 ai-neural-btn"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;