document.addEventListener("DOMContentLoaded", function () {
  const showAddEventFormBtn = document.getElementById("showAddEventFormBtn");
  const addEventFormContainer = document.getElementById("addEventFormContainer");
  const eventsList = document.getElementById("eventsList");

  // Function to fetch event details by ID
  function fetchEventDetails(eventId) {
      console.log("Fetching event details for event ID:", eventId);
      return fetch(`/events/${eventId}`)
          .then((response) => {
              if (!response.ok) {
                  throw new Error("Failed to fetch event details");
              }
              return response.json();
          })
          .then((eventDetails) => {
              console.log("Event details fetched successfully:", eventDetails);
              return eventDetails;
          })
          .catch((error) => {
              console.error("Error fetching event details:", error);
              alert("Failed to fetch event details. Please try again.");
              throw error; // Rethrow the error to propagate it further if needed
          });
  }

  // Show add event form on button click
  showAddEventFormBtn.addEventListener("click", function () {
      const pin = prompt("Enter Staff PIN:");
      if (pin === "1234") {
          addEventFormContainer.style.display = "block";
      } else {
          alert("Incorrect staff PIN. Access denied.");
      }
  });

  // Add event form submission
  const addEventForm = document.getElementById("addEventForm");
  addEventForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(addEventForm);
      const eventData = Object.fromEntries(formData.entries());
      fetch("/events", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
      })
          .then((response) => {
              if (!response.ok) {
                  throw new Error("Failed to add event");
              }
              return response.json();
          })
          .then((data) => {
              alert("Event added successfully");
              fetchAndDisplayEvents();
              addEventFormContainer.style.display = "none";
              addEventForm.reset();
          })
          .catch((error) => {
              console.error("Error adding event:", error);
              alert("Error adding event. Please try again.");
          });
  });

  // Fetch and display events
  function fetchAndDisplayEvents() {
      fetch("/events")
          .then((response) => response.json())
          .then((events) => {
              eventsList.innerHTML = ""; // Clear existing events

              events.forEach((event) => {
                  const eventItem = createEventItem(event);
                  eventsList.appendChild(eventItem);
              });
          })
          .catch((error) => {
              console.error("Error fetching events:", error);
              alert("Error fetching events. Please try again.");
          });
  }

  fetchAndDisplayEvents();

  // Function to create event item HTML
  function createEventItem(event) {
      const eventItem = document.createElement("div");
      eventItem.classList.add("event-item");

      const eventName = document.createElement("h3");
      eventName.textContent = event.name;

      const eventDescription = document.createElement("p");
      eventDescription.textContent = event.description;

      const eventDate = document.createElement("p");
      eventDate.textContent = new Date(event.date).toLocaleString();

      const eventLocation = document.createElement("p");
      eventLocation.textContent = `Location: ${event.location}`;

      const joinButton = document.createElement("button");
      joinButton.textContent = "Join Event";
      joinButton.addEventListener("click", () => {
          // Handle join event functionality
          alert(`Joined event: ${event.name}`);
      });

      const editButton = document.createElement("button");
      editButton.textContent = "Edit Event";
      editButton.addEventListener("click", () => {
          const pin = prompt("Enter Staff PIN:");
          if (pin === "1234") {
              // Fetch current event details
              fetchEventDetails(event.id).then((eventDetails) => {
                  showEditEventForm(eventDetails, pin);
              });
          } else {
              alert("Incorrect staff PIN. Access denied.");
          }
      });

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete Event";
      deleteButton.addEventListener("click", () => {
          const pin = prompt("Enter Staff PIN:");
          if (pin === "1234") {
              if (confirm(`Are you sure you want to delete the event "${event.name}"?`)) {
                  fetch(`/events/${event.id}`, {
                      method: "DELETE",
                  })
                      .then((response) => {
                          if (!response.ok) {
                              throw new Error("Failed to delete event");
                          }
                          return response.json();
                      })
                      .then(() => {
                          alert("Event deleted successfully");
                          fetchAndDisplayEvents();
                      })
                      .catch((error) => {
                          console.error("Error deleting event:", error);
                          alert("Error deleting event. Please try again.");
                      });
              }
          } else {
              alert("Incorrect staff PIN. Access denied.");
          }
      });

      eventItem.appendChild(eventName);
      eventItem.appendChild(eventDescription);
      eventItem.appendChild(eventDate);
      eventItem.appendChild(eventLocation);
      eventItem.appendChild(joinButton);
      eventItem.appendChild(editButton);
      eventItem.appendChild(deleteButton);

      return eventItem;
  }

  // Function to show edit event form
  function showEditEventForm(eventDetails, pin) {
      const editEventFormContainer = document.createElement("div");
      editEventFormContainer.innerHTML = `
          <form id="editEventForm">
              <input type="hidden" name="eventId" value="${eventDetails.id}">
              <label for="editName">Event Name:</label>
              <input type="text" id="editName" name="name" value="${eventDetails.name}" required><br><br>

              <label for="editDescription">Description:</label>
              <textarea id="editDescription" name="description" required>${eventDetails.description}</textarea><br><br>

              <label for="editDate">Date:</label>
              <input type="datetime-local" id="editDate" name="date" value="${formatDateTime(eventDetails.date)}" required><br><br>

              <label for="editLocation">Location:</label>
              <input type="text" id="editLocation" name="location" value="${eventDetails.location}" required><br><br>

              <label for="editPin">Staff PIN:</label>
              <input type="password" id="editPin" name="pin" required><br><br>

              <button type="submit">Update Event</button>
          </form>
      `;

      editEventFormContainer.querySelector("#editPin").value = pin;

      // Handle form submission for updating events
      const editEventForm = editEventFormContainer.querySelector("#editEventForm");
      editEventForm.addEventListener("submit", function (event) {
          event.preventDefault();

          const formData = new FormData(editEventForm);
          const eventId = formData.get("eventId");
          const pin = formData.get("pin");

          fetch(`/events/${eventId}`, {
              method: "PUT",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify(Object.fromEntries(formData)),
          })
              .then((response) => {
                  if (!response.ok) {
                      throw new Error("Failed to update event");
                  }
                  return response.json();
              })
              .then((data) => {
                  alert(`Event updated successfully with ID: ${eventId}`);
                  // Optionally update UI or reload events list
                  fetchAndDisplayEvents();
              })
              .catch((error) => {
                  console.error("Error updating event:", error);
                  alert("Error updating event. Please try again.");
              });
      });

      // Replace existing content with edit form
      eventsList.innerHTML = "";
      eventsList.appendChild(editEventFormContainer);
  }

  // Function to format date-time
  function formatDateTime(dateTimeString) {
      const date = new Date(dateTimeString);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}T${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
});
