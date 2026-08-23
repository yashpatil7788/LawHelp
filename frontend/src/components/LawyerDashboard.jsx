import React, { useEffect, useState } from "react";
import { supabase, useFirebase } from "../context/firebase";
import Navbar from "./Navbar";
import { Check, X, Edit3, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LawyerDashboard = () => {
  const { currentUser } = useFirebase();
  const navigate = useNavigate();
  const [lawyerData, setLawyerData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  useEffect(() => {
    const fetchLawyerData = async () => {
      if (!currentUser) return;
      try {
        // Fetch lawyer profile
        const { data: profile, error: profileError } = await supabase
          .from("lawyers")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError) throw profileError;
        setLawyerData(profile);

        // Fetch appointments
        const { data: appts, error: apptError } = await supabase
          .from("appointments")
          .select("*")
          .eq("lawyer_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (apptError) throw apptError;
        setAppointments(appts || []);
      } catch (error) {
        console.error("Error fetching lawyer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLawyerData();
  }, [currentUser]);

  const toggleAvailability = async () => {
    if (!lawyerData) return;
    setUpdatingAvailability(true);
    try {
      const newStatus = !lawyerData.availableNow;
      const { error } = await supabase
        .from("lawyers")
        .update({ availableNow: newStatus })
        .eq("id", currentUser.id);

      if (error) throw error;
      setLawyerData((prev) => ({ ...prev, availableNow: newStatus }));
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Failed to update availability.");
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointmentId);

      if (error) throw error;
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointmentId ? { ...appt, status } : appt
        )
      );
    } catch (error) {
      console.error(`Error updating appointment to ${status}:`, error);
      alert("Failed to update appointment status.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-teal-600 text-xl font-medium">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] bg-slate-50">
        {/* Left half - Profile section */}
        <div className="w-1/3 flex flex-col bg-teal-700 text-white ml-2 overflow-y-auto">
          {/* Profile Image */}
          <div className="flex-1 flex items-center justify-center p-8 min-h-[250px]">
            <div className="relative w-48 h-48 rounded-full border-4 border-slate-200 overflow-hidden shadow-lg bg-white flex items-center justify-center">
              {lawyerData?.photo_url ? (
                <img
                  src={lawyerData.photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={64} className="text-teal-200" />
              )}
            </div>
          </div>

          {/* User details at bottom */}
          <div className="p-8 bg-teal-800 flex-grow">
            <div className="flex items-start justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">{lawyerData?.name || currentUser?.displayName || "Lawyer"}</h2>
              <button
                onClick={() => navigate("/lawyer-profile-update")}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white/15 hover:bg-white/25 border border-white/30 rounded transition-colors"
              >
                <Edit3 size={15} /> Edit Profile
              </button>
            </div>

            <div className="mb-6 flex items-center justify-between bg-teal-900/50 p-4 rounded-lg">
              <span className="font-medium text-teal-100">Status</span>
              <button
                onClick={toggleAvailability}
                disabled={updatingAvailability}
                className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${
                  lawyerData?.availableNow
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-gray-400 hover:bg-gray-500 text-white"
                }`}
              >
                {updatingAvailability ? (
                  "Updating..."
                ) : lawyerData?.availableNow ? (
                  <>
                    <CheckCircle size={16} /> Available Now
                  </>
                ) : (
                  <>
                    <XCircle size={16} /> Unavailable
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center bg-teal-900/40 p-3 rounded-lg">
                <span className="w-32 text-teal-200 font-medium text-sm">Experience:</span>
                <span className="text-white text-sm">{lawyerData?.years_of_experience || 0} Years</span>
              </div>
              <div className="flex items-center bg-teal-900/40 p-3 rounded-lg">
                <span className="w-32 text-teal-200 font-medium text-sm">Consultation Fee:</span>
                <span className="text-white text-sm">₹{lawyerData?.consultation_fees || "N/A"}/hr</span>
              </div>
              <div className="flex items-center bg-teal-900/40 p-3 rounded-lg">
                <span className="w-32 text-teal-200 font-medium text-sm">Qualification:</span>
                <span className="text-white text-sm">{lawyerData?.qualification || "N/A"}</span>
              </div>
              <div className="flex flex-col bg-teal-900/40 p-3 rounded-lg gap-2">
                <span className="text-teal-200 font-medium text-sm">Practice Areas:</span>
                <div className="flex flex-wrap gap-2">
                  {lawyerData?.type && lawyerData.type.length > 0 ? (
                    lawyerData.type.map((t, idx) => (
                      <span key={idx} className="bg-teal-600 px-2 py-1 rounded text-xs">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-teal-100">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right half - Appointments activity */}
        <div className="w-2/3 flex flex-col overflow-y-auto bg-slate-100">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6 pb-2 border-b-2 border-teal-500">Consultation Requests</h2>

            {appointments.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-lg shadow-sm border border-slate-200 mt-10">
                <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-800 mb-1">No requests yet</h3>
                <p className="text-slate-500">You don't have any consultation requests at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div key={appt.id} className="p-5 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3 transition-shadow hover:shadow-md">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-teal-800 flex items-center gap-2">
                          {appt.name}
                          <span className="text-xs font-normal px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                            {appt.age} yrs • {appt.gender}
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Requested on: {new Date(appt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        {appt.status === "accepted" ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 font-medium text-sm rounded-full flex items-center gap-1">
                            <Check size={14} /> Accepted
                          </span>
                        ) : appt.status === "rejected" ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 font-medium text-sm rounded-full flex items-center gap-1">
                            <X size={14} /> Rejected
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 font-medium text-sm rounded-full flex items-center gap-1">
                            <Clock size={14} /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <div className="mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Case Type</span>
                        <p className="text-slate-800 font-medium">{appt.case_type}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Query</span>
                        <p className="text-slate-700 mt-1 bg-slate-50 p-3 rounded border border-slate-100 text-sm whitespace-pre-wrap">{appt.query}</p>
                      </div>
                    </div>

                    {(!appt.status || appt.status === "pending") && (
                      <div className="flex gap-3 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => updateAppointmentStatus(appt.id, "accepted")}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Check size={18} /> Accept
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(appt.id, "rejected")}
                          className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <X size={18} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LawyerDashboard;
