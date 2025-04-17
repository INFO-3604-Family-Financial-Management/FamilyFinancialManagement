import { View, Text, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, StatusBar, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState, useEffect } from 'react'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { familyService, familyManagementService } from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../constants/theme'

const EditFamily = () => {
  const params = useLocalSearchParams();
  const username = params.username;
  
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
  });
  const [family, setFamily] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching family data, username param:', username);
        
        const familyData = await familyService.getCurrentUserFamily();
        console.log('Family data:', familyData);
        
        if (!familyData) {
          console.error('No family found');
          setError("No family found");
          return;
        }
        
        setFamily(familyData);
        
        if (username) {
          console.log(`Editing family member: ${username}`);
          setForm({
            name: username,
          });
        } else {
          console.log(`Editing family: ${familyData.name}`);
          setForm({
            name: familyData.name,
          });
        }
      } catch (err) {
        console.error('Error fetching family data:', err);
        setError("Failed to load family data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [username]);

  const handleSubmit = async () => {
    if (!form.name.trim() && !username) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (username) {
        Alert.alert(
          "Success",
          `Member settings updated`,
          [{ text: "OK", onPress: () => router.push("/family-members") }]
        );
      } else if (family) {
        console.log(`Attempting to update family name to: ${form.name}`);
        
        try {
          await familyService.createFamily({
            id: family.id,
            name: form.name
          });
          
          Alert.alert(
            "Success",
            "Family information updated",
            [{ text: "OK", onPress: () => router.push("/family") }]
          );
        } catch (updateError) {
          console.error('Error updating family:', updateError);
          throw updateError;
        }
      }
    } catch (error) {
      console.error('Error updating family:', error);
      Alert.alert(
        "Error",
        `Failed to update: ${error.message || "Unknown error"}`,
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!username || !family) {
      return;
    }

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${username} from the family?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              await familyManagementService.removeFamilyMember(family.id, username);
              Alert.alert(
                "Success",
                `${username} has been removed from the family`,
                [{ text: "OK", onPress: () => router.push("/family-members") }]
              );
            } catch (error) {
              console.error('Error removing family member:', error);
              Alert.alert("Error", `Failed to remove member: ${error.message || "Unknown error"}`);
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
        
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {username ? 'Member Settings' : 'Edit Family'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.main} />
        
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {username ? 'Member Settings' : 'Edit Family'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={28} color={COLORS.error.main} style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={() => router.push("/family")}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
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
        <Text style={styles.headerTitle}>
          {username ? 'Member Settings' : 'Edit Family'}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main content card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {username ? 'Member Information' : 'Family Information'}
          </Text>
          
          {username ? (
            <View style={styles.memberCard}>
              <Text style={styles.memberCardLabel}>Username</Text>
              <Text style={styles.memberCardValue}>{username}</Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Family Name</Text>
              <View style={styles.textInputContainer}>
                <FormField
                  title=""
                  value={form.name}
                  handleChangeText={(text) => setForm({...form, name: text})}
                  icon="people-outline"
                />
              </View>
            </View>
          )}
          
          {/* Info card for member settings */}
          {username && (
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary.main} />
                <Text style={styles.infoTitle}>Member Access</Text>
              </View>
              <Text style={styles.infoText}>
                You can adjust settings for this family member or remove them from the family if needed.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {username ? (
          <>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => router.push("/family-members")}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.deleteButton,
                submitting && styles.disabledButton
              ]}
              onPress={handleRemoveMember}
              disabled={submitting}
            >
              {submitting ? (
                <Text style={styles.deleteButtonText}>Removing...</Text>
              ) : (
                <Text style={styles.deleteButtonText}>Remove Member</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => router.push("/family")}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                submitting && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Text style={styles.saveButtonText}>Saving...</Text>
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.neutral[600],
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: COLORS.error.light + '20',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error.main,
  },
  errorIcon: {
    marginBottom: 10,
  },
  errorText: {
    color: COLORS.error.main,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  goBackButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary.main,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  goBackButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
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
  memberCard: {
    backgroundColor: COLORS.primary.main + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary.main,
  },
  memberCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.neutral[700],
    marginBottom: 4,
  },
  memberCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.neutral[900],
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
  deleteButton: {
    flex: 2,
    backgroundColor: COLORS.error.main,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    ...SHADOWS.small,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default EditFamily