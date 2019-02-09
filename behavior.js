function RSVPSubmitName() {
	alert("Submitted");
	var inputs = document.querySelectorAll(".field input");
	inputs.forEach((input) => input.value = null);
	return false;
}
