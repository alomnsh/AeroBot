require("dotenv").config();
const axios = require("axios");

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

app.command("/aerobot-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command('/aerobot-iss', async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 4000 });
    const { latitude, longitude } = response.data.iss_position;
    
    await respond({
      text: `🛰️ *ISS Location Update*\n• *Latitude:* ${Number(latitude).toFixed(4)}\n• *Longitude:* ${Number(longitude).toFixed(4)}\n• *Status:* Tracking live orbit tracking telemetry!`
    });
  } catch (error) {
    await respond({ text: "Failed to contact the satellite tracking station. Try again later." });
  }
});

app.command('/aerobot-resistor', async ({ command, ack, respond }) => {
  await ack();
  
  const colors = {
    black: 0, brown: 1, red: 2, orange: 3, yellow: 4,
    green: 5, blue: 6, violet: 7, gray: 8, white: 9
  };

  const input = command.text.toLowerCase().trim().split(' ');
  
  if (input.length < 3) {
    await respond({ text: "Please provide at least 3 band colors! Example: `/aero-resistor brown black red`" });
    return;
  }

  const band1 = colors[input[0]];
  const band2 = colors[input[1]];
  const multiplierBand = colors[input[2]];
  
  if (band1 === undefined || band2 === undefined || multiplierBand === undefined) {
    await respond({ text: "Invalid band color. Options: black, brown, red, orange, yellow, green, blue, violet, gray, white." });
    return;
  }

  const digits = `${band1}${band2}`;
  const multiplier = Math.pow(10, multiplierBand);
  const value = Number(digits) * multiplier;
  
  const formattedValue = value >= 1000 ? `${value / 1000}k Ω` : `${value} Ω`;

  await respond({
    text: `*Resistor Calculation*\n• *Bands:* ${input.slice(0,3).join(' ➔ ')}\n• *Value:* ${formattedValue}`
  });
});

app.command('/aerobot-launch', async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get('https://rocketry.dev', { timeout: 4000 });
    const nextLaunch = response.data.launches[0];
    
    const name = nextLaunch.name;
    const rocket = nextLaunch.vehicle.name;
    const site = nextLaunch.pad.location.name;
    const mission = nextLaunch.description || "No public description available.";

    await respond({
      text: `🚀 *Upcoming Orbital Mission*\n• *Payload:* ${name}\n• *Rocket Vehicle:* ${rocket}\n• *Launch Site:* ${site}\n• *Mission details:* ${mission}`
    });
  } catch (error) {
    await respond({ text: "Failed to fetch current manifest from Launch API." });
  }
});

(async () => {
  try {
    await app.start();
    console.log("🚀 Bot is running!");
  } catch (error) {
    console.error("Failed to establish connection:", error.message);
    console.error(error);
  }
})();