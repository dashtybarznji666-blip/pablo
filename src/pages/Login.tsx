import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Package, Eye, EyeOff, User, Phone, Lock, CheckCircle2, XCircle, Info } from 'lucide-react';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import {
  validatePhoneNumber,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
  validateRegistrationPassword,
} from '@/lib/validation';
import { cn } from '@/lib/utils';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [isLoading, setIsLoading] = useState(false);

  // Sign In form state
  const [signInPhoneNumber, setSignInPhoneNumber] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered phone number on mount
  useEffect(() => {
    const rememberedPhoneNumber = localStorage.getItem('rememberedPhoneNumber');
    if (rememberedPhoneNumber) {
      setSignInPhoneNumber(rememberedPhoneNumber);
      setRememberMe(true);
    }
  }, []);

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerPhoneNumber, setRegisterPhoneNumber] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationPassword, setRegistrationPassword] = useState('');
  
  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRegistrationPassword, setShowRegistrationPassword] = useState(false);
  
  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [registrationPasswordError, setRegistrationPasswordError] = useState<string | null>(null);
  
  // Form validation state
  const [isFormValid, setIsFormValid] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Refs for auto-focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const registrationTabContentRef = useRef<HTMLDivElement>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInPhoneNumber || !signInPassword) {
      toast({
        title: t('auth.error'),
        description: t('auth.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(signInPhoneNumber, signInPassword);
      if (success) {
        // Save phone number if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedPhoneNumber', signInPhoneNumber);
        } else {
          localStorage.removeItem('rememberedPhoneNumber');
        }
        toast({
          title: t('auth.success'),
          description: t('auth.loginSuccess'),
        });
        navigate('/');
      } else {
        toast({
          title: t('auth.error'),
          description: t('auth.invalidCredentials'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('auth.error'),
        description: t('auth.loginFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get translation key from validation error
  const getValidationErrorKey = (error: string | undefined): string | null => {
    if (!error) return null;
    const errorLower = error.toLowerCase();
    if (errorLower.includes('phone') && errorLower.includes('required')) return 'auth.validation.phonenumberisrequired';
    if (errorLower.includes('phone') && (errorLower.includes('format') || errorLower.includes('digits'))) return 'auth.validation.invalidphonenumberformat';
    if (errorLower.includes('name') && errorLower.includes('required')) return 'auth.validation.nameisrequired';
    if (errorLower.includes('name') && errorLower.includes('at least 2')) return 'auth.validation.namemustbeatleast2characters';
    if (errorLower.includes('name') && errorLower.includes('less than 100')) return 'auth.validation.namemustbelessthan100characters';
    if (errorLower.includes('name') && errorLower.includes('only contain')) return 'auth.validation.namecanonlycontainletters,spaces,andhyphens';
    if (errorLower.includes('password') && errorLower.includes('required') && !errorLower.includes('registration')) return 'auth.validation.passwordisrequired';
    if (errorLower.includes('password') && errorLower.includes('at least 6')) return 'auth.validation.passwordmustbeatleast6characters';
    if (errorLower.includes('confirm')) return 'auth.validation.pleaseconfirmyourpassword';
    if (errorLower.includes('do not match')) return 'auth.validation.passwordsdonotmatch';
    if (errorLower.includes('registration password') && errorLower.includes('required')) return 'auth.validation.registrationpasswordisrequired';
    if (errorLower.includes('registration password') || errorLower.includes('invalid registration')) return 'auth.validation.invalidregistrationpassword';
    return null;
  };
  
  // Real-time validation handlers
  const handleNameChange = (value: string) => {
    setRegisterName(value);
    const validation = validateName(value);
    const errorKey = getValidationErrorKey(validation.error);
    setNameError(validation.isValid ? null : (errorKey ? t(errorKey) : validation.error) || null);
  };
  
  const handlePhoneNumberChange = (value: string) => {
    setRegisterPhoneNumber(value);
    const validation = validatePhoneNumber(value);
    const errorKey = getValidationErrorKey(validation.error);
    setPhoneNumberError(validation.isValid ? null : (errorKey ? t(errorKey) : validation.error) || null);
  };
  
  const handlePasswordChange = (value: string) => {
    setRegisterPassword(value);
    const validation = validatePassword(value);
    const errorKey = getValidationErrorKey(validation.error);
    setPasswordError(validation.isValid ? null : (errorKey ? t(errorKey) : validation.error) || null);
    
    // Also validate confirm password if it has a value
    if (confirmPassword) {
      const confirmValidation = validatePasswordConfirmation(value, confirmPassword);
      const confirmErrorKey = getValidationErrorKey(confirmValidation.error);
      setConfirmPasswordError(confirmValidation.isValid ? null : (confirmErrorKey ? t(confirmErrorKey) : confirmValidation.error) || null);
    }
  };
  
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    const validation = validatePasswordConfirmation(registerPassword, value);
    const errorKey = getValidationErrorKey(validation.error);
    setConfirmPasswordError(validation.isValid ? null : (errorKey ? t(errorKey) : validation.error) || null);
  };
  
  const handleRegistrationPasswordChange = (value: string) => {
    setRegistrationPassword(value);
    const validation = validateRegistrationPassword(value);
    const errorKey = getValidationErrorKey(validation.error);
    setRegistrationPasswordError(validation.isValid ? null : (errorKey ? t(errorKey) : validation.error) || null);
  };
  
  // Validate entire form
  useEffect(() => {
    const nameValid = validateName(registerName).isValid;
    const phoneNumberValid = validatePhoneNumber(registerPhoneNumber).isValid;
    const passwordValid = validatePassword(registerPassword).isValid;
    const confirmValid = validatePasswordConfirmation(registerPassword, confirmPassword).isValid;
    const regPasswordValid = validateRegistrationPassword(registrationPassword).isValid;
    
    setIsFormValid(nameValid && phoneNumberValid && passwordValid && confirmValid && regPasswordValid);
  }, [registerName, registerPhoneNumber, registerPassword, confirmPassword, registrationPassword]);
  
  // Auto-focus name field when registration tab opens
  useEffect(() => {
    if (activeTab === 'register' && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [activeTab]);
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const nameValidation = validateName(registerName);
    const phoneNumberValidation = validatePhoneNumber(registerPhoneNumber);
    const passwordValidation = validatePassword(registerPassword);
    const confirmValidation = validatePasswordConfirmation(registerPassword, confirmPassword);
    const regPasswordValidation = validateRegistrationPassword(registrationPassword);
    
    const nameErrorKey = getValidationErrorKey(nameValidation.error);
    const phoneNumberErrorKey = getValidationErrorKey(phoneNumberValidation.error);
    const passwordErrorKey = getValidationErrorKey(passwordValidation.error);
    const confirmErrorKey = getValidationErrorKey(confirmValidation.error);
    const regPasswordErrorKey = getValidationErrorKey(regPasswordValidation.error);
    
    setNameError(nameValidation.isValid ? null : (nameErrorKey ? t(nameErrorKey) : nameValidation.error) || null);
    setPhoneNumberError(phoneNumberValidation.isValid ? null : (phoneNumberErrorKey ? t(phoneNumberErrorKey) : phoneNumberValidation.error) || null);
    setPasswordError(passwordValidation.isValid ? null : (passwordErrorKey ? t(passwordErrorKey) : passwordValidation.error) || null);
    setConfirmPasswordError(confirmValidation.isValid ? null : (confirmErrorKey ? t(confirmErrorKey) : confirmValidation.error) || null);
    setRegistrationPasswordError(regPasswordValidation.isValid ? null : (regPasswordErrorKey ? t(regPasswordErrorKey) : regPasswordValidation.error) || null);
    
    if (!isFormValid) {
      toast({
        title: t('auth.error'),
        description: t('auth.validation.pleaseFixErrors'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await register(registerName, registerPhoneNumber, registerPassword, registrationPassword);
      if (success) {
        setShowSuccess(true);
        toast({
          title: t('auth.success'),
          description: t('auth.registerSuccess'),
        });
        
        // Clear form
        setRegisterName('');
        setRegisterPhoneNumber('');
        setRegisterPassword('');
        setConfirmPassword('');
        setRegistrationPassword('');
        setNameError(null);
        setPhoneNumberError(null);
        setPasswordError(null);
        setConfirmPasswordError(null);
        setRegistrationPasswordError(null);
        
        // Redirect after brief delay to show success
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setPhoneNumberError(t('auth.phoneNumberAlreadyExists'));
        toast({
          title: t('auth.error'),
          description: t('auth.phoneNumberAlreadyExists'),
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || t('auth.registerFailed');
      if (errorMessage.includes('phone') || errorMessage.includes('Phone')) {
        setPhoneNumberError(errorMessage);
      } else if (errorMessage.includes('registration password') || errorMessage.includes('Registration')) {
        setRegistrationPasswordError(errorMessage);
      } else {
        toast({
          title: t('auth.error'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">{t('auth.loading')}</div>
      </div>
    );
  }

  // Don't render if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Package className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('auth.welcome')}</CardTitle>
          <CardDescription>{t('auth.welcomeDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                {t('auth.signIn')}
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t('auth.register')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-phone">{t('auth.phoneNumber')}</Label>
                  <Input
                    id="signin-phone"
                    type="tel"
                    placeholder={t('auth.phoneNumberPlaceholder')}
                    value={signInPhoneNumber}
                    onChange={(e) => setSignInPhoneNumber(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('auth.password')}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm font-normal cursor-pointer"
                  >
                    {t('auth.rememberMe')}
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('auth.loading') : t('auth.signIn')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-6" ref={registrationTabContentRef}>
              {showSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">{t('auth.registerSuccess')}</h3>
                    <p className="text-sm text-muted-foreground">{t('auth.redirecting')}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4" noValidate>
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t('auth.name')}
                    </Label>
                    <div className="relative">
                      <Input
                        ref={nameInputRef}
                        id="register-name"
                        type="text"
                        placeholder={t('auth.namePlaceholder')}
                        value={registerName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        onBlur={() => handleNameChange(registerName)}
                        required
                        disabled={isLoading}
                        autoComplete="name"
                        aria-invalid={nameError ? 'true' : 'false'}
                        aria-describedby={nameError ? 'name-error' : undefined}
                        className={cn(
                          nameError && 'border-destructive focus-visible:ring-destructive',
                          !nameError && registerName && 'border-green-500'
                        )}
                      />
                      {!nameError && registerName && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {nameError && (
                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {nameError && (
                      <p id="name-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                        <XCircle className="h-3 w-3" />
                        {nameError}
                      </p>
                    )}
                  </div>

                  {/* Phone Number Field */}
                  <div className="space-y-2">
                    <Label htmlFor="register-phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {t('auth.phoneNumber')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder={t('auth.phoneNumberPlaceholder')}
                        value={registerPhoneNumber}
                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                        onBlur={() => handlePhoneNumberChange(registerPhoneNumber)}
                        required
                        disabled={isLoading}
                        autoComplete="tel"
                        aria-invalid={phoneNumberError ? 'true' : 'false'}
                        aria-describedby={phoneNumberError ? 'phone-error' : undefined}
                        className={cn(
                          phoneNumberError && 'border-destructive focus-visible:ring-destructive',
                          !phoneNumberError && registerPhoneNumber && 'border-green-500'
                        )}
                      />
                      {!phoneNumberError && registerPhoneNumber && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {phoneNumberError && (
                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {phoneNumberError && (
                      <p id="phone-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                        <XCircle className="h-3 w-3" />
                        {phoneNumberError}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t('auth.password')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth.passwordPlaceholder')}
                        value={registerPassword}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        onBlur={() => handlePasswordChange(registerPassword)}
                        required
                        disabled={isLoading}
                        autoComplete="new-password"
                        aria-invalid={passwordError ? 'true' : 'false'}
                        aria-describedby={passwordError ? 'password-error' : undefined}
                        className={cn(
                          'pr-10',
                          passwordError && 'border-destructive focus-visible:ring-destructive',
                          !passwordError && registerPassword && 'border-green-500'
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      {!passwordError && registerPassword && (
                        <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {passwordError && (
                        <XCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {passwordError && (
                      <p id="password-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                        <XCircle className="h-3 w-3" />
                        {passwordError}
                      </p>
                    )}
                    {registerPassword && (
                      <PasswordStrengthIndicator password={registerPassword} />
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t('auth.confirmPassword')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t('auth.confirmPasswordPlaceholder')}
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        onBlur={() => handleConfirmPasswordChange(confirmPassword)}
                        required
                        disabled={isLoading}
                        autoComplete="new-password"
                        aria-invalid={confirmPasswordError ? 'true' : 'false'}
                        aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
                        className={cn(
                          'pr-10',
                          confirmPasswordError && 'border-destructive focus-visible:ring-destructive',
                          !confirmPasswordError && confirmPassword && registerPassword === confirmPassword && 'border-green-500'
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                        aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      {!confirmPasswordError && confirmPassword && registerPassword === confirmPassword && (
                        <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {confirmPasswordError && (
                        <XCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {confirmPasswordError && (
                      <p id="confirm-password-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                        <XCircle className="h-3 w-3" />
                        {confirmPasswordError}
                      </p>
                    )}
                    {!confirmPasswordError && confirmPassword && registerPassword === confirmPassword && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('auth.passwordsMatch')}
                      </p>
                    )}
                  </div>

                  {/* Registration Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="registration-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t('auth.registrationPassword')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="registration-password"
                        type={showRegistrationPassword ? 'text' : 'password'}
                        placeholder={t('auth.registrationPasswordPlaceholder')}
                        value={registrationPassword}
                        onChange={(e) => handleRegistrationPasswordChange(e.target.value)}
                        onBlur={() => handleRegistrationPasswordChange(registrationPassword)}
                        required
                        disabled={isLoading}
                        autoComplete="off"
                        aria-invalid={registrationPasswordError ? 'true' : 'false'}
                        aria-describedby={registrationPasswordError ? 'registration-password-error' : 'registration-password-help'}
                        className={cn(
                          'pr-10',
                          registrationPasswordError && 'border-destructive focus-visible:ring-destructive',
                          !registrationPasswordError && registrationPassword && 'border-green-500'
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowRegistrationPassword(!showRegistrationPassword)}
                        disabled={isLoading}
                        aria-label={showRegistrationPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      >
                        {showRegistrationPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      {!registrationPasswordError && registrationPassword && (
                        <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {registrationPasswordError && (
                        <XCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <p id="registration-password-help" className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {t('auth.registrationPasswordHint')}
                    </p>
                    {registrationPasswordError && (
                      <p id="registration-password-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                        <XCircle className="h-3 w-3" />
                        {registrationPasswordError}
                      </p>
                    )}
                    {!registrationPasswordError && registrationPassword && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('auth.registrationPasswordCorrect')}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !isFormValid}>
                    {isLoading ? t('auth.loading') : t('auth.register')}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
