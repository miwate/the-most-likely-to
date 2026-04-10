import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, photoUrl } from "../supabase";
import { usePlayer } from "../hooks/usePlayer";
import Particles from "../components/Particles";
import Blobs from "../components/Blobs";

// ─── 3D tilt ──────────────────────────────
function useTilt(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const MX = 10;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const dx = ((e.clientX || e.touches?.[0]?.clientX || 0) - r.left - r.width / 2) / (r.width / 2);
      const dy = ((e.clientY || e.touches?.[0]?.clientY || 0) - r.top - r.height / 2) / (r.height / 2);
      el.style.transform = `perspective(600px) rotateY(${dx * MX}deg) rotateX(${-dy * MX}deg) scale(1.03)`;
    };
    const onLeave = () => {
      el.style.transform = "";
      el.style.transition = "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)";
      setTimeout(() => { if (el) el.style.transition = ""; }, 400);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onLeave);
    };
  }, [ref]);
}

// ─── Choice Card ──────────────────────────
function ChoiceCard({ choice, state, onClick }) {
  const ref = useRef(null);
  useTilt(ref);

  const url = photoUrl(choice.photo_path);
  const cls = `choice-card ${state}`;

  const handleClick = (e) => {
    if (state) return;
    // ripple
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px`;
    e.currentTarget.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
    onClick(choice.id);
  };

  return (
    <div ref={ref} className={cls} onClick={handleClick}>
      <div className="card-photo-wrap">
        {url ? (
          <img src={url} alt={choice.label} loading="lazy" />
        ) : (
          <div className="card-initial" style={{ background: "var(--lavender)" }}>
            {choice.label[0]}
          </div>
        )}
        <div className="checkmark">&#10003;</div>
      </div>
      <span className="card-name">{choice.label}</span>
    </div>
  );
}

// ─── Quiz Page ────────────────────────────
export default function Quiz() {
  const { id } = useParams();
  const nav = useNavigate();
  const { playerId, hasVoted, markVoted } = usePlayer();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [phase, setPhase] = useState("intro"); // intro | playing | submitting
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedMap, setSelectedMap] = useState({}); // questionId -> choiceId
  const [slideClass, setSlideClass] = useState("");

  const mainRef = useRef(null);

  // ─── Load quiz data ─────────────────────
  useEffect(() => {
    if (hasVoted(id)) {
      setPhase("voted");
      setLoading(false);
      return;
    }

    (async () => {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

      if (!quizData) {
        setLoading(false);
        return;
      }
      setQuiz(quizData);

      const { data: qData } = await supabase
        .from("questions")
        .select("*, choices(*)")
        .eq("quiz_id", id)
        .order("sort_order");

      setQuestions(qData || []);
      setLoading(false);
    })();
  }, [id]);

  // ─── Handle choice selection ────────────
  const handleChoice = useCallback(
    async (choiceId) => {
      const q = questions[currentIdx];
      setSelectedMap((prev) => ({ ...prev, [q.id]: choiceId }));

      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          // slide out then in
          setSlideClass("slide-out");
          setTimeout(() => {
            setCurrentIdx((prev) => prev + 1);
            setSlideClass("slide-in");
            setTimeout(() => setSlideClass(""), 500);
          }, 300);
        } else {
          submitVotes({ ...selectedMap, [q.id]: choiceId });
        }
      }, 800);
    },
    [currentIdx, questions, selectedMap]
  );

  // ─── Submit all votes ───────────────────
  const submitVotes = async (finalMap) => {
    setPhase("submitting");

    const rows = Object.entries(finalMap).map(([questionId, choiceId]) => ({
      quiz_id: id,
      question_id: questionId,
      choice_id: choiceId,
      player_id: playerId,
    }));

    await supabase.from("votes").insert(rows);
    markVoted(id);
    nav(`/quiz/${id}/done`);
  };

  // ─── Loading state ──────────────────────
  if (loading) {
    return (
      <>
        <Particles />
        <Blobs />
        <div className="quiz-screen">
          <p className="text-ash">Chargement...</p>
        </div>
      </>
    );
  }

  // ─── Not found ──────────────────────────
  if (!quiz) {
    return (
      <>
        <Particles />
        <Blobs />
        <div className="quiz-screen">
          <div style={{ textAlign: "center" }}>
            <h2 className="title-lg">Quiz introuvable</h2>
            <p className="text-ash">Ce lien ne mène nulle part.</p>
          </div>
        </div>
      </>
    );
  }

  // ─── Already voted ─────────────────────
  if (phase === "voted") {
    return (
      <>
        <Particles />
        <Blobs />
        <div className="quiz-screen">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h2 className="title-lg reveal-up">Tu as déjà voté !</h2>
            <p className="text-ash reveal-up" style={{ animationDelay: "0.2s" }}>
              Un seul vote par personne, c'est la règle.
            </p>
          </div>
        </div>
      </>
    );
  }

  // ─── Intro screen ──────────────────────
  if (phase === "intro") {
    return (
      <>
        <Particles />
        <Blobs />
        <div className="quiz-screen">
          <div className="stagger" style={{ textAlign: "center", padding: "2rem", maxWidth: 480 }}>
            <p className="pill reveal-up">Entre amis</p>
            <h1 className="title-xl reveal-up">
              {quiz.title.includes("…")
                ? <>
                    {quiz.title.split("…")[0]}
                    <br />
                    <span className="accent-gradient">…{quiz.title.split("…")[1]}</span>
                  </>
                : quiz.title
              }
            </h1>
            <p className="text-ash reveal-up" style={{ fontSize: "1.05rem", fontStyle: "italic", marginBottom: "2.5rem" }}>
              Sois honnête, ça reste entre nous.
            </p>
            <button
              className="btn btn-primary btn-lg reveal-up"
              onClick={() => setPhase("playing")}
            >
              C'est parti
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M12 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Playing ───────────────────────────
  const q = questions[currentIdx];
  const progress = (currentIdx / questions.length) * 100;
  const selectedChoice = selectedMap[q?.id];

  return (
    <>
      <Particles />
      <Blobs />
      <div className="quiz-screen">
        <header className="quiz-header">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="counter">
            {currentIdx + 1} / {questions.length}
          </span>
        </header>

        <div ref={mainRef} className={`quiz-main ${slideClass}`}>
          <h2 className="question-text">{q.text}</h2>

          <div className="choices-grid" data-count={q.choices.length}>
            {q.choices.map((choice) => {
              let state = "";
              if (selectedChoice) {
                state = choice.id === selectedChoice ? "selected" : "not-selected";
              }
              return (
                <ChoiceCard
                  key={choice.id}
                  choice={choice}
                  state={state}
                  onClick={handleChoice}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
