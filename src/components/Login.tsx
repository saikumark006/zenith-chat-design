import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Lock, User, Zap, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate AI authentication process
    setTimeout(() => {
      navigate('/chat');
    }, 2000);
  };

  return (
    <div className="min-h-screen neural-bg flex items-center justify-center p-4">
      {/* Neural Network Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-2 h-2 bg-primary rounded-full animate-ai-pulse" />
        <div className="absolute top-1/3 right-20 w-1 h-1 bg-neural rounded-full animate-ai-pulse" style={{animationDelay: '0.5s'}} />
        <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-accent rounded-full animate-ai-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-secondary rounded-full animate-ai-pulse" style={{animationDelay: '1.5s'}} />
      </div>

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-primary/20 ai-glow">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-neural rounded-full flex items-center justify-center hologram">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-neural bg-clip-text text-transparent">
            AI Neural Interface
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Connect to the neural network and unlock AI consciousness
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Neural ID
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your neural identifier"
                className="bg-input/50 border-primary/20 focus:border-primary focus:ring-primary/20 ai-glow"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Access Key
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your access key"
                  className="bg-input/50 border-primary/20 focus:border-primary focus:ring-primary/20 pr-10 ai-glow"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full ai-neural-btn group"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="typing-dots">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                  <span>Connecting to Neural Network...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 group-hover:animate-ai-pulse" />
                  <span>Initialize Connection</span>
                </div>
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Powered by Advanced Neural Networks
            </p>
            <div className="flex justify-center items-center gap-1 mt-2">
              <div className="w-1 h-1 bg-primary rounded-full animate-ai-pulse" />
              <div className="w-1 h-1 bg-neural rounded-full animate-ai-pulse" style={{animationDelay: '0.2s'}} />
              <div className="w-1 h-1 bg-accent rounded-full animate-ai-pulse" style={{animationDelay: '0.4s'}} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;