/*
* Stitch MongoDB SDK for react-native
* by @goonca (https://github.com/goonca)
*/

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
      dbName : 'dbName',
      dbUser : 'dbUser',
      dbPassword : 'dbPassword',
      dbOwner : 'dbOwner',
      debug : true
    }

    this._user;
    this._anonymous;
  }

  connect(onLoad, onError) {

    Stitch.initializeDefaultAppClient(this.config.appName).then(client => {

      this.client = client;
      this.db = client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas').db(this.config.dbName);
      onLoad && onLoad(client);

    }).catch(err => {
      onError && onError(err);
    });
  }

  set(config) {
    this.config = config;
    return this;
  }

  authenticate(user, onLoad, onError) {

    this._user = this.client.auth.loginWithCredential(new UserPasswordCredential(user.email, user.password));
    this._user.then(result => {

      onLoad && onLoad(this.client.auth.user);

    }).catch(err => {
      onError && onError(err);
    });
  }

  logout(onLoad, onError) {

    this.client.auth.logout().then(() => {

        this._user = undefined;
        this._anonymous = undefined;
        onLoad && onLoad();

      }).catch(err => {
        onError && onError(err);
      });
  }

  anonymous() {

    if(this._user) return this._user;
    else if(!this._anonymous) {
      this._anonymous = this.client.auth.loginWithCredential(
        new UserPasswordCredential(this.config.dbUser, this.config.dbPassword)
        //new AnonymousCredential()
      );
    }
    return this._anonymous;
  }

  confirm(token, tokenId, onLoad, onError) {

    return this.client.auth.getProviderClient(UserPasswordAuthProviderClient.factory)
      .confirmUser(token, tokenId)
      .then(response => (onLoad && onLoad(response)))
      .catch(err => (onError && onError(err)));
  }

  register(user, onLoad, onError) {

    return this.client.auth.getProviderClient(UserPasswordAuthProviderClient.factory)
      .registerWithEmail(user.email, user.password)
      .then(response => (onLoad && onLoad(response)))
      .catch(err => (onError && onError(err)));
  }

  update(obj, collection, onLoad, onError) {

    const _getAction = (collection, obj) => {

      obj.owner_id = obj.owner_id || this.client.auth.user.id;
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
        onError && onError(err);
      });
    });
  }

  get(collection, param = {}, onLoad, onError) {

    const _before = new Date().getMilliseconds();
    this.config.debug && console.log(`get-${collection}() [started]`);

    this.anonymous().then(user => {

      this.db.collection(collection).find(
        {...(param.$or || {}).length ? {$or : param.$or} : {}), ...param.$filter},
        { sort: { ...param.$sort }, limit : param.$limit}
        ).asArray()
      .then(result => {

        onLoad && onLoad(result);
        this.config.debug && console.log(`get-${collection}() [finished]: ${(new Date().getMilliseconds() - _before)} ms`);
      });

    }).catch(err => {
      onError && onError(err);
    });
  }
}

export default new Mongo();