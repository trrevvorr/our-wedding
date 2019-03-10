// deploy with `firebase deploy --only functions`
// test with `firebase serve --only functions`

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require("firebase-functions");

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require("firebase-admin");
admin.initializeApp();
const DB = admin.firestore();

//#region findGuest Query

/*
responseModel = {
	family: {
		name: "Example Name",
		members: [
			{ firstName, lastName, attending, food, plusOne, id },
			...
		],
	},
	menu: [
		{
			title: "Example Title",
			id: "ExampleId"
		},
		...
	],
}
*/

exports.findGuest = functions.https.onRequest((request, response) => {
	response.set("Access-Control-Allow-Origin", "*"); // allows CORS TODO: allow only github pages?
	validateRequest(request, response, guestLookupRequest);
});

function validateRequest(request, response, requestCallback) {
	const key = request.query.key;

	if (key) {
		let keyRef = DB.collection("keys").doc(key);
		keyRef
			.get()
			.then(keyDoc => {
				if (!keyDoc.exists) {
					// invalid key, deny request
					returnError(`Key "${key}" not found`, response, "200");
				} else {
					// key found, continue with request
					let writePermission = keyDoc.get("writePermission");
					requestCallback(request, response, writePermission);
				}
				return;
			})
			.catch(error => returnError(error, response, "201"));
	} else {
		returnError(`No key found`, response, "202");
	}
}

function guestLookupRequest(request, response) {
	const { firstName, lastName } = parseGuestQuery(request.query);
	lookupGuest(response, firstName, lastName);
}

/**
 * parses findGuest query into discreet pieces
 * @param {object} query object passed in via https request param
 * @returns pieces of query: firstName (string), lastName(string)
 */
function parseGuestQuery(query) {
	return {
		firstName: query.firstName.toLowerCase(),
		lastName: query.lastName.toLowerCase()
	};
}

function lookupGuest(response, firstName, lastName) {
	// Create a reference to the cities collection
	let guests = DB.collection("guests");

	// Create a query against the collection
	let queryRef = guests
		.where("firstName", "==", firstName)
		.where("lastName", "==", lastName);

	queryRef
		.get()
		.then(querySnapshot => tryGetGuest(querySnapshot, response))
		.catch(error => returnError(error, response, "000"));
}

function tryGetGuest(querySnapshot, response) {
	if (querySnapshot.empty) {
		returnError("no guests found", response, "100");
	} else {
		let promises = querySnapshot.docs.map(
			doc =>
				new Promise((resolve, reject) =>
					getFamily(doc, { resolve, reject })
				)
		);
		Promise.all(promises)
			.then(results => response.json(results))
			.catch(error => returnError(error, response, "300"));
	}
	return;
}

function getFamily(queryGuest, promise) {
	queryGuest
		.get("family")
		.get()
		.then(docSnapshot => addFamily(docSnapshot, promise))
		.catch(error => promise.reject(error));
}

function addFamily(famDocSnapshot, promise) {
	let responseModel = {
		family: {
			name: famDocSnapshot.get("name"),
			members: []
		},
		menu: []
	};

	getFamilyMembers(famDocSnapshot, responseModel, promise);
	return;
}

function getFamilyMembers(famDocSnapshot, responseModel, promise) {
	DB.getAll(...famDocSnapshot.get("familyMembers"))
		.then(memberDocs =>
			addFamilyMembers(memberDocs, responseModel, promise)
		)
		.catch(error => promise.reject(error));
}

function addFamilyMembers(memberDocs, responseModel, promise) {
	responseModel.family.members = memberDocs.map(memberDoc => ({
		firstName: memberDoc.get("firstName"),
		lastName: memberDoc.get("lastName"),
		food: memberDoc.get("food").id,
		attending: memberDoc.get("attending"),
		plusOne: memberDoc.get("plusOne"),
		id: memberDoc.id
	}));

	getMenu(responseModel, promise);
	return;
}

function getMenu(responseModel, promise) {
	let menu = DB.collection("menu");
	menu.get()
		.then(querySnapshot => addMenu(querySnapshot, responseModel, promise))
		.catch(error => promise.reject(error));
}

function addMenu(menuDocs, responseModel, promise) {
	if (menuDocs.empty) {
		promise.reject("no menu items found");
	} else {
		responseModel.menu = menuDocs.docs.map(menuDoc => ({
			title: menuDoc.get("title"),
			id: menuDoc.id
		}));
		// TODO: only return one menu per request
		promise.resolve(responseModel);
	}

	return;
}

/**
 * responds to client with error state and logs error in console
 * @param error object or string to log to console
 * @param response object used to respond to client
 * @param errorCode string uniquely identifying error
 */
function returnError(error, response, errorCode) {
	const errorMessage = "ERROR " + errorCode;
	response.status(500).send(errorMessage);
	console.log(errorMessage, error);
	return;
}

// https://us-central1-nancy-trevor-wedding.cloudfunctions.net/findGuest?firstName=sandy&lastName=ross
// http://localhost:5000/nancy-trevor-wedding/us-central1/findGuest?firstName=sandy&lastName=ross

//#endregion

// #region saveGuests Query

exports.saveGuests = functions.https.onRequest((request, response) => {
	response.set("Access-Control-Allow-Origin", "*"); // allows CORS TODO: allow only github pages?
	trySaveRequest(request, response);
});

function trySaveRequest(request, response) {
	let promises = request.body.members.map(
		guest =>
			new Promise((resolve, reject) =>
				trySaveGuest(guest, { resolve, reject })
			)
	);

	Promise.all(promises)
		.then(results => response.send("success"))
		.catch(error => returnError(error, response, "301"));
}

function trySaveGuest(guest, promise) {
	let guestRef = DB.collection("guests").doc(guest.id);
	guestRef
		.get()
		.then(guestDoc => {
			if (!guestDoc.exists) {
				promise.reject(`ID ${guest.id} not found`);
			} else {
				saveGuest(guest, guestDoc, guestRef);
				promise.resolve(guestDoc);
			}
			return;
		})
		.catch(error => promise.reject(error));
}

function saveGuest(guest, guestDoc, guestRef) {
	let dataToSet = {
		attending: guest.attending === "true",
		food: DB.collection("menu").doc(guest.food)
	};

	// add first and last name if this is a plus one
	if (guestDoc.get("plusOne")) {
		if (guest.firstName) {
			dataToSet.firstName = guest.firstName;
		}
		if (guest.lastName) {
			dataToSet.lastName = guest.lastName;
		}
	}

	guestRef.update(dataToSet);
}

// #endregion
