require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// health check
app.get("/", (req, res) => {
  res.send("3D Printer Cloud API Running");
});

// latest data
app.get("/latest", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("power_logs")
      .select("*")
      .order("id", { ascending: false })
      .limit(1);

    if (error) throw error;

    res.json(data[0] || {});
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// history
app.get("/history", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("power_logs")
      .select("*")
      .order("id", { ascending: false })
      .limit(500);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log("Cloud API running on port 3001");
});