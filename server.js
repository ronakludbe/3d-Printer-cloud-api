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

// COST CALCULATOR
app.get("/cost", async (req, res) => {
  try {
    const start = Number(req.query.start);
    const end = Number(req.query.end);
    const tariff = Number(req.query.tariff || 10);

    if (!start || !end) {
      return res.status(400).json({
        error: "start and end required"
      });
    }

    const { data, error } = await supabase
      .from("power_logs")
      .select("timestamp_ms, power")
      .gte("timestamp_ms", start)
      .lte("timestamp_ms", end)
      .order("timestamp_ms", { ascending: true });

    if (error) throw error;

    if (!data || data.length < 2) {
      return res.json({
        energyUsed: 0,
        cost: 0
      });
    }

    let energyUsed = 0;

    for (let i = 1; i < data.length; i++) {
      const dt = data[i].timestamp_ms - data[i - 1].timestamp_ms;
      const power = data[i - 1].power;

      energyUsed += (power * dt) / 3600000000;
    }

    const cost = energyUsed * tariff;

    res.json({
      energyUsed,
      cost
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});
app.listen(process.env.PORT || 3001, () => {
  console.log("Cloud API running on port 3001");
});