let CURR_RSVP_STATE = "guest";

function RSVPSubmitGuest() {
	displayRsvpLoadingOverlay();
	clearRsvpErrorState();
	const form = document.querySelector("#guest-info-form");
	const firstName = form.querySelector("#first-name-field").value;
	const lastName = form.querySelector("#last-name-field").value;

	const request = `https://us-central1-nancy-trevor-wedding.cloudfunctions.net/findGuest?firstName=${firstName}&lastName=${lastName}`;
	// const request = `http://localhost:5000/nancy-trevor-wedding/us-central1/findGuest?firstName=${firstName}&lastName=${lastName}`;

	var xhttp = new XMLHttpRequest();
	xhttp.addEventListener("load", guestRequestDone);
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

function guestRequestDone(event) {
	if (event.currentTarget.status === 200) {
		// success !
		setFamilyForm(JSON.parse(event.currentTarget.response));
		hideRsvpLoadingOverlay();
	} else {
		// couldn't find guest
		rsvpLoadError(event);
	}
}

function setFamilyForm(response) {
	const family = response.family;
	const menu = response.menu;
	let familyMembersNode = document.querySelector("#family-members");

	setFormState("family");
	setFamilyName(family.name);
	family.members.forEach((member, index) => {
		let memberNode = buildFamilyMember(member, menu, index);
		familyMembersNode.appendChild(memberNode);
	});
}

function setFamilyName(name) {
	document.querySelector("#family-title").textContent = name;
}

function buildFamilyMember(familyMember, menu, index) {
	// {firstName: "sandy", lastName: "ross", food: "S51OEa0RJLyL66hxvGKs", attending: true, plusOne: false}
	//0: {title: "Hotdog", id: "S51OEa0RJLyL66hxvGKs"}
	//1: {title: "not Hotdog", id: "vtIyY0LVF6iK2vF0LtMW"}
	let memberNode = document.importNode(document.querySelector("#family-member-template").content, true);

	// guest name field
	let guestNameId = "guest-name-" + index;
	memberNode.querySelector("label[for='guest-name-x']").setAttribute("for", guestNameId)
	let guestInput = memberNode.querySelector("input#guest-name-x")
	guestInput.id = guestNameId;
	guestInput.value = familyMember.firstName + " " + familyMember.lastName;
	guestInput.disabled = !familyMember.plusOne;

	// accept radio field
	let acceptId = "accept-" + index;
	let attendingName = "attending-radio-" + index;
	memberNode.querySelector("label[for='accept-x']").setAttribute("for", acceptId)
	let acceptInput = memberNode.querySelector("input#accept-x");
	acceptInput.id = acceptId;
	acceptInput.name = attendingName;
	acceptInput.checked = familyMember.attending;

	// decline radio field
	let declineId = "decline-" + index;
	memberNode.querySelector("label[for='decline-x']").setAttribute("for", declineId)
	let declineInput = memberNode.querySelector("input#decline-x")
	declineInput.id = declineId;
	declineInput.name = attendingName;
	declineInput.checked = !familyMember.attending;

	// menu radios
	let menuNode = memberNode.querySelector("fieldset.menu");
	menu.forEach((item) => {
		menuNode.appendChild(buildMenu(item, index, familyMember.food));
	});

	return memberNode;
}

function buildMenu(item, index, choice) {
	//0: {title: "Hotdog", id: "S51OEa0RJLyL66hxvGKs"}
	//1: {title: "not Hotdog", id: "vtIyY0LVF6iK2vF0LtMW"}
	let menItemNode = document.importNode(document.querySelector("#menu-item-template").content, true);

	// menu-item radio field
	let menuItemId = item.id + "-" + index;
	let menuName = "menu-item-" + index;
	let menuItemLabel = menItemNode.querySelector("label[for='menu-item-x']");
	menuItemLabel.setAttribute("for", menuItemId);
	menuItemLabel.textContent = item.title;
	let menuItemInput = menItemNode.querySelector("input#menu-item-x");
	menuItemInput.id = menuItemId;
	menuItemInput.name = menuName;
	menuItemInput.checked = choice === item.id;

	return menItemNode;
}

{/* <div class="family-member paper">
	<div class="field">
		<label id="guest-name-x">Guest</label>
		<input class="guest-name-x" type="text">
	</div>
	<fieldset class="attending">
		<span class="radio">
			<input type="radio" id="accept-x" name="attending-radio-x">
			<label for="accept-x">Kindly Accept</label>
		</span>
		<span class="radio">
			<input type="radio" id="decline-x" name="attending-radio-x">
			<label for="decline-x">Regretfully Decline</label>
		</span>
	</fieldset>
</div> */}

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