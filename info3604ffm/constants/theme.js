export const COLORS = {
    // Primary brand colors
    primary: {
      main: "#6366F1",     // Indigo-500 - Main brand color
      light: "#A5B4FC",    // Indigo-300 - Light version for backgrounds
      dark: "#4F46E5",     // Indigo-600 - Dark version for contrast
      contrast: "#ffffff", // White text on primary
    },
    
    // Secondary accent colors
    secondary: {
      main: "#F59E0B",     // Amber-500 - Secondary brand color
      light: "#FCD34D",    // Amber-300 - Light version
      dark: "#D97706",     // Amber-600 - Dark version
      contrast: "#ffffff", // White text on secondary
    },
    
    // Success colors
    success: {
      main: "#10B981",     // Emerald-500 - Success actions
      light: "#6EE7B7",    // Emerald-300 - Light success
      dark: "#059669",     // Emerald-600 - Dark success
      contrast: "#ffffff", // White text on success
    },
    
    // Error/warning colors
    error: {
      main: "#EF4444",     // Red-500 - Error states
      light: "#FCA5A5",    // Red-300 - Light error
      dark: "#DC2626",     // Red-600 - Dark error
      contrast: "#ffffff", // White text on error
    },
    
    // Neutrals/Grays
    neutral: {
      50: "#F9FAFB",       // Very light gray (almost white) - backgrounds
      100: "#F3F4F6",      // Light gray - alternate backgrounds
      200: "#E5E7EB",      // Light gray - borders
      300: "#D1D5DB",      // Medium light gray - disabled states
      400: "#9CA3AF",      // Medium gray - placeholder text
      500: "#6B7280",      // Medium gray - secondary text
      600: "#4B5563",      // Medium dark gray - body text
      700: "#374151",      // Dark gray - headings
      800: "#1F2937",      // Very dark gray - emphasized content
      900: "#111827",      // Almost black - highest contrast
    },
    
    // Special function colors
    white: "#FFFFFF",
    black: "#000000",
    transparent: "transparent",
    
    // Background colors
    background: {
      primary: "#F9FAFB",      // Very light gray - main background
      secondary: "#F3F4F6",    // Light gray - card background
      dark: "#111827",         // Dark mode background
    }
  };
  
  export const FONTS = {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
      display: 36,
    },
    weights: {
      light: "300",
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    }
  };
  
  export const SHADOWS = {
    small: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
  };
  
  export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };
  
  export const BORDER_RADIUS = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    round: 9999,
  };
  
  export default {
    COLORS,
    FONTS,
    SHADOWS,
    SPACING,
    BORDER_RADIUS,
  };