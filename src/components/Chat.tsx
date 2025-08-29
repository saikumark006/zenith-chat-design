// import { useState, useRef, useEffect, useMemo } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Card } from "@/components/ui/card";
// import {
//   Send,
//   Brain,
//   Settings,
//   History,
//   MessageCircle,
//   User,
//   ArrowLeft,
//   Database,
//   BarChart3,
//   Plus,
//   Minus,
//   Upload,
//   LogOut,
//   Loader2,
//   CheckCircle,
//   XCircle,
// } from "lucide-react";
// import { useNavigate, useLocation } from "react-router-dom";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";

// /* ---------- Types ---------- */
// interface Message {
//   id: string;
//   content: string;
//   isAI: boolean;
//   timestamp: Date;
// }
// type IconKey = "Database" | "BarChart3";
// type Agent = {
//   id: number;
//   name: string;
//   description: string;
//   iconKey: IconKey;
//   color: string;
//   rating: number;
//   date: string;
//   avm: number;
//   avgColor: string;
// };
// const ICON_MAP: Record<IconKey, React.ComponentType<{ className?: string }>> = {
//   Database,
//   BarChart3,
// };

// const Chat = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const selectedAgent: Agent = useMemo(() => {
//     const fromState = (location.state as { agent?: Agent } | null)?.agent;
//     if (fromState) {
//       localStorage.setItem("selectedAgent", JSON.stringify(fromState));
//       return fromState;
//     }
//     const cached = localStorage.getItem("selectedAgent");
//     if (cached) return JSON.parse(cached) as Agent;
//     return {
//       id: 0,
//       name: "AI Assistant",
//       description: "",
//       iconKey: "Database",
//       color: "bg-neutral-700",
//       rating: 0,
//       date: "",
//       avm: 0,
//       avgColor: "bg-neutral-700",
//     };
//   }, [location.state]);

//   const userName = useMemo(() => (localStorage.getItem("user_name") || "").trim() || "there", []);
//   const isDataFlow = /data\s*flow/i.test(selectedAgent.name || "");
//   const greeting = useMemo(() => `Hey ${userName}, how can I help today?`, [userName]);

//   const HeaderIcon = ICON_MAP[selectedAgent.iconKey] ?? Database;
//   const headerTitle = selectedAgent.name || "AI Assistant";
//   const badgeColor = selectedAgent.color || "bg-neutral-700";

//   /* ---------- Messages ---------- */
//   const [messages, setMessages] = useState<Message[]>(() => [
//     { id: "welcome-1", content: greeting, isAI: true, timestamp: new Date() },
//   ]);
//   const [inputValue, setInputValue] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const scrollAreaRef = useRef<HTMLDivElement>(null);
//   const scrollToBottom = () => {
//     if (scrollAreaRef.current) {
//       scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
//     }
//   };
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages, isTyping]);

//   const API_URL = "http://127.0.0.1:8000";

//   const handleSend = async () => {
//     if (!inputValue.trim()) return;

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       content: inputValue,
//       isAI: false,
//       timestamp: new Date(),
//     };
//     setMessages((prev) => [...prev, userMessage]);

//     const q = inputValue;
//     setInputValue("");
//     setIsTyping(true);

//     try {
//       const res = await fetch(`${API_URL}/ask`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: q }),
//       });

//       if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(`HTTP ${res.status}: ${errText}`);
//       }

//       const data = await res.json();
//       const { sql, columns, rows, rowcount, elapsed_ms } = data;

//       let reply = "";
//       if (rowcount === 0) {
//         reply = "I couldn't find any rows for that.";
//       } else if (rowcount === 1 && columns.length === 1) {
//         reply = `Answer: ${rows[0][0]}`;
//       } else {
//         const previewRows = rows.slice(0, 5);
//         const tablePreview = [
//           columns.join(" | "),
//           "-".repeat(columns.join(" | ").length),
//           ...previewRows.map((r: any[]) => r.map((v) => (v === null ? "NULL" : String(v))).join(" | ")),
//           rowcount > 5 ? `...and ${rowcount - 5} more` : "",
//         ].join("\n");
//         reply = "Here are the results:\n\n" + "```\n" + tablePreview + "\n```";
//       }

