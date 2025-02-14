import { ImageBackground, StyleSheet, Text, View, ScrollView } from "react-native";
import React from "react";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";


import images  from "../constants/images";
import CustomButton from "@/components/CustomButton";

const HelloThere = () => {
  return (
    <SafeAreaView>
      <ImageBackground
        source={images.onboardbg}
        className="w-full h-full mb-5"
        resizeMode="cover">
        <View className="mt-[75px] items-center justify-center min-h-[85vh]">
          <Text className="text-3xl font-bold text-center">
            Welcome to TFR Finance! {"\n"}
          </Text>
          <Text className="mt-[300px] text-2xl font-bold text-center text-white">
            Manage your family's finances with ease. {"\n"}
            ✔ Track spending {"\n"}
            ✔ Set budgets {"\n"}
            ✔ Plan for the future—together {"\n"}
          </Text>

          <CustomButton
            title="Get Started"
            handlePress={() => router.push("/sign-in")}
            containerStyles=" mt-7"
          />
        </View>
        </ImageBackground>
        <StatusBar backgroundColor="#000000" style="light" />
    </SafeAreaView>
  );
};

export default HelloThere;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
