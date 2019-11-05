import {

  Stitch,
  RemoteMongoClient,
  AnonymousCredential,
  UserPasswordCredential,
  UserPasswordAuthProviderClient 

} from 'mongodb-stitch-react-native-sdk';

class Mongo {

  constructor() {

    this.config = {

      appName : 'appName',
      serviceName : 'serviceName',
      dbName : 'dbName',
      dbUser : 'dbUser',
      dbPassword : 'dbPassword',
      dbOwner : 'dbOwner',
      debug : true
    }

    this._user;
    this._anonymous;
  }


  /**
  * connect()
  * establish a new coonection to the database previews defined on set()
  * @param  onLoad: Success return function
  * @param  onError: Fail return function
  * @return undefined
  */
  static connect(onLoad, onError) {

    Stitch.initializeDefaultAppClient(this.config.appName).then(client => {
      this.client = client;
      this.db = client.getServiceClient(RemoteMongoClient.factory, this.config.serviceName).db(this.config.dbName);
      onLoad && onLoad(client);

    }).catch(err => {
      onError && onError(err) || console.log(err);
    });
  }

  /**
  * set()
  * store database and connections properties
  * @param  config: Object containing (see below for a description of these fields)
  *
  * | Name       | Description             |
  * |------------|-------------------------|
  * | appName    | Stitch application name |
  * | dbName     | Database name           |
  * | dbUser     | Database username       |
  * | dbPassword | Database password       |
  * | dbOwner    | Database owner id       |
  * | debug      | Debug enabled           |
  *
  * @return this class
  */
  static set(config) {
    this.config = config;
    return this;
  }

  /**
  * authenticate()
  * authenticate database user
  * @param  user: user object {email : '<USER_EMAIL>', password : '<USER_PASSWORD>'}
  * @param  onLoad: Success return function
  * @param  onError: Fail return function
  * @return undefined
  */
  static authenticate(user, onLoad, onError) {

    this._user = this.client.auth.loginWithCredential(new UserPasswordCredential(user.email, user.password));
    this._user.then(result => {

      onLoad && onLoad(this.client.auth.user);

    }).catch(err => {
      onError && onError(err) || console.log(err);
    });
  }

  /**
  * logout()
  * logout current connected database user
  * @param  onLoad: Success return function
  * @param  onError: Fail return function
  * @return undefined
  */
  static logout(onLoad, onError) {

    this.client.auth.logout().then(() => {

        this._user = undefined;
        this._anonymous = undefined;
        onLoad && onLoad();

      }).catch(err => {
        onError && onError(err) || console.log(err);
      });
  }

  /**
  * anonymous()
  * use de default credentials in case no user is logged
  * see AnonymousCredential() for anonymous login
  * @param  onLoad: Success return function
  * @param  onError: Fail return function
  * @return stitch loginWithCredential promisse
  */
  static anonymous() {

    if(this._user) return this._user;
    else if(!this._anonymous) {
      this._anonymous = this.client.auth.loginWithCredential(
        new UserPasswordCredential(this.config.dbUser, this.config.dbPassword)
        //new AnonymousCredential()
      );
    }
    return this._anonymous;
  }

  /**
  * confirm()
  * confirm new user register
  * @param  token: new user token
  * @param  tokenId: new user tokenId
  * @param  onLoad: Success return function  
  * @param  onError: Fail return function
  * @return undefined
  */
  static confirm(token, tokenId, onLoad, onError) {

    return this.client.auth.getProviderClient(UserPasswordAuthProviderClient.factory)
      .confirmUser(token, tokenId)
      .then(response => (onLoad && onLoad(response)))
      .catch(err => (onError && onError(err) || console.log(err)));
  }

  /**
  * register()
  * register new user
  * @param  user: Object new user {user.email, user.password}
  * @param  onLoad: Success return function  
  * @param  onError: Fail return function
  * @return undefined
  */
  static register(user, onLoad, onError) {

    return this.client.auth.getProviderClient(UserPasswordAuthProviderClient.factory)
      .registerWithEmail(user.email, user.password)
      .then(response => (onLoad && onLoad(response)))
      .catch(err => (onError && onError(err) || console.log(err)));
  }

  /**
  * update()
  * Create or update an object
  * if the object received has the property _id it will be updated
  * otherwise a new Object will be created
  * @param  obj: Object to be created/updated
  * @param  collection: mongoDB collection  
  * @param  onLoad: Success return function  
  * @param  onError: Fail return function
  * @return undefined
  */
  static update(obj, collection, onLoad, onError) {

    //return insert or update promisse
    const _getAction = (collection, obj) => {

      obj.owner_id = obj.owner_id || this.client.auth.user.id;
      //store the owner id to avoid reading permission issues
      obj.shearedWith = this.config.dbOwner;

      return obj._id ?
        this.db.collection(collection).updateOne({'_id': obj._id}, {'$set': obj}) : 
        this.db.collection(collection).insertOne({...obj, insertDate : new Date()});
    }

    const _before = new Date().getMilliseconds();
    this.config.debug && console.log(`update-${collection}() [started]`);
    
    this.anonymous().then(user => {

      obj.owner_id = this.client.auth.user.id;
      delete obj.$$hashKey;

      _getAction(collection, obj).then(newObj => {
        onLoad && onLoad(newObj);
        this.config.debug && console.log(`update-${collection}() [finished]: ${(new Date().getMilliseconds() - _before)} ms`);

      }).catch(err => {
        onError && onError(err) || console.log(err);
      });
    });
  }

  static store(obj, collection, onLoad, onError) {
    this.update(obj, collection, onLoad, onError);
  }

  /**
  * get()
  * return a list of objects from the collection
  * @param  collection: mongoDB collection
  * @param  param: Object containing (see below for a description of these fields)
  *
  * | Name       | Description             |
  * |------------|-------------------------|
  * | $filter    | mongo filter            |
  * | $limit     | list max length         |
  * | $sort      | 'ASC|DESC'              |
  *
  * @param  onLoad: Success return function  
  * @param  onError: Fail return function
  * @return undefined
  */
  static get(collection, param = {}, onLoad, onError) {

    const _before = new Date().getMilliseconds();
    this.config.debug && console.log(`get-${collection}() [started]`);

    this.anonymous().then(user => {

      this.db.collection(collection).find(
        {...((param.$or || {}).length ? {$or : param.$or} : {}), ...param.$filter},
        { sort: { ...param.$sort }, limit : param.$limit}
        ).asArray()
      .then(result => {
        //console.log(result)
        onLoad && onLoad(result);
        this.config.debug && console.log(`get-${collection}() [finished]: ${(new Date().getMilliseconds() - _before)} ms`);
      });

    }).catch(err => {
      onError && onError(err);
    });
  }
}

export { Mongo };
