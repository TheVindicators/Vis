# Server-Side Save State [sending state to server]

Used to keep client state consistent across browsers, as well as to share work/progress.

**URL** : `/rest/save_state/`

**Method** : `POST`

**Auth required** : NO

**Data example**

```
for a full example of a save state that's POSTED, view tests/resources/good_json_test.json
```

## Success Response

**Code** : `200 OK`

**Content example**

On successful save, the server will return a success message as well as the project UUID. This is used to keep track of a single session. On the first POST of a save state, the server will generate a UUID, save it to the state, and notify the client of it so that both can reference this new state by the UUID.

```json
{
  "results": "SUCCESS",
  "uuid": "486a4c8b-09a8-4480-9728-f4d239bb4a3c"
}
```

## Error Response

**Condition** : The save state was improperly formatted, or other bad POST related action

**Code** : `400 BAD REQUEST`

**Content** :

The error field is a string that details the specific POST error that occurred.

```json
{
  "results": "FAIL",
  "reason": "BADPOST",
  "error": "non-valid JSON save state",
}
```

**Condition** : The save state could not be written to disk.

**Code** : `500 INTERNAL SERVER ERROR`

**Content** :

The error field is an int with the Python-related IOError. Some common examples include 13: no permission and 28: disk full. Errorstring is the exception message itself.

```json
{
  "results": "FAIL",
  "reason": "IOERROR",
  "error": 13,
  "errorstring": "Permission Denied"
}
```
**Condition** : All other errors not covered above (hardware failure, global thermonuclear warfare-EMP burst)

**Code** : `500 INTERNAL SERVER ERROR`

**Content** :

The error field is a string that details the specific error that was raised.

```json
{
  "results": "FAIL",
  "reason": "OTHER",
  "error": "god save the queen"
}
```

# Server-Side Save State [enumerating states on server]


**URL** : `/rest/resume_state`

**Method** : `GET`

**Auth required** : NO

**Data example**

```
website.com/rest/resume_state/
```

## Success Response

**Code** : `200 OK`

**Content example**

On successful GET, the server will return a list of all the save states on the server, in comma-delimited format. If there are no saves on the server, data will be an empty string.

```json
{
  "results": "SUCCESS",
  "data": "486a4c8b-09a8-4480-9728-f4d239bb4a3c,7ca3ccfd-98d0-4d2c-a2cd-96c3339d7c25,9b88bd30-3ae6-4323-85f9-f739fd26c66b"
}
```

## Error Response

**Condition** : The states could not be enumerated.

**Code** : `500 INTERNAL SERVER ERROR`

**Content** :

The error field is a string that details the specific error that was raised. In this example, the save-state folder was deleted while the server was still running.

```json
{
  "results": "FAIL",
  "reason": "OTHER",
  "error": "No such file or directory"
}
```

# Server-Side Save State [fetching a state on server]


**URL** : `/rest/resume_state/<uuid>`

**Method** : `GET`

**Auth required** : NO

**Data example**

```
website.com/rest/resume_state/486a4c8b-09a8-4480-9728-f4d239bb4a3c
```

## Success Response

**Code** : `200 OK`

**Content example**

On successful GET, the server will return the save state in JSON format.

```
for a full example of a save state that's returned, view tests/resources/good_json_test.json
```

## Error Response

**Condition** : The state could not be found or loaded.

**Code** : `500 INTERNAL SERVER ERROR`

**Content** :

The error field is a string that details the specific error that was raised. In this example, the requested save-state does not exist

```json
{
  "results": "FAIL",
  "reason": "OTHER",
  "error": "No such file or directory"
}
```