//       const aiMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         content: reply + `\n\n(SQL run in ${elapsed_ms} ms)\n\nUsed SQL:\n\`\`\`sql\n${sql}\n\`\`\``,
//         isAI: true,
//         timestamp: new Date(),
//       };

//       setMessages((prev) => [...prev, aiMessage]);
//     } catch (err: any) {
//       const aiMessage: Message = {
//         id: (Date.now() + 2).toString(),
//         content: `❌ Error: ${err.message}`,
//         isAI: true,
//         timestamp: new Date(),
//       };
//       setMessages((prev) => [...prev, aiMessage]);
//     } finally {
//       setIsTyping(false);
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   /* ---------- DataFlow onboarding state ---------- */
//   const [apiKeys, setApiKeys] = useState<string[]>([""]);
//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   const handleApiKeyChange = (idx: number, value: string) => {
//     setApiKeys((prev) => {
//       const next = [...prev];
//       next[idx] = value;
//       return next;
//     });
//   };
//   const addApiKeyField = () => {
//     if (apiKeys[apiKeys.length - 1].trim() !== "") {
//       setApiKeys((prev) => [...prev, ""]);
//     }
//   };
//   const removeApiKeyField = (idx: number) => {
//     setApiKeys((prev) => {
//       const next = prev.filter((_, i) => i !== idx);
//       return next.length === 0 ? [""] : next;
//     });
//   };
//   const handleApiKeyEnter = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" && idx === apiKeys.length - 1) {
//       e.preventDefault();
//       if (apiKeys[idx].trim() !== "") addApiKeyField();
//     }
//   };
//   const handleCsvPicked: React.ChangeEventHandler<HTMLInputElement> = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (!file.name.toLowerCase().endsWith(".csv")) {
//       alert("Please select a .csv file");
//       e.target.value = "";
//       return;
//     }
//     setApiKeys((prev) => {
//       const next = [...prev];
//       next[prev.length - 1] = file.name;
//       return next;
//     });
//     e.target.value = "";
//   };

//   /** ---------- Modal for Progress ---------- */
//   const [progressModalOpen, setProgressModalOpen] = useState(false);
//   const [progressLogs, setProgressLogs] = useState<string[]>([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [processingDone, setProcessingDone] = useState(false);

//   const handleContinue = async () => {
//     try {
//       const validApiKeys = apiKeys.filter((key) => key.trim() !== "");
//       if (validApiKeys.length === 0) {
//         alert("Please enter at least one valid URL");
//         return;
//       }

//       setProgressModalOpen(true);
//       setIsProcessing(true);
//       setProcessingDone(false);
//       setProgressLogs(["Starting data load..."]);

//       const response = await fetch("http://127.0.0.1:8000/run-loader", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ apis: validApiKeys }),
//       });

//       if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       const data = await response.json();

//       const logs: string[] = [];
//       if (data.details && data.details.length > 0) {
//         logs.push(...data.details);
//       } else {
//         logs.push(data.message || "Processing complete.");
//       }

//       setProgressLogs(logs);
//       setIsProcessing(false);
//       setProcessingDone(true);
//     } catch (err: any) {
//       setProgressLogs((prev) => [...prev, `❌ Error: ${err.message}`]);
//       setIsProcessing(false);
//       setProcessingDone(true);
//     }
//   };

//   /* ---------- Mode ---------- */
//   const [mode, setMode] = useState<"landing" | "dataflow" | "chat">(
//     isDataFlow ? "dataflow" : "chat"
//   );

