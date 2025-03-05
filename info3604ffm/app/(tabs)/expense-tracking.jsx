import { View, Text, ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectList } from "react-native-dropdown-select-list";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";

const ExpenseTracking = () => {
  const data = [
    { key: 1, value: "Daily Expenses" },
    { key: 2, value: "Health Expenses" },
    { key: 3, value: "Home/Rent" },
    { key: 4, value: "Transportation" },
    { key: 5, value: "Food" },
  ];

  const [form, setForm] = useState({
    title: "",
    value: null,
    category: null,
    desc: null,
    rec: null,
  });

  const submit = () => {};

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
        <Text className="text-tertiary text-2xl text-bold">Add Expense</Text>
        <FormField
          title="Add New Expense: "
          value={form.title}
          placeholder="Enter new expense"
          handleChangeText={(e) => ({ ...form, title: e })}
          otherStyles="mt-10"
        ></FormField>
        <FormField
          title="Add Value:  "
          value={form.value}
          placeholder="Enter value"
          handleChangeText={(e) => ({ ...form, title: e })}
          otherStyles="mt-5 mb-5"
        ></FormField>
        <Text className="mb-2">Select Category:</Text>
        <SelectList data={data} save="value"
        setSelected={(selected) => setForm({...form, category: selected})}
        />
        <FormField
          title="Add Description: "
          value={form.desc}
          placeholder="Description"
          handleChangeText={(e) => ({ ...form, title: e })}
          otherStyles="mt-5 mb-5"
        ></FormField>

        <BouncyCheckbox
        isChecked={form.rec}
        onPress={(isChecked) => setForm({
          ...form, recurring: isChecked
        })} text="Recurring?" />

        <CustomButton
          title="Add Expense"
          handlePress={submit}
          containerStyles="mt-5"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExpenseTracking;
