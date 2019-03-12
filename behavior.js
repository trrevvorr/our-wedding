// #region globals

let QUERY_RESPONSE = [];
const ACCEPT_KEY = "accept";
const DECLINE_KEY = "decline";

// #endregion

// #region RSVPSubmitGuest

function RSVPSubmitGuest() {
	try {
		displayRsvpLoadingOverlay();
		clearRsvpErrorState();
		clearRsvpSuccessState();
		const form = document.querySelector("#guest-info-form");
		const firstName = form.querySelector("#first-name-field").value;
		const lastName = form.querySelector("#last-name-field").value;

		let request =
			getFirebaseUrl() +
			`findGuest?firstName=${firstName}&lastName=${lastName}&key=${getKey()}`;
		var xhttp = new XMLHttpRequest();
		xhttp.addEventListener("load", guestRequestDone);
		xhttp.addEventListener("error", rsvpLoadError);
		xhttp.addEventListener("abort", rsvpLoadError);
		xhttp.open("GET", request, true);
		xhttp.send();
	} catch (error) {
		console.log(error);
	} finally {
		return false;
	}
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
	familyItemsNode.innerHTML = "";

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
	setField({
		node: familyItemNode.querySelector(".family-item"),
		id: "family-item-" + index,
		textContent: family.name
	});

	return familyItemNode;
}

function RSVPChooseFamily() {
	try {
		let selectedFamilyId = document.querySelector(
			"#choose-family-form input:checked"
		).id;
		let index = selectedFamilyId.slice(selectedFamilyId.length - 1);
		index = parseInt(index);

		parseResponseType([QUERY_RESPONSE[index]]);
	} catch (error) {
		console.log(error);
	} finally {
		return false;
	}
}

/**
 * sets data on passed in field such as id, value, etc.
 * @param {Object} params input parameter object
 * @param {Object} params.node DOM input node to set data on,
 * 				should be one of input type = text, radio, etc.
 * 				should have a single input child and a single label child
 * @param {string} params.id set as input's `id` attribute (and label's `for` attribute), should be unique to DOM
 * @param {string} [params.value] set as input's `value` attribute, used primarily for text in text fields
 * @param {boolean} [params.checked] set as input's `checked` state, used for checkboxes and radios
 * @param {string} [params.name] set as input's name, used for radios
 * @param {boolean} [params.disabled] set as input's `disabled` state, used for all input types
 * @param {string} [params.textContent] set as label's `textContent` attribute, used for labels of all input types
 * @param {string} [params.dataId] set as input's `data-id` attribute, used for input id reference
 * @param {function} [params.onChange] set as input's `onChange` callback
 */
function setField(params) {
	const {
		node,
		id,
		value,
		checked,
		name,
		disabled,
		textContent,
		dataId,
		onChange
	} = params;

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
	if (typeof onChange !== "undefined") {
		input.addEventListener("change", onChange);
	}
}

//#endregion

// #region setFamilyForm

function setFamilyForm(response) {
	const family = response.family;
	const menu = response.menu;
	let familyMembersNode = document.querySelector("#family-members");
	familyMembersNode.innerHTML = "";

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
	let isAttending = familyMember.attending;

	// family member
	memberNode.querySelector(".family-member").id = familyMember.id;

	// guest name field
	let firstName = familyMember.firstName ? familyMember.firstName : "";
	let lastName = familyMember.lastName ? familyMember.lastName : "";
	let fullName = firstName || lastName ? [firstName, lastName].join(" ") : "";
	setField({
		node: memberNode.querySelector(".guest-name"),
		id: "guest-name-" + index,
		value: fullName,
		disabled: !familyMember.plusOne
	});

	// accept radio field
	setField({
		node: memberNode.querySelector(".accept-radio"),
		id: "accept-" + index,
		checked: isAttending,
		name: "attending-radio-" + index,
		onChange: onAttendanceChange,
		value: ACCEPT_KEY
	});

	// decline radio field
	let notAttending =
		typeof isAttending === "undefined" ? undefined : !isAttending;
	setField({
		node: memberNode.querySelector(".decline-radio"),
		id: "decline-" + index,
		checked: notAttending,
		name: "attending-radio-" + index,
		onChange: onAttendanceChange,
		value: DECLINE_KEY
	});

	// menu radios
	let menuNode = memberNode.querySelector("fieldset.menu");
	menu.forEach(item => {
		menuNode.appendChild(buildMenu(item, index, familyMember.food));
	});

	setFamilyMemberState(memberNode, isAttending);

	return memberNode;
}

function buildMenu(item, index, choice) {
	let menItemNode = document.importNode(
		document.querySelector("#menu-item-template").content,
		true
	);

	// menu-item radio field
	setField({
		node: menItemNode.querySelector(".menu-item"),
		id: item.id + "-" + index,
		checked: choice === item.id,
		name: "menu-item-" + index,
		textContent: item.title,
		dataId: item.id
	});

	return menItemNode;
}

function RSVPSubmitFamily() {
	try {
		displayRsvpLoadingOverlay();
		let familyMmeberNodes = document.querySelectorAll(
			"#family-info-form .family-member"
		);

		let members = Array.from(familyMmeberNodes).map(node =>
			getFamilyMember(node)
		);
		let url = getFirebaseUrl() + "saveGuests";

		$.post(url, { members, key: getKey() })
			.done(RSVPSubmitFamilySuccess)
			.fail(RSVPSubmitFamilyFailure);
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
	let foodChoice = node.querySelector(".menu input:checked");
	if (foodChoice) {
		return foodChoice.getAttribute("data-id");
	} else {
		return "";
	}
}

function RSVPSubmitFamilySuccess() {
	resetRsvpForm();
	setRsvpSuccessState();
}

function RSVPSubmitFamilyFailure() {
	setRsvpErrorState();
	hideRsvpLoadingOverlay();
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

function clearRsvpSuccessState() {
	const rsvpContent = document.querySelector("#RSVP .form");
	rsvpContent.classList.remove("success");
}

function setRsvpSuccessState() {
	const rsvpContent = document.querySelector("#RSVP .form");
	rsvpContent.classList.add("success");
}

function setFormState(state) {
	const rsvpContent = document.querySelector("#RSVP .outer-content");
	rsvpContent.classList.remove(CURR_RSVP_STATE);
	CURR_RSVP_STATE = state;
	rsvpContent.classList.add(CURR_RSVP_STATE);
}

function resetRsvpForm() {
	clearRsvpSuccessState();
	clearRsvpErrorState();
	document.querySelector("#first-name-field").value = "";
	document.querySelector("#last-name-field").value = "";
	hideRsvpLoadingOverlay();
	setFormState("guest");
}

//#endregion

// #region attendance status change handlers

function onAttendanceChange(event) {
	let changedRadio = event.target;
	let familyMemberNode = changedRadio.closest(".family-member");
	const isAttending = changedRadio.value === ACCEPT_KEY;

	setFamilyMemberState(familyMemberNode, isAttending);
}

function setFamilyMemberState(familyMemberNode, isAttending) {
	// name is required if guest is attending
	familyMemberNode.querySelector(".guest-name input").required = isAttending;

	// set disabled state for each menu item
	familyMemberNode.querySelectorAll(".menu-item input").forEach(item => {
		item.disabled = !isAttending;
	});
}

// #endregion

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

function getKey() {
	let queryParams = new URLSearchParams(window.location.search);
	let key = queryParams.get("key");
	key = key === null ? "" : key;
	return key;
}
// #endregion
