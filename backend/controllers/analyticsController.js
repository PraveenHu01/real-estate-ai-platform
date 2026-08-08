exports.getAnalytics = async (req, res) => {
  res.json({
    propertiesByCity: [
      { city: "Bhopal", count: 48, avgPrice: 62.5 },
      { city: "Indore", count: 65, avgPrice: 71.0 },
      { city: "Bengaluru", count: 120, avgPrice: 155.0 },
      { city: "Mumbai", count: 95, avgPrice: 320.0 },
      { city: "Delhi", count: 82, avgPrice: 185.0 }
    ],
    priceTrendsYearly: [
      { year: "2022", Bhopal: 48.0, Indore: 52.0, Bengaluru: 110.0, Mumbai: 260.0, Delhi: 140.0 },
      { year: "2023", Bhopal: 52.5, Indore: 58.0, Bengaluru: 124.0, Mumbai: 282.0, Delhi: 152.0 },
      { year: "2024", Bhopal: 56.0, Indore: 63.5, Bengaluru: 138.0, Mumbai: 305.0, Delhi: 168.0 },
      { year: "2025", Bhopal: 60.2, Indore: 68.0, Bengaluru: 152.0, Mumbai: 325.0, Delhi: 179.0 },
      { year: "2026", Bhopal: 64.5, Indore: 74.2, Bengaluru: 168.5, Mumbai: 348.0, Delhi: 192.0 }
    ],
    userRegistrationsMonthly: [
      { month: "Jan", buyers: 42, sellers: 12 },
      { month: "Feb", buyers: 58, sellers: 16 },
      { month: "Mar", buyers: 75, sellers: 22 },
      { month: "Apr", buyers: 90, sellers: 28 },
      { month: "May", buyers: 115, sellers: 34 },
      { month: "Jun", buyers: 142, sellers: 38 }
    ],
    mostSearchedLocations: [
      { location: "MP Nagar, Bhopal", searches: 1420 },
      { location: "Vijay Nagar, Indore", searches: 1890 },
      { location: "Indiranagar, Bengaluru", searches: 3100 },
      { location: "Bandra West, Mumbai", searches: 2750 },
      { location: "Arera Colony, Bhopal", searches: 1120 }
    ],
    propertyCategories: [
      { name: "2 BHK Flats", percentage: 42 },
      { name: "3 BHK Flats", percentage: 33 },
      { name: "Luxury Villas", percentage: 15 },
      { name: "Commercial Plots", percentage: 10 }
    ]
  });
};
