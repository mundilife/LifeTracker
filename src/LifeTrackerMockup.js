import React, { useState, useEffect, useCallback } from 'react';
import { User, Map as MapIcon, BarChart2, Sun, Heart, Moon, Wind, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

mapboxgl.accessToken = 'pk.eyJ1IjoibGlmZXRyYWNrZXIiLCJhIjoiY2x5czE2bTdtMDJkMTJtcXJ6NDE2cng3ciJ9.nF_LVVE7rjj2uGb9ZBOD6A';

const LifeTrackerMockup = () => {
  const [activeTab, setActiveTab] = useState('longevity');
  const [map, setMap] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [userAdvice, setUserAdvice] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date(2024, 8, 1)); // September 1, 2024

  const metrics = [
    { id: 'longevity', label: 'Longevity Score', color: 'rgba(75, 192, 192, 0.6)', icon: User },
    { id: 'vitaminD', label: 'Vitamin D', color: 'rgba(255, 206, 86, 0.6)', icon: Sun },
    { id: 'cardiovascular', label: 'Cardiovascular Health', color: 'rgba(255, 99, 132, 0.6)', icon: Heart },
    { id: 'circadian', label: 'Circadian Rhythm', color: 'rgba(54, 162, 235, 0.6)', icon: Moon },
    { id: 'airQuality', label: 'Air Quality', color: 'rgba(153, 102, 255, 0.6)', icon: Wind },
    { id: 'uvIndex', label: 'UV Index', color: 'rgba(255, 159, 64, 0.6)', icon: Zap },
  ];

  const devices = [
    { name: 'Garmin', logo: 'https://www.vectorlogo.zone/logos/garmin/garmin-icon.svg' },
    { name: 'Fitbit', logo: 'https://www.vectorlogo.zone/logos/fitbit/fitbit-icon.svg' },
    { name: 'Apple', logo: 'https://www.vectorlogo.zone/logos/apple/apple-icon.svg' },
    { name: 'Xiaomi', logo: 'https://www.vectorlogo.zone/logos/mi/mi-icon.svg' },
    { name: 'Google', logo: 'https://www.vectorlogo.zone/logos/google/google-icon.svg' },
  ];

  const locations = {
    home: [-9.3076, 38.6913], // Oeiras
    work: [-9.1393, 38.7223], // Central Lisbon
    joggingroute: [
      [-9.3151, 38.6891], // Start of Passeio Marítimo
      [-9.3139, 38.6953], // Middle point
      [-9.3151, 38.6891]  // Back to start
    ],
    park: [-9.2780, 38.6970], // Parque dos Poetas
  };

  const mockWeeklyRoutine = [
    { // Monday
      routes: [
        { from: 'home', to: 'joggingroute', activity: 'Jogging', time: '07:00' },
        { from: 'home', to: 'work', activity: 'Commute', time: '08:30' },
        { from: 'work', to: 'home', activity: 'Commute', time: '18:00' },
      ],
      activities: { Work: 480, Jogging: 60, Commute: 60, Leisure: 180 }
    },
    { // Tuesday
      routes: [
        { from: 'home', to: 'work', activity: 'Commute', time: '08:30' },
        { from: 'work', to: 'home', activity: 'Commute', time: '18:00' },
        { from: 'home', to: 'park', activity: 'Walking', time: '19:00' },
        { from: 'park', to: 'home', activity: 'Walking', time: '20:00' },
      ],
      activities: { Work: 480, Walking: 120, Commute: 60, Leisure: 180 }
    },
    { // Wednesday
      routes: [
        { from: 'home', to: 'work', activity: 'Commute', time: '08:30' },
        { from: 'work', to: 'home', activity: 'Commute', time: '18:00' },
        { from: 'home', to: 'joggingroute', activity: 'Jogging', time: '19:00' },
      ],
      activities: { Work: 480, Jogging: 60, Commute: 60, Leisure: 240 }
    },
    { // Thursday
      routes: [
        { from: 'home', to: 'work', activity: 'Commute', time: '08:30' },
        { from: 'work', to: 'park', activity: 'Lunch Break', time: '12:00' },
        { from: 'park', to: 'work', activity: 'Return from Lunch', time: '13:00' },
        { from: 'work', to: 'home', activity: 'Commute', time: '18:00' },
      ],
      activities: { Work: 480, Walking: 60, Commute: 60, Leisure: 180 }
    },
    { // Friday
      routes: [
        { from: 'home', to: 'work', activity: 'Commute', time: '08:30' },
        { from: 'work', to: 'home', activity: 'Commute', time: '17:00' },
        { from: 'home', to: 'park', activity: 'Evening Walk', time: '18:00' },
        { from: 'park', to: 'home', activity: 'Return from Walk', time: '19:00' },
      ],
      activities: { Work: 450, Walking: 120, Commute: 60, Leisure: 240 }
    },
    { // Saturday
      routes: [
        { from: 'home', to: 'joggingroute', activity: 'Long Run', time: '09:00' },
        { from: 'home', to: 'park', activity: 'Afternoon Walk', time: '15:00' },
        { from: 'park', to: 'home', activity: 'Return from Walk', time: '16:30' },
      ],
      activities: { Jogging: 120, Walking: 150, Leisure: 480 }
    },
    { // Sunday
      routes: [
        { from: 'home', to: 'park', activity: 'Morning Walk', time: '10:00' },
        { from: 'park', to: 'home', activity: 'Return from Walk', time: '11:30' },
      ],
      activities: { Walking: 90, Leisure: 600 }
    }
  ];

  const generateUserAdvice = useCallback(() => {
    let advice = '';

    // Analyze activity patterns to provide user advice
    const totalActivities = mockWeeklyRoutine.reduce((acc, day) => {
      Object.entries(day.activities).forEach(([activity, duration]) => {
        acc[activity] = (acc[activity] || 0) + duration;
      });
      return acc;
    }, {});

    const totalMinutes = Object.values(totalActivities).reduce((sum, duration) => sum + duration, 0);
    const workPercentage = (totalActivities.Work || 0) / totalMinutes * 100;
    const exercisePercentage = ((totalActivities.Jogging || 0) + (totalActivities.Walking || 0)) / totalMinutes * 100;

    if (workPercentage > 50) {
      advice += "You're spending a significant amount of time working. Consider taking regular breaks and prioritizing work-life balance. ";
    }

    if (exercisePercentage < 10) {
      advice += "Your exercise levels seem low. Try to incorporate more physical activity into your routine, aiming for at least 150 minutes of moderate exercise per week. ";
    } else if (exercisePercentage > 20) {
      advice += "Great job on staying active! Keep up the good work with your exercise routine. ";
    }

    // Analyze location data
    const uniqueLocations = new Set(mockWeeklyRoutine.flatMap(day => day.routes.map(route => route.to)));
    if (uniqueLocations.size <= 3) {
      advice += "Consider exploring new locations to add variety to your routine and potentially boost your mood and creativity. ";
    }

    // Analyze timing of activities
    const hasLateNightActivity = mockWeeklyRoutine.some(day => 
      day.routes.some(route => {
        const hour = parseInt(route.time.split(':')[0]);
        return hour >= 22 || hour < 5;
      })
    );
    if (hasLateNightActivity) {
      advice += "Late-night activities detected. Ensure you're getting enough sleep by maintaining a consistent sleep schedule. ";
    }

    // Metric-specific advice (placeholder - replace with actual metric analysis)
    switch(activeTab) {
      case 'longevity':
        advice += "To improve your longevity score, focus on balanced nutrition, regular exercise, stress management, and good sleep habits. ";
        break;
      case 'vitaminD':
        advice += "Boost your Vitamin D levels by spending time outdoors, especially during midday. Consider a supplement if levels are consistently low. ";
        break;
      case 'cardiovascular':
        advice += "For better cardiovascular health, aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous-intensity aerobic activity per week. ";
        break;
      case 'circadian':
        advice += "Maintain a consistent sleep schedule and limit blue light exposure before bedtime to improve your circadian rhythm. ";
        break;
      case 'airQuality':
        advice += "Be aware of local air quality reports and consider indoor air purifiers if outdoor air quality is poor. ";
        break;
      case 'uvIndex':
        advice += "Protect your skin from harmful UV rays by using sunscreen, wearing protective clothing, and seeking shade during peak sun hours. ";
        break;
    }

    setUserAdvice(advice);
  }, [activeTab, mockWeeklyRoutine]);


  // end of user advice generation

  //  useEffect to generate advice when activeTab changes
  useEffect(() => {
    generateUserAdvice();
  }, [generateUserAdvice, activeTab]);

  useEffect(() => {
    const newMap = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-9.1393, 38.7223], // Lisbon coordinates
      zoom: 11
    });

    newMap.on('load', () => {
      setMapLoaded(true);
      setMap(newMap);

      // Initialize the route source and layer
      newMap.addSource('route', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      newMap.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'interpolate',
            ['linear'],
            ['get', 'score'],
            0, '#ff0000',
            0.5, '#ffff00',
            1, '#00ff00'
          ],
          'line-width': 8
        }
      });
    });

    return () => newMap.remove();
  }, []);

  const getRoute = useCallback(async (start, end) => {
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
      );
      const json = await query.json();
      return json.routes[0].geometry.coordinates;
    } catch (error) {
      console.error('Error fetching route:', error);
      return [];
    }
  }, []);


  const updateMapRoute = useCallback(async (metricId, day = null) => {
    if (!map || !mapLoaded) return;

    let routeFeatures = [];

    try {
      if (day !== null) {
        // Show single day route
        const dayRoutes = mockWeeklyRoutine[day].routes;
        for (let route of dayRoutes) {
          let coordinates;
          if (route.from === 'joggingroute' || route.to === 'joggingroute') {
            coordinates = locations.joggingroute;
          } else {
            coordinates = await getRoute(locations[route.from], locations[route.to]);
          }
          routeFeatures.push({
            type: 'Feature',
            properties: {
              score: Math.random(), // Replace with actual score based on metricId
              activity: route.activity
            },
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          });
        }
      } else {
        // Show week route
        for (let day of mockWeeklyRoutine) {
          for (let route of day.routes) {
            let coordinates;
            if (route.from === 'joggingroute' || route.to === 'joggingroute') {
              coordinates = locations.joggingroute;
            } else {
              coordinates = await getRoute(locations[route.from], locations[route.to]);
            }
            routeFeatures.push({
              type: 'Feature',
              properties: {
                score: Math.random(), // Replace with actual score based on metricId
                activity: route.activity
              },
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            });
          }
        }
      }

      if (map.getSource('route')) {
        map.getSource('route').setData({
          type: 'FeatureCollection',
          features: routeFeatures
        });

        // Fit the map to the route
        const coordinates = routeFeatures.flatMap(feature => feature.geometry.coordinates);
        const bounds = coordinates.reduce((bounds, coord) => bounds.extend(coord), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        map.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      console.error('Error updating map route:', error);
    }
  }, [map, mapLoaded, getRoute]);

  useEffect(() => {
    if (mapLoaded && map) {
      updateMapRoute(activeTab, selectedDay);
    }
  }, [activeTab, selectedDay, mapLoaded, map, updateMapRoute]);

  const generateWeeklyData = useCallback(() => {
    const indicators = {
      longevity: [75, 78, 80, 82, 79, 81, 83],
      vitaminD: [50, 55, 60, 58, 62, 65, 63],
      cardiovascular: [70, 72, 75, 73, 76, 74, 77],
      circadian: [85, 83, 86, 88, 87, 89, 90],
      airQuality: [60, 65, 62, 58, 63, 67, 64],
      uvIndex: [3, 4, 5, 4, 3, 2, 3]
    };
    return indicators[activeTab] || Array(7).fill(0);
  }, [activeTab]);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: 'Weekly Data',
      font: { size: 14 }
    },
  },
  scales: {
    y: { beginAtZero: true }
  },
  onClick: (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      setSelectedDay(prevDay => prevDay === clickedIndex ? null : clickedIndex);
    }
  }
};

  const createChartData = useCallback((label, color) => {
    const data = generateWeeklyData();
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label,
        data: data, // Keep all data points
        backgroundColor: data.map((_, index) => 
          index === selectedDay ? 'rgba(255, 99, 132, 0.8)' : color
        ),
      }],
    };
  }, [generateWeeklyData, selectedDay]);

  const activityChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Activity Breakdown',
        font: { size: 14 }
      },
    },
  };

  const getActivityChartData = (day = null) => {
    let activities;
    if (day !== null) {
      activities = mockWeeklyRoutine[day].activities;
    } else {
      activities = mockWeeklyRoutine.reduce((acc, day) => {
        Object.entries(day.activities).forEach(([activity, duration]) => {
          acc[activity] = (acc[activity] || 0) + duration;
        });
        return acc;
      }, {});
    }
    return {
      labels: Object.keys(activities),
      datasets: [{
        data: Object.values(activities),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      }],
    };
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">LifeTracker Dashboard</h1>
        </div>
      </header>
      
      <div className="bg-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {devices.map((device, index) => (
            <div key={index} className="flex flex-col items-center">
              <img 
                src={device.logo} 
                alt={`${device.name} logo`} 
                className="w-12 h-12 mb-2 object-contain"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://via.placeholder.com/48?text=' + device.name;
                }}
              />
              <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-2 rounded">
                Import {device.name}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-4">
          <div className="sm:hidden">
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              value={activeTab}
              onChange={(e) => {
                setActiveTab(e.target.value);
                setSelectedDay(null);
              }}
            >
              {metrics.map((metric) => (
                <option key={metric.id} value={metric.id}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-4" aria-label="Tabs">
              {metrics.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => {
                    setActiveTab(metric.id);
                    setSelectedDay(null);
                  }}
                  className={`${
                    activeTab === metric.id
                      ? 'bg-gray-200 text-gray-800'
                      : 'text-gray-600 hover:text-gray-800'
                  } px-3 py-2 font-medium text-sm rounded-md`}
                >
                  <metric.icon className="inline-block mr-2" size={16} />
                  {metric.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-2">{metrics.find(m => m.id === activeTab).label}</h2>
              <div className="h-64">
                <Bar 
                  options={chartOptions} 
                  data={createChartData(
                    metrics.find(m => m.id === activeTab).label,
                    metrics.find(m => m.id === activeTab).color
                  )} 
                />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-2">
                Activity Breakdown
                {selectedDay !== null && ` - ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][selectedDay]}`}
              </h2>
              <div className="h-64">
                <Bar options={activityChartOptions} data={getActivityChartData(selectedDay)} />
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Health & Movement Map</h2>
            <div id="map" className="h-[calc(100vh-300px)] w-full rounded"></div>
          </div>
        </div>

          {/* Add this new section to display user advice */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-2">Personalized Advice</h2>
          <p>{userAdvice}</p>
        </div>
      </main>
    </div>
  );
};

export default LifeTrackerMockup;