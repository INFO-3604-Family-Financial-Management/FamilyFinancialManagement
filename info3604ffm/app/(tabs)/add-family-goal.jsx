import { View, Text, SafeAreaView, Alert, TouchableOpacity } from 'react-native'
import React, {useState, useEffect} from 'react'
import Checkbox from 'expo-checkbox';
import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'
import { router } from 'expo-router'
import { goalService, familyService } from '../../services/api'

const AddFamilyGoal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [goalType, setGoalType] = useState('saving'); // Default to saving
    const [familyId, setFamilyId] = useState(null);
    const [form, setForm] = useState({
        name: '',
        amount: ''
    });

    // Fetch the family ID when component mounts
    useEffect(() => {
        const fetchFamilyData = async () => {
            try {
                const family = await familyService.getFamily();
                if (family && family.id) {
                    setFamilyId(family.id);
                } else {
                    Alert.alert(
                        "No Family Found", 
                        "You need to be part of a family to create family goals.",
                        [{ text: "OK", onPress: () => router.replace('/family') }]
                    );
                }
            } catch (error) {
                console.error('Error fetching family:', error);
                Alert.alert("Error", "Could not retrieve family information.");
            }
        };

        fetchFamilyData();
    }, []);

    const validateForm = () => {
        if (!form.name.trim()) {
            Alert.alert("Validation Error", "Please enter a goal name");
            return false;
        }
        
        const amount = parseFloat(form.amount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert("Validation Error", "Please enter a valid amount greater than 0");
            return false;
        }
        
        if (!familyId) {
            Alert.alert("Error", "No family found. Please create or join a family first.");
            return false;
        }
        
        return true;
    };

    const submit = async () => {
        if (!validateForm()) return;
        
        setIsLoading(true);
        
        try {
            const goalData = {
                name: form.name,
                amount: parseFloat(form.amount),
                goalType: goalType,
                isPersonal: false, // This is a family goal
                family: familyId
            };
            
            await goalService.createGoal(goalData);
            
            Alert.alert(
                "Success",
                "Family goal created successfully",
                [{ text: "OK", onPress: () => router.push('/family-goals') }]
            );
        } catch (error) {
            console.error('Create goal error:', error);
            Alert.alert("Error", error.message || "Failed to create family goal");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className='bg-gray-500 h-full'>
            <View className='mt-10 items-center'>
                <Text className='text-black font-bold text-3xl'>Add New Goal</Text>
            </View>
            <View className='bg-gray-500 p-4 rounded-lg m-4 mt-10 h-[65vh]'>
                <FormField
                    title='Name'
                    value={form.name}
                    handleChangeText={(e) => setForm({...form, name: e})}
                    otherStyles='mt-7'
                />
                <FormField
                    title='Amount'
                    value={form.amount}
                    handleChangeText={(e) => setForm({...form, amount: e})}
                    otherStyles='mt-7'
                />
                <View className='mt-10'>
                    <Text className='text-base text-gray-100 text-medium'>Type</Text>
                    <View className='border-2 border-white w-full p-4 bg-white rounded-2xl focus:border-black'>
                        <TouchableOpacity onPress={() => setGoalType('saving')} className="mb-2 flex-row items-center">
                            <Checkbox value={goalType === 'saving'} onValueChange={() => setGoalType('saving')} />
                            <Text>Saving</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setGoalType('spending')} className="mb-2 flex-row items-center">
                            <Checkbox value={goalType === 'spending'} onValueChange={() => setGoalType('spending')} />
                            <Text>Spending</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <CustomButton
                    title="Save"
                    handlePress={submit}
                    containerStyles="mx-8 mt-10 w-half"
                />
                <CustomButton
                    title="Cancel"
                    handlePress={() => router.push("/family")}
                    containerStyles="mx-8 mt-5 w-half"
                />
            </View>
        </SafeAreaView>
    )
}

export default AddFamilyGoal