import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
	const { isSignedIn, isLoaded } = useAuth();

	if (!isLoaded) {
		return null;
	}

	// If user is already signed in, redirect to home
	if (isSignedIn) {
		return <Redirect href="/(tabs)/" />;
	}

	return <Stack screenOptions={{ headerShown: false }} />;
}
