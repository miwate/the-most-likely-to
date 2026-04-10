import Particles from "../components/Particles";
import Blobs from "../components/Blobs";
import Confetti from "../components/Confetti";

export default function Done() {
  return (
    <>
      <Particles />
      <Blobs />
      <Confetti />
      <div
        className="page"
        style={{ justifyContent: "center", minHeight: "100vh" }}
      >
        <div
          className="stagger"
          style={{ textAlign: "center", padding: "2rem" }}
        >
          <h2 className="title-lg reveal-up">Merci d'avoir joué !</h2>
          <p
            className="text-ash reveal-up"
            style={{ fontSize: "1rem", lineHeight: 1.7 }}
          >
            Tes réponses ont bien été enregistrées.
            <br />
            Les résultats ? Ça reste entre nous.
          </p>
        </div>
      </div>
    </>
  );
}
