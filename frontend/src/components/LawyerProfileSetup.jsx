import { useState, useEffect, useRef } from "react";
import { useFirebase, supabase } from "../context/firebase";
import GeoMap from "./GeoMap";
import MultiSelect from "./ui/multiselect";
import { useNavigate } from "react-router-dom";

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090,
};

const practiceOptions = ["Civil", "Criminal", "Corporate", "Family", "Property", "Labor"];

function LawyerProfileSetup({ user, onComplete }) {
  const { uploadProfileImage, currentUser } = useFirebase();
  const activeUser = user || currentUser;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: activeUser?.displayName || activeUser?.user_metadata?.full_name || "",
    email: activeUser?.email || "",
    photoURL: activeUser?.photoURL || "",
    age: "",
    gender: "",
    location: "",
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
    yearsOfExperience: "",
    qualification: "",
    contact: "",
    consultationFees: "",
    type: [],
    profileImage: null,
    degreeImage: null,
  });

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [map, setMap] = useState(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    // Automatically fetch the user's current location
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (window.isSecureContext && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Location access was unavailable. Allow location permission in your browser and try again.");
          updateLocation(defaultCenter.lat, defaultCenter.lng);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      alert("Location requires browser permission and a secure connection. Open the app at http://localhost:5173.");
      updateLocation(defaultCenter.lat, defaultCenter.lng);
    }
  };

  const updateLocation = (latitude, longitude) => {
    setFormData((prevData) => ({
      ...prevData,
      latitude,
      longitude,
    }));
    fetchLocationDetails(latitude, longitude);
  };

  const fetchLocationDetails = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`
      );
      const data = await response.json();
      if (data.features?.length > 0) {
        setFormData((prevData) => ({
          ...prevData,
          location: data.features[0].properties.formatted,
        }));
      }
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };

  const handleMapClick = (e) => {
    const lat = e.lat;
    const lng = e.lng;
    updateLocation(lat, lng);
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

  const selectLocation = (feature) => {
    const { lat, lon, formatted } = feature.properties;
    setSearchQuery(formatted);
    setLocationSuggestions([]);
    setFormData((current) => ({ ...current, location: formatted, latitude: lat, longitude: lon }));
  };

  const handleChange = (e) => {
    // For file inputs, capture the file
    if (e.target.type === "file") {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0],
      });
    } else if (e.target.name === "type") {
      // For multi-select, use the selected value
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let photoURL = formData.photoURL;
      let degreeImageURL = null;

      if (formData.profileImage) {
        photoURL = await uploadProfileImage(user.id, formData.profileImage);
      }

      if (formData.degreeImage) {
        degreeImageURL = await uploadProfileImage(user.id, formData.degreeImage);
      }

      const { error } = await supabase.from("lawyers").upsert({
          id: user.id,
          uid: user.id,
          email: user.email || formData.email || "",
          name: formData.name,
          age: formData.age ? Number(formData.age) : null,
          gender: formData.gender,
          contact: formData.contact,
          consultation_fees: formData.consultationFees ? Number(formData.consultationFees) : null,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          years_of_experience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : null,
          qualification: formData.qualification,
          type: formData.type,
          photo_url: photoURL,
          degree_image_url: degreeImageURL,
        });
      if (error) throw error;

      if (onComplete) {
        onComplete();
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error updating lawyer profile:", error);
      alert(error.message || "Error updating profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen pt-10 bg-gray-50 p-4">
      <div className="bg-white p-8 w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-2/5 shadow-md rounded-xl border border-gray-200">
        <h2 className="text-3xl font-semibold text-center mb-2">Complete Lawyer Profile</h2>
        <p className="text-center text-gray-500 mb-6">Fill in the details to proceed</p>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 mb-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 shadow-sm"
        />

        <div className="flex gap-4 mb-3">
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            className="w-1/2 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 shadow-sm"
          />

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-1/2 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 shadow-sm"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex gap-4 mb-3">
          <input
            type="tel"
            name="contact"
            placeholder="Contact Number"
            value={formData.contact}
            onChange={handleChange}
            className="w-1/2 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 shadow-sm"
          />

          <input
            type="number"
            name="consultationFees"
            placeholder="Consultation Fees"
            value={formData.consultationFees}
            onChange={handleChange}
            className="w-1/2 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Location:</label>
          <input
            type="text"
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for your location"
            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
          {locationSuggestions.length > 0 && (
            <div className="relative z-20">
              <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                {locationSuggestions.map((feature) => (
                  <button key={feature.properties.place_id} type="button" onClick={() => selectLocation(feature)} className="block w-full text-left px-3 py-2 text-sm hover:bg-teal-50">
                    {feature.properties.formatted}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-md overflow-hidden h-36 border border-gray-200 mb-3">
          <GeoMap center={{ lat: formData.latitude, lng: formData.longitude }} height="144px" onLocationChange={(lat, lng) => updateLocation(lat, lng)} />
        </div>

        <div className="flex gap-4 mb-3">
          <input
            type="number"
            name="yearsOfExperience"
            placeholder="Years of Experience"
            value={formData.yearsOfExperience}
            onChange={handleChange}
            className="w-1/2 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
          <input
            type="text"
            name="qualification"
            placeholder="Qualification"
            value={formData.qualification}
            onChange={handleChange}
            className="w-1/2 p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>

        <MultiSelect
          name="type"
          label="Practice Type(s):"
          options={practiceOptions}
          value={formData.type}
          onChange={handleChange}
        />

        {[
          { label: "Upload Profile Image", name: "profileImage" },
          { label: "Upload Degree Certificate", name: "degreeImage" },
        ].map(({ label, name }) => (
          <div key={name} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
            <input
              type="file"
              name={name}
              onChange={handleChange}
              className="w-full p-1 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 shadow-sm"
            />
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition-all font-medium shadow"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

export default LawyerProfileSetup;
