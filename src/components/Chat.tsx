import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Send,
  Brain,
  Settings,
  History,
  MessageCircle,
  User,
  ArrowLeft,
  Database,
  BarChart3,
  Plus,
  Minus,
  Upload,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
/* ---------- Types ---------- */
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}
type IconKey = "Database" | "BarChart3";
type Agent = {
  id: number;
  name: string;
  description: string;
  iconKey: IconKey;
  color: string;
  rating: number;
  date: string;
  avm: number;
  avgColor: string;
};
const ICON_MAP: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  Database,
  BarChart3,
};
const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedAgent: Agent = useMemo(() => {
    const fromState = (location.state as { agent?: Agent } | null)?.agent;
    if (fromState) {
      localStorage.setItem("selectedAgent", JSON.stringify(fromState));
      return fromState;
    }
    const cached = localStorage.getItem("selectedAgent");
    if (cached) return JSON.parse(cached) as Agent;
    return {
      id: 0,
      name: "AI Assistant",
      description: "",
      iconKey: "Database",
      color: "bg-neutral-700",
      rating: 0,
      date: "",
      avm: 0,
      avgColor: "bg-neutral-700",
    };
  }, [location.state]);
  const userName = useMemo(() => (localStorage.getItem("user_name") || "").trim() || "there", []);
  const isDataFlow = /data\s*flow/i.test(selectedAgent.name || "");
  const isInsights = /insight/i.test(selectedAgent.name || "");
  const greeting = useMemo(() => {
    if (isDataFlow) return `Hey ${userName}, let’s pull your data with one click.`;
    if (isInsights) return `Hey ${userName}, let’s get insights on your data.`;
    return `Hey ${userName}, how can I help today?`;
  }, [isDataFlow, isInsights, userName]);
  const HeaderIcon = ICON_MAP[selectedAgent.iconKey] ?? Database;
  const headerTitle = selectedAgent.name || "AI Assistant";
  const badgeColor = selectedAgent.color || "bg-neutral-700";
  /* ---------- Messages ---------- */
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: "welcome-1", content: greeting, isAI: true, timestamp: new Date() },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isAI: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setTimeout(() => {
      const aiResponses = [
        "I understand your question. Let me think about this and provide you with a helpful response.",
        "That's an interesting point! I'm processing your request to give you the best possible answer.",
        "Thanks for your message. Based on what you've asked, here's my response to help you.",
        "I've analyzed your question and I'm ready to assist you with a comprehensive answer.",
      ];
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        isAI: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  /* ---------- DataFlow onboarding state ---------- */
  const [apiKeys, setApiKeys] = useState<string[]>([""]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleApiKeyChange = (idx: number, value: string) => {
    setApiKeys((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };
  const addApiKeyField = () => {
    if (apiKeys[apiKeys.length - 1].trim() !== "") {
      setApiKeys((prev) => [...prev, ""]);
    }
  };
  const removeApiKeyField = (idx: number) => {
    setApiKeys((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length === 0 ? [""] : next;
    });
  };
  const handleApiKeyEnter = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && idx === apiKeys.length - 1) {
      e.preventDefault();
      if (apiKeys[idx].trim() !== "") addApiKeyField();
    }
  };
  const handleCsvPicked: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please select a .csv file");
      e.target.value = "";
      return;
    }
    setApiKeys((prev) => {
      const next = [...prev];
      next[prev.length - 1] = file.name;
      return next;
    });
    e.target.value = "";
  };
  /** NEW: Send all keys to backend */
  const handleContinue = async () => {
  try {
    console.log("Sending API keys:", apiKeys);   // <-- Debug
    const response = await fetch("http://127.0.0.1:8000/run-loader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apis: apiKeys }),
    });
    const data = await response.json();
    console.log("Backend response:", data);      // <-- Debug
    alert(data.message || "Process completed!");
  } catch (err) {
    console.error("Error:", err);
    alert("❌ Failed to send data");
  }
};

  /* ---------- Settings ---------- */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState<boolean>(() => {
    const v = localStorage.getItem("pref_show_timestamps");
    return v ? v === "true" : true;
  });
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    const v = localStorage.getItem("pref_compact_mode");
    return v ? v === "true" : false;
  });
  const persistPrefs = () => {
    localStorage.setItem("pref_show_timestamps", String(showTimestamps));
    localStorage.setItem("pref_compact_mode", String(compactMode));
  };
  const handleLogout = () => {
    try {
      localStorage.removeItem("selectedAgent");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("pref_show_timestamps");
      localStorage.removeItem("pref_compact_mode");
      sessionStorage.clear();
      navigate("/agents");
    } catch {
      navigate("/agents");
    }
  };
  /* ---------- UI ---------- */
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
            onClick={() => navigate("/agents")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Agents
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <MessageCircle className="w-4 h-4" />
            New Conversation
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <History className="w-4 h-4" />
            Chat History
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
            Settings
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
          </div>
        </div>
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-primary/20 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 ${badgeColor} rounded-full flex items-center justify-center animate-hologram-shift`}
            >
              <HeaderIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{headerTitle}</h1>
              <p className="text-xs text-muted-foreground">Online and ready to help</p>
            </div>
          </div>
        </div>
        {/* Content */}
        {isDataFlow ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground">One-click Data Pull</h2>
                <p className="text-sm text-muted-foreground mt-2">{greeting}</p>
              </div>
              <div className="space-y-4">
                {apiKeys.map((val, idx) => (
                  <div key={idx} className="relative">
                    <Input
                      value={val}
                      onChange={(e) => handleApiKeyChange(idx, e.target.value)}
                      onKeyDown={(e) => handleApiKeyEnter(idx, e)}
                      placeholder={`Enter CSV/Parquet/API URL ${apiKeys.length > 1 ? `#${idx + 1}` : ""}`}
                      className="pr-36 bg-input/50 border-primary/20 focus:border-primary focus:ring-primary/20 ai-glow"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 px-3 text-xs"
                        title="Upload CSV"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-1" /> CSV
                      </Button>
                      {apiKeys.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => removeApiKeyField(idx)}
                          className="h-9 w-9"
                          title="Remove this field"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                      {idx === apiKeys.length - 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={addApiKeyField}
                          disabled={val.trim() === ""}
                          className="h-9 w-9"
                          title="Add another API key"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvPicked}
                className="hidden"
              />
              <div className="mt-6 flex justify-end">
                <Button className="ai-neural-btn" onClick={handleContinue}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-6 max-w-4xl mr-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.isAI ? "justify-start" : "justify-end"}`}
                  >
                    {message.isAI && (
                      <div
                        className={`w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center hologram flex-shrink-0`}
                      >
                        <HeaderIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <Card
                      className={`max-w-md p-4 ${
                        message.isAI ? "message-ai bg-gradient-message" : "bg-muted/80 border-muted-foreground/20"
                      }`}
                    >
                      <p className="text-sm text-foreground">{message.content}</p>
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
                    <div
                      className={`w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center hologram flex-shrink-0`}
                    >
                      <HeaderIcon className="w-4 h-4 text-white" />
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
            <div className="border-t border-primary/20 bg-card/80 backdrop-blur-xl p-6">
              <div className="w-full max-w-6xl mx-auto flex gap-4">
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
          </>
        )}
      </div>
      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Personalize your chat experience and manage your account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-ts">Show timestamps</Label>
              <Switch
                id="show-ts"
                checked={showTimestamps}
                onCheckedChange={setShowTimestamps}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="compact-mode">Compact message cards</Label>
              <Switch
                id="compact-mode"
                checked={compactMode}
                onCheckedChange={setCompactMode}
              />
            </div>
            <div className="pt-2 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-3">
                Logged in as <span className="text-foreground font-medium">{userName}</span>
              </p>
              <Button
                variant="destructive"
                className="w-full flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
          <DialogFooter>
            <div className="flex w-full justify-between">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowTimestamps(localStorage.getItem("pref_show_timestamps") !== "false");
                  setCompactMode(localStorage.getItem("pref_compact_mode") === "true");
                  setSettingsOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  persistPrefs();
                  setSettingsOpen(false);
                }}
              >
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default Chat;