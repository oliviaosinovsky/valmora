// Approved public product information only. No internal financial data.
export const pricingProducts = [
  {
    "id": "kit",
    "name": "ClosetCue camera kit + first year",
    "description": "Planning bundle: one retrofit camera kit, basic self-installation and 12 months of app access.",
    "price": 199,
    "currency": "USD",
    "billingModel": "bundle",
    "features": [
      "Camera-assisted wardrobe inventory (proposed)",
      "12 months of outfit planning",
      "Manual clothing availability correction (proposed)"
    ],
    "optionalAddons": []
  },
  {
    "id": "app",
    "name": "ClosetCue app-only",
    "description": "Exploratory software-only option for customers outside the camera-kit bundle.",
    "price": 9.99,
    "currency": "USD",
    "billingModel": "monthly",
    "features": [
      "Personalized outfit planning (proposed)",
      "Weather and calendar connection (proposed)",
      "Wear tracking and packing (proposed)"
    ],
    "optionalAddons": []
  }
] as const;
