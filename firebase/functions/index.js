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
			{ firstName, lastName, attending, food, plusOne, },
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
		// TODO: support case where multiple guests share first and last name
		let queryGuest = querySnapshot.docs[0];
		getFamily(queryGuest, response);
	}
	return;
}

function getFamily(queryGuest, response) {
	queryGuest
		.get("family")
		.get()
		.then(docSnapshot => addFamily(docSnapshot, response))
		.catch(error => returnError(error, response, "001"));
}

function addFamily(famDocSnapshot, response) {
	let responseModel = {
		family: {
			name: famDocSnapshot.get("name"),
			members: []
		},
		menu: []
	};

	getFamilyMembers(famDocSnapshot, responseModel, response);
	return;
}

function getFamilyMembers(famDocSnapshot, responseModel, response) {
	DB.getAll(...famDocSnapshot.get("familyMembers"))
		.then(memberDocs =>
			addFamilyMembers(memberDocs, responseModel, response)
		)
		.catch(error => returnError(error, response, "002"));
}

function addFamilyMembers(memberDocs, responseModel, response) {
	responseModel.family.members = memberDocs.map(memberDoc => ({
		firstName: memberDoc.get("firstName"),
		lastName: memberDoc.get("lastName"),
		food: memberDoc.get("food").id,
		attending: memberDoc.get("attending"),
		plusOne: memberDoc.get("plusOne")
	}));

	getMenu(responseModel, response);
	return;
}

function getMenu(responseModel, response) {
	let menu = DB.collection("menu");
	menu.get()
		.then(querySnapshot => addMenu(querySnapshot, responseModel, response))
		.catch(error => returnError(error, response, "003"));
}

function addMenu(menuDocs, responseModel, response) {
	if (menuDocs.empty) {
		returnError("no menu items found", response, "101");
	} else {
		responseModel.menu = menuDocs.docs.map(menuDoc => ({
			title: menuDoc.get("title"),
			id: menuDoc.id
		}));
		response.json(responseModel);
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
