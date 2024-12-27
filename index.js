const getDefaultParams = () => {
  return {
    locationId: 5020,
    startTimestamp: "today",
    endTimestamp: "tomorrow",
  };
};

const getQueryParams = () => {
  const defaultParams = getDefaultParams();
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(defaultParams)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }

  window.history.replaceState({}, "", url);
  return url.searchParams;
};

const getApiTimestamp = (dateLike) => {
  const today = new Date();
  const exactTomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const tomorrow = new Date(
    exactTomorrow.getFullYear(),
    exactTomorrow.getMonth(),
    exactTomorrow.getDate()
  );
  if (dateLike === "today") {
    dateLike = today;
  } else if (dateLike === "tomorrow") {
    dateLike = tomorrow;
  }
  const date = new Date(dateLike);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getEndpoint = () => {
  const params = getQueryParams();
  const endpoint = new URL(
    `https://ttp.cbp.dhs.gov/schedulerapi/locations/${params.get(
      "locationId"
    )}/slots`
  );
  endpoint.searchParams.set(
    "startTimestamp",
    getApiTimestamp(params.get("startTimestamp"))
  );
  endpoint.searchParams.set(
    "endTimestamp",
    getApiTimestamp(params.get("endTimestamp"))
  );
  return endpoint;
};

const getAvailableAppointments = async () => {
  const response = await fetch(getEndpoint(getQueryParams()));
  const data = await response.json();
  return data
    .filter((slot) => slot.active)
    .map((slot) => new Date(slot.timestamp))
    .map((timestamp) => `${timestamp.getHours()}:${timestamp.getMinutes()}`);
};

const draw = async () => {
  const params = getQueryParams();
  const availableAppointments = await getAvailableAppointments();
  if (availableAppointments.length === 0) {
    availableAppointments.push("No appointments available");
  }
  document.write(`
<pre>
Following appointments available:
${availableAppointments.join("\n")}
</pre>
      `);
};

draw();
