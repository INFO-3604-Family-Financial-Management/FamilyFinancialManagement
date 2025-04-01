import { View, Text, TouchableOpacity } from "react-native";
import React, {useState} from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";
import FormField from "@/components/FormField";

const CreateBudget = () => {
    const [form, setForm] = useState({
        category: '',
        amount: 0
    })
    const submit = () => {

    }
  return (
    <SafeAreaView className="bg-gray-500 h-full">
      <View className="mt-10 items-center">
        <Text className="text-black font-bold text-3xl">Adding New Category</Text>
      </View>
      <View className="bg-gray-600 p-4 rounded-lg m-4 mt-10 h-[65vh]">
        <Text className="text-2xl text-left font-bold text-gray-900 text-center">
          February
        </Text>
        <View className=" justify-center items-center p-4">
            <FormField
                title='Category'
                value={form.category}
                handleChangeText={(e) => setForm({...form, category: e})}
                otherStyles='mt-7'
            />
            <FormField
                title='Amount'
                value={form.amount}
                keyboardType='number-pad'
                handleChangeText={(e) => setForm({...form, amount: e})}
                otherStyles='mt-7'
            />
        </View>
        <CustomButton
        title="Cancel"
        handlePress={() => router.push("/budget")}
        containerStyles="mx-8 mt-10 w-half"
      />
      <CustomButton
        title="Save"
        handlePress={submit}
        containerStyles="mx-8 mt-2 w-half"
      />
      </View>
    </SafeAreaView>
  );
};

export default CreateBudget;
