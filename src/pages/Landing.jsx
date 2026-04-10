import { useNavigate } from "react-router-dom";
import Particles from "../components/Particles";
import Blobs from "../components/Blobs";

export default function Landing() {
  const nav = useNavigate();

  return (
    <>
      <Particles />
      <Blobs />
      <div className="page" style={{ justifyContent: "center", minHeight: "100vh" }}>
        <div className="container stagger" style={{ textAlign: "center" }}>
          <p className="pill reveal-up">Entre amis</p>

          <h1 className="title-xl reveal-up">
            Qui est le
            <br />
            <span className="accent-gradient">plus… ?</span>
          </h1>

          <p className="text-ash reveal-up" style={{ fontSize: "1.05rem", fontStyle: "italic", marginBottom: "2.5rem" }}>
            Crée ton quiz, partage le lien, découvre ce que tes amis pensent vraiment.
          </p>

          <button
            className="btn btn-primary btn-lg reveal-up"
            onClick={() => nav("/create")}
          >
            Créer mon quiz
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M12 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