//   /* ---------- Settings ---------- */
//   const [settingsOpen, setSettingsOpen] = useState(false);
//   const [showTimestamps, setShowTimestamps] = useState<boolean>(() => {
//     const v = localStorage.getItem("pref_show_timestamps");
//     return v ? v === "true" : true;
//   });
//   const [compactMode, setCompactMode] = useState<boolean>(() => {
//     const v = localStorage.getItem("pref_compact_mode");
//     return v ? v === "true" : false;
//   });
//   const persistPrefs = () => {
//     localStorage.setItem("pref_show_timestamps", String(showTimestamps));
//     localStorage.setItem("pref_compact_mode", String(compactMode));
//   };
//   const handleLogout = () => {
//     try {
//       localStorage.removeItem("selectedAgent");
//       localStorage.removeItem("auth_token");
//       localStorage.removeItem("pref_show_timestamps");
//       localStorage.removeItem("pref_compact_mode");
//       sessionStorage.clear();
//       navigate("/agents");
//     } catch {
//       navigate("/agents");
//     }
//   };

//   /* ---------- UI ---------- */
//   return (
//     <div className="min-h-screen bg-card flex">
//       {/* Sidebar */}
//       <div className="w-64 bg-card/80 backdrop-blur-xl border-r border-primary/20 flex flex-col">
//         <div className="p-4 border-b border-primary/20">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 bg-gradient-neural rounded-full flex items-center justify-center hologram">
//               <Brain className="w-5 h-5 text-primary-foreground" />
//             </div>
//             <div>
//               <h2 className="font-semibold text-foreground">AI Chatbot</h2>
//               <p className="text-xs text-muted-foreground">v1.0</p>
//             </div>
//           </div>
//         </div>
//         <div className="flex-1 p-4 space-y-4">
//           <Button
//             variant="ghost"
//             className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
//             onClick={() => navigate("/agents")}
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Back to Agents
//           </Button>
//           <Button
//             variant="ghost"
//             className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
//             onClick={() => {
//               setMode(isDataFlow ? "dataflow" : "chat");
//               setMessages([{ id: "welcome-1", content: greeting, isAI: true, timestamp: new Date() }]);
//               setInputValue("");
//               setIsTyping(false);
//               setApiKeys([""]); // ensure fresh
//             }}
//           >
//             <MessageCircle className="w-4 h-4" />
//             New Conversation
//           </Button>
//           <Button
//             variant="ghost"
//             className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
//           >
//             <History className="w-4 h-4" />
//             Chat History
//           </Button>
//           <Button
//             variant="ghost"
//             className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
//             onClick={() => setSettingsOpen(true)}
//           >
//             <Settings className="w-4 h-4" />
//             Settings
//           </Button>
//         </div>
//         <div className="p-4 border-t border-primary/20">
//           <div className="text-xs text-muted-foreground space-y-1">
//             <div className="flex justify-between">
//               <span>Status:</span>
//               <span className="text-primary flex items-center gap-1">
//                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ai-pulse" />
//                 Active
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Chat Area */}
//       <div className="flex-1 flex flex-col">
//         {/* Header */}
//         <div className="h-16 border-b border-primary/20 bg-card/80 backdrop-blur-xl flex items-center justify-between px-6">
//           <div className="flex items-center gap-3">
//             <div className={`w-6 h-6 ${badgeColor} rounded-full flex items-center justify-center animate-hologram-shift`}>
//               <HeaderIcon className="w-4 h-4 text-white" />
//             </div>
//             <div>
//               <h1 className="font-semibold text-foreground">{headerTitle}</h1>
//               <p className="text-xs text-muted-foreground">Online and ready to help</p>
//             </div>
//           </div>
//         </div>

