import { formatClerkError, validateEmail, validatePassword } from "@/lib/auth";
import { useSignIn } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import React, { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function SignIn() {
	const { signIn } = useSignIn();
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [generalError, setGeneralError] = useState<string | null>(null);

	const handleSignIn = async () => {
		// Clear previous errors
		setErrors({});
		setGeneralError(null);

		// Validate inputs
		const emailError = validateEmail(email);
		const passwordError = validatePassword(password);

		if (emailError || passwordError) {
			const newErrors: Record<string, string> = {};
			if (emailError) newErrors.identifier = emailError;
			if (passwordError) newErrors.password = passwordError;
			setErrors(newErrors);
			return;
		}

		setLoading(true);

		try {
			const signInAttempt = await signIn.create({
				identifier: email,
				password,
			});

			if (signInAttempt.status === "complete") {
				// Successfully signed in
				await signInAttempt.finalize({
					navigate: ({ session, decorateUrl }) => {
						// Handle any session tasks
						if (session?.currentTask) {
							console.log("Session task:", session.currentTask);
							return;
						}

						// Navigate to home
						const url = decorateUrl("/(tabs)/");
						if (url.startsWith("http")) {
							window.location.href = url;
						} else {
							router.push(url as Href);
						}
					},
				});
			} else {
				console.error("Unexpected sign-in status:", signInAttempt.status);
				setGeneralError("Sign-in failed. Please try again.");
			}
		} catch (err: any) {
			const { fieldErrors, generalError: apiError } = formatClerkError(err);
			if (Object.keys(fieldErrors).length > 0) {
				setErrors(fieldErrors);
			} else if (apiError) {
				setGeneralError(apiError);
			} else {
				setGeneralError(
					"Sign-in failed. Please check your email and password.",
				);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView className="auth-safe-area">
			<ScrollView
				className="auth-scroll"
				contentContainerStyle={{ flexGrow: 1 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="auth-content">
					{/* Branding */}
					<View className="auth-brand-block">
						<View className="auth-logo-wrap">
							<View className="auth-logo-mark">
								<Text className="auth-logo-mark-text">R</Text>
							</View>
							<View>
								<Text className="auth-wordmark">Recurrly</Text>
								<Text className="auth-wordmark-sub">Smart Billing</Text>
							</View>
						</View>
					</View>

					{/* Content */}
					<View className="auth-card">
						<Text className="auth-title">Welcome back</Text>
						<Text className="auth-subtitle">
							Sign in to continue managing your subscriptions
						</Text>

						{/* General Error */}
						{generalError && (
							<Text
								className="auth-error"
								role="alert"
							>
								{generalError}
							</Text>
						)}

						{/* Form */}
						<View className="auth-form">
							{/* Email Field */}
							<View className="auth-field">
								<Text className="auth-label">Email</Text>
								<TextInput
									className={`auth-input ${errors.identifier ? "auth-input-error" : ""}`}
									placeholder="Enter your email"
									placeholderTextColor="rgba(0, 0, 0, 0.4)"
									value={email}
									onChangeText={setEmail}
									keyboardType="email-address"
									autoCapitalize="none"
									autoCorrect={false}
									editable={!loading}
									accessibilityLabel="Email input"
								/>
								{errors.identifier && (
									<Text className="auth-error">{errors.identifier}</Text>
								)}
							</View>

							{/* Password Field */}
							<View className="auth-field">
								<Text className="auth-label">Password</Text>
								<TextInput
									className={`auth-input ${errors.password ? "auth-input-error" : ""}`}
									placeholder="Enter your password"
									placeholderTextColor="rgba(0, 0, 0, 0.4)"
									value={password}
									onChangeText={setPassword}
									secureTextEntry
									editable={!loading}
									accessibilityLabel="Password input"
								/>
								{errors.password && (
									<Text className="auth-error">{errors.password}</Text>
								)}
							</View>

							{/* Sign In Button */}
							<Pressable
								className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
								onPress={handleSignIn}
								disabled={loading || !email || !password}
								accessibilityRole="button"
								accessibilityLabel="Sign in button"
							>
								{loading ? (
									<ActivityIndicator
										size="small"
										color="#081126"
									/>
								) : (
									<Text className="auth-button-text">Sign in</Text>
								)}
							</Pressable>
						</View>

						{/* Sign Up Link */}
						<View className="auth-link-row">
							<Text className="text-sm font-sans-medium text-muted-foreground">
								New to Recurrly?
							</Text>
							<Link
								href="/(auth)/sign-up"
								asChild
							>
								<Pressable>
									<Text className="text-sm font-sans-semibold text-accent">
										Create an account
									</Text>
								</Pressable>
							</Link>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
