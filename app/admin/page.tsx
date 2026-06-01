import { supabase } from "../../lib/supabase";
import AdminClient from "./AdminClient";

export const metadata = {
  title: "Remivo Admin",
  robots: {
    index: false,
    follow: false,
  },
};

// Ensure Next.js dynamically fetches fresh data on every load.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { data: leads, error } = await supabase
    .from('Waitlist')
    .select('*')
    .order('created_at', { ascending: false });

  console.log("Supabase Fetch Result - Data:", leads);
  console.log("Supabase Fetch Result - Error:", error);

  if (error) {
    return (
      <div style={{ padding: "4rem", fontFamily: "sans-serif", color: "#b91c1c", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Failed to load waitlist data</h2>
        <p style={{ background: "#fee2e2", display: "inline-block", padding: "0.5rem 1rem", borderRadius: "8px" }}>
          {error.message}
        </p>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
          Ensure your Supabase environment variables are loaded and the Waitlist table exists.
        </p>
      </div>
    );
  }

  return <AdminClient leads={leads || []} />;
}
