import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { calculatePasswordStrength, PasswordStrength } from '@/lib/validation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export default function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const { t } = useTranslation();
  
  const strengthData = useMemo(() => calculatePasswordStrength(password), [password]);
  
  if (!password) {
    return null;
  }
  
  const getStrengthColor = (strength: PasswordStrength) => {
    switch (strength) {
      case 'strong':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'weak':
        return 'bg-red-500';
    }
  };
  
  const getStrengthText = (strength: PasswordStrength) => {
    switch (strength) {
      case 'strong':
        return t('auth.passwordStrength.strong');
      case 'medium':
        return t('auth.passwordStrength.medium');
      case 'weak':
        return t('auth.passwordStrength.weak');
    }
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t('auth.passwordStrength.label')}</span>
        <span className={cn(
          'text-xs font-medium',
          strengthData.strength === 'strong' && 'text-green-600',
          strengthData.strength === 'medium' && 'text-yellow-600',
          strengthData.strength === 'weak' && 'text-red-600'
        )}>
          {getStrengthText(strengthData.strength)}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', getStrengthColor(strengthData.strength))}
          style={{ width: `${strengthData.score}%` }}
        />
      </div>
      
      {/* Requirements checklist */}
      <div className="space-y-1 text-xs">
        <div className={cn('flex items-center gap-2', strengthData.requirements.minLength ? 'text-green-600' : 'text-muted-foreground')}>
          {strengthData.requirements.minLength ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          <span>{t('auth.passwordStrength.requirements.minLength')}</span>
        </div>
        <div className={cn('flex items-center gap-2', strengthData.requirements.hasUpperCase ? 'text-green-600' : 'text-muted-foreground')}>
          {strengthData.requirements.hasUpperCase ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          <span>{t('auth.passwordStrength.requirements.hasUpperCase')}</span>
        </div>
        <div className={cn('flex items-center gap-2', strengthData.requirements.hasLowerCase ? 'text-green-600' : 'text-muted-foreground')}>
          {strengthData.requirements.hasLowerCase ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          <span>{t('auth.passwordStrength.requirements.hasLowerCase')}</span>
        </div>
        <div className={cn('flex items-center gap-2', strengthData.requirements.hasNumber ? 'text-green-600' : 'text-muted-foreground')}>
          {strengthData.requirements.hasNumber ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          <span>{t('auth.passwordStrength.requirements.hasNumber')}</span>
        </div>
        <div className={cn('flex items-center gap-2', strengthData.requirements.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground')}>
          {strengthData.requirements.hasSpecialChar ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          <span>{t('auth.passwordStrength.requirements.hasSpecialChar')}</span>
        </div>
      </div>
    </div>
  );
}







