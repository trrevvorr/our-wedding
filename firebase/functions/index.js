// deploy with `firebase deploy --only functions`
// test with `firebase serve --only functions`

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();
const DB = admin.firestore();

exports.findGuest = functions.https.onRequest((request, response) => {
	const { firstName, lastName, phoneNumber } = parseGuestQuery(request.query);

	tryGetGuest(response, firstName, lastName, phoneNumber);
});

/**
 * parses findGuest query into discreet pieces
 * @param {object} query object passed in via https request param
 * @returns pieces of query: firstName (string), lastName(string), phoneNumber (number)
 */
function parseGuestQuery(query) {
	return {
		firstName: query.firstName.toLowerCase(),
		lastName: query.lastName.toLowerCase(),
		phoneNumber: parseInt(query.phoneNumber),
	};
}

function tryGetGuest(response, firstName, lastName, phoneNumber) {
	// Create a reference to the cities collection
	let guests = DB.collection("guests");

	// Create a query against the collection
	let queryRef = guests.where("firstName", "==", firstName)
		.where("lastName", "==", lastName)
		.where("phoneNumber", "==", phoneNumber)
		.limit(1);

	queryRef.get()
		.then(querySnapshot => getGuest(querySnapshot, response))
		.catch(error => returnError(error, response));
}

function getGuest(querySnapshot, response) {
	if (querySnapshot.empty) {
		console.log('No matching documents!');
		response.send('No matching documents!');

	} else {
		let queryGuest = querySnapshot.docs[0];
		queryGuest.get("family").get()
			.then(docSnapshot => getFamily(docSnapshot, response))
			.catch(error => returnError(error, response));
	}
	return;
}

/**
 * given a guest, return the family and their food choices
 */
function getFamily(famDocSnapshot, response) {
	DB.getAll(...famDocSnapshot.get("familyMembers"))
		.then(memberDocs => logMembers(memberDocs, famDocSnapshot, response))
		.catch(error => returnError(error, response));

	return;
}

function logMembers(memberDocs, famDoc, response) {
	let names = memberDocs.map(memberDoc =>
		`${memberDoc.get("firstName")} ${memberDoc.get("lastName")}`
	);

	response.send(`
		Members: ${JSON.stringify(names)}
		Fam: ${JSON.stringify(famDoc.get("name"))}
	`);
	return;
}

function returnError(error, response) {
	response.send('Error getting documents');
	console.log('Error getting documents', error);
	return;
}

// https://us-central1-nancy-trevor-wedding.cloudfunctions.net/findGuest?firstName=sandy&lastName=ross&phoneNumber=5732001357
