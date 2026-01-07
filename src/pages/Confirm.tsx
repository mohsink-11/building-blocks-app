import { useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from "react-router-dom";

export default function Confirm() {
  const navigate = useNavigate();

  useEffect(() => {
    // Finalize the email confirmation
    supabase.auth.getSession().finally(() => {
      // Optional: redirect to login page
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Confirming your email… You will be redirected shortly.
    </div>
  );
}
