const fs = require('fs');
// const families = require("./backups/firebase-export-families.json");
const guests = require("./backups/firebase-export-guests.json");

function inputData(guests) {
    let guestFamilies = {};

    for (let key in guests) {
        let guest = guests[key];
        let familyKey = guest["family"]["value"].match(/families\/(\w+)/)[1];

        addGuestToFamily(guestFamilies, guest, familyKey)
    }

    return guestFamilies;
}

function addGuestToFamily(guestFamilies, guest, familyKey) {
    if (guestFamilies[familyKey] === undefined) {
        guestFamilies[familyKey] = [];
    }

    guestFamilies[familyKey].push(guest);
}

function outputAllGuests(guestFamilies) {
    outputGuests(guestFamilies, "ALL GUESTS", att => false)
}

function outputAttendingGuests(guestFamilies) {
    outputGuests(guestFamilies, "ATTENDING GUESTS", att => att !== true)
}

function outputNonAttendingGuests(guestFamilies) {
    outputGuests(guestFamilies, "NON-ATTENDING GUESTS", att => att !== false)
}

function outputUndefinedGuests(guestFamilies) {
    outputGuests(guestFamilies, "UNDEFINED GUESTS", att => att !== undefined)
}

function outputGuests(guestFamilies, title, filterAttending) {
    let text = [];
    text.push("----------")
    let totalMemberCount = 0;
    
    for (let familyKey in guestFamilies) {
        let family = guestFamilies[familyKey];
        let memberCount = 0;
        
        for (let guestIndex in family) {
            let guest = family[guestIndex];
            let name = guest["firstName"] + " " + guest["lastName"];
            name = (name === "undefined undefined" ? "guest" : name);
            let attending = guest["attending"];
            
            if (filterAttending(attending)) { continue; }
            
            text.push("attending: " + attending + ",\tname: " + name);
            if (attending) {
                text.push("food: " + guest["food"]["value"])
            }
            memberCount++;
            totalMemberCount++;
        }
        
        if (memberCount) { text.push("----------"); }
    }
    text = [`TOTAL ${title}: ${totalMemberCount}`, ...text];

    const outputText = text.join("\n");
    const fileTitle = title.replace(" ", "_").toLocaleLowerCase();
    const outputFile = `./import/count/${fileTitle}.txt`;
    fs.writeFile(outputFile, outputText, function (err) {
        if (err) throw err;
        console.log("Exported: " + outputFile);
    });
}


console.log("BEFORE RUNNING SCRIPT, EXPORT DATABASE TO import/backups/firebase-export-guests.json")
let guestFamilies = inputData(guests);
outputAllGuests(guestFamilies);
outputAttendingGuests(guestFamilies);
outputNonAttendingGuests(guestFamilies);
outputUndefinedGuests(guestFamilies);

// let action = "all";
// if (process.argv.length > 2) {
//     action = process.argv[2];
// }

// switch (action) {
//     case "all":
//         outputAllGuests(guestFamilies);
//         break;
//     case "attending":
//         outputAttendingGuests(guestFamilies);
//         break;
//     case "non-attending":
//         outputNonAttendingGuests(guestFamilies);
//         break;
//     case "undefined":
//         outputUndefinedGuests(guestFamilies);
//         break;
//     default:
//         console.log(`${action} is an invalid action`);
//         console.log("valid actions: all, attending, non-attending, undefined");
//         console.log("e.g. node countAttendance.js all");
// }
