import { fireEvent, render, screen } from '@testing-library/react';

import BuildForm from '@/components/BuildForm';

describe('BuildForm', () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders and submits canonical + legacy payload fields with mapped cost tier', () => {
    render(
      <BuildForm
        title="Edit Build"
        isSubmitting={false}
        onSubmit={onSubmit}
        initialData={{
          recipe_title: 'Storm Brand Build',
          meal_type: 'main',
          difficulty: 'chef',
          prep_time: '30m',
          prep_time_minutes: 30,
          ingredients_from_pantry: [{ name: 'Orb of Alteration', quantity: '2', unit: 'x' }],
          shopping_list: [{ name: 'Tabula Rasa', quantity: '1', unit: 'x' }],
          step_by_step: ['Open passive tree', { step: 2, text: 'Link support gems' } as any],
          match_reasoning: 'Good starter',
          safety_badge: true,
        }}
      />,
    );

    expect(screen.getByDisplayValue('Storm Brand Build')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30m')).toBeInTheDocument();
    expect(screen.getByText(/Orb of Alteration/)).toBeInTheDocument();
    expect(screen.getByText(/Tabula Rasa/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mirror of Kalandra/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save Build/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        build_title: 'Storm Brand Build',
        build_archetype: 'league_starter',
        build_cost_tier: 'mirror_of_kalandra',
        build_complexity: 'mirror_of_kalandra',
        difficulty: 'chef',
        recipe_title: 'Storm Brand Build',
        meal_type: 'league_starter',
        prep_time: '30m',
        prep_time_minutes: 30,
        ingredients_from_pantry: expect.any(Array),
        shopping_list: expect.any(Array),
        step_by_step: expect.arrayContaining(['Open passive tree', 'Link support gems']),
      }),
    );
  });

  it('adds/edits/removes gear-gems including string entries and cancel edit', () => {
    render(
      <BuildForm
        title="Create Build"
        isSubmitting={false}
        onSubmit={onSubmit}
        initialData={{
          gear_gems: ['Arc Gem'],
        }}
      />,
    );

    // Empty add branch (ignored)
    fireEvent.click(screen.getAllByTitle('Add')[0]);
    expect(screen.getByText('Arc Gem')).toBeInTheDocument();

    // Edit from string entry branch
    fireEvent.click(screen.getByText('Arc Gem'));
    const gearNameInput = screen.getByPlaceholderText('Gear/Gem Name');
    fireEvent.change(gearNameInput, { target: { value: 'Arc Gem Updated' } });
    fireEvent.click(screen.getByTitle('Save'));
    expect(screen.getByText('Arc Gem Updated')).toBeInTheDocument();

    // Add structured entry branch
    fireEvent.change(screen.getAllByPlaceholderText('Qty')[0], { target: { value: '2' } });
    fireEvent.change(screen.getAllByLabelText('Unit')[0], { target: { value: 'stack' } });
    fireEvent.change(gearNameInput, { target: { value: 'Orb of Fusing' } });
    fireEvent.click(screen.getAllByTitle('Add')[0]);
    expect(screen.getByText(/2 Stack Orb of Fusing/i)).toBeInTheDocument();

    // Edit object entry + cancel branch
    fireEvent.click(screen.getByText(/2 Stack Orb of Fusing/i));
    fireEvent.click(screen.getByTitle('Cancel'));
    expect(screen.getByText(/2 Stack Orb of Fusing/i)).toBeInTheDocument();

    const listItem = screen.getByText(/2 Stack Orb of Fusing/i).closest('li') as HTMLLIElement;
    fireEvent.click(listItem.querySelector('button') as HTMLButtonElement);
    expect(screen.queryByText(/2 Stack Orb of Fusing/i)).not.toBeInTheDocument();
  });

  it('adds/edits/removes checklist items including string entries', () => {
    render(
      <BuildForm
        title="Create Build"
        isSubmitting={false}
        onSubmit={onSubmit}
        initialData={{
          build_items: ['Divine Orb'],
        }}
      />,
    );

    const qtyInputs = screen.getAllByPlaceholderText('Qty');
    const unitInputs = screen.getAllByLabelText('Unit');
    const itemNameInput = screen.getByPlaceholderText('Item Name');

    // Empty add branch
    fireEvent.click(screen.getAllByTitle('Add')[1]);
    expect(screen.getByText('Divine Orb')).toBeInTheDocument();

    // Edit from string branch
    fireEvent.click(screen.getByText('Divine Orb'));
    fireEvent.change(itemNameInput, { target: { value: 'Divine Orb Updated' } });
    fireEvent.click(screen.getByTitle('Save'));
    expect(screen.getByText('Divine Orb Updated')).toBeInTheDocument();

    // Add object entry + edit object branch
    fireEvent.change(qtyInputs[1], { target: { value: '1' } });
    fireEvent.change(unitInputs[1], { target: { value: 'slot' } });
    fireEvent.change(itemNameInput, { target: { value: 'Cloak of Flame' } });
    fireEvent.click(screen.getAllByTitle('Add')[1]);
    expect(screen.getByText(/1 Slot Cloak of Flame/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/1 Slot Cloak of Flame/i));
    fireEvent.change(itemNameInput, { target: { value: 'Cloak of Defiance' } });
    fireEvent.click(screen.getByTitle('Save'));
    expect(screen.getByText(/1 Slot Cloak of Defiance/i)).toBeInTheDocument();

    const listItem = screen.getByText(/1 Slot Cloak of Defiance/i).closest('li') as HTMLLIElement;
    fireEvent.click(listItem.querySelector('button') as HTMLButtonElement);
    expect(screen.queryByText(/1 Slot Cloak of Defiance/i)).not.toBeInTheDocument();
  });

  it('handles steps and numeric setup minutes filtering', () => {
    render(<BuildForm title="Create Build" isSubmitting={false} onSubmit={onSubmit} />);

    const firstStep = screen.getByPlaceholderText(/Step 1 instructions/i);
    fireEvent.change(firstStep, { target: { value: 'Get starter weapon' } });
    fireEvent.click(screen.getByText('+ Add Step'));

    const removeStep1 = screen.getByLabelText('Remove step 1');
    fireEvent.click(removeStep1);
    expect(screen.getByPlaceholderText(/Step 1 instructions/i)).toBeInTheDocument();

    const minutesInput = screen.getByPlaceholderText('recipeForm.prepTimeMinutes') as HTMLInputElement;
    fireEvent.change(minutesInput, { target: { value: '12a' } });
    expect(minutesInput.value).toBe('');

    fireEvent.change(minutesInput, { target: { value: '45' } });
    expect(minutesInput.value).toBe('45');
  });

  it('falls back to raw unit when translation key is missing and strips units. prefix', () => {
    render(
      <BuildForm
        title="Create Build"
        isSubmitting={false}
        onSubmit={onSubmit}
        initialData={{
          gear_gems: [{ name: 'Timeless Jewel', quantity: '1', unit: 'units.custom' }],
        }}
      />,
    );

    expect(screen.getByText(/1 custom Timeless Jewel/i)).toBeInTheDocument();
  });

  it('covers archetype/setup change and Enter-key paths for ingredients/checklist edits', () => {
    render(<BuildForm title="Create Build" isSubmitting={true} onSubmit={onSubmit} />);

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'bossing' } });
    fireEvent.change(screen.getByPlaceholderText('Setup Time (e.g. 45 min)'), { target: { value: '60m' } });

    const minutesInput = screen.getByPlaceholderText('recipeForm.prepTimeMinutes');
    fireEvent.keyDown(minutesInput, { key: 'e' });
    fireEvent.change(minutesInput, { target: { value: '60' } });

    const qtyInputs = screen.getAllByPlaceholderText('Qty');
    const unitInputs = screen.getAllByLabelText('Unit');
    const gearNameInput = screen.getByPlaceholderText('Gear/Gem Name');
    const itemNameInput = screen.getByPlaceholderText('Item Name');

    fireEvent.change(qtyInputs[0], { target: { value: '1' } });
    fireEvent.change(unitInputs[0], { target: { value: 'socket' } });
    fireEvent.change(gearNameInput, { target: { value: 'Arc' } });
    fireEvent.keyDown(gearNameInput, { key: 'Enter' });
    expect(screen.getByText(/1 Socket Arc/i)).toBeInTheDocument();

    fireEvent.change(qtyInputs[1], { target: { value: '2' } });
    fireEvent.change(unitInputs[1], { target: { value: 'link' } });
    fireEvent.change(itemNameInput, { target: { value: 'Six Link Chest' } });
    fireEvent.keyDown(itemNameInput, { key: 'Enter' });
    expect(screen.getByText(/2 Link Six Link Chest/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/2 Link Six Link Chest/i));
    fireEvent.click(screen.getByTitle('Cancel'));
    expect(screen.getByText(/2 Link Six Link Chest/i)).toBeInTheDocument();
  });
});
