import React from 'react';
import Input from './Input';
import Button from './Button';
import { Sparkles } from 'lucide-react';

export interface CreatePetFormEnhancedProps {
  petName: string;
  setPetName: (name: string) => void;
  onCreate: (override?: boolean) => void;
  onCancel: () => void;
  isCreating?: boolean;
  canCreateFree?: boolean;
  walletCoins?: number;
  paidCost?: number;
}

// Функция валидации имени на латинские буквы
const isLatinOnly = (text: string): boolean => {
  if (!text.trim()) return false;
  // Разрешаем только латинские буквы (A-Z, a-z) и пробелы
  return /^[A-Za-z\s]+$/.test(text.trim());
};

export default function CreatePetFormEnhanced({
  petName,
  setPetName,
  onCreate,
  onCancel,
  isCreating = false,
  canCreateFree = false,
  walletCoins,
  paidCost = 0
}: CreatePetFormEnhancedProps) {
  const hasName = Boolean(petName.trim());
  const isValidLatin = isLatinOnly(petName);
  const requiredCost = canCreateFree ? 0 : (paidCost || 0);
  const canAfford = requiredCost === 0 ? true : (typeof walletCoins === 'number' ? walletCoins >= requiredCost : false);
  
  // Определяем ошибки валидации
  const hasNameError = hasName && !isValidLatin;
  const hasFundsError = hasName && isValidLatin && !canAfford;
  
  // Success только когда имя валидное И достаточно средств
  const isValid = hasName && isValidLatin && canAfford;
  
  // Кнопка disabled если имя пустое, невалидное или недостаточно средств
  const disabled = !hasName || !isValidLatin || !canAfford;

  const showFree = isValid && requiredCost === 0;
  const showPaid = isValid && requiredCost > 0;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-black text-white">Создать нового питомца</h3>
      </div>
      
      <Input
        value={petName}
        onChange={(e) => setPetName(e.target.value)}
        placeholder="Введите имя питомца (только латинские буквы)"
        onKeyPress={(e) => e.key === 'Enter' && !disabled && onCreate()}
        label="Имя питомца"
        helperText={!hasName ? "Можно использовать только латинские буквы (A-Z, a-z)" : undefined}
        success={isValid}
        error={
          hasNameError
            ? "Имя должно содержать только латинские буквы (A-Z, a-z)"
            : hasFundsError
            ? `Недостаточно монет (нужно ${requiredCost})`
            : undefined
        }
      />

      {requiredCost > 0 && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Стоимость создания</span>
            <span className="text-lg font-bold text-white">{requiredCost} монет</span>
          </div>
          {typeof walletCoins === 'number' && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-400">Ваш баланс</span>
              <span className={`text-sm font-semibold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                {walletCoins} монет
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => onCreate()}
          disabled={disabled}
          loading={isCreating}
          className="flex-1 flex-col py-4"
          icon={<Sparkles className="w-5 h-5" />}
        >
          <span className="text-base font-bold">Создать</span>
          <span className="text-xs text-white/80 mt-0.5">
            {showFree && 'Бесплатно'}
            {showPaid && `${requiredCost} монет`}
            {hasName && requiredCost > 0 && !canAfford && `${requiredCost} монет`}
          </span>
        </Button>
        
        <Button
          onClick={onCancel}
          variant="secondary"
          className="flex-1"
        >
          Отмена
        </Button>
      </div>
    </div>
  );
}

