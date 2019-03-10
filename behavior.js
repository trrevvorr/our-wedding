let QUERY_RESPONSE = [];

// #region RSVPSubmitGuest

function RSVPSubmitGuest() {
	displayRsvpLoadingOverlay();
	clearRsvpErrorState();
	const form = document.querySelector("#guest-info-form");
	const firstName = form.querySelector("#first-name-field").value;
	const lastName = form.querySelector("#last-name-field").value;
	let queryParams = new URLSearchParams(window.location.search);
	let key = queryParams.get("key");
	key = key === null ? "" : key;

	let request =
		getFirebaseUrl() +
		`findGuest?firstName=${firstName}&lastName=${lastName}&key=${key}`;
	var xhttp = new XMLHttpRequest();
	xhttp.addEventListener("load", guestRequestDone);
	xhttp.addEventListener("error", rsvpLoadError);
	xhttp.addEventListener("abort", rsvpLoadError);
	xhttp.open("GET", request, true);
	xhttp.send();

	return false;
}

function rsvpLoadError() {
	setRsvpErrorState();
	hideRsvpLoadingOverlay();
}

function guestRequestDone(event) {
	if (event.currentTarget.status === 200) {
		// success !
		parseResponseType(JSON.parse(event.currentTarget.response));
		hideRsvpLoadingOverlay();
	} else {
		// couldn't find guest
		rsvpLoadError();
	}
}

function parseResponseType(response) {
	QUERY_RESPONSE = response;

	if (response.length === 0) {
		// no families returned
		rsvpLoadError();
	} else if (response.length === 1) {
		// single family returned, continue to RSVP
		setFamilyForm(response[0]);
	} else {
		chooseFamilyForm(response);
	}
}

//#endregion

// #region chooseFamilyForm

function chooseFamilyForm(response) {
	setFormState("choose-family");
	let familyItemsNode = document.querySelector("#family-items");

	response.forEach((family, index) => {
		let itemNode = buildFamilyItem(family, index);
		familyItemsNode.appendChild(itemNode);
	});
}

function buildFamilyItem(family, index) {
	family = family.family;

	let familyItemNode = document.importNode(
		document.querySelector("#family-item-template").content,
		true
	);

	// menu-item radio field
	setField(
		familyItemNode.querySelector(".family-item"),
		"family-item-" + index,
		undefined,
		undefined,
		undefined,
		undefined,
		family.name
	);

	return familyItemNode;
}

function RSVPChooseFamily() {
	let selectedFamilyId = document.querySelector(
		"#choose-family-form input:checked"
	).id;
	let index = selectedFamilyId.slice(selectedFamilyId.length - 1);
	index = parseInt(index);

	parseResponseType([QUERY_RESPONSE[index]]);
	return false;
}

/**
 * sets data on passed in field such as id, value, etc.
 * @param node dom input node to set data on,
 * 				should be one of input type = text, radio, etc.
 * 				should have a single input child and a single label child
 * @param {string} id set as node's ID, should be unique to DOM
 * @param {string} value set as node's value, used primarily for text in text fields
 * @param {bool} checked set as node's checked state, used for checkboxes and radios
 * @param {string} name set as node's name, used for radios
 * @param {bool} disabled set as node's disabled state, used for all input types
 * @param {string} textContent set as node's textContent, used for labels of all input types
 * @param {string} dataId set as node's data-id, used for input id reference
 */
function setField(
	node,
	id,
	value,
	checked,
	name,
	disabled,
	textContent,
	dataId
) {
	let label = node.querySelector("label");
	if (typeof id !== "undefined") {
		label.setAttribute("for", id);
	}
	if (typeof textContent !== "undefined") {
		label.textContent = textContent;
	}

	let input = node.querySelector("input");
	if (typeof id !== "undefined") {
		input.id = id;
	}
	if (typeof value !== "undefined") {
		input.value = value;
	}
	if (typeof checked !== "undefined") {
		input.checked = checked;
	}
	if (typeof name !== "undefined") {
		input.name = name;
	}
	if (typeof disabled !== "undefined") {
		input.disabled = disabled;
	}
	if (typeof dataId !== "undefined") {
		input.setAttribute("data-id", dataId);
	}
}

