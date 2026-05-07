import {
	formatClerkError,
	validateCode,
	validateEmail,
	validatePassword,
} from "@/lib/auth";
import { useSignUp } from "@clerk/expo";
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

export default function SignUp() {
	const { signUp } = useSignUp();
	const router = useRouter();

	// Sign-up creation step
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [generalError, setGeneralError] = useState<string | null>(null);

	// Verification step
	const [verificationCode, setVerificationCode] = useState("");
	const [verificationLoading, setVerificationLoading] = useState(false);
	const [verificationError, setVerificationError] = useState<string | null>(
		null,
	);
	const [resendLoading, setResendLoading] = useState(false);

	const handleCreateAccount = async () => {
		// Clear previous errors
		setErrors({});
		setGeneralError(null);

		// Validate inputs
		const emailError = validateEmail(email);
		const passwordError = validatePassword(password);

		if (emailError || passwordError) {
			const newErrors: Record<string, string> = {};
			if (emailError) newErrors.email_address = emailError;
			if (passwordError) newErrors.password = passwordError;
			setErrors(newErrors);
			return;
		}

		setLoading(true);

		try {
			// Create account with email/password
			const signUpAttempt = await signUp.create({
				emailAddress: email,
				password,
			});

			// Send verification email
			if (
				signUpAttempt.status === "missing_requirements" &&
				signUpAttempt.unverifiedFields.includes("email_address")
			) {
				await signUp.verifications.sendEmailCode();
			}
		} catch (err: any) {
			const { fieldErrors, generalError: apiError } = formatClerkError(err);
			if (Object.keys(fieldErrors).length > 0) {
				setErrors(fieldErrors);
			} else if (apiError) {
				setGeneralError(apiError);
			} else {
				setGeneralError("Failed to create account. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyEmail = async () => {
		setVerificationError(null);

		// Validate code
		const codeError = validateCode(verificationCode);
		if (codeError) {
			setVerificationError(codeError);
			return;
		}

		setVerificationLoading(true);

		try {
			// Verify email code
			const verifyAttempt = await signUp.verifications.verifyEmailCode({
				code: verificationCode,
			});

			if (verifyAttempt.status === "complete") {
				// Email verified, finalize sign-up
				await signUp.finalize({
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
				console.error("Unexpected verification status:", verifyAttempt.status);
				setVerificationError("Verification failed. Please try again.");
			}
		} catch (err: any) {
			const { fieldErrors, generalError: apiError } = formatClerkError(err);
			if (fieldErrors.code) {
				setVerificationError(fieldErrors.code);
			} else if (apiError) {
				setVerificationError(apiError);
			} else {
				setVerificationError("Invalid verification code. Please try again.");
			}
		} finally {
			setVerificationLoading(false);
		}
	};

	const handleResendCode = async () => {
		setVerificationError(null);
		setResendLoading(true);

		try {
			await signUp.verifications.sendEmailCode();
		} catch (err: any) {
			const { generalError } = formatClerkError(err);
			setVerificationError(
				generalError || "Failed to resend code. Please try again.",
			);
		} finally {
			setResendLoading(false);
		}
	};

	// Show verification step if email is pending verification
	if (
		signUp?.status === "missing_requirements" &&
		signUp.unverifiedFields.includes("email_address") &&
		signUp.missingFields.length === 0
	) {
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
							<Text className="auth-title">Verify your email</Text>
							<Text className="auth-subtitle">
								We sent a code to {email}. Enter it below to confirm your
								account.
							</Text>

							{/* Verification Error */}
							{verificationError && (
								<Text
									className="auth-error"
									role="alert"
								>
									{verificationError}
								</Text>
							)}

							{/* Form */}
							<View className="auth-form">
								{/* Code Field */}
								<View className="auth-field">
									<Text className="auth-label">Verification code</Text>
									<TextInput
										className="auth-input"
										placeholder="000000"
										placeholderTextColor="rgba(0, 0, 0, 0.4)"
										value={verificationCode}
										onChangeText={setVerificationCode}
										keyboardType="number-pad"
										maxLength={6}
										editable={!verificationLoading && !resendLoading}
										accessibilityLabel="Verification code input"
									/>
								</View>

								{/* Verify Button */}
								<Pressable
									className={`auth-button ${verificationLoading ? "auth-button-disabled" : ""}`}
									onPress={handleVerifyEmail}
									disabled={
										verificationLoading || verificationCode.length !== 6
									}
									accessibilityRole="button"
									accessibilityLabel="Verify button"
								>
									{verificationLoading ? (
										<ActivityIndicator
											size="small"
											color="#081126"
										/>
									) : (
										<Text className="auth-button-text">Verify</Text>
									)}
								</Pressable>

								{/* Resend Button */}
								<Pressable
									className="auth-secondary-button"
									onPress={handleResendCode}
									disabled={resendLoading}
									accessibilityRole="button"
									accessibilityLabel="Resend code button"
								>
									{resendLoading ? (
										<ActivityIndicator
											size="small"
											color="#ea7a53"
										/>
									) : (
										<Text className="auth-secondary-button-text">
											Didn't get a code? Resend
										</Text>
									)}
								</Pressable>
							</View>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}

	// Show initial sign-up form
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
						<Text className="auth-title">Create your account</Text>
						<Text className="auth-subtitle">
							Start managing your subscriptions with Recurrly
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
									className={`auth-input ${errors.email_address ? "auth-input-error" : ""}`}
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
								{errors.email_address && (
									<Text className="auth-error">{errors.email_address}</Text>
								)}
							</View>

							{/* Password Field */}
							<View className="auth-field">
								<Text className="auth-label">Password</Text>
								<TextInput
									className={`auth-input ${errors.password ? "auth-input-error" : ""}`}
									placeholder="At least 8 characters"
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
								<Text className="auth-helper">
									Use uppercase, lowercase, and numbers for security
								</Text>
							</View>

							{/* Create Account Button */}
							<Pressable
								className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
								onPress={handleCreateAccount}
								disabled={loading || !email || !password}
								accessibilityRole="button"
								accessibilityLabel="Create account button"
							>
								{loading ? (
									<ActivityIndicator
										size="small"
										color="#081126"
									/>
								) : (
									<Text className="auth-button-text">Create account</Text>
								)}
							</Pressable>
						</View>

						{/* Sign In Link */}
						<View className="auth-link-row">
							<Text className="text-sm font-sans-medium text-muted-foreground">
								Already have an account?
							</Text>
							<Link
								href="/(auth)/sign-in"
								asChild
							>
								<Pressable>
									<Text className="text-sm font-sans-semibold text-accent">
										Sign in
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
