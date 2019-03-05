// deploy with `firebase deploy --only functions`
// test with `firebase serve --only functions`

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

exports.findGuest = functions.https.onRequest((request, response) => {
	const { firstName, lastName, phoneNumber } = parseInput(request.query.firstName, request.query.lastName, request.query.phoneNumber)

	var db = admin.firestore();
	tryGetMatchingGuest(db, response, firstName, lastName, phoneNumber);
});

function parseInput(firstName, lastName, phoneNumber) {
	return {
		firstName: firstName.toLowerCase(),
		lastName: lastName.toLowerCase(),
		phoneNumber: parseInt(phoneNumber),
	};
}

function tryGetMatchingGuest(db, response, firstName, lastName, phoneNumber) {
	// Create a reference to the cities collection
	var guests = db.collection("guests");

	// Create a query against the collection
	var queryRef = guests.where("firstName", "==", firstName)
		.where("lastName", "==", lastName)
		.where("phoneNumber", "==", phoneNumber)
		.limit(1);

	queryRef.get().then(snapshot => {
		if (snapshot.empty) {
			console.log('No matching documents!');
			response.send('No matching documents!');

		} else {
			snapshot.forEach(doc => {
				response.send({ "attending": doc.data().attending, "food": doc.data().food });
			});
		}
		return;

	}).catch(err => {
		response.send('Error getting documents');
		console.log('Error getting documents', err);
		return;
	});
}

// https://us-central1-nancy-trevor-wedding.cloudfunctions.net/findGuest?firstName=sandy&lastName=ross&phoneNumber=5732001357
