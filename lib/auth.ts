/**
 * Maps Clerk error field names to user-friendly display names
 */
export const errorFieldMap: Record<string, string> = {
	identifier: "Email",
	email_address: "Email",
	password: "Password",
	confirm_password: "Password confirmation",
	code: "Verification code",
};

/**
 * Extracts and formats Clerk API errors into user-friendly messages
 */
export function formatClerkError(error: any): {
	fieldErrors: Record<string, string>;
	generalError: string | null;
} {
	const fieldErrors: Record<string, string> = {};
	let generalError: string | null = null;

	if (error?.errors && Array.isArray(error.errors)) {
		for (const err of error.errors) {
			if (err.meta?.paramName) {
				const fieldName = err.meta.paramName;
				const displayName = errorFieldMap[fieldName] || fieldName;
				fieldErrors[fieldName] =
					err.message || `Invalid ${displayName.toLowerCase()}`;
			} else {
				// General error if no specific field
				generalError = err.message || "An error occurred. Please try again.";
			}
		}
	}

	// Common Clerk error messages to user-friendly text
	if (!generalError && error?.message) {
		const msg = error.message.toLowerCase();
		if (msg.includes("invalid email")) {
			fieldErrors.identifier = "Please enter a valid email address";
		} else if (msg.includes("password")) {
			fieldErrors.password = "Password does not meet requirements";
		} else if (msg.includes("already") && msg.includes("use")) {
			fieldErrors.identifier = "This email is already registered";
		} else if (msg.includes("not found")) {
			fieldErrors.identifier = "Email not found";
		} else {
			generalError = error.message;
		}
	}

	return { fieldErrors, generalError };
}

/**
 * Validates email format client-side
 */
export function validateEmail(email: string): string | null {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!email) return "Email is required";
	if (!emailRegex.test(email)) return "Please enter a valid email address";
	return null;
}

/**
 * Validates password client-side
 */
export function validatePassword(password: string): string | null {
	if (!password) return "Password is required";
	if (password.length < 8) return "Password must be at least 8 characters";
	return null;
}

/**
 * Validates verification code format
 */
export function validateCode(code: string): string | null {
	if (!code) return "Verification code is required";
	if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) return "Code must be 6 digits";
	return null;
}
