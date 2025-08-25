import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen neural-bg flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-2xl mx-auto">
        {/* Main Logo */}
        <div className="mx-auto w-20 h-20 bg-gradient-neural rounded-full flex items-center justify-center hologram mb-8">
          <MessageCircle className="w-10 h-10 text-primary-foreground" />
        </div>

        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-foreground">
            AI Chatbot
          </h1>
          <p className="text-xl text-muted-foreground">
            Chat with an intelligent AI assistant that understands and responds to your questions.
          </p>
        </div>

        {/* Call to Action */}
        <div className="space-y-4 mt-12">
          <Button
            onClick={() => navigate('/login')}
            variant="ai-neural"
            size="lg"
            className="text-lg px-8 py-4"
          >
            Start Chatting
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Powered by Advanced AI Technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
