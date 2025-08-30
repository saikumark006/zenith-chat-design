import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Send,
  Brain,
  Settings,
  MessageCircle,
  User,
  ArrowLeft,
  Database,
  BarChart3,
  Plus,
  Minus,
  Upload,
  LogOut,
  Loader2,
  CheckCircle,
  XCircle,
  MoreVertical,
  Trash2,
  TrendingUp,
  PieChart,
  BarChart,
  LineChart,
  Activity,
  Zap,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/* ---------- Types ---------- */
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  sql?: string;
  aiSummary?: string;
  chartImage?: string;
  chartType?: string;
  chartEngine?: string;
  insights?: any;
  fullData?: {columns: string[], rows: any[], rowcount: number};
  tableData?: {columns: string[], rows: any[], hasMore: boolean, moreCount: number};
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

/* ---------- Conversation Types ---------- */
type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

const ICON_MAP: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  Database,
  BarChart3,
};

// Enhanced chart types and engines
const CHART_TYPES = [
  { value: "auto", label: "Auto Detect", icon: Activity, description: "Let AI choose the best chart" },
  { value: "bar", label: "Bar Chart", icon: BarChart, description: "Compare categories" },
  { value: "line", label: "Line Chart", icon: LineChart, description: "Show trends over time" },
  { value: "pie", label: "Pie Chart", icon: PieChart, description: "Show proportions" },
  { value: "scatter", label: "Scatter Plot", icon: TrendingUp, description: "Show correlations" },
  { value: "heatmap", label: "Heatmap", icon: BarChart3, description: "Show data density" },
  { value: "histogram", label: "Histogram", icon: BarChart, description: "Show distribution" },
  { value: "box", label: "Box Plot", icon: Activity, description: "Show statistical summary" },
  { value: "dashboard", label: "Dashboard", icon: BarChart3, description: "Multi-view analysis" }
];

const CHART_ENGINES = [
  { 
    value: "matplotlib", 
    label: "Matplotlib", 
    description: "High-quality static charts",
    icon: BarChart,
    badge: "Static"
  },
  { 
    value: "plotly", 
    label: "Plotly", 
    description: "Interactive charts with zoom/hover",
    icon: TrendingUp,
    badge: "Interactive"
  },
  { 
    value: "pandasai", 
    label: "PandasAI", 
    description: "AI-powered contextual visualizations",
    icon: Zap,
    badge: "AI Smart"
  }
];

