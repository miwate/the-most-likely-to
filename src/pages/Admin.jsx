import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase, photoUrl } from "../supabase";
import { toast } from "sonner";
import Particles from "../components/Particles";
import Blobs from "../components/Blobs";

export default function Admin() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const adminKey = params.get("key");
  const isNew = params.get("new") === "1";

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [copied, setCopied] = useState(false);

  const quizUrl = `${window.location.origin}/quiz/${id}`;
  const adminUrl = `${window.location.origin}/quiz/${id}/admin?key=${adminKey}`;

  // ─── Load & verify ────────────────────
  useEffect(() => {
    (async () => {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

      if (!quizData || quizData.admin_key !== adminKey) {
        setLoading(false);
        return;
      }

      setQuiz(quizData);
      setAuthorized(true);

      const { data: qData } = await supabase
        .from("questions")
        .select("*, choices(*)")
        .eq("quiz_id", id)
        .order("sort_order");

      setQuestions(qData || []);

      const { data: vData } = await supabase
        .from("votes")
        .select("*")
        .eq("quiz_id", id);

      setVotes(vData || []);
      setLoading(false);
    })();
  }, [id, adminKey]);

  // ─── Real-time subscription ───────────
  useEffect(() => {
    if (!authorized) return;

    const channel = supabase
      .channel(`votes-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes", filter: `quiz_id=eq.${id}` },
        (payload) => {
          setVotes((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, authorized]);

  // ─── Computed stats ───────────────────
  const totalPlayers = useMemo(() => {
    const players = new Set(votes.map((v) => v.player_id));
    return players.size;
  }, [votes]);

  const resultsByQuestion = useMemo(() => {
    return questions.map((q) => {
      const qVotes = votes.filter((v) => v.question_id === q.id);
      const total = qVotes.length;

      const choiceResults = q.choices.map((c) => {
        const count = qVotes.filter((v) => v.choice_id === c.id).length;
        return {
          ...c,
          count,
          pct: total > 0 ? Math.round((count / total) * 100) : 0,
        };
      });

      choiceResults.sort((a, b) => b.count - a.count);
      return { ...q, results: choiceResults, totalVotes: total };
    });
  }, [questions, votes]);

  // ─── Copy link ────────────────────────
  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  // ─── Loading ──────────────────────────
  if (loading) {
    return (
      <>
        <Particles />
        <Blobs />
        <div className="page" style={{ justifyContent: "center", minHeight: "100vh" }}>
          <p className="text-ash">Chargement...</p>
        </div>
      </>
    );
  }

  // ─── Unauthorized ─────────────────────
  if (!authorized) {
    return (
      <>
        <Particles />
        <Blobs />
        <div className="page" style={{ justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h2 className="title-lg">Accès refusé</h2>
            <p className="text-ash">Clé admin invalide ou quiz introuvable.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Particles />
      <Blobs />
      <div className="page" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="container">
          {/* Header */}
          <div className="reveal-up" style={{ marginBottom: 28 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => nav("/")} style={{ marginBottom: 12 }}>
              ← Accueil
            </button>
            <h1 className="title-lg">{quiz.title}</h1>
            <p className="text-ash">Tableau de bord</p>
          </div>

          {/* Share links */}
          <div className="glass-card reveal-up" style={{ marginBottom: 24 }}>
            <p className="label">Lien du quiz (à partager)</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input className="input" value={quizUrl} readOnly style={{ flex: 1, fontSize: "0.85rem" }} />
              <button className="btn btn-primary btn-sm" onClick={() => copyLink(quizUrl)}>
                Copier
              </button>
            </div>

            <details>
              <summary className="text-ash" style={{ cursor: "pointer", fontSize: "0.85rem" }}>
                Lien admin (garde-le pour toi)
              </summary>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input className="input" value={adminUrl} readOnly style={{ flex: 1, fontSize: "0.8rem" }} />
                <button className="btn btn-secondary btn-sm" onClick={() => copyLink(adminUrl)}>
                  Copier
                </button>
              </div>
            </details>
          </div>

          {/* Stats overview */}
          <div
            className="reveal-up"
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 28,
              animationDelay: "0.15s",
            }}
          >
            <div className="glass-card" style={{ flex: 1, textAlign: "center" }}>
              <div className="stat-number">{totalPlayers}</div>
              <p className="text-ash" style={{ fontSize: "0.8rem" }}>
                {totalPlayers === 1 ? "participant" : "participants"}
              </p>
            </div>
            <div className="glass-card" style={{ flex: 1, textAlign: "center" }}>
              <div className="stat-number">{questions.length}</div>
              <p className="text-ash" style={{ fontSize: "0.8rem" }}>questions</p>
            </div>
            <div className="glass-card" style={{ flex: 1, textAlign: "center" }}>
              <div className="stat-number">{votes.length}</div>
              <p className="text-ash" style={{ fontSize: "0.8rem" }}>votes</p>
            </div>
          </div>

          {/* Live badge */}
          {totalPlayers > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(60,79,118,0.08)",
                borderRadius: 100,
                padding: "6px 16px",
                marginBottom: 24,
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--dusk)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#2ecc71",
                  animation: "pulse 2s infinite",
                }}
              />
              Résultats en temps réel
              <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
            </div>
          )}

          {/* No votes yet */}
          {totalPlayers === 0 && (
            <div
              className="glass-card reveal-up"
              style={{ textAlign: "center", padding: "40px 24px", marginBottom: 24 }}
            >
              <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>
                En attente des premiers votes...
              </p>
              <p className="text-ash">
                Partage le lien ci-dessus à tes amis pour commencer.
              </p>
            </div>
          )}

          {/* Results per question */}
          {totalPlayers > 0 &&
            resultsByQuestion.map((q, qi) => (
              <div
                key={q.id}
                className="glass-card reveal-up"
                style={{ marginBottom: 20, animationDelay: `${0.1 * qi}s` }}
              >
                <h3 className="title-md" style={{ marginBottom: 16 }}>
                  {q.text}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {q.results.map((c) => (
                    <div key={c.id}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {c.photo_path ? (
                            <img
                              src={photoUrl(c.photo_path)}
                              alt={c.label}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "var(--lavender)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                              }}
                            >
                              {c.label[0]}
                            </div>
                          )}
                          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                            {c.label}
                          </span>
                        </div>
                        <span className="text-ash" style={{ fontSize: "0.8rem" }}>
                          {c.count} ({c.pct}%)
                        </span>
                      </div>
                      <div className="results-bar-track">
                        <div
                          className="results-bar-fill"
                          style={{ width: `${Math.max(c.pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-ash" style={{ fontSize: "0.75rem", marginTop: 10 }}>
                  {q.totalVotes} {q.totalVotes === 1 ? "vote" : "votes"}
                </p>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
