import "@/global.css";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
	throw new Error("Add your Clerk Publishable Key to the .env file");
}

// Root layout component that handles auth routing
function RootLayoutNav() {
	const { isSignedIn, isLoaded } = useAuth();
	const router = useRouter();
	const segments = useSegments();

	// When auth state loads, route user appropriately
	useEffect(() => {
		if (!isLoaded) return;

		const isAuthGroup = segments[0] === "(auth)";

		if (isSignedIn && isAuthGroup) {
			// User is signed in but on auth screen → redirect to home
			router.replace("/(tabs)/" as never);
		} else if (!isSignedIn && !isAuthGroup) {
			// User is signed out but not on auth screen → redirect to sign-in
			router.replace("/(auth)/sign-in" as never);
		}
	}, [isSignedIn, isLoaded, segments]);

	return <Stack screenOptions={{ headerShown: false }} />;
}

export default function App() {
	const [fontsLoaded] = useFonts({
		"sans-bold": require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
		"sans-extrabold": require("@/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
		"sans-light": require("@/assets/fonts/PlusJakartaSans-Light.ttf"),
		"sans-medium": require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
		"sans-regular": require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
		"sans-semibold": require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) return null;

	return (
		<ClerkProvider
			publishableKey={publishableKey}
			tokenCache={tokenCache}
		>
			<RootLayoutNav />
		</ClerkProvider>
	);
}
