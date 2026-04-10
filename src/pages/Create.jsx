import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { supabase } from "../supabase";
import Particles from "../components/Particles";
import Blobs from "../components/Blobs";

// ─── Helpers ────────────────────────────────────
function nameFromFile(f) {
  return f.name.replace(/\.[^.]+$/, "");
}

// ─── Photo Upload Sub-Component ─────────────────
function PhotoBank({ photos, setPhotos }) {
  const [editingId, setEditingId] = useState(null);

  const onDrop = useCallback(
    (accepted) => {
      const newPhotos = accepted.map((file) => ({
        file,
        name: nameFromFile(file),
        preview: URL.createObjectURL(file),
        id: nanoid(6),
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    },
    [setPhotos]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
  });

  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const renamePhoto = (id, newName) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  };

  const commitEdit = () => setEditingId(null);

  const cleanName = (name) =>
    name.replace(/^[\d_]+/, "").replace(/[\d_]+$/, "").replace(/_/g, " ").trim();

  const autoCleanAll = () => {
    setPhotos((prev) => prev.map((p) => ({ ...p, name: cleanName(p.name) || p.name })));
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} />
        <p style={{ margin: 0 }}>
          {isDragActive
            ? "Lache les photos ici..."
            : "Glisse tes photos ici ou clique pour en ajouter"}
        </p>
        <p className="text-ash" style={{ fontSize: "0.8rem", marginTop: 6 }}>
          JPG, PNG, WebP - les noms des fichiers seront utilisés comme prénoms
        </p>
      </div>

      {photos.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={autoCleanAll}>
            Nettoyer les prénoms
          </button>
        </div>
      )}

      {photos.length > 0 && (
        <div className="photo-preview-grid">
          {photos.map((p) => (
            <div key={p.id} className="photo-preview-item">
              <img src={p.preview} alt={p.name} />
              <button
                className="remove-btn"
                onClick={() => removePhoto(p.id)}
                type="button"
              >
                ×
              </button>
              {editingId === p.id ? (
                <input
                  className="photo-preview-name-input"
                  value={p.name}
                  autoFocus
                  onChange={(e) => renamePhoto(p.id, e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                />
              ) : (
                <span
                  className="photo-preview-name"
                  onClick={() => setEditingId(p.id)}
                  title="Cliquer pour modifier"
                >
                  {p.name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Question Editor Sub-Component ──────────────
function QuestionEditor({ question, index, photos, onChange, onRemove }) {
  const updateText = (text) => onChange(index, { ...question, text });

  const toggleChoice = (photoId) => {
    const choices = question.choices.includes(photoId)
      ? question.choices.filter((c) => c !== photoId)
      : question.choices.length < 6
        ? [...question.choices, photoId]
        : question.choices;
    onChange(index, { ...question, choices });
  };

  return (
    <div className="glass-card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
        <span className="label" style={{ margin: 0 }}>Question {index + 1}</span>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => onRemove(index)} style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
          Supprimer
        </button>
      </div>

      <input
        className="input"
        placeholder="Ex: Qui est le plus drôle ?"
        value={question.text}
        onChange={(e) => updateText(e.target.value)}
      />

      <p className="text-ash" style={{ fontSize: "0.8rem", margin: "12px 0 8px" }}>
        Choisis 3 à 6 amis pour cette question :
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {photos.map((p) => {
          const selected = question.choices.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggleChoice(p.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "8px 6px",
                borderRadius: 12,
                border: selected ? "2px solid var(--dusk)" : "2px solid transparent",
                background: selected ? "rgba(60,79,118,0.08)" : "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                minWidth: 60,
              }}
            >
              <img
                src={p.preview}
                alt={p.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  objectFit: "cover",
                  opacity: selected ? 1 : 0.5,
                  transition: "opacity 0.2s",
                }}
              />
              <span style={{ fontSize: "0.7rem", color: selected ? "var(--charcoal)" : "var(--ash)" }}>
                {p.name}
              </span>
            </button>
          );
        })}
      </div>

      {question.choices.length > 0 && question.choices.length < 3 && (
        <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: 8 }}>
          Minimum 3 choix par question
        </p>
      )}
    </div>
  );
}

// ─── Main Create Page ───────────────────────────
export default function Create() {
  const nav = useNavigate();
  const [step, setStep] = useState(0); // 0: photos, 1: questions, 2: publishing
  const [title, setTitle] = useState("Qui est le plus… ?");
  const [photos, setPhotos] = useState([]);
  const [questions, setQuestions] = useState([
    { text: "", choices: [] },
  ]);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { text: "", choices: [] }]);
  };

  const updateQuestion = (index, updated) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── VALIDATION ─────────────────────────
  const canProceedToQuestions = photos.length >= 3;
  const canPublish =
    title.trim() &&
    questions.length > 0 &&
    questions.every((q) => q.text.trim() && q.choices.length >= 3);

  // ─── PUBLISH ────────────────────────────
  const handlePublish = async () => {
    if (!canPublish || publishing) return;
    setPublishing(true);
    setProgress(0);
    setProgressLabel("");
    setStep(2);

    const totalSteps = photos.length + 1 + questions.length;
    let completed = 0;
    const advance = (label) => {
      completed += 1;
      setProgress(Math.round((completed / totalSteps) * 100));
      setProgressLabel(label);
    };

    try {
      const quizId = nanoid(8);
      const adminKey = nanoid(16);

      // 1. Upload all photos
      const photoPathMap = {}; // localId → storage path
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setProgressLabel(`Upload photo ${i + 1} / ${photos.length}...`);
        const ext = photo.file.name.split(".").pop();
        const storagePath = `${quizId}/${photo.id}.${ext}`;
        const { error } = await supabase.storage
          .from("photos")
          .upload(storagePath, photo.file);
        if (error) throw error;
        photoPathMap[photo.id] = storagePath;
        advance(`Upload photo ${i + 1} / ${photos.length}...`);
      }

      // 2. Create quiz
      setProgressLabel("Création du quiz...");
      const { error: quizError } = await supabase
        .from("quizzes")
        .insert({ id: quizId, admin_key: adminKey, title });
      if (quizError) throw quizError;
      advance("Création du quiz...");

      // 3. Create questions + choices
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        setProgressLabel(`Création de la question ${i + 1} / ${questions.length}...`);
        const { data: qRow, error: qError } = await supabase
          .from("questions")
          .insert({ quiz_id: quizId, text: q.text, sort_order: i })
          .select()
          .single();
        if (qError) throw qError;

        const choiceRows = q.choices.map((photoId) => {
          const photo = photos.find((p) => p.id === photoId);
          return {
            question_id: qRow.id,
            label: photo?.name || "???",
            photo_path: photoPathMap[photoId] || null,
          };
        });

        const { error: cError } = await supabase
          .from("choices")
          .insert(choiceRows);
        if (cError) throw cError;
        advance(`Création de la question ${i + 1} / ${questions.length}...`);
      }

      // 4. Done - redirect to success screen with links
      setProgress(100);
      setProgressLabel("Quiz prêt !");
      toast.success("Quiz créé !");
      nav(`/quiz/${quizId}/admin?key=${adminKey}&new=1`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur : " + (err.message || "Impossible de créer le quiz"));
      setPublishing(false);
      setStep(1);
    }
  };

  return (
    <>
      <Particles />
      <Blobs />
      <div className="page" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="container">
          {/* Header */}
          <div className="reveal-up" style={{ marginBottom: 32 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => nav("/")} style={{ marginBottom: 16 }}>
              ← Retour
            </button>
            <h1 className="title-lg">Créer un quiz</h1>
            <p className="text-ash">
              {step === 0 && "Commence par ajouter les photos de tes amis."}
              {step === 1 && "Ajoute tes questions et choisis les participants."}
              {step === 2 && "Publication en cours..."}
            </p>
          </div>

          {/* Progress */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
            {["Photos", "Questions", "Publier"].map((label, i) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: i <= step ? "var(--dusk)" : "var(--oak-light)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>

          {/* ─── STEP 0: Photos ───────────── */}
          {step === 0 && (
            <div>
              <div className="field">
                <label className="label">Titre du quiz</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Qui est le plus… ?"
                />
              </div>

              <div className="field">
                <label className="label">Photos des amis ({photos.length})</label>
                <PhotoBank photos={photos} setPhotos={setPhotos} />
              </div>

              {!canProceedToQuestions && photos.length > 0 && (
                <p className="text-ash" style={{ fontSize: "0.85rem", marginBottom: 12 }}>
                  Il faut au moins 3 amis pour continuer.
                </p>
              )}

              <button
                className="btn btn-primary btn-block"
                disabled={!canProceedToQuestions}
                onClick={() => setStep(1)}
              >
                Continuer vers les questions →
              </button>
            </div>
          )}

          {/* ─── STEP 1: Questions ────────── */}
          {step === 1 && (
            <div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setStep(0)}
                style={{ marginBottom: 16 }}
              >
                ← Modifier les photos
              </button>

              {questions.map((q, i) => (
                <QuestionEditor
                  key={i}
                  question={q}
                  index={i}
                  photos={photos}
                  onChange={updateQuestion}
                  onRemove={removeQuestion}
                />
              ))}

              <button
                className="btn btn-secondary btn-block"
                onClick={addQuestion}
                style={{ marginBottom: 16 }}
              >
                + Ajouter une question
              </button>

              <button
                className="btn btn-primary btn-block btn-lg"
                disabled={!canPublish}
                onClick={handlePublish}
              >
                Publier le quiz
              </button>

              {!canPublish && (
                <p className="text-ash" style={{ fontSize: "0.8rem", textAlign: "center", marginTop: 10 }}>
                  Chaque question doit avoir un texte et au moins 3 choix.
                </p>
              )}
            </div>
          )}

          {/* ─── STEP 2: Publishing ──────── */}
          {step === 2 && (
            <div className="publish-progress">
              <div className="publish-progress-track">
                <div className="publish-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div>
                <p className="publish-progress-label">{progressLabel}</p>
                <p className="publish-progress-pct">{progress} %</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
