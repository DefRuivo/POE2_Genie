"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
    normalizeBuildArchetype,
    normalizeBuildCostTier,
    toLegacyDifficulty,
} from '@/lib/build-contract';
import {
    BuildArchetype,
    BuildCostTier,
    BuildRecord,
} from '@/types';

interface BuildFormProps {
    initialData?: Partial<BuildRecord>;
    onSubmit: (data: any) => Promise<void>;
    isSubmitting: boolean;
    title: string;
}

export default function BuildForm({ initialData, onSubmit, isSubmitting, title }: BuildFormProps) {
    const { t } = useTranslation();
    const initialArchetype = normalizeBuildArchetype(
        (initialData?.build_archetype as string) || (initialData?.meal_type as string),
    );
    const initialCostTierRaw =
        (initialData?.build_cost_tier as string)
        || (initialData?.build_complexity as string)
        || (initialData?.difficulty as string)
        || 'medium';
    const initialCostTier = normalizeBuildCostTier(initialCostTierRaw);
    const initialSteps = (initialData?.build_steps as any[])
        || (initialData?.step_by_step as any[])
        || [];
    const normalizedInitialSteps = initialSteps.length > 0
        ? initialSteps.map((s: any, i: number) => {
            if (typeof s === 'string') return { step: i + 1, text: s };
            return s || { step: i + 1, text: '' };
        })
        : [{ step: 1, text: '' }];

    const [formData, setFormData] = useState({
        build_title: initialData?.build_title || initialData?.recipe_title || '',
        build_archetype: initialArchetype as BuildArchetype,
        build_cost_tier: initialCostTier as BuildCostTier,
        setup_time: initialData?.setup_time || initialData?.prep_time || '',
        setup_time_minutes: (initialData?.setup_time_minutes ?? initialData?.prep_time_minutes ?? '') as any,
        gear_gems: (initialData?.gear_gems as any[]) || (initialData?.ingredients_from_pantry as any[]) || [],
        build_items: (initialData?.build_items as any[]) || (initialData?.shopping_list as any[]) || [],
        build_steps: normalizedInitialSteps,
    });

    const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', unit: 'x' });
    const [editingIngredientIndex, setEditingIngredientIndex] = useState<number | null>(null);

    const [newShoppingItem, setNewShoppingItem] = useState({ name: '', quantity: '', unit: 'x' });
    const [editingShoppingIndex, setEditingShoppingIndex] = useState<number | null>(null);

    const availableUnits = ['x', 'stack', 'set', 'lvl', '%', 'socket', 'link', 'slot'];

    // Handlers for basic fields
    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Ingredient Handlers
    const addIngredient = () => {
        if (!newIngredient.name.trim()) return;

        if (editingIngredientIndex !== null) {
            // Update existing
            setFormData(prev => {
                const newList = [...prev.gear_gems];
                newList[editingIngredientIndex] = { ...newIngredient };
                return { ...prev, gear_gems: newList };
            });
            setEditingIngredientIndex(null);
        } else {
            // Add new
            setFormData(prev => ({
                ...prev,
                gear_gems: [...prev.gear_gems, { ...newIngredient }]
            }));
        }
        setNewIngredient({ name: '', quantity: '', unit: 'x' });
    };

    const removeIngredient = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            gear_gems: prev.gear_gems.filter((_, i) => i !== idx)
        }));
    };

    const editIngredient = (idx: number) => {
        const item = formData.gear_gems[idx];
        setEditingIngredientIndex(idx);
        if (typeof item === 'string') {
            setNewIngredient({ name: item, quantity: '', unit: 'x' });
        } else {
            setNewIngredient({ name: item.name, quantity: item.quantity || '', unit: item.unit || 'x' });
        }
    };

    const cancelEditIngredient = () => {
        setEditingIngredientIndex(null);
        setNewIngredient({ name: '', quantity: '', unit: 'x' });
    };

    // Shopping List Handlers
    const addShoppingItem = () => {
        if (!newShoppingItem.name.trim()) return;

        if (editingShoppingIndex !== null) {
            // Update existing
            setFormData(prev => {
                const newList = [...prev.build_items];
                newList[editingShoppingIndex] = { ...newShoppingItem };
                return { ...prev, build_items: newList };
            });
            setEditingShoppingIndex(null);
        } else {
            // Add new
            setFormData(prev => ({
                ...prev,
                build_items: [...prev.build_items, { ...newShoppingItem }]
            }));
        }
        setNewShoppingItem({ name: '', quantity: '', unit: 'x' });
    };

    const removeShoppingItem = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            build_items: prev.build_items.filter((_, i) => i !== idx)
        }));
    };

    const editShoppingItem = (idx: number) => {
        const item = formData.build_items[idx];
        setEditingShoppingIndex(idx);
        if (typeof item === 'string') {
            setNewShoppingItem({ name: item, quantity: '', unit: 'x' });
        } else {
            setNewShoppingItem({ name: item.name, quantity: item.quantity || '', unit: item.unit || 'x' });
        }
    };

    const cancelEditShoppingItem = () => {
        setEditingShoppingIndex(null);
        setNewShoppingItem({ name: '', quantity: '', unit: 'x' });
    };

    // Step Handlers
    const handleStepChange = (idx: number, text: string) => {
        const newSteps = [...formData.build_steps];
        newSteps[idx] = { ...newSteps[idx], text };
        setFormData(prev => ({ ...prev, build_steps: newSteps }));
    };

    const addStep = () => {
        setFormData(prev => ({
            ...prev,
            build_steps: [...prev.build_steps, { step: prev.build_steps.length + 1, text: '' }]
        }));
    };

    const removeStep = (idx: number) => {
        const newSteps = formData.build_steps.filter((_, i) => i !== idx)
            .map((s, i) => ({ ...s, step: i + 1 })); // Re-index
        setFormData(prev => ({ ...prev, build_steps: newSteps }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Normalize steps to string[] before submitting to match expectations
        const finalData = {
            ...formData,
            build_title: formData.build_title,
            build_reasoning: initialData?.build_reasoning || initialData?.match_reasoning || '',
            gear_gems: formData.gear_gems,
            build_items: formData.build_items,
            build_steps: formData.build_steps.map(s => s.text),
            compliance_badge: (initialData as any)?.compliance_badge ?? (initialData as any)?.safety_badge ?? true,
            build_archetype: formData.build_archetype,
            build_cost_tier: formData.build_cost_tier,
            build_complexity: formData.build_cost_tier,
            setup_time: formData.setup_time,
            setup_time_minutes: formData.setup_time_minutes,
            // Legacy aliases accepted by legacy endpoints.
            recipe_title: formData.build_title,
            meal_type: formData.build_archetype,
            prep_time: formData.setup_time,
            prep_time_minutes: formData.setup_time_minutes,
            ingredients_from_pantry: formData.gear_gems,
            shopping_list: formData.build_items,
            step_by_step: formData.build_steps.map(s => s.text),
            // Legacy aliases accepted by legacy endpoints.
            difficulty: toLegacyDifficulty(formData.build_cost_tier as BuildCostTier),
        };
        onSubmit(finalData);
    };

    const getUnitLabel = (unit: string) => {
        // Strip off "units." prefix if it somehow got saved in the DB
        const cleanUnit = unit.replace(/^units\./, '');
        const key = `units.${cleanUnit}`;
        const translated = t(key);
        // If translation returns the key itself, it means missing translation.
        // Fallback to the clean unit name.
        return translated === key ? cleanUnit : translated;
    };

    return (
        <div className="poe-card poe-section-marker poe-section-builds rounded-3xl border border-poe-borderStrong shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-black poe-title mb-6">{title}</h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Left Column: Details & Ingredients */}
                <div className="space-y-8">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <label htmlFor="build_title" className="block text-xs font-black text-poe-text2 uppercase tracking-widest">{t('recipeForm.recipeTitle')}</label>

                        <input
                            id="build_title"
                            type="text"
                            placeholder={t('recipeForm.recipeTitlePlaceholder')}
                            value={formData.build_title}
                            onChange={e => handleChange('build_title', e.target.value)}
                            className="w-full text-lg font-bold p-3 poe-input poe-focus-ring rounded-xl"
                            required
                        />

                        <div className="grid grid-cols-1 gap-4">
                            <select
                                value={formData.build_archetype}
                                onChange={e => handleChange('build_archetype', e.target.value)}
                                className="p-3 poe-select poe-focus-ring rounded-xl font-medium"
                            >
                                <option value="league_starter">{t('recipeForm.leagueStarter')}</option>
                                <option value="mapper">{t('recipeForm.mapper')}</option>
                                <option value="bossing">{t('recipeForm.bossing')}</option>
                                <option value="hybrid">{t('recipeForm.hybrid')}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-poe-text2 uppercase tracking-widest">{t('recipeForm.costs')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'cheap', label: t('recipeForm.cheap'), tooltip: t('recipeForm.costTooltipCheap') },
                                    { value: 'medium', label: t('recipeForm.medium'), tooltip: t('recipeForm.costTooltipMedium') },
                                    { value: 'expensive', label: t('recipeForm.expensive'), tooltip: t('recipeForm.costTooltipExpensive') },
                                    { value: 'mirror_of_kalandra', label: t('recipeForm.mirrorOfKalandra'), tooltip: t('recipeForm.costTooltipMirrorOfKalandra') },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        title={option.tooltip}
                                        onClick={() => handleChange('build_cost_tier', option.value)}
                                        className={`py-2 px-3 rounded-xl border text-xs font-black uppercase transition-colors poe-focus-ring ${
                                            formData.build_cost_tier === option.value
                                                ? 'poe-accent-settings-soft'
                                                : 'poe-input border-poe-border text-poe-text2 hover:border-poe-sectionSettings'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder={t('recipeForm.prepTimePlaceholder')}
                                value={formData.setup_time}
                                onChange={e => handleChange('setup_time', e.target.value)}
                                className="w-full p-3 poe-input poe-focus-ring rounded-xl"
                            />
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    onKeyDown={(e) => {
                                        if (['.', ',', '-', 'e', 'E', '+'].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    placeholder={t('recipeForm.prepTimeMinutes') || "Minutes (e.g. 30)"}
                                    value={formData.setup_time_minutes}
                                    onChange={e => {
                                        const val = e.target.value;
                                        // Double check regex to ensure only digits (though onKeyDown helps too)
                                        if (val === '' || /^\d+$/.test(val)) {
                                             handleChange('setup_time_minutes', val ? parseInt(val) : '');
                                        }
                                    }}
                                    className="w-full p-3 poe-input poe-focus-ring rounded-xl"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-poe-text2 text-sm font-bold">min</span>
                            </div>
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="space-y-4">
                        <label className="block text-xs font-black text-poe-text2 uppercase tracking-widest">{t('recipeForm.ingredients')}</label>


                        <div className="grid grid-cols-12 gap-3">
                            <input
                                type="text"
                                placeholder={t('recipeForm.qty')}
                                value={newIngredient.quantity}
                                onChange={e => setNewIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                                className="col-span-2 p-3 poe-input poe-focus-ring rounded-xl text-center"
                            />
                            <select
                                value={newIngredient.unit}
                                onChange={e => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                                className="col-span-3 p-3 poe-select poe-focus-ring rounded-xl font-medium text-poe-text1"
                                aria-label="Unit"
                            >
                                {availableUnits.map(u => (
                                    <option key={u} value={u}>{t(`units.${u}`)}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder={t('recipeForm.ingredientName')}
                                value={newIngredient.name}
                                onChange={e => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                                className={editingIngredientIndex !== null ? "col-span-5 p-3 poe-input poe-focus-ring rounded-xl" : "col-span-6 p-3 poe-input poe-focus-ring rounded-xl"}
                            />
                            {editingIngredientIndex !== null ? (
                                <div className="col-span-2 flex gap-2">
                                    <button type="button" onClick={addIngredient} className="flex-1 poe-status-success rounded-xl font-bold hover:brightness-110 flex items-center justify-center aspect-square poe-focus-ring" title={t('common.save')}>
                                        <i className="fas fa-check"></i>
                                    </button>
                                    <button type="button" onClick={cancelEditIngredient} className="flex-1 poe-card text-poe-text1 rounded-xl font-bold hover:brightness-110 flex items-center justify-center aspect-square poe-focus-ring" title={t('common.cancel')}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={addIngredient} className="col-span-1 poe-status-success rounded-xl font-bold hover:brightness-110 flex items-center justify-center aspect-square poe-focus-ring" title={t('recipeForm.add')}>
                                    <i className="fas fa-plus"></i>
                                </button>
                            )}
                        </div>

                        <ul className="space-y-2">
                            {formData.gear_gems.map((ing: any, i) => (
                                <li key={i}
                                    onClick={() => editIngredient(i)}
                                    className={`flex justify-between items-center poe-card border border-poe-border p-3 rounded-xl shadow-sm cursor-pointer transition-colors group ${editingIngredientIndex === i ? 'ring-2 ring-poe-sectionBuilds border-poe-sectionBuilds' : 'hover:bg-poe-surface2'}`}
                                    title={t('common.edit')}
                                >
                                    {typeof ing === 'string' ? ing : (ing.quantity ? `${ing.quantity} ${getUnitLabel(ing.unit)} ${ing.name}` : ing.name)}
                                    {editingIngredientIndex !== i && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeIngredient(i); }}
                                            className="text-poe-danger hover:brightness-110 p-2 poe-focus-ring rounded-lg"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Shopping List */}
                    <div className="space-y-4">
                        <label className="block text-xs font-black text-poe-text2 uppercase tracking-widest">{t('recipeForm.shoppingList')}</label>
                        <div className="grid grid-cols-12 gap-3">
                            <input
                                type="text"
                                placeholder={t('recipeForm.qty')}
                                value={newShoppingItem.quantity}
                                onChange={e => setNewShoppingItem(prev => ({ ...prev, quantity: e.target.value }))}
                                className="col-span-2 p-3 poe-input poe-focus-ring rounded-xl text-center"
                            />
                            <select
                                value={newShoppingItem.unit}
                                onChange={e => setNewShoppingItem(prev => ({ ...prev, unit: e.target.value }))}
                                className="col-span-3 p-3 poe-select poe-focus-ring rounded-xl outline-none font-medium text-poe-text1"
                                aria-label="Unit"
                            >
                                {availableUnits.map(u => (
                                    <option key={u} value={u}>{t(`units.${u}`)}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder={t('recipeForm.itemName')}
                                value={newShoppingItem.name}
                                onChange={e => setNewShoppingItem(prev => ({ ...prev, name: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addShoppingItem())}
                                className={editingShoppingIndex !== null ? "col-span-5 p-3 poe-input poe-focus-ring rounded-xl" : "col-span-6 p-3 poe-input poe-focus-ring rounded-xl"}
                            />
                            {editingShoppingIndex !== null ? (
                                <div className="col-span-2 flex gap-2">
                                    <button type="button" onClick={addShoppingItem} className="flex-1 poe-status-warning rounded-xl font-bold hover:brightness-110 flex items-center justify-center aspect-square poe-focus-ring" title={t('common.save')}>
                                        <i className="fas fa-check"></i>
                                    </button>
                                    <button type="button" onClick={cancelEditShoppingItem} className="flex-1 poe-card text-poe-text1 rounded-xl font-bold hover:brightness-110 flex items-center justify-center aspect-square poe-focus-ring" title={t('common.cancel')}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={addShoppingItem} className="col-span-1 poe-status-warning rounded-xl font-bold hover:brightness-110 flex items-center justify-center aspect-square poe-focus-ring" title={t('recipeForm.add')}>
                                    <i className="fas fa-plus"></i>
                                </button>
                            )}
                        </div>
                        <ul className="space-y-2">
                            {formData.build_items.map((item: any, i) => (
                                <li key={i}
                                    onClick={() => editShoppingItem(i)}
                                    className={`flex justify-between items-center poe-card border border-poe-border p-3 rounded-xl shadow-sm cursor-pointer transition-colors group ${editingShoppingIndex === i ? 'ring-2 ring-poe-sectionStash border-poe-sectionStash' : 'hover:bg-poe-surface2'}`}
                                    title={t('common.edit')}
                                >
                                    {typeof item === 'string' ? item : (item.quantity ? `${item.quantity} ${getUnitLabel(item.unit)} ${item.name}` : item.name)}
                                    {editingShoppingIndex !== i && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeShoppingItem(i); }}
                                            className="text-poe-danger hover:brightness-110 p-2 poe-focus-ring rounded-lg"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>

                {/* Right Column: Instructions & Submit */}
                <div className="space-y-8 flex flex-col h-full">
                    {/* Steps */}
                    <div className="space-y-4">
                        <label className="block text-xs font-black text-poe-text2 uppercase tracking-widest">{t('recipeForm.instructions')}</label>
                        <div className="space-y-4">
                            {formData.build_steps.map((step, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-8 h-8 poe-accent-builds-soft rounded-full flex items-center justify-center font-bold shrink-0">
                                        {i + 1}
                                    </div>
                                    <textarea
                                        value={step.text}
                                        onChange={e => handleStepChange(i, e.target.value)}
                                        placeholder={t('recipeForm.stepPlaceholder').replace('{n}', (i + 1).toString())}
                                        className="flex-1 p-3 poe-input poe-focus-ring rounded-xl resize-y min-h-[5rem]"
                                    />
                                    <button type="button" onClick={() => removeStep(i)} aria-label={`Remove step ${i + 1}`} className="self-center text-poe-danger hover:brightness-110 px-2 poe-focus-ring rounded-lg">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addStep} className="w-full py-3 border-2 border-dashed border-poe-borderStrong rounded-xl text-poe-text2 font-bold hover:border-poe-sectionBuilds hover:text-poe-sectionBuilds poe-focus-ring">
                            + {t('recipeForm.addStep')}
                        </button>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 poe-btn-primary poe-focus-ring rounded-2xl font-black text-lg shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-3 mt-auto"
                    >
                        {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                        {isSubmitting ? t('recipeForm.saving') : t('recipeForm.saveRecipe')}
                    </button>
                </div>

            </form>
        </div>
    );
}
