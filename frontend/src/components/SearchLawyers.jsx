import { useState, useEffect, useRef } from "react";
import GeoMap from "./GeoMap";
import { supabase } from "../context/firebase";
import MultiSelect from "./ui/multiselect";
import LawyerCard from "./LawyerCard";
import Navbar from "./Navbar";
const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090,
};

const radiusOptions = [5, 10, 25, 50, 100, 500]; // in kilometers
const practiceOptions = ["Civil", "Criminal", "Corporate", "Family", "Property", "Labor"];

function SearchLawyers() {
  const [userLocation, setUserLocation] = useState(defaultCenter);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [radius, setRadius] = useState(10);
  const [lawyers, setLawyers] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [searchError, setSearchError] = useState("");
  const searchInputRef = useRef(null);
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [genderFilter, setGenderFilter] = useState("");
  const [experienceMin, setExperienceMin] = useState("");
  const [experienceMax, setExperienceMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [sortOrder, setSortOrder] = useState("asc");

  // Get user's current location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Apply filters whenever lawyers or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [
    lawyers, 
    selectedTypes, 
    genderFilter, 
    experienceMin, 
    experienceMax, 
    priceMin, 
    priceMax,
    sortBy,
    sortOrder
  ]);

  const getUserLocation = () => {
    setLocationError("");
    setLoading(true);
    if (window.isSecureContext && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          searchLawyers(latitude, longitude, radius);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(error.code === 1
            ? "Location access was blocked. Allow location access in your browser, then try again."
            : "Could not get your location. Check that location services are enabled, then try again.");
          searchLawyers(defaultCenter.lat, defaultCenter.lng, radius);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocationError("Location requires browser permission and a secure connection. Open the app at http://localhost:5173.");
      searchLawyers(defaultCenter.lat, defaultCenter.lng, radius);
    }
  };

  const handlePlaceSelect = (feature) => {
    const { lat, lon, formatted } = feature.properties;
    setUserLocation({
      lat,
      lng: lon,
    });
    setSearchQuery(formatted);
    setLocationSuggestions([]);
    searchLawyers(lat, lon, radius);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length < 3) {
      setLocationSuggestions([]);
      return;
    }
    fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(value)}&limit=5&apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`)
      .then((response) => response.json())
      .then((data) => setLocationSuggestions(data.features || []))
      .catch((error) => console.error("Error searching location:", error));
  };

  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value);
    setRadius(newRadius);
    searchLawyers(userLocation.lat, userLocation.lng, newRadius);
  };

  const handleMapClick = (e) => {
    const newLocation = {
      lat: e.lat,
      lng: e.lng,
    };
    setUserLocation(newLocation);
    searchLawyers(newLocation.lat, newLocation.lng, radius);
  };

  const handleTypeChange = (e) => {
    setSelectedTypes(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const searchLawyers = async (lat, lng, radiusKm) => {
    setLoading(true);
    setSearchError("");
    try {
      // Approximate degree distances
      const latDelta = radiusKm / 111.32;
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .gte("latitude", lat - latDelta)
        .lte("latitude", lat + latDelta);
      if (error) throw error;
      const lawyersData = [];
      
      (data || []).forEach((lawyer) => {
        if (lawyer.latitude == null || lawyer.longitude == null) return;
        const distance = calculateDistance(lat, lng, lawyer.latitude, lawyer.longitude);
        if (distance <= radiusKm) {
          lawyersData.push({
            ...lawyer,
            photoURL: lawyer.photo_url,
            consultationFees: lawyer.consultation_fees,
            yearsOfExperience: lawyer.years_of_experience,
            distance: distance.toFixed(1),
          });
        }
      });

      setLawyers(lawyersData);
    } catch (error) {
      console.error("Error searching lawyers:", error);
      setSearchError(error.message || "Could not load lawyers. Check your Supabase table and policies.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...lawyers];
    
    // Filter by practice type
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(lawyer => {
        // Check if there's overlap between selected types and lawyer's types
        return selectedTypes.some(type => lawyer.type && lawyer.type.includes(type));
      });
    }
    
    // Filter by gender
    if (genderFilter) {
      filtered = filtered.filter(lawyer => lawyer.gender === genderFilter);
    }
    
    // Filter by experience
    if (experienceMin) {
      filtered = filtered.filter(lawyer => parseInt(lawyer.yearsOfExperience) >= parseInt(experienceMin));
    }
    if (experienceMax) {
      filtered = filtered.filter(lawyer => parseInt(lawyer.yearsOfExperience) <= parseInt(experienceMax));
    }
    
    // Filter by price
    if (priceMin) {
      filtered = filtered.filter(lawyer => parseFloat(lawyer.consultationFees) >= parseFloat(priceMin));
    }
    if (priceMax) {
      filtered = filtered.filter(lawyer => parseFloat(lawyer.consultationFees) <= parseFloat(priceMax));
    }
    
    // Sort results
    if (sortBy === "distance") {
      filtered.sort((a, b) => {
        return sortOrder === "asc" 
          ? parseFloat(a.distance) - parseFloat(b.distance)
          : parseFloat(b.distance) - parseFloat(a.distance);
      });
    } else if (sortBy === "price") {
      filtered.sort((a, b) => {
        return sortOrder === "asc"
          ? parseFloat(a.consultationFees || 0) - parseFloat(b.consultationFees || 0)
          : parseFloat(b.consultationFees || 0) - parseFloat(a.consultationFees || 0);
      });
    } else if (sortBy === "experience") {
      filtered.sort((a, b) => {
        return sortOrder === "asc"
          ? parseInt(a.yearsOfExperience || 0) - parseInt(b.yearsOfExperience || 0)
          : parseInt(b.yearsOfExperience || 0) - parseInt(a.yearsOfExperience || 0);
      });
    }
    
    setFilteredLawyers(filtered);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setGenderFilter("");
    setExperienceMin("");
    setExperienceMax("");
    setPriceMin("");
    setPriceMax("");
    setSortBy("distance");
    setSortOrder("asc");
  };

  const mapOptions = {
    styles: [
      {
        featureType: "all",
        elementType: "geometry",
        stylers: [{ color: "#f5f5f5" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#c9d6de" }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }]
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#e8f0f5" }]
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#c5e6c0" }]
      }
    ],
    disableDefaultUI: true,
    zoomControl: true,
    scaleControl: true,
    rotateControl: false,
    fullscreenControl: false
  };

  // Function to view lawyer profile details
  const viewLawyerProfile = (lawyerId) => {
    // Navigate to lawyer profile page
    window.location.href = `/lawyer-profile/${lawyerId}`;
  };

  // Function to book appointment with lawyer
  const bookAppointment = (lawyerId) => {
    // Navigate to appointment booking page
    window.location.href = `/book-appointment/${lawyerId}`;
  };
  console.log();
  

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <div className="px-4 md:px-6 pt-5 pb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Find Lawyers Near You</h1>
          <p className="text-sm text-gray-500 mt-1">Discover verified lawyers in your area</p>
        </div>
        
        <div className="p-4 md:p-6">
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Location</label>
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Enter a location"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                />
                {locationSuggestions.length > 0 && (
                  <div className="relative z-20">
                    <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                      {locationSuggestions.map((feature) => (
                        <button key={feature.properties.place_id} type="button" onClick={() => handlePlaceSelect(feature)} className="block w-full text-left px-3 py-2 text-sm hover:bg-teal-50">
                          {feature.properties.formatted}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={getUserLocation}
                  className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Use My Current Location
                </button>
              </div>
            </div>
            {locationError && <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-2">{locationError}</p>}
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar with filters */}
            <div className="md:w-1/3 lg:w-1/4">
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Radius</label>
                  <select
                    value={radius}
                    onChange={handleRadiusChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  >
                    {radiusOptions.map((option) => (
                      <option key={option} value={option}>
                        Within {option} km
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <MultiSelect
                    name="type"
                    label="Practice Areas"
                    options={practiceOptions}
                    value={selectedTypes}
                    onChange={handleTypeChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={experienceMin}
                      onChange={(e) => setExperienceMin(e.target.value)}
                      className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={experienceMax}
                      onChange={(e) => setExperienceMax(e.target.value)}
                      className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={handleSortChange}
                      className="w-3/4 p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="distance">Distance</option>
                      <option value="price">Price</option>
                      <option value="experience">Experience</option>
                    </select>
                    <button 
                      onClick={toggleSortOrder}
                      className="flex-1 p-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      {sortOrder === "asc" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={resetFilters}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
              
              {/* Map in sidebar */}
              <div className="bg-white rounded-lg shadow-md p-4 hidden md:block">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Map View</h2>
                <GeoMap center={userLocation} radiusKm={radius} lawyers={filteredLawyers} height="400px" onLocationChange={(lat, lng) => handleMapClick({ lat, lng })} />
              </div>
            </div>
            
            {/* Main content - Lawyer listings */}
            <div className="md:w-2/3 lg:w-3/4">
              {/* Map for mobile view */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6 md:hidden">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Map View</h2>
                <GeoMap center={userLocation} radiusKm={radius} lawyers={filteredLawyers} height="400px" onLocationChange={(lat, lng) => handleMapClick({ lat, lng })} />
              </div>
            
              {loading ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
                  <p className="mt-2 text-gray-600">Searching for lawyers...</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <h2 className="text-xl font-semibold p-4 bg-teal-50 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-teal-700">{filteredLawyers.length} Lawyers Found</span>
                    <span className="text-sm bg-teal-100 text-teal-800 px-3 py-1 rounded-full">Within {radius} km</span>
                  </h2>
                  
                  {filteredLawyers.length === 0 ? (
                    <div className="p-8 text-center">
                      {searchError ? (
                        <p className="text-red-600">{searchError}</p>
                      ) : (
                        <>
                          <p className="text-gray-700 font-medium">No lawyers found within {radius} km.</p>
                          <p className="mt-2 text-sm text-gray-500">Try increasing the radius, or confirm that a lawyer profile with a map location has been saved in Supabase.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredLawyers.map((lawyer) => (
                        <LawyerCard key={lawyer.id} lawyer={lawyer} />
                      ))}
                    </div>
                  )}
                  
                  {filteredLawyers.length > 5 && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center">
                      <button className="px-4 py-2 flex items-center text-teal-600 hover:text-teal-800 font-medium text-sm transition-colors">
                        Show more lawyers
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>  
          </div>
        </div>
      </div>
    </div>
  );
}
export default SearchLawyers;
