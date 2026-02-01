# Credit Card Recommendation System

## Overview

The **Lobang Card** feature is a smart credit card recommendation engine built into Scrimp. "Lobang" is Singlish slang for "insider tip" or "good deal" - and that's exactly what this feature provides: the best credit card to use based on your location and spending patterns.

## Features

### 1. **Smart Card Recommendations**
- Get real-time suggestions for which credit card offers the best rewards
- Based on merchant type, category, and your card portfolio
- Considers minimum spend requirements automatically

### 2. **Local Rewards Library** 
Located in `data/rewardsData.json`, includes:
- **Major Singapore Credit Cards:**
  - DBS Live Fresh (5% cashback on online & contactless)
  - UOB EVOL (8% cashback on online & mobile contactless)
  - HSBC Revolution (4 mpd on online & contactless)
  - DBS Altitude (miles card)
  - Citi Rewards (10% on dining, 6% on groceries)

- **Merchant Category Code (MCC) Mappings:**
  - NTUC FairPrice, Cold Storage, Sheng Siong, Giant (Groceries - MCC 5411)
  - Grab, Foodpanda, Deliveroo (Food Delivery - MCC 5814)
  - Uniqlo, H&M, Zara (Retail - MCC 5651)
  - Toast Box, Ya Kun, Starbucks, McDonald's (Dining - MCC 5812/5814)
  - Shopee, Lazada, Amazon (Online - MCC 5999)
  - And more...

### 3. **Location-Based Detection**
- Uses device GPS to detect nearby merchants (when enabled)
- Caches location data to minimize API calls
- Respects user privacy with on-demand location access

### 4. **Min Spend Tracking**
- Visual progress bars showing how close you are to meeting each card's monthly minimum spend
- Helps you maximize rewards by meeting spend thresholds

### 5. **Miles vs. Cashback Toggle**
- Switch between miles and cashback preference
- Recommendations automatically adjust based on your preference

## File Structure

```
finance-tracker/
├── data/
│   └── rewardsData.json          # Credit card & merchant data
├── utils/
│   ├── cardEngine.ts             # Recommendation logic
│   ├── locationService.ts        # Full geolocation implementation
│   └── locationServiceStub.ts    # Stub for testing without location
├── components/
│   └── LobangCard.tsx            # Dashboard widget component
└── app/(tabs)/
    ├── index.tsx                 # Dashboard (shows Lobang Card)
    └── settings.tsx              # Card management UI
```

## Setup Instructions

### Step 1: Install Dependencies

First, fix npm permissions and install the geolocation package:

```bash
# Fix npm cache permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Install geolocation service
cd /Users/riz1/Downloads/finance-tracker
npm install react-native-geolocation-service --legacy-peer-deps
```

### Step 2: Add Location Permissions (Manual)

