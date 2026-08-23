import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export { supabase };
export const firebaseAuth = supabase.auth;
export const db = supabase;

const AuthContext = createContext(null);
export const useFirebase = () => useContext(AuthContext);

export const FirebaseProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (active) {
                setCurrentUser(session?.user ?? null);
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user ?? null);
            setLoading(false);
            if (session?.access_token) localStorage.setItem("authToken", session.access_token);
            else localStorage.removeItem("authToken");
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const signinEmail = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { user: data.user, session: data.session };
    };

    const signupEmail = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return { user: data.user, session: data.session };
    };

    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
        return data;
    };

    const signOutUser = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        localStorage.removeItem("authToken");
    };

    const signInAsGuest = async () => {
        throw new Error("Guest sign-in is not enabled in Supabase yet.");
    };

    const uploadProfileImage = async (userId, file) => {
        if (!file) return null;
        const path = `${userId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
        return data.publicUrl;
    };

    return (
        <AuthContext.Provider value={{ signupEmail, signInWithGoogle, signinEmail, uploadProfileImage, currentUser, signOutUser, signInAsGuest, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
