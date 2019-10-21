
import { Stitch, RemoteMongoClient, AnonymousCredential, UserPasswordCredential, UserPasswordAuthProviderClient }
  from 'mongodb-stitch-react-native-sdk';

class Mongo {

  constructor() {

    this.Enum = {

      LOGGED_USER : 'logged-user',

      COLLECTION : {

        SECTION : 'section'
      },

      Stitch : {

        APP_NAME : 'APP_NAME',
        DB_NAME : 'DB_NAME',
        DB_USER : 'DB_USER',
        DB_PASSWORD : 'DB_PASSWORD',
        DB_OWNER_USER : 'DB_OWNER_USER'
      }
    }

    this._user;
    this._anonymous;

    Stitch.initializeDefaultAppClient(this.Enum.Stitch.APP_NAME).then(client => {
      this.client = client;
      this.db = client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas').db(this.Enum.Stitch.DB_NAME);
      //EventRegister.emit(Prop.enum.events.DATABASE_LOADED);

    })
    .catch(err => {console.log(err)});

  }


    authenticate(user) {

      //console.log(user);

      this._user = this.client.auth.loginWithCredential(new UserPasswordCredential(user.email, user.password));
      this._user.then(result => this.db.collection(this.Enum.COLLECTION.USER).updateOne(
          {owner_id: this.client.auth.user.id}, {$set:{lastLogon:new Date(),email:user.email}}, {upsert:true}
        )
      );
      return this._user;
    }

    logout() {

      this.client.auth.logout().then(() => {
          this._user = undefined;
          this._anonymous = undefined;
          //Model.currentUser = null;
          //delete sessionStorage[this.Enum.LOGGED_USER];          
        })
        .catch(err => {
          console.error(err);
          //Utils.showError(err);
        });
    }

    anonymous() {

      if(this._user) return this._user;
      else if(!this._anonymous) {
        //console.log(this.client)
        this._anonymous = this.client.auth.loginWithCredential(
          new UserPasswordCredential(this.Enum.Stitch.DB_USER, this.Enum.Stitch.DB_PASSWORD)
          //new AnonymousCredential()
        );
      }
      return this._anonymous;
    }

    confirm(token, tokenId) {

      //console.log(`confirm user: ${token}`);
      return this.client.auth.getProviderClient(UserPasswordAuthProviderClient.factory)
        .confirmUser(token, tokenId)
    }

    register(user) {

      //console.log(user);
      return this.client.auth.getProviderClient(UserPasswordAuthProviderClient.factory)
        .registerWithEmail(user.email, user.password);
    }

    update(obj, config) {

      const _getAction = (collection, obj) => {

        obj.owner_id = obj.owner_id || this.client.auth.user.id;
        obj.shearedWith = this.Enum.Stitch.DB_OWNER_USER;

        return obj._id ?
          this.db.collection(collection).updateOne({'_id': obj._id}, {'$set': obj}) : 
          this.db.collection(collection).insertOne({...obj, insertDate : new Date()});
      }

      const _before = new Date().getMilliseconds();
      console.log(`update-${config.COLLECTION}() [started]`);
      
      this.anonymous().then(user => {
        obj.owner_id = this.client.auth.user.id;
        delete obj.$$hashKey;
        _getAction(config.COLLECTION, obj).then(newObj => {
          config.onload && config.onload(newObj);
          console.log(`update-${config.COLLECTION}() [finished]: ${(new Date().getMilliseconds() - _before)} ms`);
        })
        .catch(err => {
          console.error(err);
          //Utils.showError(err);
        });
      });
    }

    get(config, param = {}) {

      const _before = new Date().getMilliseconds();
      console.log(`get-${config.COLLECTION}() [started]`);
      this.anonymous().then(user => {
        /*let _teste = Object.assign({'deleted':{'$ne':true}}, param);*/
        //console.log(user);
        this.db.collection(config.COLLECTION).find(
          Object.assign({}, (param.$or && param.$or.length ? {$or : param.$or} : {}), param.$filter),
          { sort: { ...param.$sort }, limit : param.$limit}
          ).asArray()
        .then(result => {
          //console.log(result)
          config.onload && config.onload(result);
          //else if(!config.preventDefault) $rootScope.$broadcast(`${config.LOAD_LISTENER}_int`, result);
          console.log(`get-${config.COLLECTION}() [finished]: ${(new Date().getMilliseconds() - _before)} ms`);
        });

      }).catch(err => {
        console.error(err);
        //Utils.showError(err);
      });
    }

}

export default new Mongo();