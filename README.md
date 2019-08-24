# Simple Wedding Site

I created this website for my wedding. I wanted something:

-   custom (always found something to nitpick on any free template site)
-   sharable (wrote this in such a way that it would be easy to fork and customize for yourself)
-   free (using github pages and firebase, don't even have to pay for a host)

To see it in action: https://trrevvorr.github.io/our-wedding/?key=demo

## Run Locally

-   `cd our-wedding`
-   `npm i`
-   `npm run serve`

## Import data

### Setup
- Install firestore import from npm: `npm i node-firestore-import-export`
- initialize with firebase credentials: `export GOOGLE_APPLICATION_CREDENTIALS=path/to/my/credentials.json`
- see [here] for more details

### Backup
- create a backup of your data by running: 
    - `firestore-export --backupFile ./import/backups/firebase-export-guests.json --nodePath guests -p`
    - `firestore-export --backupFile ./import/backups/firebase-export-families.json --nodePath families -p`

### Import
CAUTION: the following commands will overwrite any data in `guests/` or `families/` with matching keys. Do a backup before proceeding.

1. populate `import/guests_to_import.json` with your guests' info
1. run `node import/guests_to_families.js`
1. run `firestore-import --backupFile ./import/out/guests.json --nodePath guests`
1. run `firestore-import --backupFile ./import/out/families.json --nodePath families`

### Clear
CAUTION: thie following commands will remove all `guests/` and `families/`. Do a backup before proceeding.

1. clear all guests: `firestore-clear --nodePath guests`
1. clear all guests: `firestore-clear --nodePath families`

## Other

### Get Attendance Counts
1. Create a guests backup (see Backup section)
1. Run `node import/countAttendance.js` script

### Poor Man's CSV to JSON
Convert CSV to `guest_to_import.json` format JSON

CSV Format:
| | | | | | | | | | | |
|-|-|-|-|-|-|-|-|-|-|-|
| family name1 | first1 | last 1 | first2 | last2 | first3 | last3 | first4 | last4 | first5 | last5 |
| family name2 | first1 | last 1 | first2 | last2 | first3 | last3 | first4 | last4 | first5 | last5 |
| family name3 | first1 | last 1 | first2 | last2 | first3 | last3 | first4 | last4 | first5 | last5 |

VS Code Regex Find: `^(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*)`
And Replace: `{"name":"$1","familyMembers":[["$2","$3"],["$4","$5"],["$6","$7"],["$8","$9"],["$10","$11"]]},`