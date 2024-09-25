import express from "express";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(cors());

const data = `<h1>SLIMECRAFT</h1> WASD - Move<br> SHIFT - Sprint<br> SPACE - Jump<br> R - Reset Camera<br> U - Toggle UI 0 - Pickaxe<br> 1-8 - Select Block<br> F1 - Save Game<br> F2 - Load Game<br> F10 - Debug Camera<br><br> <h2>PRESS ANY KEY TO START</h2>
`;
app.get("/data", (req, res) => {
    res.json({data:data});
});

app.get("/", (req, res) => {
    res.redirect("https://slimecraftuca.onrender.com/data");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
