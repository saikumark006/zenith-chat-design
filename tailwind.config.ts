import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					glow: 'hsl(var(--secondary-glow))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					glow: 'hsl(var(--accent-glow))'
				},
				neural: {
					DEFAULT: 'hsl(var(--neural))',
					glow: 'hsl(var(--neural-glow))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				}
			},
			backgroundImage: {
				'gradient-neural': 'var(--gradient-neural)',
				'gradient-hologram': 'var(--gradient-hologram)',
				'gradient-ai-bg': 'var(--gradient-ai-bg)',
				'gradient-message': 'var(--gradient-message)'
			},
			boxShadow: {
				'neural': 'var(--shadow-neural)',
				'glow': 'var(--shadow-glow)',
				'hologram': 'var(--shadow-hologram)'
			},
			transitionTimingFunction: {
				'ai': 'var(--transition-ai)',
				'glow': 'var(--transition-glow)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'neural-float': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'50%': { transform: 'translateY(-10px) rotate(1deg)' }
				},
				'hologram-shift': {
					'0%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
					'100%': { backgroundPosition: '0% 50%' }
				},
				'hologram-scan': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				},
				'ai-pulse': {
					'0%, 100%': { opacity: '1', transform: 'scaleY(1)' },
					'50%': { opacity: '0.7', transform: 'scaleY(1.05)' }
				},
				'typing-bounce': {
					'0%, 80%, 100%': { transform: 'scale(0.8) translateY(0)', opacity: '0.5' },
					'40%': { transform: 'scale(1) translateY(-8px)', opacity: '1' }
				},
				'matrix-rain': {
					'0%': { transform: 'translateY(-100vh)', opacity: '1' },
					'100%': { transform: 'translateY(100vh)', opacity: '0' }
				},
				'circuit-flow': {
					'0%': { strokeDashoffset: '100%' },
					'100%': { strokeDashoffset: '0%' }
				},
				'data-stream': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'neural-float': 'neural-float 20s ease-in-out infinite',
				'hologram-shift': 'hologram-shift 4s ease-in-out infinite',
				'hologram-scan': 'hologram-scan 3s linear infinite',
				'ai-pulse': 'ai-pulse 2s ease-in-out infinite',
				'typing-bounce': 'typing-bounce 1.4s ease-in-out infinite both',
				'matrix-rain': 'matrix-rain 2s linear infinite',
				'circuit-flow': 'circuit-flow 2s ease-in-out infinite',
				'data-stream': 'data-stream 3s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
