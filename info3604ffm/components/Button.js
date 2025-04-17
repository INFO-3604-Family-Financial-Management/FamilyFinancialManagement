import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

/**
 * Modern, reusable Button component with various style options
 * @param {Object} props
 * @param {string} props.title - Button label text
 * @param {function} props.onPress - Function to call when button is pressed
 * @param {string} props.variant - Button style ('primary', 'secondary', 'outline', 'ghost')
 * @param {string} props.size - Button size ('small', 'medium', 'large')
 * @param {boolean} props.isLoading - Whether to show loading indicator
 * @param {boolean} props.isDisabled - Whether button is disabled
 * @param {string} props.iconName - Ionicons icon name to display
 * @param {string} props.iconPosition - Position of icon ('left', 'right')
 * @param {Object} props.style - Additional styles
 */
const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  isDisabled = false,
  iconName,
  iconPosition = 'left',
  style,
}) => {
  // Get button styles based on variant
  const getButtonStyles = () => {
    // Base styles shared by all variants
    const baseStyles = {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: BORDER_RADIUS.md,
    };
    
    // Size variations
    const sizeStyles = {
      small: {
        paddingVertical: 8,
        paddingHorizontal: 12,
      },
      medium: {
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      large: {
        paddingVertical: 16,
        paddingHorizontal: 24,
      },
    };
    
    // Variant styles
    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          ...sizeStyles[size],
          backgroundColor: isDisabled ? COLORS.neutral[300] : COLORS.primary.main,
        };
      case 'secondary':
        return {
          ...baseStyles,
          ...sizeStyles[size],
          backgroundColor: isDisabled ? COLORS.neutral[300] : COLORS.secondary.main,
        };
      case 'outline':
        return {
          ...baseStyles,
          ...sizeStyles[size],
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled ? COLORS.neutral[300] : COLORS.primary.main,
        };
      case 'ghost':
        return {
          ...baseStyles,
          ...sizeStyles[size],
          backgroundColor: 'transparent',
        };
      default:
        return {
          ...baseStyles,
          ...sizeStyles[size],
          backgroundColor: isDisabled ? COLORS.neutral[300] : COLORS.primary.main,
        };
    }
  };

  // Get text styles based on variant
  const getTextStyles = () => {
    const baseTextStyles = {
      fontWeight: '600',
      textAlign: 'center',
    };
    
    // Size variations
    const sizeTextStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };
    
    // Color based on variant
    switch (variant) {
      case 'primary':
        return {
          ...baseTextStyles,
          ...sizeTextStyles[size],
          color: isDisabled ? COLORS.neutral[500] : COLORS.white,
        };
      case 'secondary':
        return {
          ...baseTextStyles,
          ...sizeTextStyles[size],
          color: isDisabled ? COLORS.neutral[500] : COLORS.white,
        };
      case 'outline':
        return {
          ...baseTextStyles,
          ...sizeTextStyles[size],
          color: isDisabled ? COLORS.neutral[500] : COLORS.primary.main,
        };
      case 'ghost':
        return {
          ...baseTextStyles,
          ...sizeTextStyles[size],
          color: isDisabled ? COLORS.neutral[500] : COLORS.primary.main,
        };
      default:
        return {
          ...baseTextStyles,
          ...sizeTextStyles[size],
          color: isDisabled ? COLORS.neutral[500] : COLORS.white,
        };
    }
  };

  // Get icon color based on variant
  const getIconColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return isDisabled ? COLORS.neutral[500] : COLORS.white;
      case 'outline':
      case 'ghost':
        return isDisabled ? COLORS.neutral[500] : COLORS.primary.main;
      default:
        return isDisabled ? COLORS.neutral[500] : COLORS.white;
    }
  };

  // Get icon size based on button size
  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'medium': return 18;
      case 'large': return 22;
      default: return 18;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled || isLoading}
      activeOpacity={0.7}
      style={[getButtonStyles(), style]}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={getTextStyles().color} 
          size={getIconSize()}
        />
      ) : (
        <>
          {iconName && iconPosition === 'left' && (
            <Ionicons 
              name={iconName} 
              size={getIconSize()} 
              color={getIconColor()} 
              style={{ marginRight: 8 }} 
            />
          )}
          
          <Text style={getTextStyles()}>
            {title}
          </Text>
          
          {iconName && iconPosition === 'right' && (
            <Ionicons 
              name={iconName} 
              size={getIconSize()} 
              color={getIconColor()} 
              style={{ marginLeft: 8 }} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;