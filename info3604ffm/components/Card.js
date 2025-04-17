import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../constants/theme';

/**
 * Reusable Card component with customizable styles and optional onPress handler
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content inside the card
 * @param {string} props.title - Optional card title
 * @param {boolean} props.pressable - Whether the card is pressable
 * @param {function} props.onPress - Function to call when card is pressed
 * @param {string} props.variant - Card style variant ('default', 'outlined', 'elevated')
 * @param {Object} props.style - Additional styles for the card container
 * @param {Object} props.titleStyle - Additional styles for the title
 */
const Card = ({
  children,
  title,
  pressable = false,
  onPress,
  variant = 'default',
  style,
  titleStyle,
}) => {
  // Define styles based on variant
  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: BORDER_RADIUS.lg,
      padding: 16,
      marginVertical: 8,
    };
    
    switch (variant) {
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: COLORS.neutral[200],
          backgroundColor: COLORS.white,
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: COLORS.white,
          ...SHADOWS.medium,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: COLORS.white,
          ...SHADOWS.small,
        };
    }
  };

  const cardContent = (
    <View style={[getCardStyle(), style]}>
      {title && (
        <Text 
          style={[
            { 
              color: COLORS.neutral[800],
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 12,
            },
            titleStyle
          ]}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );

  if (pressable && onPress) {
    return (
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={onPress}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

export default Card;