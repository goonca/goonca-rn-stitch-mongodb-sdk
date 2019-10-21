# goonca-rn-stitch-mongodb-sdk

This is a react native friendly interface for Stitch MongoDB SDK

## Getting started
```
$ npm install goonca-rn-stitch-mongodb-sdk
```
import goonca-rn-stitch-mongodb-sdk
```
import MongoDB from 'goonca-rn-stitch-mongodb-sdk'
```

Methods

### set()
```
set({..config})
```
Store database and connections properties

Arguments:

config <Object>
Object containing (see below for a description of these fields):

|Name  |Description  |
|--|--|
|appName  | Stitch application name |
|dbName  | Database name |
|dbUser  | Database username |
|dbPassword  | Database password |
|debug  | Debug enabled (default=true) |


##### Example
```
MongoDB.set(
  {
    appName : '<APP_NAME>',
    dbName : '<DB_NAME>',
    dbUser : '<DB_USER>',
    dbPassword : '<DB_PASSWORD>',
    debug : <true|false>
  }
)
```

### connect()
```
connect(onLoad, onError)
```
Connect to database using the parameter defined on set().

parameters:

|Name  |Description  |
|--|--|
|onLoad  | Success return function |
|onError  | Fail return function |


##### Example
```
MongoDB.connect(
  {
    onLoad : <Function>,
    onError : <Function>
  }
)
```

### authenticate()
```
authenticate(user, onLoad, onError)
```
Authenticate database user.

parameters:

|Name  |Description  |
|--|--|
|user  | Object user to be authenticated {user.email, user.password} |
|onLoad  | Success return function |
|onError  | Fail return function |


##### Example
```
MongoDB.authenticate(
  {
    user : {email : '<USER_EMAIL>', password : '<USER_PASSWORD>'}
    onLoad : <Function>,
    onError : <Function>
  }
)
```

### logout()
```
logout(onLoad, onError)
```
Logout current connected database user.

parameters:

|Name  |Description  |
|--|--|
|onLoad  | Success return function |
|onError  | Fail return function |


##### Example
```
MongoDB.logout(
  {
    onLoad : <Function>,
    onError : <Function>
  }
)
```

### confirm()
```
confirm(token, tokenId, onLoad, onError)
```
Confirm new user register.

parameters:

|Name  |Description  |
|--|--|
|token  | User token |
|tokenId  | User tokenId |
|onLoad  | Success return function |
|onError  | Fail return function |


##### Example
```
MongoDB.confirm(
  {
    token : '<USER_TOKEN>',
    tokenId : '<USER_TOKEN_ID>',
    onLoad : <Function>,
    onError : <Function>
  }
)
```

### register()
```
register(user, onLoad, onError)
```
Register user register.

parameters:

|Name  |Description  |
|--|--|
|user  | Object new user {user.email, user.password} |
|onLoad  | Success return function |
|onError  | Fail return function |


##### Example
```
MongoDB.register(
  {
    user : {email : '<USER_EMAIL>', password : '<USER_PASSWORD>'}
    tokenId : '<USER_TOKEN_ID>',
    onLoad : <Function>,
    onError : <Function>
  }
)
```

### update()
```
update(obj, collection, onLoad, onError)
```
Create or update an object.
if the object received has the property id it will be updated
otherwise a new Object will be created.

parameters:

|Name  |Description  |
|--|--|
|obj  | Object to be created/updated |
|collection  | mongoDB collection |
|onLoad  | Success return function |
|onError  | Fail return function |


##### Example
```
MongoDB.update(
  {
    obj : {...}
    tokenId : '<MONGO_DB_COLLECTION>',
    onLoad : <Function>,
    onError : <Function>
  }
)
```

### get()
```
get(collection, param, onLoad, onError)
```
Return a list of objects from the collection.

parameters:

|Name  |Description  |
|--|--|
|collection  | mongoDB collection |
|param  | Object containing (see below for a description of these fields) |
|onLoad  | Success return function |
|onError  | Fail return function |

**(param)**

|Name  |Description  |
|--|--|
|$filter  | Mongo filter |
|$limit  | list max length |
|$sort  | ASC\|DESC |


##### Example
```
MongoDB.get(
  {
    collection : '<COLLECTION>'
    param : {...},
    onLoad : <Function>,
    onError : <Function>
  }
)
```