The location permissions need to be added to `app.json`. Add these lines:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"],
        "NSLocationWhenInUseUsageDescription": "Scrimp needs your location to recommend the best credit card for nearby merchants.",
        "NSLocationAlwaysUsageDescription": "Scrimp needs your location to recommend the best credit card for nearby merchants."
      }
    },
    "android": {
      "permissions": [
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

### Step 3: Enable Full Location Service (Optional)

To enable actual location detection:

1. Replace imports in files that use location:
   ```typescript
   // Change this:
   import { getMerchantAtCurrentLocation } from '@/utils/locationServiceStub';
   
   // To this:
   import { getMerchantAtCurrentLocation } from '@/utils/locationService';
   ```

2. Get a Google Places API key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable "Places API"
   - Create credentials (API key)
   - Restrict the key to Places API only

3. Update `utils/locationService.ts` with your API key:
   ```typescript
   const GOOGLE_PLACES_API_KEY = 'YOUR_API_KEY_HERE';
   ```

### Step 4: Configure Your Cards

1. Open the app
2. Navigate to Settings (gear icon)
3. Tap "My Cards" under CREDIT CARDS section
4. Select the cards you own
5. Toggle "Prefer Miles" vs "Prefer Cashback"

## Usage

### Dashboard Widget

The **Lobang Card** appears at the top of your dashboard:

- **Without location:** Shows a demo recommendation using NTUC FairPrice as an example
- **With location enabled:** Detects your current merchant and shows the best card
- **Tap to refresh:** Get updated recommendations

### Min Spend Progress

Below the Lobang Card, you'll see progress bars for each of your cards showing:
- Current monthly spend
- Target minimum spend
- How much more you need to meet the threshold

## How the Engine Works

### Recommendation Algorithm

```typescript
getBestCard(merchantName, category, userCards, preferMiles)
```

1. **Merchant Lookup:** Finds the merchant in the MCC mapping
2. **Card Filtering:** Filters by user's card portfolio and preference (miles/cashback)
3. **Reward Scoring:** Evaluates each card's reward rate for that merchant category
4. **Min Spend Check:** Applies penalty if user hasn't met minimum spend
5. **Best Match:** Returns the highest-scoring card

### Caching Strategy

- Location data is cached for 24 hours
- Prevents excessive API calls
- Cached by rounded coordinates (~100m precision)
- Maximum 50 cached locations stored

## Customization

### Adding New Cards

Edit `data/rewardsData.json`:

```json
{
  "id": "your-card-id",
  "name": "Your Card Name",
  "issuer": "Bank Name",
  "rewardType": "cashback",  // or "miles"
  "minSpend": 600,
  "rewards": [
    {
      "category": "groceries",
      "rate": 5,
      "unit": "%",
      "conditions": "Min spend $600/month"
    }
  ],
  "mccCodes": ["5411", "5812"]
}
```

### Adding New Merchants

Edit the `merchantMccMapping` array:

```json
{
  "merchantName": "New Merchant",
  "aliases": ["Alias1", "Alias2"],
  "mcc": "5411",
  "category": "groceries"
}
```

## Testing Without Location

The app works perfectly without location services:

1. Use the stub implementation (default)
2. Demo mode shows NTUC FairPrice example
3. All features work except real-time merchant detection

## Future Enhancements

Potential improvements:
- **Transaction Linking:** Auto-track spend per card from your transactions
- **Reward Maximization:** Suggest which card to use for upcoming purchases
- **Spending Patterns:** Learn from your habits and proactively suggest optimizations
- **Real-time MCC Detection:** Parse transaction descriptions to detect merchant codes
- **Multi-card Strategies:** Recommend card combinations to maximize overall rewards

## API Reference

### `getBestCard()`
```typescript
function getBestCard(
  merchantName: string,
  category?: string,
  userCards?: UserCard[],
  preferMiles?: boolean
): CardRecommendation | null
```

### `getMinSpendProgress()`
```typescript
function getMinSpendProgress(
  userCards: UserCard[]
): MinSpendProgress[]
```

### `getMerchantAtCurrentLocation()`
```typescript
async function getMerchantAtCurrentLocation(): 
  Promise<LocationData | null>
```

## Troubleshooting

### "Location service not configured"
- Install `react-native-geolocation-service` package
- Switch from stub to full implementation

### Cards not appearing
- Check Settings → My Cards
- Ensure you've selected at least one card

### Wrong recommendations
- Verify merchant name matches entries in `rewardsData.json`
- Check MCC codes are correct
- Ensure card details (reward rates, categories) are accurate

## Privacy & Security

- **No external tracking:** All data stays local on device
- **On-demand location:** Only requests location when you tap refresh
- **Cached intelligently:** Minimizes location API calls
- **No personal data collection:** No credit card numbers or personal info stored

## Contributing

To add more Singapore credit cards:
1. Research the card's reward structure
2. Add to `rewardsData.json`
3. Test recommendations
4. Submit a pull request

---

**Built with ❤️ for the Singaporean community**

*"Lobang" your way to maximum credit card rewards!*
