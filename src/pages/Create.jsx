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
              <input
                className="photo-preview-name"
                value={p.name}
                onChange={(e) => renamePhoto(p.id, e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  width: 72,
                  textAlign: "center",
                  fontFamily: "inherit",
                }}
              />
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
    setStep(2);

    try {
      const quizId = nanoid(8);
      const adminKey = nanoid(16);

      // 1. Upload all photos
      const photoPathMap = {}; // localId → storage path
      for (const photo of photos) {
        const ext = photo.file.name.split(".").pop();
        const storagePath = `${quizId}/${photo.id}.${ext}`;
        const { error } = await supabase.storage
          .from("photos")
          .upload(storagePath, photo.file);
        if (error) throw error;
        photoPathMap[photo.id] = storagePath;
      }

      // 2. Create quiz
      const { error: quizError } = await supabase
        .from("quizzes")
        .insert({ id: quizId, admin_key: adminKey, title });
      if (quizError) throw quizError;

      // 3. Create questions + choices
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
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
      }

      // 4. Done - redirect to success screen with links
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
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: "3px solid var(--oak-light)",
                  borderTopColor: "var(--dusk)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 20px",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p className="text-ash">Upload des photos et création du quiz...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