//         {/* Dataflow */}
//         {mode === "dataflow" && (
//           <div className="flex-1 flex items-center justify-center p-8">
//             <div className="w-full max-w-xl">
//               <div className="text-center mb-8">
//                 <h2 className="text-3xl font-bold text-foreground">One-click Data Pull</h2>
//                 <p className="text-sm text-muted-foreground mt-2">{greeting}</p>
//               </div>
//               <div className="space-y-4">
//                 {apiKeys.map((val, idx) => (
//                   <div key={idx} className="relative">
//                     <Input
//                       value={val}
//                       onChange={(e) => handleApiKeyChange(idx, e.target.value)}
//                       onKeyDown={(e) => handleApiKeyEnter(idx, e)}
//                       placeholder={`Enter CSV/Parquet/API URL ${apiKeys.length > 1 ? `#${idx + 1}` : ""}`}
//                       className="pr-36 bg-input/50 border-primary/20 focus:border-primary focus:ring-primary/20 ai-glow"
//                     />
//                     <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
//                       <Button
//                         type="button"
//                         variant="secondary"
//                         className="h-9 px-3 text-xs"
//                         title="Upload CSV"
//                         onClick={() => fileInputRef.current?.click()}
//                       >
//                         <Upload className="w-4 h-4 mr-1" /> CSV
//                       </Button>
//                       {apiKeys.length > 1 && (
//                         <Button
//                           type="button"
//                           variant="secondary"
//                           onClick={() => removeApiKeyField(idx)}
//                           className="h-9 w-9"
//                           title="Remove this field"
//                         >
//                           <Minus className="w-4 h-4" />
//                         </Button>
//                       )}
//                       {idx === apiKeys.length - 1 && (
//                         <Button
//                           type="button"
//                           variant="secondary"
//                           onClick={addApiKeyField}
//                           disabled={val.trim() === ""}
//                           className="h-9 w-9"
//                           title="Add another API key"
//                         >
//                           <Plus className="w-4 h-4" />
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvPicked} className="hidden" />
//               <div className="mt-6 flex justify-end">
//                 <Button className="ai-neural-btn" onClick={handleContinue}>
//                   Continue
//                 </Button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Chat */}
//         {mode === "chat" && (
//           <>
//             <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
//               <div className="space-y-6 max-w-4xl mr-auto">
//                 {messages.map((message) => (
//                   <div key={message.id} className={`flex gap-4 ${message.isAI ? "justify-start" : "justify-end"}`}>
//                     {message.isAI && (
//                       <div className={`w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center hologram flex-shrink-0`}>
//                         <HeaderIcon className="w-4 h-4 text-white" />
//                       </div>
//                     )}
//                     <Card
//                       className={`max-w-md p-4 ${
//                         message.isAI ? "message-ai bg-gradient-message" : "bg-muted/80 border-muted-foreground/20"
//                       }`}
//                     >
//                       <p className="text-sm text-foreground whitespace-pre-line">{message.content}</p>
//                     </Card>
//                     {!message.isAI && (
//                       <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
//                         <User className="w-4 h-4 text-muted-foreground" />
//                       </div>
//                     )}
//                   </div>
//                 ))}
//                 {isTyping && (
//                   <div className="flex gap-4 justify-start">
//                     <div className={`w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center hologram flex-shrink-0`}>
//                       <HeaderIcon className="w-4 h-4 text-white" />
//                     </div>
//                     <Card className="message-ai bg-gradient-message p-4">
//                       <div className="flex items-center gap-2">
//                         <div className="typing-dots">
//                           <div className="typing-dot" />
//                           <div className="typing-dot" />
//                           <div className="typing-dot" />
//                         </div>
//                         <span className="text-xs text-muted-foreground">AI is processing...</span>
//                       </div>
//                     </Card>
//                   </div>
//                 )}
//               </div>
//             </ScrollArea>
//             <div className="border-t border-primary/20 bg-card/80 backdrop-blur-xl p-6">
//               <div className="w-full max-w-6xl mx-auto flex gap-4">
//                 <div className="flex-1 relative">
//                   <Input
//                     value={inputValue}
//                     onChange={(e) => setInputValue(e.target.value)}
//                     onKeyPress={handleKeyPress}
//                     placeholder="Type your message here..."
//                     className="pr-12 bg-input/50 border-primary/20 focus:border-primary focus:ring-primary/20 ai-glow"
//                   />
//                   <Button
//                     onClick={handleSend}
//                     disabled={!inputValue.trim() || isTyping}
//                     size="sm"
//                     className="absolute right-1 top-1/2 -translate-y-1/2 ai-neural-btn"
//                   >
//                     <Send className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Progress Modal */}
//       <Dialog
//         open={progressModalOpen}
//         onOpenChange={(open) => {
//           setProgressModalOpen(open);
//           if (!open && processingDone) {
//             setApiKeys([""]);
//             setProgressLogs([]);
//             setIsProcessing(false);
//             setProcessingDone(false);
//           }
//         }}
//       >
//         <DialogContent className="sm:max-w-lg">
//           <DialogHeader>
//             <DialogTitle>Processing Your Data</DialogTitle>
//             <DialogDescription>Real-time progress of loading data into Snowflake.</DialogDescription>
//           </DialogHeader>
//           <div className="max-h-64 overflow-y-auto mt-4 space-y-2">
//             {progressLogs.map((log, idx) => (
//               <div key={idx} className="flex items-start gap-2 text-sm">
//                 {log.startsWith("❌") ? (
//                   <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
//                 ) : (
//                   <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
//                 )}
//                 <span className="text-foreground">{log}</span>
//               </div>
//             ))}
//             {isProcessing && (
//               <div className="flex items-center gap-2 text-muted-foreground">
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Processing...
//               </div>
//             )}
//           </div>
//           <DialogFooter>
//             {processingDone && (
//               <Button
//                 onClick={() => {
//                   setProgressModalOpen(false);
//                   setMode("dataflow");
//                   setApiKeys([""]);
//                   setProgressLogs([]);
//                   setIsProcessing(false);
//                   setProcessingDone(false);
//                 }}
//               >
//                 OK
//               </Button>
//             )}
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Settings Modal */}
//       <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
//         <DialogContent className="sm:max-w-lg">
//           <DialogHeader>
//             <DialogTitle>Settings</DialogTitle>
//             <DialogDescription>Personalize your chat experience and manage your account.</DialogDescription>
//           </DialogHeader>
//           <div className="space-y-6 py-2">
//             <div className="flex items-center justify-between">
//               <Label htmlFor="show-ts">Show timestamps</Label>
//               <Switch id="show-ts" checked={showTimestamps} onCheckedChange={setShowTimestamps} />
//             </div>
//             <div className="flex items-center justify-between">
//               <Label htmlFor="compact-mode">Compact message cards</Label>
//               <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} />
//             </div>
//             <div className="pt-2 border-t border-border/50">
//               <p className="text-sm text-muted-foreground mb-3">
//                 Logged in as <span className="text-foreground font-medium">{userName}</span>
//               </p>
//               <Button variant="destructive" className="w-full flex items-center gap-2" onClick={handleLogout}>
//                 <LogOut className="w-4 h-4" />
//                 Logout
//               </Button>
//             </div>
//           </div>
//           <DialogFooter>
//             <div className="flex w-full justify-between">
//               <Button
//                 variant="secondary"
//                 onClick={() => {
//                   setShowTimestamps(localStorage.getItem("pref_show_timestamps") !== "false");
//                   setCompactMode(localStorage.getItem("pref_compact_mode") === "true");
//                   setSettingsOpen(false);
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={() => {
//                   persistPrefs();
//                   setSettingsOpen(false);
//                 }}
//               >
//                 Save changes
//               </Button>
//             </div>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default Chat;


import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Loader2,
  CheckCircle,
  XCircle,
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

  // --- FIX: greet using only the part before '@' if it's an email ---
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

  /* ---------- Messages ---------- */
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: "welcome-1", content: greeting, isAI: true, timestamp: new Date() },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // --- FIX: reliable autoscroll container (replace ScrollArea) ---
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

    const q = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const { sql, columns, rows, rowcount, elapsed_ms } = data;

      let reply = "";
      if (rowcount === 0) {
        reply = "I couldn't find any rows for that.";
      } else if (rowcount === 1 && columns.length === 1) {
        reply = `Answer: ${rows[0][0]}`;
      } else {
        const previewRows = rows.slice(0, 5);
        const header = columns.join(" | ");
        const separator = "-".repeat(header.length);
        const tableRows = previewRows.map((r: any[]) =>
          r.map((v) => (v === null ? "NULL" : String(v))).join(" | ")
        );
        const more = rowcount > 5 ? `...and ${rowcount - 5} more` : "";
        const tablePreview = [header, separator, ...tableRows, more].filter(Boolean).join("\n");
        reply = "Here are the results:\n\n" + "```\n" + tablePreview + "\n```";
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          reply +
          `\n\n(SQL run in ${elapsed_ms} ms)\n\nUsed SQL:\n\`\`\`sql\n${sql}\n\`\`\``,
        isAI: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      const aiMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `❌ Error: ${err.message}`,
        isAI: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- FIX: use onKeyDown; Enter to send (avoid deprecated onKeyPress) ---
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

  /** ---------- Modal for Progress ---------- */
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

      const response = await fetch("http://127.0.0.1:8000/run-loader", {
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
      setProgressLogs((prev) => [...prev, `❌ Error: ${err.message}`]);
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
    <div className="min-h-screen bg-card flex">
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
            onClick={() => {
              setMode(isDataFlow ? "dataflow" : "chat");
              setMessages([{ id: "welcome-1", content: greeting, isAI: true, timestamp: new Date() }]);
              setInputValue("");
              setIsTyping(false);
              setApiKeys([""]); // ensure fresh
            }}
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
            <div className={`w-6 h-6 ${badgeColor} rounded-full flex items-center justify-center animate-hologram-shift`}>
              <HeaderIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{headerTitle}</h1>
              <p className="text-xs text-muted-foreground">Online and ready to help</p>
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
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvPicked} className="hidden" />
              <div className="mt-6 flex justify-end">
                <Button className="ai-neural-btn" onClick={handleContinue}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat */}
        {mode === "chat" && (
          <>
            {/* --- FIX: simple, reliable scrollable container --- */}
            <div
              ref={scrollContainerRef}
              className="flex-1 p-6 overflow-y-auto"
            >
              <div className="space-y-6 max-w-4xl mr-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-4 ${message.isAI ? "justify-start" : "justify-end"}`}>
                    {message.isAI && (
                      <div className={`w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center hologram flex-shrink-0`}>
                        <HeaderIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <Card
                      className={`max-w-md p-4 ${
                        message.isAI ? "message-ai bg-gradient-message" : "bg-muted/80 border-muted-foreground/20"
                      } ${compactMode ? "py-2 px-3" : ""}`}
                    >
                      <p className="text-sm text-foreground whitespace-pre-line">{message.content}</p>
                      {showTimestamps && (
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      )}
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
                    <div className={`w-8 h-8 ${badgeColor} rounded-full flex items-center justify-center hologram flex-shrink-0`}>
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
            </div>

            <div className="border-t border-primary/20 bg-card/80 backdrop-blur-xl p-6">
              <div className="w-full max-w-6xl mx-auto flex gap-4">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
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
          <div className="max-h-64 overflow-y-auto mt-4 space-y-2">
            {progressLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                {log.startsWith("❌") ? (
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
              <Switch id="show-ts" checked={showTimestamps} onCheckedChange={setShowTimestamps} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="compact-mode">Compact message cards</Label>
              <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} />
            </div>
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
