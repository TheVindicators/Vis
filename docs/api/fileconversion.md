# Server-Side File Conversion

Used to enable file support not native to Three.js

**URL** : `/rest/convert_object/`

**Method** : `POST`

**Auth required** : NO

## Success Response

**Code** : `200 OK`

**Content example**

On successful conversion the server will return an .OBJ object as a string to the client.


## Error Response

**Condition** : The file could not be converted

**Code** : `500 INTERNAL SERVER ERROR`

**Content** :

The error is returned as a string, in a non-JSON format.

```
IOError: [Errno 2] No such file or directory
```
