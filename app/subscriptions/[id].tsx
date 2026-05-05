import { Link, useLocalSearchParams } from "expo-router";
import { styled } from "nativewind";
import React from "react";
import { Text } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const SubscriptionDetails = () => {
	const { id } = useLocalSearchParams<{ id: string }>();

	return (
		<SafeAreaView className="flex-1 bg-background p-5">
			<Text>SubscriptionDetails: {id}</Text>
			<Link href="/">Go Back</Link>
		</SafeAreaView>
	);
};

export default SubscriptionDetails;
