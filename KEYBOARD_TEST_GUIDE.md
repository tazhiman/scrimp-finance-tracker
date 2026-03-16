# Keyboard Behavior Testing Guide

## Quick Test Scenarios

### 🎯 Priority 1: Most Common Use Cases

#### 1. Add Transaction (TransactionForm)
**Path:** Transactions tab → + button

**Test Steps:**
1. Tap **Amount** field
   - ✅ Keyboard appears
   - ✅ Amount field stays visible above keyboard
   
2. Tap **Description** field
   - ✅ View scrolls automatically
   - ✅ Description field visible above keyboard
   
3. Tap **Add** under categories (to add custom)
   - ✅ Both Name and Emoji inputs visible
   - ✅ Can switch between them without keyboard dismissing

**Expected:** All fields always visible, smooth auto-scrolling

---

#### 2. Create Goal (Goals Screen)
**Path:** Goals tab → + button

**Test Steps:**
1. Tap **Goal Name**
   - ✅ Field visible above keyboard
   
2. Scroll down and tap **Target Amount**
   - ✅ View auto-scrolls
   - ✅ Field visible above keyboard
   
3. Tap **Contribution Amount** (at bottom)
   - ✅ Auto-scrolls to show field
   - ✅ Field never hidden by keyboard

**Expected:** Seamless scrolling, all fields accessible

---

#### 3. Add Custom Credit Card (CardManagementModal)
**Path:** Settings → Credit Cards → Add Custom Card

**Test Steps:**
1. Tap "Add Custom Card" button
2. Form appears with two inputs
3. Tap **Card Name**
   - ✅ Keyboard appears
   - ✅ Input field visible
   
4. Tap **Minimum Spend**
   - ✅ Keyboard stays open
   - ✅ Second field visible

**Expected:** Both inputs always visible with keyboard open

---

#### 4. Edit Transaction (Transaction Detail)
**Path:** Tap any transaction → Edit button

**Test Steps:**
1. Tap **Edit** button
2. Tap **Amount** field
   - ✅ Field stays in view
   
3. Tap **Description** textarea
   - ✅ View adjusts
   - ✅ TextArea visible above keyboard
   
4. Tap between fields multiple times
   - ✅ Keyboard persists (doesn't dismiss)
   - ✅ Smooth transitions

**Expected:** Edit mode is fully usable with keyboard

---

## 🔍 Detailed Testing Checklist

### TransactionForm Modal
- [ ] Amount field visible on tap
- [ ] Category selector scrolls into view
- [ ] Custom category: name input visible
- [ ] Custom category: emoji input visible
- [ ] Description textarea visible
- [ ] Can tap "Save" button with keyboard open
- [ ] Can tap "Cancel" with keyboard open
- [ ] Recurring expense fields all accessible

### Goals Modal
- [ ] Goal name input visible
- [ ] Target amount input visible
- [ ] Target date picker accessible
- [ ] Contribution frequency selector usable
- [ ] Contribution amount (last field) visible
- [ ] Can tap "Save" with keyboard open
- [ ] Edit existing goal works the same

### Card Management Modal
- [ ] Can scroll card list with keyboard open
- [ ] Custom card name input visible
- [ ] Min spend input visible
- [ ] Can tap "Add Card" button with keyboard
- [ ] Can tap "Cancel" with keyboard
- [ ] Can tap "Done" at bottom with keyboard

### Transaction Detail Screen
- [ ] Edit mode: amount field visible
- [ ] Edit mode: category selector usable
- [ ] Edit mode: description textarea visible
- [ ] Edit mode: date picker accessible
- [ ] Can tap "Apply" button with keyboard
- [ ] Can tap "Cancel" with keyboard

---

## 📱 Platform-Specific Tests

### iOS Specific
- [ ] Keyboard slides up smoothly
- [ ] Content adjusts with padding
- [ ] Status bar area respected
- [ ] Safe area handling correct
- [ ] Keyboard dismisses on outside tap (modal forms)

### Android Specific
- [ ] View height adjusts properly
- [ ] Navigation bar respected
- [ ] Hardware keyboard works (if available)
- [ ] Software keyboard works
- [ ] Back button dismisses keyboard first

---

## 🐛 Edge Cases to Test

### Small Screens
- [ ] iPhone SE / small Android: All fields accessible
- [ ] Very long forms: Can scroll to bottom fields
- [ ] Landscape mode: Works correctly (if supported)

### Multiple Fields
- [ ] Rapid tapping between fields: Smooth
- [ ] Tab key navigation: Moves to next field
- [ ] Return key: Submits form or moves to next
- [ ] Fields at the very bottom: Still visible

### Keyboard Behavior
- [ ] Tap outside input: Keyboard dismisses (non-form areas)
- [ ] Tap another input: Keyboard persists, switches field
- [ ] Tap scrollable area: Can scroll without dismissing
- [ ] Drag to scroll: Keyboard stays if input focused

---

## ⚡ Quick Smoke Test (2 minutes)

1. **Add Transaction:** Tap amount, description, save
2. **Create Goal:** Tap name, target, contribution, save
3. **Edit Transaction:** Open any transaction, tap edit, modify amount
4. **Add Custom Card:** Settings → Cards → Add custom card

If all 4 scenarios show fields above keyboard: ✅ **PASS**

---

## 🎨 Visual Indicators of Success

### ✅ Good Signs
- Input field always visible above keyboard
- Smooth auto-scrolling when tapping fields
- Keyboard persists when tapping between fields
- Save/Cancel buttons accessible with keyboard open
- No "jumping" or layout shifts

### ❌ Problems to Watch For
- Input field hidden behind keyboard
- Have to manually scroll to see what you're typing
- Keyboard dismisses when trying to tap another field
- Can't reach bottom buttons with keyboard open
- Layout jumps or stutters when keyboard appears

---

## 🔧 Troubleshooting

### If a field is still covered:
1. Check if `KeyboardAvoidingView` wraps the form
2. Verify `keyboardVerticalOffset` is appropriate
3. Ensure `ScrollView` has `keyboardShouldPersistTaps="handled"`
4. Check that parent views have `flex: 1`

### If keyboard dismisses unexpectedly:
1. Verify `keyboardShouldPersistTaps="handled"` on ScrollView
2. Check for conflicting touch handlers
3. Ensure modal/overlay doesn't capture taps

---

## 📝 Test Results Template

```
Date: _________
Device: _________
OS Version: _________

TransactionForm:        ☐ Pass  ☐ Fail
Goals Modal:            ☐ Pass  ☐ Fail
Card Management:        ☐ Pass  ☐ Fail
Transaction Detail:     ☐ Pass  ☐ Fail

Notes:
_________________________________
_________________________________
_________________________________
```

---

**Need Help?** Check `KEYBOARD_FIX.md` for technical implementation details.
