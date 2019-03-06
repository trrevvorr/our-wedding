let CURR_RSVP_STATE = "guest";

function RSVPSubmitName() {
	displayRsvpLoadingOverlay();
	clearRsvpErrorState();
	const form = document.querySelector("#guest-info-form");
	const firstName = form.querySelector("#first-name-field").value;
	const lastName = form.querySelector("#last-name-field").value;
	const phoneNumber = form.querySelector("#phone-number-field").value;

	const request = `https://us-central1-nancy-trevor-wedding.cloudfunctions.net/findGuest?firstName=${firstName}&lastName=${lastName}&phoneNumber=${phoneNumber}`;
	// const request = `http://localhost:5000/nancy-trevor-wedding/us-central1/findGuest?firstName=${firstName}&lastName=${lastName}&phoneNumber=${phoneNumber}`;

	var xhttp = new XMLHttpRequest();
	xhttp.addEventListener("load", rsvpLoadDone);
	xhttp.addEventListener("error", rsvpLoadError);
	xhttp.addEventListener("abort", rsvpLoadError);
	xhttp.open("GET", request, true);
	xhttp.send();

	return false;
}

function rsvpLoadError(event) {
	setRsvpErrorState();
	hideRsvpLoadingOverlay();
}

function rsvpLoadDone(event) {
	if (event.currentTarget.status === 200) {
		setFormState("family");
		hideRsvpLoadingOverlay();
	} else {
		rsvpLoadError(event);
	}
}

function displayRsvpLoadingOverlay() {
	const rsvpContent = document.querySelector("#RSVP .outer-content");
	rsvpContent.classList.add("loading");
}

function hideRsvpLoadingOverlay() {
	const rsvpContent = document.querySelector("#RSVP .outer-content");
	rsvpContent.classList.remove("loading");
}

function clearRsvpErrorState() {
	const rsvpContent = document.querySelector("#RSVP .form");
	rsvpContent.classList.remove("error");
}

function setRsvpErrorState() {
	const rsvpContent = document.querySelector("#RSVP .form");
	rsvpContent.classList.add("error");
}

function setFormState(state) {
	const rsvpContent = document.querySelector("#RSVP .outer-content");
	rsvpContent.classList.remove(CURR_RSVP_STATE);
	CURR_RSVP_STATE = state;
	rsvpContent.classList.add(CURR_RSVP_STATE);
}