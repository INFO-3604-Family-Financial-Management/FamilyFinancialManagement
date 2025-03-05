import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import CustomButton from '@/components/CustomButton'


const customers = [
  { id: '1', name: 'Food', email: 'KFC', amount: '$59', image: 'https://via.placeholder.com/50' },
  { id: '2', name: 'Entertainment', email: 'Avengers Doomsday', amount: '$80', image: 'https://via.placeholder.com/50' },
  { id: '3', name: 'Rent', email: 'March', amount: '$3400', image: 'https://via.placeholder.com/50' },
  { id: '4', name: 'Transport', email: 'Daily Commute', amount: '$35', image: 'https://via.placeholder.com/50' },
  { id: '5', name: 'Food', email: 'Doubles', amount: '$20', image: 'https://via.placeholder.com/50' },
];

const LatestCustomers = () => {

  const submit =()=>{

  }
  return (
    <SafeAreaView className="">
      <View  className="mt-10 items-center">
        <Text className="text-black text-2xl">
          Home
        </Text>
      </View>
      <View className="bg-black border-2 h-24 mx-6 mt-10 flex-row rounded-2xl items-center justify-center">
        <Text className="text-white text-2xl font-extrabold text-center">
          Daily Budget {"\n"} $200
        </Text>
      </View>
      <View className="bg-white p-4 rounded-lg shadow-md m-4 mt-10">
      <View className="flex-row justify-between mb-4">
        <Text className="text-xl font-bold text-gray-900">Latest Transactions</Text>
        <TouchableOpacity>
          <Text className="text-sm text-blue-600">View all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center py-3 border-b border-gray-200 last:border-b-0">
            <Image source={{ uri: item.image }} className="w-10 h-10 rounded-full" />
            <View className="flex-1 ml-4">
              <Text className="text-sm font-medium text-gray-900">{item.name}</Text>
              <Text className="text-sm text-gray-500">{item.email}</Text>
            </View>
            <Text className="text-base font-semibold text-gray-900">{item.amount}</Text>
          </View>
        )}
      />
    </View>
    <CustomButton
    title="View Budgets"
    handlePress={submit}
    containerStyles="mx-8 mt-6"
    />
    </SafeAreaView>
  );
};

export default LatestCustomers;
