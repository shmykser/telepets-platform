import { useState } from 'react';
import { useAllPets, usePet } from '@/hooks/usePet';
import PetCarouselEnhanced from '@/components/PetCarouselEnhanced';
import QuickStatsEnhanced from '@/components/QuickStatsEnhanced';
import CreatePetFormEnhanced from '@/components/CreatePetFormEnhanced';
import WelcomeEnhanced from '@/components/WelcomeEnhanced';
import AllDeadEnhanced from '@/components/AllDeadEnhanced';
import type { Pet } from '@/types';
import { buildUrl } from '@/config/endpoints';
import { getStoredUserId } from '@/utils';

export default function Home() {
  const { pets, wallet, totalPets, alivePets, deadPets, isLoading } = useAllPets();
  const { createPet, healthUp, healthUpWithCost, isCreating } = usePet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [petName, setPetName] = useState('');

  const handleCreatePet = () => {
    if (!petName.trim()) return;
    createPet({ name: petName.trim(), override: false });
    setPetName('');
    setShowCreateForm(false);
  };

  const handleHealthUp = (pet: Pet) => {
    healthUp(pet.name);
  };

  const handleHealthUpWithCost = (pet: Pet) => {
    healthUpWithCost(pet.name);
  };

  const handlePlay = (pet: Pet) => {
    console.log('Play with pet:', pet.name);
  };

  const transformedPets: Pet[] = pets.map(pet => ({
    ...pet,
    image_url: pet.image_url || (pet.name && pet.user_id 
      ? buildUrl.petImage(pet.user_id, pet.name) 
      : undefined)
  }));

  const hasPets = totalPets > 0;
  const allDead = hasPets && alivePets === 0;
  const noPets = !hasPets;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a] px-4 sm:px-6 overflow-x-hidden" style={{ paddingTop: '1rem', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', minHeight: '100vh', maxWidth: '100vw' }}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 w-full overflow-x-hidden">
        {/* Stats and Create Button Row */}
        {(hasPets || !showCreateForm) && (
          <div className="flex flex-row gap-2 sm:gap-4">
            {/* Stats - занимает половину ширины на мобильных и десктопе */}
            <div className="w-1/2">
              <QuickStatsEnhanced
                stats={{
                  totalPets,
                  alivePets,
                  deadPets,
                  coins: wallet?.coins ?? 0
                }}
                columns={4}
              />
            </div>
            
            {/* Create Button - занимает половину ширины, только если есть питомцы */}
            {hasPets && !showCreateForm && !allDead && (
              <div className="w-1/2 flex items-center">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full h-full min-h-[120px] sm:min-h-[140px] px-2 sm:px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xs sm:text-base font-semibold hover:opacity-90 transition-opacity flex items-center justify-center shadow-lg hover:shadow-xl"
                >
                  <span className="text-center">Создать питомца</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Welcome or All Dead */}
        {noPets && !showCreateForm && (
          <WelcomeEnhanced onCreateClick={() => setShowCreateForm(true)} />
        )}

        {allDead && !showCreateForm && (
          <AllDeadEnhanced
            totals={{ total_pets: totalPets, dead_pets: deadPets }}
            onCreateClick={() => setShowCreateForm(true)}
          />
        )}

        {/* Create Pet Form */}
        {showCreateForm && (
          <div className="max-w-md mx-auto">
            <CreatePetFormEnhanced
              petName={petName}
              setPetName={setPetName}
              onCreate={handleCreatePet}
              onCancel={() => {
                setShowCreateForm(false);
                setPetName('');
              }}
              isCreating={isCreating}
              canCreateFree={totalPets === 0}
              walletCoins={wallet?.coins}
              paidCost={100}
            />
          </div>
        )}

        {/* Pet Carousel */}
        {hasPets && !showCreateForm && (
          <div className="flex justify-center">
            <PetCarouselEnhanced
              pets={transformedPets}
              onPetSelect={(pet) => console.log('Selected:', pet.name)}
              onHealthUp={handleHealthUp}
              onHealthUpWithCost={handleHealthUpWithCost}
              onPlay={handlePlay}
              autoplay={false}
              pauseOnHover={true}
              showIndicators={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

