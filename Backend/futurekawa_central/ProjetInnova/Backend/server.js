const express = require("express");
const cors = require("cors");
const path = require('path');
const pool = require("./src/config/db");

const authRoutes = require("./src/routes/auth.routes");
const albumsRoutes = require('./src/routes/album.routes');
const photosRoutes = require('./src/routes/photos.routes');
const sharesRoutes = require('./src/routes/shares.routes');
const personsRoutes = require('./src/routes/persons.routes');


const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/auth", authRoutes);
app.use("/api/albums", albumsRoutes);
app.use("/api", photosRoutes);
app.use('/api', sharesRoutes);
app.use('/api', personsRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API en ligne" });
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Erreur DB", err);
  } else {
    console.log("Connexion PostgreSQL OK :", res.rows[0]);
  }
});

app.listen(5000, () => {
  console.log("serveur lancé sur http://localhost:5000");
});