//#endregion

// #region setFamilyForm

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
	let memberNode = document.importNode(
		document.querySelector("#family-member-template").content,
		true
	);

	// family member
	memberNode.querySelector(".family-member").id = familyMember.id;

	// guest name field
	setField(
		memberNode.querySelector(".guest-name"),
		"guest-name-" + index,
		familyMember.firstName + " " + familyMember.lastName,
		undefined,
		undefined,
		!familyMember.plusOne
	);

	// accept radio field
	setField(
		memberNode.querySelector(".accept-radio"),
		"accept-" + index,
		undefined,
		familyMember.attending,
		"attending-radio-" + index
	);

	// decline radio field
	setField(
		memberNode.querySelector(".decline-radio"),
		"decline-" + index,
		undefined,
		!familyMember.attending,
		"attending-radio-" + index
	);

	// menu radios
	let menuNode = memberNode.querySelector("fieldset.menu");
	menu.forEach(item => {
		menuNode.appendChild(buildMenu(item, index, familyMember.food));
	});

	return memberNode;
}

function buildMenu(item, index, choice) {
	let menItemNode = document.importNode(
		document.querySelector("#menu-item-template").content,
		true
	);

	// menu-item radio field
	setField(
		menItemNode.querySelector(".menu-item"),
		item.id + "-" + index,
		undefined,
		choice === item.id,
		"menu-item-" + index,
		undefined,
		item.title,
		item.id
	);

	return menItemNode;
}

function RSVPSubmitFamily() {
	try {
		let familyMmeberNodes = document.querySelectorAll(
			"#family-info-form .family-member"
		);

		let members = Array.from(familyMmeberNodes).map(node =>
			getFamilyMember(node)
		);
		let url = getFirebaseUrl() + "saveGuests";

		$.post(url, { members })
			.done(RSVPSubmitFamilySuccess)
			.fail(RSVPSubmitFamilyFailure);

		// $.ajax({
		// 	type: "POST",
		// 	url: url,
		// 	data: members,
		// 	success: RSVPSubmitFamilySuccess,
		// 	dataType: RSVPSubmitFamilyFailure
		// });
	} catch (error) {
		console.log(error);
	} finally {
		return false;
	}
}

function getFamilyMember(node) {
	let id = node.id;
	let { firstName, lastName } = getName(node);
	let attending = getAttending(node);
	let food = getFoodChoice(node);
	return { id, firstName, lastName, attending, food };
}

function getName(node) {
	let name = node.querySelector(".guest-name input").value;
	name = name.trim();
	let names = name.split(" ");
	let firstName = names.length > 0 ? names[0] : "";
	let lastName = names.length > 1 ? names[1] : "";

	return { firstName, lastName };
}

function getAttending(node) {
	return node.querySelector(".accept-radio input").checked;
}

function getFoodChoice(node) {
	return node.querySelector(".menu input:checked").getAttribute("data-id");
}

function RSVPSubmitFamilySuccess() {
	alert("Success!");
}

function RSVPSubmitFamilyFailure() {
	alert("Failure:(");
}

// #endregion

// #region modify RSVP state

let CURR_RSVP_STATE = "guest";

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

//#endregion

// #region shared

function getFirebaseUrl() {
	let queryParams = new URLSearchParams(window.location.search);
	let useFirebaseServe = queryParams.get("useServe");
	// user local firebase serve for local testing
	let url = `https://us-central1-nancy-trevor-wedding.cloudfunctions.net/`;
	if (useFirebaseServe) {
		url = `http://localhost:5000/nancy-trevor-wedding/us-central1/`;
	}
	return url;
}
// #endregion
