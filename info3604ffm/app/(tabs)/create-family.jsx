import { View, Text, SafeAreaView, Alert, StatusBar, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { familyService, authService } from '@/services/api'
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme'

const CreateFamily = () => {
  const [form, setForm] = useState({
    name: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Error", "Please enter a family name")
      return false
    }
    return true
  }

  const submit = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error("You must be logged in to create a family");
      }
      
      // Create the family with the current user as a member
      const familyData = {
        name: form.name,
        members: [] // This needs to be sent but can be empty - backend will add current user
      }
      
      // Create the family
      const newFamily = await familyService.createFamily(familyData)
      
      Alert.alert(
        "Success",
        "Family created successfully!",
        [{ text: "OK", onPress: () => router.push('/family') }]
      )
    } catch (error) {
      console.error('Create family error:', error)
      Alert.alert("Error", error.message || "Failed to create family")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Family</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Family Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Family Details</Text>
          
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Family Name</Text>
            <View style={styles.textInputContainer}>
              <FormField
                title=""
                value={form.name}
                handleChangeText={(e) => setForm({...form, name: e})}
                icon="people-outline"
                placeholder="Enter your family name"
              />
            </View>
          </View>
        </View>
        
        {/* Help Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary.main} />
            <Text style={styles.infoTitle}>About Family Groups</Text>
          </View>
          <Text style={styles.infoText}>
            Creating a family allows you to share budgets, goals, and financial plans 
            with family members. You can add members after creating your family.
          </Text>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.push("/family")}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.saveButton,
            isLoading && styles.disabledButton
          ]}
          onPress={submit}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.saveButtonText}>Creating...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Create Family</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...SHADOWS.medium,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for bottom buttons
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.neutral[800],
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.neutral[700],
    marginBottom: 8,
  },
  textInputContainer: {
    borderRadius: 12,
  },
  infoCard: {
    backgroundColor: COLORS.primary.light + '20',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary.main,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary.main,
  },
  infoText: {
    color: COLORS.neutral[700],
    lineHeight: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    borderRadius: 12,
  },
  cancelButtonText: {
    color: COLORS.neutral[700],
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 2,
    backgroundColor: COLORS.primary.main,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    ...SHADOWS.small,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default CreateFamily