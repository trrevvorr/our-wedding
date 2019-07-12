const fs = require('fs');
const data = require("./guests_to_import.json");

function inputData(data) {
    let families = {};
    let guests = {};

    for (let i in data) {
        let family = data[i];
        parseFamily(family, families, guests)
    }

    return {
        families: families,
        guests: guests
    };
}

function parseFamily(family, families, guests) {
    let name = family.name;
    let members = family.familyMembers;
    let familyKey = createFamily(name, families);
    let familyRef = createFamilyRefrence(familyKey);

    for (let i in members) {
        let member = members[i];
        let firstName = member[0];
        let lastName = member[1];

        if (firstName == "" || lastName == "") {
            continue;
        }

        if (firstName == "null" || lastName == "null") {
            firstName = null;
            lastName = null;
        }

        let guestKey = createGuest(firstName, lastName, familyRef, guests);
        let guestRef = createGuestReference(guestKey);
        addGuestToFamily(guestRef, familyKey, families)
    }
}

function createFamily(name, families) {
    const family = {
        familyMembers: [],
        name: name.toLowerCase().trim(),
        __collections__: {}
    }
    const key = generateKey();
    families[key] = family;

    return key;
}

function createFamilyRefrence(familyKey) {
    return {
        __datatype__: "documentReference",
        value: "families/" + familyKey
      };
}

function createGuest(firstName, lastName, familyRef, guests) {
    let guest = {
        family: familyRef,
        __collections__: {}
    };

    if (firstName === null || lastName === null) {
        if (firstName !== lastName) {
            console.error(`If either first or last name is null, both must be null. Intead, recieved ${firstName} ${lastName}`);
            throw "InvalidDataException";
        }

        guest["plusOne"] = true;
    } else {
        guest["plusOne"] = false;
        guest["firstName"] = firstName.toLowerCase().trim();
        guest["lastName"] = lastName.toLowerCase().trim();
    }

    const key = generateKey();
    guests[key] = guest;

    return key;
}

function addGuestToFamily(guestRef, familyKey, families) {
    families[familyKey]["familyMembers"].push(guestRef);
}

function createGuestReference(guestKey) {
    return {
        __datatype__: "documentReference",
        value: "guests/" + guestKey
    };
}

function generateKey() {
    const length = 20;
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function outputGuests(data) {
    let guests = data.guests;
    outputData(guests, "guests");
}

function outputFamilies(data) {
    let families = data.families;
    outputData(families, "families");
}

function outputData(data, filePrefix) {
    const json = JSON.stringify(data, null, 2);
    const outputFile = `./import/out/${filePrefix}.json`;

    fs.writeFile(outputFile, json, function (err) {
        if (err) throw err;
        console.log("Exported: " + outputFile);
    });
}

let parsedData = inputData(data);
outputGuests(parsedData);
outputFamilies(parsedData);