import React, { useEffect, useState } from "react";
import { supabase, useFirebase } from "../context/firebase";
import Navbar from "./Navbar";
import { Check, Edit3, X, Camera } from "lucide-react";
import LawyerDashboard from "./LawyerDashboard";

const UserProfile = () => {
  const { currentUser, loading: authLoading, uploadProfileImage } = useFirebase();
  const [userData, setUserData] = useState(null);
  const [chatSummaries, setChatSummaries] = useState([]);
  const [docExplanations, setDocExplanations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activityError, setActivityError] = useState("");
  const [editData, setEditData] = useState({ name: "", phone: "", location: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      if (!currentUser) {
        console.warn("❌ No user logged in.");
        setLoading(false);
        return;
      }

      try {
        const profileResult = await supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
        if (profileResult.error) throw profileResult.error;

        const profileData = profileResult.data || {};
        setUserData(profileData);

        if (profileData.user_type === "lawyer") {
          setLoading(false);
          return;
        }

        setEditData({
          name: profileData.name || currentUser.displayName || "",
          phone: profileData.phone || profileData.contact || "",
          location: profileData.location || "",
        });

        const [chatbotResult, docsResult] = await Promise.all([
          supabase.from("chatbots").select("chats").eq("user_id", currentUser.id).maybeSingle(),
          supabase.from("documents").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(2),
        ]);

        if (chatbotResult.error) throw chatbotResult.error;
        if (docsResult.error) throw docsResult.error;

        if (chatbotResult.data) {
          const chats = chatbotResult.data.chats || [];
          const recentChats = chats.slice(-2).reverse(); // last 2 chats
          setChatSummaries(recentChats);
        }

        const explanations = [];
        docsResult.data.forEach(data => {
          const explanation = data.explanation || data.summary || data.answer;
          if (data.file_name || explanation) {
            explanations.push({
              fileName: data.file_name || data.fileName || "Document",
              answer: (explanation || "Document uploaded successfully").slice(0, 150) + "...",
            });
          }
        });
        setDocExplanations(explanations.slice(0, 2)); // last 2 explanations
      } catch (error) {
        console.error("Error fetching profile:", error);
        setActivityError(error.message || "Could not load recent activity.");
      }

      setLoading(false);
    };

    // Only fetch when auth loading is done
    if (!authLoading) fetchAllData();
  }, [currentUser, authLoading]);

  const handleEditChange = (event) => {
    setEditData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveError("Please choose an image file.");
      return;
    }
    setSaveError("");
    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    setSaveError("");
    try {
      const updatedData = {
        uid: currentUser.id,
        email: currentUser.email || userData?.email || "",
        name: editData.name.trim(),
        phone: editData.phone.trim(),
        location: editData.location.trim(),
        updated_at: new Date().toISOString(),
      };
      if (profileImage) {
        updatedData.photo_url = await uploadProfileImage(currentUser.id, profileImage);
      }
      const { error } = await supabase.from("profiles").upsert({ id: currentUser.id, ...updatedData });
      if (error) throw error;
      setUserData((current) => ({ ...current, ...updatedData }));
      setProfileImage(null);
      setProfileImagePreview("");
      setEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveError(error.message || "Profile could not be saved. Check your Supabase policies.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-teal-600 text-xl font-medium">Loading profile...</div>
    </div>
  );

  if (userData?.user_type === "lawyer") {
    return <LawyerDashboard />;
  }

  // Function to truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <>
        <Navbar/>
    <div className="flex h-screen bg-slate-50">
        
      {/* Left half - Profile section */}
      <div className="w-1/2 flex flex-col bg-teal-700 text-white ml-2">
        {/* Large profile image */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative w-64 h-64 rounded-full border-4 border-slate-200 overflow-hidden shadow-lg">
            <img
              src={userData?.photo_url || "/api/placeholder/400/400"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* User details at bottom */}
        <div className="p-8 bg-teal-800">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 className="text-3xl font-bold">{userData?.name || currentUser?.displayName || "User Name"}</h2>
            <button
              onClick={() => { setSaveError(""); setEditing(true); }}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white/15 hover:bg-white/25 border border-white/30"
            >
              <Edit3 size={15} /> Edit
            </button>
          </div>
          {editing && (
            <div className="mb-6 p-4 bg-white text-slate-800">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <img
                    src={profileImagePreview || userData?.photo_url || "/api/placeholder/96/96"}
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover border border-slate-200"
                  />
                  <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 text-slate-700 cursor-pointer hover:bg-slate-50">
                    <Camera size={15} />
                    Change photo
                    <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                  </label>
                </div>
                <input className="field" name="name" placeholder="Full name" value={editData.name} onChange={handleEditChange} />
                <input className="field" name="phone" placeholder="Phone number" value={editData.phone} onChange={handleEditChange} />
                <input className="field" name="location" placeholder="Location" value={editData.location} onChange={handleEditChange} />
              </div>
              {saveError && <p className="mt-3 text-sm text-red-600">{saveError}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-3 py-2 text-sm bg-teal-700 text-white disabled:opacity-60">
                  <Check size={15} /> {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditing(false)} disabled={saving} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 text-slate-700">
                  <X size={15} /> Cancel
                </button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-center bg-teal-900/40 p-3 rounded-lg">
              <span className="w-24 text-teal-200 font-medium">Email:</span>
              <span className="text-white">{userData?.email || currentUser?.email || "Email not available"}</span>
            </div>
            <div className="flex items-center bg-teal-900/40 p-3 rounded-lg">
              <span className="w-24 text-teal-200 font-medium">Phone:</span>
              <span className="text-white">{userData?.phone || userData?.contact || "Not specified"}</span>
            </div>
            <div className="flex items-center bg-teal-900/40 p-3 rounded-lg">
              <span className="w-24 text-teal-200 font-medium">Location:</span>
              <span className="text-white">{userData?.location || "Not specified"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right half - Recent activity */}
      <div className="w-1/2 flex flex-col overflow-y-auto bg-slate-100">
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6 pb-2 border-b-2 border-teal-500">Recent Activity</h2>
          {activityError && <p className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{activityError}</p>}

          {/* Recent Chats */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-teal-700 mb-4 flex items-center bg-teal-50 p-2 rounded-t-lg border-l-4 border-teal-500">
              <span className="mr-2">💬</span>
              Recent Chats with LawBot
            </h3>
            {chatSummaries.length === 0 ? (
              <div className="p-4 rounded-lg bg-white text-slate-600 shadow-sm border border-slate-200">
                No recent chats found.
              </div>
            ) : (
              <div className="space-y-4">
                {chatSummaries.map((chat, i) => (
                  <div key={i} className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                    {chat.messages.map((msg, j) => (
                      <div key={j} className={`mb-2 p-3 rounded-lg ${msg.sender === "user" ? "bg-teal-50 border-l-4 border-teal-400" : "bg-slate-50 border-l-4 border-slate-400"}`}>
                        <p className="text-sm">
                          <span className={`font-medium ${msg.sender === "user" ? "text-teal-600" : "text-slate-700"}`}>
                            {msg.sender === "user" ? "You:" : "LawBot:"}
                          </span>{" "}
                          {truncateText(msg.text, 100)}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Analyzer Results */}
          <div>
            <h3 className="text-lg font-medium text-teal-700 mb-4 flex items-center bg-teal-50 p-2 rounded-t-lg border-l-4 border-teal-500">
              <span className="mr-2">📄</span>
              Document Analysis
            </h3>
            {docExplanations.length === 0 ? (
              <div className="p-4 rounded-lg bg-white text-slate-600 shadow-sm border border-slate-200">
                No analysis results available.
              </div>
            ) : (
              <div className="space-y-4">
                {docExplanations.map((doc, i) => (
                  <div key={i} className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                    <h4 className="font-medium text-teal-600 mb-2 pb-1 border-b border-slate-200">{doc.fileName}</h4>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">{truncateText(doc.answer, 100)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default UserProfile;