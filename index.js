const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
  });
};

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
    .map((slot) => new Date(slot.timestamp));
};

const draw = async () => {
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const error = document.getElementById('error');
  const appointmentsList = document.getElementById('appointmentsList');
  const locationIdSpan = document.getElementById('locationId');

  // Show loading, hide others
  loading.classList.remove('hidden');
  results.classList.add('hidden');
  error.classList.add('hidden');

  try {
      const params = getQueryParams();
      locationIdSpan.textContent = params.get('locationId');
      
      const availableAppointments = await getAvailableAppointments();
      
      appointmentsList.innerHTML = '';
      
      if (availableAppointments.length === 0) {
          appointmentsList.innerHTML = `
              <li class="py-3 text-center text-gray-500">
                  No appointments available
              </li>
          `;
      } else {
          availableAppointments.forEach(time => {
              const li = document.createElement('li');
              li.className = 'py-3 flex items-center';
              li.innerHTML = `
                  <span class="text-gray-800">${formatTime(new Date(time))}</span>
              `;
              appointmentsList.appendChild(li);
          });
      }

      // Hide loading, show results
      loading.classList.add('hidden');
      results.classList.remove('hidden');

  } catch (err) {
      // Show error state
      loading.classList.add('hidden');
      error.classList.remove('hidden');
      document.getElementById('errorMessage').textContent = 
          `Error loading appointments: ${err.message}`;
  }
};

const setupAutoReload = () => {
  const autoReloadCheckbox = document.getElementById('autoReload');
  let intervalId;

  autoReloadCheckbox.addEventListener('change', () => {
    if (autoReloadCheckbox.checked) {
      intervalId = setInterval(() => {
        // Show loading spinner before reloading
        document.getElementById('loading').classList.remove('hidden');
        draw();
      }, 15000);
    } else {
      clearInterval(intervalId);
    }
  });
};

draw();
setupAutoReload();
