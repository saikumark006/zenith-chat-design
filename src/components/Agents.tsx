import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Database,
  BarChart3,
  ChevronDown,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export type IconKey = "Database" | "BarChart3";

export type Agent = {
  id: number;
  name: string;
  description: string;
  iconKey: IconKey;      // used to rehydrate the exact icon on Login/Chat
  color: string;         // tailwind bg-* class for the circle
  rating: number;
  status: "Active" | "Inactive";
  date: string;
  avm: number;           // kept in type but not rendered
  avgColor: string;      // kept in type but not rendered
};

const ICON_MAP = {
  Database,
  BarChart3,
};

const Agents = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const agents: Agent[] = [
    {
      id: 1,
      name: "DataFlow",
      description:
        "Seamlessly connects and ingests data from multiple sources including databases, APIs, files, and cloud services.",
      iconKey: "Database",
      color: "bg-emerald-500",
      rating: 9.2,
      status: "Active",
      date: "3/1/2024",
      avm: 9.2,
      avgColor: "bg-emerald-500",
    },
    {
      id: 2,
      name: "InsightAI",
      description:
        "Transforms raw data into actionable insights through natural language queries, SQL generation, and dynamic visualizations.",
      iconKey: "BarChart3",
      color: "bg-blue-500",
      rating: 8.8,
      status: "Active",
      date: "2/10/2024",
      avm: 8.8,
      avgColor: "bg-blue-500",
    },
  ];

  // name-only search so "data" → DataFlow only
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((a) => a.name.toLowerCase().includes(q));
  }, [agents, searchQuery]);

  const handleAgentClick = (agent: Agent) => {
    // persist so refresh on /login or /chat keeps the same selection
    localStorage.setItem("selectedAgent", JSON.stringify(agent));
    navigate("/login", { state: { agent } });
  };

  return (
    <div className="min-h-screen bg-background p-6 relative">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your AI Agents</h1>
              <p className="text-muted-foreground">
                Manage your intelligent assistants all in one place
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>

          <Button variant="outline" className="gap-2">
            Most Recent <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-sm text-muted-foreground">
            No agents found for "{searchQuery}".
          </div>
        ) : (
          filtered.map((agent) => {
            const IconComponent = ICON_MAP[agent.iconKey];
            return (
              <Card
                key={agent.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleAgentClick(agent)}
              >
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{agent.description}</p>

                  {/* date */}
                  <p className="text-xs text-muted-foreground">{agent.date}</p>

                  {/* footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs">
                      {agent.status}
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs gap-1 group-hover:text-primary">
                      View Details <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Agents;