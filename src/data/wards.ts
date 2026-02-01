import { Ward } from "@/types";

// Generate 250 wards data for Delhi
const zoneCenters: Record<string, { lat: number, lng: number }> = {
  "North Delhi": { lat: 28.7041, lng: 77.1025 },
  "South Delhi": { lat: 28.5000, lng: 77.1850 },
  "East Delhi": { lat: 28.6314, lng: 77.2921 },
  "West Delhi": { lat: 28.6600, lng: 77.0800 },
  "Central Delhi": { lat: 28.6448, lng: 77.2167 },
  "New Delhi": { lat: 28.6139, lng: 77.2090 },
  "North West Delhi": { lat: 28.7500, lng: 77.0500 },
  "South West Delhi": { lat: 28.5500, lng: 77.0000 },
  "North East Delhi": { lat: 28.7000, lng: 77.2500 },
  "Shahdara": { lat: 28.6700, lng: 77.3000 },
  "South East Delhi": { lat: 28.5500, lng: 77.2500 }
};

const zones = Object.keys(zoneCenters);

const wardNames = [
  "Narela", "Bakhtawarpur", "Alipur", "Model Town", "Sadar Bazar",
  "Civil Lines", "Karol Bagh", "Rajouri Garden", "Hari Nagar", "Tilak Nagar",
  "Janakpuri", "Dwarka", "Najafgarh", "Palam", "Delhi Cantt",
  "Vasant Kunj", "Mehrauli", "Sangam Vihar", "Greater Kailash", "Defence Colony",
  "Lajpat Nagar", "Okhla", "Tughlakabad", "Badarpur", "Sarita Vihar",
  "Mayur Vihar", "Preet Vihar", "Laxmi Nagar", "Shakarpur", "Gandhi Nagar",
  "Krishna Nagar", "Vivek Vihar", "Dilshad Garden", "Seelampur", "Jama Masjid",
  "Chandni Chowk", "Daryaganj", "Paharganj", "RK Puram", "Sarojini Nagar",
  "Connaught Place", "India Gate", "Lodhi Colony", "Pitampura", "Rohini",
  "Shalimar Bagh", "Wazirpur", "Ashok Vihar", "Mangolpuri", "Sultanpuri"
];

const pollutionSources = [
  "Vehicle Emissions",
  "Industrial Discharge",
  "Construction Dust",
  "Open Waste Burning",
  "Sewage Overflow",
  "Illegal Factories",
  "Traffic Congestion",
  "Brick Kilns",
  "Power Plants",
  "Household Waste",
  "Agricultural Burning",
  "Commercial Waste",
  "Street Food Vendors",
  "Unauthorized Markets"
];

export const generateWards = (): Ward[] => {
  const wards: Ward[] = [];

  for (let i = 1; i <= 250; i++) {
    const baseNameIndex = (i - 1) % wardNames.length;
    const zoneIndex = Math.floor((i - 1) / 23) % zones.length;
    const zone = zones[zoneIndex];
    const center = zoneCenters[zone];

    // Generate realistic Delhi AQI (Winter levels are typically 200-500)
    // Base AQI around 300 with variation
    const baseAQI = 250 + Math.random() * 200;
    const aqi = Math.floor(baseAQI);

    // Calculate score based on AQI (Higher AQI = Lower Score)
    // 0-50 AQI = 100 Score
    // 500 AQI = 0 Score
    let pollutionScore = Math.max(0, 100 - Math.floor((aqi / 500) * 100));

    const sourceCount = Math.floor(Math.random() * 4) + 2;
    const selectedSources = pollutionSources
      .sort(() => Math.random() - 0.5)
      .slice(0, sourceCount);

    wards.push({
      id: i,
      name: `${wardNames[baseNameIndex]} Ward ${Math.ceil(i / wardNames.length)}`,
      zone: zone,
      population: Math.floor(Math.random() * 80000) + 20000,
      area: parseFloat((Math.random() * 8 + 2).toFixed(2)),
      pollutionScore,
      aqi: aqi,
      airQuality: Math.floor(Math.random() * 100) + 1,
      waterQuality: Math.floor(Math.random() * 100) + 1,
      wasteManagement: Math.floor(Math.random() * 100) + 1,
      noiseLevel: Math.floor(Math.random() * 100) + 1,
      trend7Days: parseFloat((Math.random() * 20 - 10).toFixed(1)),
      trend30Days: parseFloat((Math.random() * 30 - 15).toFixed(1)),
      sources: selectedSources,
      trafficStatus: Math.random() > 0.7 ? 'heavy' : Math.random() > 0.4 ? 'moderate' : 'low',
      coordinates: {
        lat: center.lat + (Math.random() * 0.1 - 0.05),
        lng: center.lng + (Math.random() * 0.1 - 0.05)
      }
    });
  }

  return wards;
};

export const wards = generateWards();

export const getWardById = (id: number): Ward | undefined => {
  return wards.find(w => w.id === id);
};

export const searchWards = (query: string): Ward[] => {
  const lowercaseQuery = query.toLowerCase();
  return wards.filter(w =>
    w.name.toLowerCase().includes(lowercaseQuery) ||
    w.id.toString().includes(query) ||
    w.zone.toLowerCase().includes(lowercaseQuery)
  );
};

export const getStatusFromScore = (score: number): 'good' | 'moderate' | 'unhealthy' | 'severe' | 'hazardous' => {
  if (score >= 80) return 'good';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'unhealthy';
  if (score >= 20) return 'severe';
  return 'hazardous';
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    good: 'Good',
    moderate: 'Moderate',
    unhealthy: 'Unhealthy',
    severe: 'Severe',
    hazardous: 'Hazardous'
  };
  return labels[status] || status;
};

export const getWardColor = (score: number) => {
  if (score >= 80) return "bg-pollution-good";
  if (score >= 60) return "bg-pollution-moderate";
  if (score >= 40) return "bg-pollution-unhealthy";
  if (score >= 20) return "bg-pollution-severe";
  return "bg-pollution-hazardous";
};
