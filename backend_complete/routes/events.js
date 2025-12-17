import express from "express";
import { poolDirect } from "../db.js";

const router = express.Router();

// GET /api/events?q=&location=&date=
router.get("/", async (req, res) => {
  try {
    const { q, location, date } = req.query;

    let sql = "SELECT * FROM events WHERE 1=1";
    const params = [];

    if (q) {
      sql += " AND title LIKE ?";
      params.push(`%${q}%`);
    }

    if (location) {
      sql += " AND location LIKE ?";
      params.push(`%${location}%`);
    }

    if (date) {
      sql += " AND date >= ? AND date < DATE_ADD(?, INTERVAL 1 DAY)";
      params.push(`${date} 00:00:00`, `${date} 00:00:00`);
    }

    sql += " ORDER BY date ASC";

const [rows] = await poolDirect.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Erreur /api/events :", err);
    res.status(500).json({ message: "Erreur serveur événements" });
  }
});

export default router;
