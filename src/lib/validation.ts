/**
 * Validation utilities for form fields
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate phone number format (local format: starts with 0, followed by 9-10 digits)
 */
export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  if (!phoneNumber) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  const phoneRegex = /^0\d{9,10}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return { isValid: false, error: 'Phone number must start with 0 and be followed by 9-10 digits (e.g., 07501234567)' };
  }
  
  return { isValid: true };
}

/**
 * Validate name (min 2 chars, max 100, no special characters except spaces and hyphens)
 */
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (name.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }
  
  const nameRegex = /^[a-zA-Z\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF-]+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, and hyphens' };
  }
  
  return { isValid: true };
}

/**
 * Validate password
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }
  
  return { isValid: true };
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirmation(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true };
}

/**
 * Validate registration password
 */
export function validateRegistrationPassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Registration password is required' };
  }
  
  const REQUIRED_PASSWORD = 'DASHTYfalak2025@';
  if (password !== REQUIRED_PASSWORD) {
    return { isValid: false, error: 'Invalid registration password' };
  }
  
  return { isValid: true };
}

/**
 * Calculate password strength
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-100
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const requirements = {
    minLength: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  const totalRequirements = Object.keys(requirements).length;
  const score = Math.round((metRequirements / totalRequirements) * 100);
  
  let strength: PasswordStrength = 'weak';
  if (score >= 80) {
    strength = 'strong';
  } else if (score >= 50) {
    strength = 'medium';
  }
  
  return {
    strength,
    score,
    requirements,
  };
}