// Helper function to render text with bold markdown
const renderTextWithBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
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

  const userName = useMemo(() => {
    const raw = (localStorage.getItem("user_name") || "").trim();
    const nameBeforeAt = raw.includes("@") ? raw.split("@")[0] : raw;
    return nameBeforeAt || "there";
  }, []);

  const isDataFlow = /data\s*flow/i.test(selectedAgent.name || "");
  const greeting = useMemo(() => `Hey ${userName}, how can I help today?`, [userName]);

  const HeaderIcon = ICON_MAP[selectedAgent.iconKey] ?? Database;
  const headerTitle = selectedAgent.name || "AI Assistant";
  const badgeColor = selectedAgent.color || "bg-neutral-700";

  /* ---------- Chat History Persistence ---------- */
  const convosKey = useMemo(() => `chat_convos_${selectedAgent.id}`, [selectedAgent.id]);

  const loadConvos = (): Conversation[] => {
    try {
      const raw = localStorage.getItem(convosKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Conversation[];
      return parsed.map(c => ({
        ...c,
        messages: c.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
      }));
    } catch {
      return [];
    }
  };

  const saveConvos = (convos: Conversation[]) => {
    const serializable = convos.map(c => ({
      ...c,
      messages: c.messages.map(m => ({ ...m, timestamp: (m.timestamp as Date).toISOString() as any })),
    }));
    localStorage.setItem(convosKey, JSON.stringify(serializable));
  };

  const makeInitialConversation = (): Conversation => {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      title: "New conversation",
      messages: [{ id: "welcome-1", content: greeting, isAI: true, timestamp: new Date() }],
      createdAt: now,
      updatedAt: now,
    };
  };

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const existing = loadConvos();
    if (existing.length > 0) return existing;
    const init = makeInitialConversation();
    saveConvos([init]);
    return [init];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(
    () => (conversations[0]?.id ?? makeInitialConversation().id)
  );

  const activeConversation = useMemo(
    () => conversations.find(c => c.id === activeConversationId) ?? conversations[0],
    [conversations, activeConversationId]
  );

  /* ---------- Messages ---------- */
  const [messages, setMessages] = useState<Message[]>(
    () => activeConversation?.messages ?? [{ id: "welcome-1", content: greeting, isAI: true, timestamp: new Date() }]
  );
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
    }
  }, [activeConversationId]);

  /* ---------- Enhanced AI Settings ---------- */
  const [enableAISummary, setEnableAISummary] = useState<boolean>(() => {
    const v = localStorage.getItem("pref_ai_summary");
    return v ? v === "true" : true;
  });
  const [enableCharts, setEnableCharts] = useState<boolean>(() => {
    const v = localStorage.getItem("pref_charts");
    return v ? v === "true" : true;
  });
  const [chartType, setChartType] = useState<string>(() => {
    const v = localStorage.getItem("pref_chart_type");
    return v || "auto";
  });
  const [chartEngine, setChartEngine] = useState<string>(() => {
    const v = localStorage.getItem("pref_chart_engine");
    return v || "matplotlib";
  });

  const updateActiveConversation = (updater: (prev: Conversation) => Conversation) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === activeConversationId);
      if (idx === -1) return prev;
      const updated = updater(prev[idx]);
      const next = [...prev];
      next[idx] = updated;
      saveConvos(next);
      return next;
    });
  };

  const addConversation = () => {
    const newConv = makeInitialConversation();
    setConversations(prev => {
      const next = [newConv, ...prev];
      saveConvos(next);
      return next;
    });
    setActiveConversationId(newConv.id);
    setMessages(newConv.messages);
  };

  const renameConversationIfNeeded = (firstUserMessage: string) => {
    if (!activeConversation) return;
    if (activeConversation.title !== "New conversation") return;
    const title = firstUserMessage.trim().slice(0, 60) || "Conversation";
    updateActiveConversation(c => ({ ...c, title }));
  };

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const API_URL = "http://127.0.0.1:8000";

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isAI: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    updateActiveConversation(c => ({
      ...c,
      messages: [...c.messages, userMessage],
      updatedAt: new Date().toISOString(),
    }));

    renameConversationIfNeeded(userMessage.content);

    const q = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const requestBody = {
        question: q,
        include_summary: enableAISummary,
        include_chart: enableCharts,
        chart_type: chartType,
        chart_engine: chartEngine,
      };

      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const { sql, columns, rows, rowcount, elapsed_ms, ai_summary, chart, insights, response_text } = data;

      let reply = response_text || "";
      let fullData = undefined;
      let tableData = undefined;

      if (rowcount === 0) {
        reply = "I couldn't find any rows for that.";
      } else if (rowcount === 1 && columns.length === 1) {
        reply = `Answer: ${rows[0][0]}`;
      } else {
        const previewRows = rows.slice(0, 5);
        reply = "Here are the results:";
        
        // Store table data for display
        const hasMore = rowcount > 5;
        tableData = {
          columns,
          rows: previewRows,
          hasMore,
          moreCount: hasMore ? rowcount - 5 : 0
        };

        // Store full data for modal
        if (rowcount > 5) {
          fullData = { columns, rows, rowcount };
        }
      }

      if (ai_summary) {
        reply += `\n\n**AI Analysis:**\n${ai_summary}`;
      }

      if (insights && Object.keys(insights).length > 0) {
        reply += `\n\n**Key Insights:**`;
        if (insights.total_records) reply += `\n• Total records: ${insights.total_records}`;
        if (insights.numeric_columns) reply += `\n• Numeric columns: ${insights.numeric_columns}`;
        if (insights.categorical_columns) reply += `\n• Categorical columns: ${insights.categorical_columns}`;
        Object.keys(insights).forEach(key => {
          if (key.endsWith('_stats')) {
            const col = key.replace('_stats', '');
            reply += `\n• ${col} stats: Mean=${insights[key].mean?.toFixed(2)}, Min=${insights[key].min}, Max=${insights[key].max}`;
          }
        });
      }

      let chartImage = undefined;
      let chartType_final = undefined;
      let chartEngine_final = undefined;

      if (enableCharts && chart) {
        console.log("Chart data received:", chart);
        if (chart.data_encoded) {
          chartImage = `data:image/png;base64,${chart.data_encoded}`;
          chartType_final = chart.type;
          chartEngine_final = chart.engine;
          console.log("Chart image created successfully");
        } else {
          console.warn("Chart object exists but no data_encoded found");
        }
      } else if (enableCharts && !chart) {
        console.warn("Charts enabled but no chart returned");
        reply += `\n\n*Note: Chart generation was requested but no visualization was created.*`;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: reply + `\n\n`,
        isAI: true,
        timestamp: new Date(),
        sql,
        aiSummary: ai_summary,
        chartImage,
        chartType: chartType_final,
        chartEngine: chartEngine_final,
        insights,
        fullData,
        tableData: typeof tableData !== 'undefined' ? tableData : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
      updateActiveConversation(c => ({
        ...c,
        messages: [...c.messages, aiMessage],
        updatedAt: new Date().toISOString(),
      }));
    
    } catch (err: any) {
      let errorMsg = err.message;
      if (errorMsg.includes("chart generation") || errorMsg.includes("visualization")) {
        errorMsg += " (Try switching to a different chart engine in settings)";
      }
      const aiMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `⚠ Error: ${errorMsg}`,
        isAI: true,
        timestamp: new Date(),
      };      
      setMessages((prev) => [...prev, aiMessage]);
      updateActiveConversation(c => ({
        ...c,
        messages: [...c.messages, aiMessage],
        updatedAt: new Date().toISOString(),
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  /* ---------- Modal for Progress ---------- */
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingDone, setProcessingDone] = useState(false);

  const handleContinue = async () => {
    try {
      const validApiKeys = apiKeys.filter((key) => key.trim() !== "");
      if (validApiKeys.length === 0) {
        alert("Please enter at least one valid URL");
        return;
      }

      setProgressModalOpen(true);
      setIsProcessing(true);
      setProcessingDone(false);
      setProgressLogs(["Starting data load..."]);

      const response = await fetch(`${API_URL}/run-loader`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apis: validApiKeys }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();

      const logs: string[] = [];
      if (data.details && data.details.length > 0) {
        logs.push(...data.details);
      } else {
        logs.push(data.message || "Processing complete.");
      }

      setProgressLogs(logs);
      setIsProcessing(false);
      setProcessingDone(true);
    } catch (err: any) {
      setProgressLogs((prev) => [...prev, `⚠ Error: ${err.message}`]);
      setIsProcessing(false);
      setProcessingDone(true);
    }
  };

  /* ---------- Mode ---------- */
  const [mode, setMode] = useState<"landing" | "dataflow" | "chat">(
    isDataFlow ? "dataflow" : "chat"
  );

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
    localStorage.setItem("pref_ai_summary", String(enableAISummary));
    localStorage.setItem("pref_charts", String(enableCharts));
    localStorage.setItem("pref_chart_type", chartType);
    localStorage.setItem("pref_chart_engine", chartEngine);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("selectedAgent");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("pref_show_timestamps");
      localStorage.removeItem("pref_compact_mode");
      localStorage.removeItem("pref_ai_summary");
      localStorage.removeItem("pref_charts");
      localStorage.removeItem("pref_chart_type");
      localStorage.removeItem("pref_chart_engine");
    } catch {}
    sessionStorage.clear();
    navigate("/agents");
  };

  /* ---------- SQL Modal ---------- */
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [sqlText, setSqlText] = useState<string>("");

  /* ---------- Full Results Modal ---------- */
  const [fullResultsModalOpen, setFullResultsModalOpen] = useState(false);
  const [fullResultsData, setFullResultsData] = useState<{columns: string[], rows: any[]}>({columns: [], rows: []});

  /* ---------- Conversation item menu state ---------- */
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("[data-convo-row]")) setMenuOpenFor(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const deleteConversation = (id: string) => {
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== id);
      saveConvos(remaining);
      if (id === activeConversationId) {
        if (remaining.length > 0) {
          const nextActive = [...remaining].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          setActiveConversationId(nextActive.id);
          setMessages(nextActive.messages);
        } else {
          const fresh = makeInitialConversation();
          saveConvos([fresh]);
          setMessages(fresh.messages);
          setActiveConversationId(fresh.id);
          return [fresh];
        }
      }
      return remaining;
    });
    setMenuOpenFor(null);
  };

  // Enhanced chart icon display
  const getChartIcon = (type?: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      bar: BarChart,
      line: LineChart,
      pie: PieChart,
      scatter: TrendingUp,
      heatmap: BarChart3,
      histogram: BarChart,
      box: Activity,
      dashboard: BarChart3,
      pandasai_smart: Zap,
      plotly_bar: BarChart,
      plotly_line: LineChart,
    };
    return iconMap[type || ""] || TrendingUp;
  };

  const getEngineBadge = (engine?: string) => {
    const badges = {
      matplotlib: { text: "Static", color: "bg-blue-500" },
      plotly: { text: "Interactive", color: "bg-green-500" },
      pandasai: { text: "AI Smart", color: "bg-purple-500" },
    };
    return badges[engine || "matplotlib"] || badges.matplotlib;
  };

  // Helper function to process message content with bold formatting
  const processMessageContent = (content: string, message: Message) => {
    return <span className="whitespace-pre-line">{renderTextWithBold(content)}</span>;
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-card flex">
      {/* Hide scrollbars utility */}
      <style>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Sidebar */}
      <div className="w-64 bg-card/80 backdrop-blur-xl border-r border-primary/20 flex flex-col">
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">AI Chatbot</h2>
              <p className="text-xs text-muted-foreground">v2.0 Enhanced</p>
            </div>
          </div>
        </div>

        {/* Middle section */}
        <div className="flex-1 p-4 flex flex-col gap-4 min-h-0">
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
            onClick={() => {
              setMode(isDataFlow ? "dataflow" : "chat");
              if (!isDataFlow) {
                addConversation();
              } else {
                setMessages([{ id: "welcome-1", content: greeting, isAI: true, timestamp: new Date() }]);
              }
              setInputValue("");
              setIsTyping(false);
              setApiKeys([""]);
            }}
          >
            <MessageCircle className="w-4 h-4" />
            New Conversation
          </Button>

          {/* Chat History List */}
          {!isDataFlow && (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Conversations</div>
              <div className="flex-1 overflow-y-auto no-scrollbar pr-1 space-y-1">
                {[...conversations]
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((c) => (
                    <div
                      key={c.id}
                      data-convo-row
                      className="relative group"
                    >
                      <Button
                        variant={c.id === activeConversationId ? "secondary" : "ghost"}
                        className="w-full justify-start text-left h-auto py-2 pr-10"
                        onClick={() => {
                          setActiveConversationId(c.id);
                          setMode("chat");
                        }}
                        title={c.title}
                      >
                        <span className="truncate">{c.title || "Conversation"}</span>
                      </Button>

                      <button
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenFor(prev => (prev === c.id ? null : c.id));
                        }}
                        aria-label="Conversation menu"
                        title="More"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {menuOpenFor === c.id && (
                        <div className="absolute right-2 top-8 z-20 bg-popover border border-border/50 rounded-md shadow-lg">
                          <button
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 w-full text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(c.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>

        {/* Enhanced Status */}
        <div className="p-4 border-t border-primary/20">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-primary flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                Active
              </span>
            </div>
            {enableAISummary && (
              <div className="flex items-center gap-1 text-blue-400">
                <Brain className="w-3 h-3" />
                AI Analysis ON
              </div>
            )}
            {enableCharts && (
              <div className="flex items-center gap-1 text-green-400">
                <BarChart3 className="w-3 h-3" />
                Charts ON ({chartEngine})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Header - Fixed */}
        <div className="h-16 border-b border-primary/20 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 ${badgeColor} rounded-full flex items-center justify-center`}>
              <HeaderIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{headerTitle}</h1>
              <p className="text-xs text-muted-foreground">
                {enableAISummary || enableCharts ? "Enhanced with AI features" : "Online and ready to help"}
              </p>
            </div>
          </div>
        </div>

        {/* Dataflow */}
        {mode === "dataflow" && (
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
                      className="pr-36 bg-input/50 border-primary/20 focus:border-primary focus:ring-primary/20"
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
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvPicked} className="hidden" />
              <div className="mt-6 flex justify-end">
                <Button onClick={handleContinue}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Mode */}
        {mode === "chat" && (
          <>
            {/* Messages Container - Scrollable */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto no-scrollbar p-6"
              style={{ height: 'calc(100vh - 64px - 80px)' }}
            >
              <div className="space-y-6 w-full">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-4 w-full ${message.isAI ? "justify-start" : "justify-end"}`}>
                    {message.isAI && (
                      <div className={`w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <HeaderIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`${message.isAI ? "max-w-4xl" : "max-w-lg ml-auto"} space-y-3`}>
                      <Card
                        className={`p-4 ${
                          message.isAI 
                            ? "bg-secondary/50 border-border/50" 
                            : "bg-muted/80 border-muted-foreground/20"
                        } ${compactMode ? "py-2 px-3" : ""}`}
                      >
                        <div className="text-sm text-foreground">
                          {processMessageContent(message.content, message)}
                        </div>

                        {/* Table Display for query results */}
                        {message.tableData && (
                          <div className="mt-4">
                            <div className="overflow-auto bg-muted/30 rounded-md border border-border/50" style={{maxHeight: '400px'}}>
                              <Table>
                                <TableHeader className="sticky top-0 bg-muted/80">
                                  <TableRow>
                                    {message.tableData.columns.map((col, idx) => (
                                      <TableHead key={idx} className="font-semibold text-foreground">
                                        {col}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {message.tableData.rows.map((row, rowIdx) => (
                                    <TableRow key={rowIdx} className="hover:bg-muted/20">
                                      {row.map((cell: any, cellIdx: number) => (
                                        <TableCell key={cellIdx} className="text-sm">
                                          {cell === null ? <span className="text-muted-foreground italic">NULL</span> : String(cell)}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            {message.tableData.hasMore && (
                              <div className="mt-2">
                                <button
                                  className="text-primary hover:text-primary/80 underline cursor-pointer text-sm"
                                  onClick={() => {
                                    if (message.fullData) {
                                      setFullResultsData(message.fullData);
                                      setFullResultsModalOpen(true);
                                    }
                                  }}
                                >
                                  and {message.tableData.moreCount} more
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* View SQL button for AI messages with SQL */}
                        {message.isAI && message.sql && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSqlText(message.sql || "");
                                setSqlModalOpen(true);
                              }}
                            >
                              View SQL
                            </Button>
                          </div>
                        )}

                        {showTimestamps && (
                          <p className="mt-2 text-[10px] text-muted-foreground">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        )}
                      </Card>

                      {/* Enhanced Chart Display */}
                      {message.chartImage && (
                        <Card className="p-4 bg-secondary/30 border-border/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const ChartIcon = getChartIcon(message.chartType);
                                return <ChartIcon className="w-4 h-4 text-primary" />;
                              })()}
                              <span className="text-sm font-medium">Generated Visualization</span>
                              {message.chartType && (
                                <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
                                  {message.chartType?.replace('plotly_', '').replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {message.chartEngine && (
                                <span className={`text-xs px-2 py-1 rounded-full text-white ${getEngineBadge(message.chartEngine).color}`}>
                                  {getEngineBadge(message.chartEngine).text}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="relative">
                            <img
                              src={message.chartImage}
                              alt={`Generated ${message.chartType || 'chart'} visualization`}
                              className="w-full rounded border bg-white"
                              style={{ maxHeight: '500px', objectFit: 'contain' }}
                              onError={(e) => {
                                console.error("Chart image failed to load:", e);
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <div className="hidden w-full h-32 bg-muted/50 border border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
                              <p className="text-sm">Chart could not be displayed</p>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                    {!message.isAI && (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-4 justify-start w-full">
                    <div className={`w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <HeaderIcon className="w-4 h-4 text-white" />
                    </div>
                    <Card className="bg-secondary/50 border-border/50 p-4 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full animate-pulse bg-muted-foreground"></div>
                          <div className="w-2 h-2 rounded-full animate-pulse bg-muted-foreground" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 rounded-full animate-pulse bg-muted-foreground" style={{animationDelay: '0.4s'}}></div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          AI is {enableAISummary ? "analyzing and " : ""}{enableCharts ? "visualizing..." : "processing..."}
                        </span>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="border-t border-primary/20 bg-card/80 backdrop-blur-xl p-6 flex-shrink-0">
              <div className="w-full flex gap-4">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your data..."
                    className="pr-12 bg-input/50 border-primary/20 focus:border-primary focus:ring-primary/20"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Progress Modal */}
      <Dialog
        open={progressModalOpen}
        onOpenChange={(open) => {
          setProgressModalOpen(open);
          if (!open && processingDone) {
            setApiKeys([""]);
            setProgressLogs([]);
            setIsProcessing(false);
            setProcessingDone(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Processing Your Data</DialogTitle>
            <DialogDescription>Real-time progress of loading data into Snowflake.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto no-scrollbar mt-4 space-y-2">
            {progressLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                {log.startsWith("⚠") ? (
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                )}
                <span className="text-foreground">{log}</span>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            )}
          </div>
          <DialogFooter>
            {processingDone && (
              <Button
                onClick={() => {
                  setProgressModalOpen(false);
                  setMode("dataflow");
                  setApiKeys([""]);
                  setProgressLogs([]);
                  setIsProcessing(false);
                  setProcessingDone(false);
                }}
              >
                OK
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enhanced Settings</DialogTitle>
            <DialogDescription>Customize your AI-powered data analysis experience.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Display</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-ts">Show timestamps</Label>
                  <Switch id="show-ts" checked={showTimestamps} onCheckedChange={setShowTimestamps} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode">Compact message cards</Label>
                  <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} />
                </div>
              </div>
            </div>

            {/* AI Features */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">AI Features</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-summary">AI Analysis</Label>
                    <p className="text-xs text-muted-foreground">Generate insights from query results</p>
                  </div>
                  <Switch id="ai-summary" checked={enableAISummary} onCheckedChange={setEnableAISummary} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="charts">Data Visualization</Label>
                    <p className="text-xs text-muted-foreground">Auto-generate charts from data</p>
                  </div>
                  <Switch id="charts" checked={enableCharts} onCheckedChange={setEnableCharts} />
                </div>
              </div>
            </div>
{/* Visualization Settings */}
{enableCharts && (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Visualization Settings</h3>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="chart-engine">Visualization Engine</Label>
        <Select value={chartEngine} onValueChange={setChartEngine}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select engine" />
          </SelectTrigger>
          <SelectContent>
            {CHART_ENGINES.map(engine => {
              const IconComponent = engine.icon;
              return (
                <SelectItem key={engine.value} value={engine.value}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{engine.label}</div>
                      <div className="text-xs text-muted-foreground">{engine.description}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full text-white ${
                      engine.value === "matplotlib" ? "bg-blue-500" :
                      engine.value === "plotly" ? "bg-green-500" : "bg-purple-500"
                    }`}>
                      {engine.badge}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="chart-type">Default Chart Type</Label>
        <Select value={chartType} onValueChange={setChartType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select chart type" />
          </SelectTrigger>
          <SelectContent>
            {CHART_TYPES.map(type => {
              const IconComponent = type.icon;
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
)}

<div className="pt-2 border-t border-border/50">
  <p className="text-sm text-muted-foreground mb-3">
    Logged in as <span className="text-foreground font-medium">{userName}</span>
  </p>
  <Button variant="destructive" className="w-full flex items-center gap-2" onClick={handleLogout}>
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
      setEnableAISummary(localStorage.getItem("pref_ai_summary") !== "false");
      setEnableCharts(localStorage.getItem("pref_charts") === "true");
      setChartType(localStorage.getItem("pref_chart_type") || "auto");
      setChartEngine(localStorage.getItem("pref_chart_engine") || "matplotlib");
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

{/* SQL Modal */}
<Dialog open={sqlModalOpen} onOpenChange={setSqlModalOpen}>
<DialogContent className="sm:max-w-2xl">
  <DialogHeader>
    <DialogTitle>Executed SQL</DialogTitle>
    <DialogDescription>The exact SQL query used for this response.</DialogDescription>
  </DialogHeader>
  <div className="mt-2">
    <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-3 rounded-md border border-border/50">
      {sqlText}
    </pre>
  </div>
  <DialogFooter>
    <Button onClick={() => setSqlModalOpen(false)}>Close</Button>
  </DialogFooter>
</DialogContent>
</Dialog>

{/* Full Results Modal */}
<Dialog open={fullResultsModalOpen} onOpenChange={setFullResultsModalOpen}>
  <DialogContent className="sm:max-w-6xl max-h-[80vh]">
    <DialogHeader>
      <DialogTitle>Complete Results</DialogTitle>
      <DialogDescription>All {fullResultsData.rows.length} rows from your query.</DialogDescription>
    </DialogHeader>
    <div className="overflow-auto bg-muted/30 rounded-md border border-border/50" style={{maxHeight: '60vh'}}>
      <Table>
        <TableHeader className="sticky top-0 bg-muted/80">
          <TableRow>
            {fullResultsData.columns.map((col, idx) => (
              <TableHead key={idx} className="font-semibold text-foreground">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {fullResultsData.rows.map((row, rowIdx) => (
            <TableRow key={rowIdx} className="hover:bg-muted/20">
              {row.map((cell: any, cellIdx: number) => (
                <TableCell key={cellIdx} className="text-sm">
                  {cell === null ? <span className="text-muted-foreground italic">NULL</span> : String(cell)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    <DialogFooter>
      <Button onClick={() => setFullResultsModalOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
</div>
);
};
export default Chat;
