import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Category, TransactionType } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { Spacing, Radius } from '@/constants/design';

const EMOJI_OPTIONS = [
  '🍽️', '🛒', '☕', '🍕', '🍺', '🥡',
  '🚗', '🚌', '✈️', '⛽', '🚲', '🛵',
  '🛍️', '👕', '💄', '🎮', '📱', '💎',
  '🏠', '🔑', '🛠️', '🧹', '🪴', '💡',
  '💊', '🏥', '🏋️', '🧘', '🦷', '👓',
  '🎬', '🎵', '📚', '🎨', '🏖️', '⚽',
  '💰', '💳', '🏦', '📊', '💼', '🧾',
  '🎁', '🐾', '👶', '📦', '🔔', '⭐',
];

interface CategorySelectorProps {
  type: TransactionType;
  selectedCategory?: string;
  onSelect: (category: Category) => void;
  customCategoryName?: string;
  onCustomCategoryNameChange?: (name: string) => void;
  customCategoryEmoji?: string;
  onCustomCategoryEmojiChange?: (emoji: string) => void;
  showCustomInput?: boolean;
  onShowCustomInputChange?: (show: boolean) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  type,
  selectedCategory,
  onSelect,
  customCategoryName = '',
  onCustomCategoryNameChange,
  customCategoryEmoji = '',
  onCustomCategoryEmojiChange,
  showCustomInput = false,
  onShowCustomInputChange,
}) => {
  const { theme, themeMode } = useTheme();
  const { customCategories } = useFinance();
  const defaultCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const otherIndex = defaultCategories.findIndex(c => c.id === 'other');
  const allCategories = otherIndex >= 0
    ? [...defaultCategories.slice(0, otherIndex), ...customCategories, ...defaultCategories.slice(otherIndex)]
    : [...defaultCategories, ...customCategories];

  const activeTextColor = themeMode === 'dark' ? '#000505' : theme.text;

  const handleAddCustom = () => {
    if (onShowCustomInputChange) onShowCustomInputChange(true);
    if (onCustomCategoryNameChange) onCustomCategoryNameChange('');
    if (onCustomCategoryEmojiChange) onCustomCategoryEmojiChange('');
    const otherCategory = defaultCategories.find(c => c.id === 'other');
    if (otherCategory) onSelect(otherCategory);
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                { backgroundColor: theme.backgroundSecondary },
                isSelected && { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                onSelect(category);
                if (onShowCustomInputChange) onShowCustomInputChange(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{category.icon}</Text>
              <Text
                style={[
                  styles.label,
                  { color: isSelected ? activeTextColor : theme.textSecondary },
                  isSelected && { fontWeight: '600' },
                ]}
                numberOfLines={1}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
          onPress={handleAddCustom}
          activeOpacity={0.7}
        >
          <Icon name="add-circle-outline" size={22} color={theme.primary} />
          <Text style={[styles.addLabel, { color: theme.textSecondary }]}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      {showCustomInput && (
        <View style={styles.customInputWrapper}>
          <View style={styles.inputWithLabel}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.customInput, { backgroundColor: theme.inputBackground, borderColor: theme.cardBorder, color: theme.text }]}
              value={customCategoryName}
              onChangeText={(text) => { if (onCustomCategoryNameChange) onCustomCategoryNameChange(text); }}
              placeholder="e.g. Groceries"
              placeholderTextColor={theme.textTertiary}
              returnKeyType="done"
            />
          </View>

          <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>Pick an Emoji</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiGrid}
          >
            {EMOJI_OPTIONS.map((emoji) => {
              const isSelected = customCategoryEmoji === emoji;
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    { backgroundColor: theme.backgroundSecondary },
                    isSelected && { backgroundColor: theme.primary + '28', borderColor: theme.primary, borderWidth: 2 },
                  ]}
                  onPress={() => { if (onCustomCategoryEmojiChange) onCustomCategoryEmojiChange(emoji); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiButtonText}>{emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xs,
    paddingBottom: 0,
    paddingHorizontal: Spacing.xs,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    minWidth: 80,
  },
  icon: {
    fontSize: 22,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    minWidth: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  customInputWrapper: {
    marginTop: Spacing.lg,
  },
  inputWithLabel: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  customInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    fontSize: 16,
    borderWidth: 1,
    height: 52,
  },
  emojiGrid: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonText: {
    fontSize: 22,
  },
});
