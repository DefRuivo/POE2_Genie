import PantrySection from '@/components/PantrySection';
import PantryItemCard from '@/components/PantryItemCard';
import PantryEditDialog from '@/components/PantryEditDialog';
import StashSection from '@/components/StashSection';
import StashItemCard from '@/components/StashItemCard';
import StashItemEditDialog from '@/components/StashItemEditDialog';

describe('pantry wrapper exports', () => {
  it('maps pantry wrappers to stash components', () => {
    expect(PantrySection).toBe(StashSection);
    expect(PantryItemCard).toBe(StashItemCard);
    expect(PantryEditDialog).toBe(StashItemEditDialog);
  });
});
