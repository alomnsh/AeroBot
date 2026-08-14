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
  await respond({ text: `I am very alive!!!\nLatency: ${latency}ms` });
});

app.command('/aerobot-iss', async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 4000 });
    const { latitude, longitude, velocity, visibility } = response.data;
    
    await respond({
      text: `🛰️ *ISS Location Update*\n• *Latitude:* ${Number(latitude).toFixed(4)}\n• *Longitude:* ${Number(longitude).toFixed(4)}\n• *Velocity:* ${Math.round(velocity)} km/h\n• *Visibility:* ${visibility}`
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

app.command('/aerobot-weight', async ({ command, ack, respond }) => {
  await ack();
  
  const earthWeight = parseFloat(command.text.trim());
  if (isNaN(earthWeight) || earthWeight <= 0) {
    await respond({ text: "Please provide a valid Earth weight! Example: \`/aerobot-weight 170\`" });
    return;
  }

  const moonWeight = (earthWeight * 0.166).toFixed(1);
  const marsWeight = (earthWeight * 0.377).toFixed(1);
  const jupiterWeight = (earthWeight * 2.36).toFixed(1);

  await respond({
    text: `🪐 *Planetary Weight for ${earthWeight} lbs/kg*\n• *The Moon:* ${moonWeight} (Featherweight!)\n• *Mars:* ${marsWeight} (Lighter stance)\n• *Jupiter:* ${jupiterWeight} (Intense gravity!)`
  });
});

app.command('/aerobot-help', async ({ ack, respond }) => {
  await ack();
  
  const helpText = ` *AeroBot Commands*\n` +
    `Here is a list of all available commands you can run:\n\n` +
    `• \`/aerobot-ping\` - Checks if the bot is alive and responding.\n` +
    `• \`/aerobot-iss\` - Tells the current coordinates of the ISS, its velocity and visibility.\n` +
    `• \`/aerobot-resistor\` - Calculates the resistance of a resistor from its color bands.\n` +
    `• \`/aerobot-weight [value]\` - Calculates your exact weight on other planets.\n` +
    `• \`/aerobot-help\` - Displays this helpful command directory screen.`;

  await respond({ text: helpText });
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