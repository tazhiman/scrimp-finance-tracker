import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category, TransactionType } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { Spacing, Radius } from '@/constants/design';

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
  const emojiInputRef = useRef<TextInput>(null);
  
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
          <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
          <Text style={[styles.addLabel, { color: theme.textSecondary }]}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      {showCustomInput && (
        <View style={styles.customInputWrapper}>
          <View style={styles.customInputContainer}>
            <View style={styles.inputWithLabel}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.customInput, { backgroundColor: theme.inputBackground, borderColor: theme.cardBorder, color: theme.text }]}
                value={customCategoryName}
                onChangeText={(text) => { if (onCustomCategoryNameChange) onCustomCategoryNameChange(text); }}
                placeholder="e.g. Groceries"
                placeholderTextColor={theme.textTertiary}
                returnKeyType="next"
              />
            </View>
            <View style={styles.emojiInputWithLabel}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Emoji</Text>
              <TextInput
                ref={emojiInputRef}
                style={[styles.emojiInput, { backgroundColor: theme.inputBackground, borderColor: theme.cardBorder, color: theme.text }]}
                value={customCategoryEmoji}
                onChangeText={(text) => { if (onCustomCategoryEmojiChange) onCustomCategoryEmojiChange(text); }}
                placeholder="e.g. 🛒"
                placeholderTextColor={theme.textTertiary}
                maxLength={4}
                returnKeyType="done"
                selectTextOnFocus={true}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>
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
  customInputContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-end',
  },
  inputWithLabel: {
    flex: 1,
  },
  emojiInputWithLabel: {
    width: 100,
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
  emojiInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
    fontSize: 16,
    borderWidth: 1,
    textAlign: 'center',
    height: 52,
  },
});
