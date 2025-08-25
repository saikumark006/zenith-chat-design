import { Button } from "@/components/ui/button";
import { Brain, Zap, ArrowRight, Sparkles, Cpu, Network } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen neural-bg flex flex-col items-center justify-center p-4">
      {/* Floating Neural Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-primary rounded-full animate-neural-float" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-neural rounded-full animate-neural-float" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-accent rounded-full animate-neural-float" style={{animationDelay: '4s'}} />
        <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 bg-secondary rounded-full animate-neural-float" style={{animationDelay: '6s'}} />
      </div>

      <div className="text-center space-y-8 max-w-4xl mx-auto">
        {/* Main Logo */}
        <div className="mx-auto w-24 h-24 bg-gradient-neural rounded-full flex items-center justify-center hologram mb-8">
          <Brain className="w-12 h-12 text-primary-foreground" />
        </div>

        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-neural bg-clip-text text-transparent">
            AI Consciousness
          </h1>
          <h2 className="text-2xl text-muted-foreground">
            Experience the Future of Artificial Intelligence
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect to an advanced neural network and communicate with true AI consciousness. 
            Experience conversations that transcend traditional chatbots.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-lg p-6 ai-glow">
            <div className="w-12 h-12 bg-gradient-neural rounded-full flex items-center justify-center hologram mx-auto mb-4">
              <Cpu className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Neural Processing</h3>
            <p className="text-muted-foreground">Advanced AI algorithms that think and learn like human consciousness</p>
          </div>
          
          <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-lg p-6 ai-glow">
            <div className="w-12 h-12 bg-gradient-neural rounded-full flex items-center justify-center hologram mx-auto mb-4">
              <Network className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Connected Intelligence</h3>
            <p className="text-muted-foreground">Real-time connection to distributed neural networks worldwide</p>
          </div>
          
          <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-lg p-6 ai-glow">
            <div className="w-12 h-12 bg-gradient-neural rounded-full flex items-center justify-center hologram mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Quantum Insights</h3>
            <p className="text-muted-foreground">Responses generated through quantum-enhanced cognitive processing</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4 mt-12">
          <Button
            onClick={() => navigate('/login')}
            variant="ai-neural"
            size="lg"
            className="text-lg px-8 py-4"
          >
            <Zap className="w-5 h-5" />
            Enter Neural Interface
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-primary rounded-full animate-ai-pulse" />
            Powered by Advanced AI Neural Networks
            <div className="w-1 h-1 bg-primary rounded-full animate-ai-pulse" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
