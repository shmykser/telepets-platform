import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FormCard from './FormCard';
import InputVariant1 from './InputVariant1';
import ButtonVariant1 from './ButtonVariant1';
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
  const requiredCost = canCreateFree ? 0 : (paidCost || 0);
  const canAfford = requiredCost === 0 ? true : (typeof walletCoins === 'number' ? walletCoins >= requiredCost : false);
  const disabled = !(hasName && canAfford);

  const showFree = hasName && requiredCost === 0;
  const showPaid = hasName && requiredCost > 0 && canAfford;

  return (
    <FormCard
      title="Создать нового питомца"
      description="Введите имя для вашего нового питомца"
      variant="glass"
    >
      <div className="space-y-6">
        <InputVariant1
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Введите имя питомца (только латинские буквы)"
          onKeyPress={(e) => e.key === 'Enter' && !disabled && onCreate()}
          label="Имя питомца"
          helperText="Можно использовать только латинские буквы (A-Z, a-z)"
          success={hasName && canAfford}
          error={hasName && !canAfford ? `Недостаточно монет (нужно ${requiredCost})` : undefined}
        />

        {/* Cost info */}
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

        {/* Action buttons */}
        <div className="flex gap-3">
          <ButtonVariant1
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
          </ButtonVariant1>
          
          <ButtonVariant1
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
          >
            Отмена
          </ButtonVariant1>
        </div>
      </div>
    </FormCard>
  );
}
