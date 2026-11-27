const response = http.post(RESTART_URL, { body: "" });
if (!response.ok) {
  throw new Error("Could not request the simulator restart: " + response.status);
}
