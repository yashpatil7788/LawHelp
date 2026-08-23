import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // optional loading state

  useEffect(() => {
    const handleSession = async (session) => {
      const authUser = session?.user;
      if (authUser) {
        const { data: userData } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
        
        // Merge auth + Firestore info
        setUser({
          uid: authUser.id,
          email: authUser.email,
          displayName: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
          ...(userData || {}),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};

export default useAuth;
