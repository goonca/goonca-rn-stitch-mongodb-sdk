
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

      stitch : {
        appName : 'appName',
        dbName : 'dbName',
        dbUser : 'dbUser',
        dbPassword : 'dbPassword',
        dbOwner : 'dbOwner'
      }
    }

    this._user;
    this._anonymous;
  }

  connect(onLoad, onError) {

    Stitch.initializeDefaultAppClient(this.config.Stitch.appName).then(client => {

      this.client = client;
      this.db = client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas').db(this.config.Stitch.dbName);
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
        new UserPasswordCredential(this.config.Stitch.dbUser, this.config.Stitch.dbPassword)
        //new AnonymousCredential()
      );
    }
    return this._anonymous;
  }

  confirm(token, tokenId) {

    return this.client.auth.getProviderClient(UserPasswordAuthProviderClient.factory)
      .confirmUser(token, tokenId)
  }

  register(user) {

    return this.client.auth.getProviderClient(UserPasswordAuthProviderClient.factory)
      .registerWithEmail(user.email, user.password);
  }

  update(obj, collection, onLoad, onError) {

    const _getAction = (collection, obj) => {

      obj.owner_id = obj.owner_id || this.client.auth.user.id;
      obj.shearedWith = this.config.Stitch.dbOwner;

      return obj._id ?
        this.db.collection(collection).updateOne({'_id': obj._id}, {'$set': obj}) : 
        this.db.collection(collection).insertOne({...obj, insertDate : new Date()});
    }

    const _before = new Date().getMilliseconds();
    console.log(`update-${collection}() [started]`);
    
    this.anonymous().then(user => {

      obj.owner_id = this.client.auth.user.id;
      delete obj.$$hashKey;

      _getAction(collection, obj).then(newObj => {
        onLoad && onLoad(newObj);
        console.log(`update-${collection}() [finished]: ${(new Date().getMilliseconds() - _before)} ms`);

      }).catch(err => {
        onError && onError(err);
      });
    });
  }

  get(collection, param = {}, onLoad, onError) {

    const _before = new Date().getMilliseconds();
    console.log(`get-${collection}() [started]`);

    this.anonymous().then(user => {

      this.db.collection(collection).find(
        Object.assign({}, (param.$or && param.$or.length ? {$or : param.$or} : {}), param.$filter),
        { sort: { ...param.$sort }, limit : param.$limit}
        ).asArray()
      .then(result => {

        onLoad && onLoad(result);
        console.log(`get-${collection}() [finished]: ${(new Date().getMilliseconds() - _before)} ms`);
      });

    }).catch(err => {
      onError && onError(err);
    });
  }
}

export default new Mongo();