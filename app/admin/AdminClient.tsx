"use client";

import { useState } from "react";

export default function AdminClient({ leads }: { leads: any[] }) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLeads = leads.filter((lead) => {
    const q = search.toLowerCase();
    return (
      (lead.full_name || "").toLowerCase().includes(q) ||
      (lead.email || "").toLowerCase().includes(q) ||
      (lead.whatsapp || "").toLowerCase().includes(q)
    );
  });

  const handleCopy = (text: string, type: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800&display=swap');
    
    :root {
      --green: #12B76A;
      --green-dark: #027A48;
      --green-light: #D1FADF;
      --ink: #0F172A;
      --surface: #F8FAFC;
      --border: #E2E8F0;
      --border2: #CBD5E1;
      --muted: #475569;
      --muted2: #64748B;
    }

    * { box-sizing: border-box; }
    body { font-family: 'Cabinet Grotesk', sans-serif; background: #fff; color: var(--ink); margin: 0; padding: 0; }
    
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }
    .admin-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.5rem; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
    .admin-title { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; margin: 0; display: flex; align-items: center; gap: 0.75rem; }
    .admin-badge { background: var(--green-light); color: var(--green-dark); padding: 0.25rem 0.75rem; border-radius: 100px; font-size: 0.875rem; font-weight: 700; }
    
    .header-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .admin-search { position: relative; width: 100%; max-width: 320px; }
    .admin-search input { width: 100%; padding: 0.875rem 1rem 0.875rem 2.5rem; border-radius: 12px; border: 1px solid var(--border2); font-family: inherit; font-size: 0.95rem; outline: none; transition: all 0.2s; }
    .admin-search input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(18,183,106,0.1); }
    .admin-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted2); }

    .logout-btn { background: none; border: 1px solid var(--border2); padding: 0.8rem 1.2rem; border-radius: 12px; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: 600; color: var(--muted); transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
    .logout-btn:hover { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }

    .table-wrapper { overflow-x: auto; border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
    table { width: 100%; border-collapse: collapse; text-align: left; white-space: nowrap; }
    th { padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 700; color: var(--muted2); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); background: var(--surface); }
    td { padding: 1rem 1.5rem; font-size: 0.95rem; border-bottom: 1px solid var(--border); color: var(--ink); }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--surface); }
    
    .copy-btn { background: none; border: none; cursor: pointer; color: var(--muted2); display: inline-flex; align-items: center; justify-content: center; padding: 4px; border-radius: 6px; transition: 0.2s; margin-left: 6px; }
    .copy-btn:hover { background: var(--border); color: var(--ink); }
    .copy-btn.copied { color: var(--green); }

    .empty-state { text-align: center; padding: 4rem 1.5rem; color: var(--muted); }
    .empty-icon { width: 48px; height: 48px; color: var(--border2); margin-bottom: 1rem; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="admin-container">
        <header className="admin-header">
          <h1 className="admin-title">
            <img src="/logo-mark.png" alt="Remivo" style={{ height: 24, width: "auto" }} />
            Remivo Admin
            <span className="admin-badge">{filteredLeads.length} Leads</span>
          </h1>
          <div className="header-actions">
            <div className="admin-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </header>

        {filteredLeads.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h3 style={{ fontSize: "1.25rem", color: "var(--ink)", marginBottom: "0.5rem" }}>No leads found</h3>
            <p>We couldn't find any waitlist entries matching your search.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Country</th>
                  <th>Corridor</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const date = lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";
                  return (
                    <tr key={lead.id}>
                      <td style={{ color: "var(--muted)" }}>{date}</td>
                      <td style={{ fontWeight: 600 }}>{lead.full_name}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {lead.email}
                          <button onClick={() => handleCopy(lead.email, "email", lead.id)} className={`copy-btn ${copiedId === `${lead.id}-email` ? 'copied' : ''}`} title="Copy Email">
                            {copiedId === `${lead.id}-email` ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {lead.whatsapp || "-"}
                          {lead.whatsapp && (
                            <button onClick={() => handleCopy(lead.whatsapp, "wa", lead.id)} className={`copy-btn ${copiedId === `${lead.id}-wa` ? 'copied' : ''}`} title="Copy WhatsApp">
                              {copiedId === `${lead.id}-wa` ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td>{lead.country}</td>
                      <td>
                        <span style={{ display: "inline-block", background: "var(--surface)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600 }}>
                          {lead.currency}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
