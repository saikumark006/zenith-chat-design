import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Database, 
  BarChart3, 
  Plus,
  ChevronDown,
  MoreHorizontal,
  ArrowRight,
  Phone,
  MessageSquare,
  Mail,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Agents = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const agents = [
    {
      id: 1,
      name: "DataFlow",
      description: "Seamlessly connects and ingests data from multiple sources including databases, APIs, files, and cloud services.",
      icon: Database,
      color: "bg-emerald-500",
      rating: 9.2,
      status: "Active",
      date: "3/1/2024",
      channels: ["Voice"],
      avm: 9.2,
      avgColor: "bg-emerald-500"
    },
    {
      id: 2,
      name: "InsightAI",
      description: "Transforms raw data into actionable insights through natural language queries, SQL generation, and dynamic visualizations.",
      icon: BarChart3,
      color: "bg-blue-500", 
      rating: 8.8,
      status: "Active",
      date: "2/10/2024",
      channels: ["Voice", "Chat", "Email"],
      avm: 8.8,
      avgColor: "bg-blue-500"
    }
  ];

  const handleAgentClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your AI Agents</h1>
              <p className="text-muted-foreground">Create, customize, and manage your intelligent assistants all in one place</p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
          
          <Button variant="outline" className="gap-2">
            All Functions <ChevronDown className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" className="gap-2">
            All Channels <ChevronDown className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" className="gap-2">
            All Status <ChevronDown className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" className="gap-2">
            Most Recent <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Agent Card */}
        <Card className="border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer group">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center mb-4 group-hover:border-primary/50 transition-colors">
              <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Create New Agent</h3>
            <p className="text-sm text-muted-foreground">
              Create a custom AI agent to help with customer support, sales, or other tasks
            </p>
          </CardContent>
        </Card>

        {/* Agent Cards */}
        {agents.map((agent) => {
          const IconComponent = agent.icon;
          return (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleAgentClick}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${agent.color} flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {agent.description}
                </p>

                {/* Channels */}
                <div className="flex gap-2 flex-wrap">
                  {agent.channels.map((channel) => (
                    <div key={channel} className="flex items-center gap-1">
                      {channel === "Voice" && <Phone className="w-3 h-3" />}
                      {channel === "Chat" && <MessageSquare className="w-3 h-3" />}
                      {channel === "Email" && <Mail className="w-3 h-3" />}
                      <span className="text-xs text-muted-foreground">{channel}</span>
                    </div>
                  ))}
                </div>

                {/* AVM Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">AVM</span>
                    <span className="text-lg font-bold">{agent.avm}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${agent.avgColor}`}
                      style={{ width: `${(agent.avm / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">{agent.date}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Badge variant={agent.status === "Active" ? "default" : "secondary"}>
                    {agent.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-xs gap-1 group-hover:text-primary">
                    View Details <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Agents;