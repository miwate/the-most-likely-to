import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Create from "./pages/Create";
import Quiz from "./pages/Quiz";
import Admin from "./pages/Admin";
import Done from "./pages/Done";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/create" element={<Create />} />
      <Route path="/quiz/:id" element={<Quiz />} />
      <Route path="/quiz/:id/admin" element={<Admin />} />
      <Route path="/quiz/:id/done" element={<Done />} />
    </Routes>
  );
}
