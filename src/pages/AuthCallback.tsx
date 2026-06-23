import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "motion/react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automatically picks up the token from the URL hash.
    // We just need to wait for the session to be established.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Session established — go to app
        navigate("/", { replace: true });
      } else if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        // Something went wrong — go to sign-in
        navigate("/signin", { replace: true });
      }
    });

    // Fallback: if onAuthStateChange doesn't fire in 5 seconds, check manually
    const fallback = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/", { replace: true });
      } else {
        navigate("/signin", { replace: true });
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="text-4xl"
      >
        ⚡
      </motion.div>
      <p className="text-muted-foreground text-sm font-medium animate-pulse">
        Signing you in with Google...
      </p>
    </div>
  );
};

export default AuthCallback;
